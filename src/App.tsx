/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ActiveTab, AppDataState, Escala, Escalado, GoogleUserProfile,
  Indisponibilidade, Membro, Musica, MusicaEscala, StatusConfirmacao,
  AppSession, MinisterioInfo, SUPER_ADMIN_EMAIL,
} from './types';
import { INITIAL_APP_DATA } from './data/mockData';
import {
  createDefaultSpreadsheet, fetchSpreadsheetData, writeFullAppDataToSheet,
} from './services/googleSheets';
import {
  googleSignInWithFirebase, getOAuthClientId, logout as firebaseLogout,
} from './services/firebaseAuth';
import {
  registrarUsuario, buscarPermissaoUsuario, carregarMinisterioInfo,
  gerarTokenConvite, garantirAbaPermissoes, lerPermissoes,
} from './services/permissoes';
import { registrarNoIndice } from './services/indice';
import { LoginView } from './components/LoginView';
import { OnboardingView } from './components/OnboardingView';
import { AguardandoView } from './components/AguardandoView';
import { SuperAdminView } from './components/SuperAdminView';
import { Navbar } from './components/Navbar';
import { HomeDashboard } from './components/HomeDashboard';
import { EscalasList } from './components/EscalasList';
import { EscalaDetail } from './components/EscalaDetail';
import { EscalaForm } from './components/EscalaForm';
import { RepertorioView } from './components/RepertorioView';
import { MembrosView } from './components/MembrosView';
import { DisponibilidadeView } from './components/DisponibilidadeView';
import { SetupView } from './components/SetupView';
import { PerfilView } from './components/PerfilView';
import { FeedbackButton } from './components/FeedbackButton';
import { Check, CloudOff, RefreshCw as SyncIcon, Cloud } from 'lucide-react';

const STORAGE_KEYS = {
  SPREADSHEET_ID: 'escalalouvor_spreadsheet_id',
  ACCESS_TOKEN: 'escalalouvor_access_token',
  USER_PROFILE: 'escalalouvor_user_profile',
  MINISTERIO: 'escalalouvor_ministerio',
  SESSION_ROLE: 'escalalouvor_session_role',
  APP_DATA: 'escalalouvor_app_data_v2',
};

declare global {
  interface Window { google?: any; }
}

export default function App() {
  const [session, setSession] = useState<AppSession>({ stage: 'loading' });
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedEscalaId, setSelectedEscalaId] = useState<string | null>(null);
  const [editingEscalaId, setEditingEscalaId] = useState<string | null>(null);

  const [appData, setAppData] = useState<AppDataState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_DATA);
      return saved ? JSON.parse(saved) : INITIAL_APP_DATA;
    } catch { return INITIAL_APP_DATA; }
  });

  const [user, setUser] = useState<GoogleUserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  );
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID)
  );
  const [ministerio, setMinisterio] = useState<MinisterioInfo | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MINISTERIO);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVerificando, setIsVerificando] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pendentesCount, setPendentesCount] = useState(0);
  const [tokenExpirado, setTokenExpirado] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Persiste sessão, ministério e dados no localStorage
  useEffect(() => {
    if (ministerio) localStorage.setItem(STORAGE_KEYS.MINISTERIO, JSON.stringify(ministerio));
    else localStorage.removeItem(STORAGE_KEYS.MINISTERIO);
  }, [ministerio]);

  useEffect(() => {
    if (session.stage === 'app') {
      localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, session.role);
    }
  }, [session]);

  useEffect(() => {
    // #6 Guard correto: só salva se tiver dados reais
    const temDados = appData.membros.length > 0 || appData.escalas.length > 0 ||
      appData.repertorio.length > 0 || appData.disponibilidades.length > 0;
    if (temDados) {
      localStorage.setItem(STORAGE_KEYS.APP_DATA, JSON.stringify(appData));
    }
  }, [appData]);

  // PWA + online/offline + sync pendente offline
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); setIsInstallable(true); };
    window.addEventListener('beforeinstallprompt', handler);
    const goOnline = () => {
      setIsOnline(true);
      // #9 Sync ao voltar online
      const savedData = localStorage.getItem(STORAGE_KEYS.APP_DATA);
      const sid = localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID);
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (savedData && sid && token && token !== 'local-demo') {
        try {
          const data = JSON.parse(savedData);
          writeFullAppDataToSheet(sid, token, data).catch(() => {});
        } catch {}
      }
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstallable(false);
    setDeferredPrompt(null);
  };

  // ── Determinar sessão ao iniciar ──────────────────────────────────────────
  const resolverSessao = useCallback(async (
    u: GoogleUserProfile,
    token: string,
    sheetId: string | null
  ) => {
    // Super admin
    if (u.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      setSession({ stage: 'super_admin' });
      return;
    }

    // Sem planilha → onboarding
    if (!sheetId) {
      setSession({ stage: 'onboarding' });
      return;
    }

    // Tem planilha → verifica permissão
    try {
      await garantirAbaPermissoes(sheetId, token);
      const permissao = await buscarPermissaoUsuario(sheetId, token, u.email);

      if (!permissao) {
        setSession({ stage: 'onboarding' });
        return;
      }

      const info = await carregarMinisterioInfo(sheetId, token);
      setMinisterio(info);

      if (!permissao.aprovado && permissao.role !== 'lider') {
        setSession({ stage: 'aguardando_aprovacao', ministerio: info });
        return;
      }

      // Carrega dados da planilha e garante que o usuário está na lista de membros
      try {
        const dados = await fetchSpreadsheetData(sheetId, token);
        const jaEstaNaLista = dados.membros.some(m => m.email.toLowerCase() === u.email.toLowerCase());
        if (!jaEstaNaLista) {
          const novoMembro: Membro = {
            id: `m_${Date.now()}`,
            nome: u.name,
            email: u.email,
            telefone: '',
            funcoes: permissao.role === 'lider' ? ['Líder'] : ['Vocal'],
            ministerio: info.nome,
            ativo: true,
          };
          dados.membros.push(novoMembro);
          await writeFullAppDataToSheet(sheetId, token, dados);
        }
        setAppData(dados);
      } catch {}

      setSession({ stage: 'app', role: permissao.role, ministerio: info });
    } catch (e) {
      setSession({ stage: 'onboarding' });
    }
  }, []);

  // Ao montar: restaura sessão do cache ou resolve via planilha
  useEffect(() => {
    const savedRole = localStorage.getItem(STORAGE_KEYS.SESSION_ROLE);

    if (user && ministerio && savedRole) {
      // Sessão em cache — entra direto sem ir na planilha
      if (user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
        setSession({ stage: 'super_admin' });
      } else {
        setSession({ stage: 'app', role: savedRole as any, ministerio });
      }
      // Tenta atualizar da planilha em background se online
      if (accessToken && accessToken !== 'local-demo' && spreadsheetId && navigator.onLine) {
        fetchSpreadsheetData(spreadsheetId, accessToken)
          .then(dados => setAppData(dados))
          .catch((e) => {
            // #1 Token expirado — pede novo login
            if (e.message?.includes('401') || e.message?.includes('PERMISSION_DENIED')) {
              setTokenExpirado(true);
            }
          });
        // #9 Verificar pendentes para líder
        if (savedRole === 'lider') {
          lerPermissoes(spreadsheetId, accessToken)
            .then(perms => setPendentesCount(perms.filter(p => !p.aprovado).length))
            .catch(() => {});
        }
      }
    } else if (user && accessToken && accessToken !== 'local-demo') {
      resolverSessao(user, accessToken, spreadsheetId);
    } else if (user && accessToken === 'local-demo') {
      setSession({ stage: 'app', role: 'lider', ministerio: ministerio || {
        spreadsheet_id: 'local', nome: 'Modo Local', codigo: 'LOCAL',
        lider_email: user.email, lider_nome: user.name, membros: [],
      }});
    } else {
      setSession({ stage: 'login' });
    }
  }, []);

  // ── Login Google ──────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await googleSignInWithFirebase();
      if (result?.accessToken) {
        setAccessToken(result.accessToken);
        setUser(result.user);
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(result.user));
        await resolverSessao(result.user, result.accessToken, spreadsheetId);
      }
    } catch (firebaseErr: any) {
      const clientId = getOAuthClientId();
      if (window.google?.accounts?.oauth2 && clientId) {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file',
          callback: async (response: any) => {
            setIsLoading(false);
            if (response.access_token) {
              setAccessToken(response.access_token);
              localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                  headers: { Authorization: `Bearer ${response.access_token}` },
                });
                if (userRes.ok) {
                  const ud = await userRes.json();
                  const profile: GoogleUserProfile = { email: ud.email, name: ud.name, picture: ud.picture };
                  setUser(profile);
                  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
                  await resolverSessao(profile, response.access_token, spreadsheetId);
                }
              } catch {}
            }
          },
          error_callback: () => { setIsLoading(false); },
        });
        client.requestAccessToken();
        return;
      }
      setErrorMessage(firebaseErr?.message || 'Erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    setSpreadsheetId(null);
    setMinisterio(null);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.SPREADSHEET_ID);
    localStorage.removeItem(STORAGE_KEYS.MINISTERIO);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ROLE);
    localStorage.removeItem(STORAGE_KEYS.APP_DATA);
    localStorage.removeItem('escalalouvor_app_data_v1'); // limpa cache antigo
    firebaseLogout().catch(() => {});
    setSession({ stage: 'login' });
  };

  const handleUseLocalMode = () => {
    const demoProfile: GoogleUserProfile = { name: 'Líder Local', email: 'lider@local.com', picture: '' };
    setUser(demoProfile);
    setAccessToken('local-demo');
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'local-demo');
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(demoProfile));
    const localMin: MinisterioInfo = {
      spreadsheet_id: 'local', nome: 'Modo Local', codigo: 'LOCAL',
      lider_email: demoProfile.email, lider_nome: demoProfile.name, membros: [],
    };
    setMinisterio(localMin);
    setSession({ stage: 'app', role: 'lider', ministerio: localMin });
  };

  // ── Criar ministério ──────────────────────────────────────────────────────
  const handleCriarMinisterio = async (nome: string, codigo: string) => {
    if (!user || !accessToken) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { id } = await createDefaultSpreadsheet(accessToken);
      setSpreadsheetId(id);
      localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id);

      const permissao = {
        email: user.email,
        nome: user.name,
        role: 'lider' as const,
        spreadsheet_id: id,
        ministerio_nome: nome,
        ministerio_codigo: codigo,
        aprovado: true,
      };
      await registrarUsuario(id, accessToken, permissao, user.picture || '');

      // Adiciona o líder como membro na lista de membros da equipe
      const liderMembro: Membro = {
        id: `m_lider_${Date.now()}`,
        nome: user.name,
        email: user.email,
        telefone: '',
        funcoes: ['Líder'],
        ministerio: nome,
        ativo: true,
      };
      const appDataComLider = { ...INITIAL_APP_DATA, membros: [liderMembro] };
      setAppData(appDataComLider);
      await writeFullAppDataToSheet(id, accessToken, appDataComLider);

      const info: MinisterioInfo = {
        spreadsheet_id: id, nome, codigo,
        lider_email: user.email, lider_nome: user.name,
        membros: [permissao],
      };
      setMinisterio(info);

      // Registra no índice central do super admin (silencioso se falhar)
      registrarNoIndice(accessToken, {
        spreadsheet_id: id,
        ministerio_nome: nome,
        ministerio_codigo: codigo,
        lider_email: user.email,
        lider_nome: user.name,
      }).catch(() => {});

      const token = gerarTokenConvite(id, codigo);
      // #10 Copia automaticamente e mostra só o código curto
      try { navigator.clipboard.writeText(token); } catch {}
      showToast(`Ministério "${nome}" criado! Código copiado: ${codigo}`);
      setSession({ stage: 'app', role: 'lider', ministerio: info });
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao criar ministério.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Entrar em ministério existente ────────────────────────────────────────
  const handleEntrarMinisterio = async (sheetId: string, codigo: string) => {
    if (!user || !accessToken) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await garantirAbaPermissoes(sheetId, accessToken);
      const jaExiste = await buscarPermissaoUsuario(sheetId, accessToken, user.email);

      if (!jaExiste) {
        // Busca o nome do ministério da planilha antes de registrar
        const infoPrevia = await carregarMinisterioInfo(sheetId, accessToken);
        const permissao = {
          email: user.email, nome: user.name, role: 'membro' as const,
          spreadsheet_id: sheetId,
          ministerio_nome: infoPrevia.nome || '',
          ministerio_codigo: codigo,
          aprovado: false,
        };
        await registrarUsuario(sheetId, accessToken, permissao, user.picture || '');
      }

      setSpreadsheetId(sheetId);
      localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, sheetId);
      const info = await carregarMinisterioInfo(sheetId, accessToken);
      setMinisterio(info);

      const permissaoAtual = await buscarPermissaoUsuario(sheetId, accessToken, user.email);
      if (permissaoAtual?.aprovado) {
        // Carrega dados e garante que o membro está na lista
        const dados = await fetchSpreadsheetData(sheetId, accessToken);
        const jaEstaNaLista = dados.membros.some(m => m.email.toLowerCase() === user.email.toLowerCase());
        if (!jaEstaNaLista) {
          const novoMembro: Membro = {
            id: `m_${Date.now()}`,
            nome: user.name,
            email: user.email,
            telefone: '',
            funcoes: ['Vocal'],
            ministerio: info.nome,
            ativo: true,
          };
          dados.membros.push(novoMembro);
          await writeFullAppDataToSheet(sheetId, accessToken, dados);
        }
        setAppData(dados);
        setSession({ stage: 'app', role: permissaoAtual.role, ministerio: info });
      } else {
        setSession({ stage: 'aguardando_aprovacao', ministerio: info });
      }
    } catch (e: any) {
      setErrorMessage('Código inválido ou planilha inacessível. Verifique com seu líder.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Verificar aprovação ───────────────────────────────────────────────────
  const handleVerificarAprovacao = async () => {
    if (!user || !accessToken || !spreadsheetId) return;
    setIsVerificando(true);
    try {
      const permissao = await buscarPermissaoUsuario(spreadsheetId, accessToken, user.email);
      if (permissao?.aprovado && ministerio) {
        // Carrega dados da planilha para ter os membros atualizados
        const dados = await fetchSpreadsheetData(spreadsheetId, accessToken);
        setAppData(dados);
        setSession({ stage: 'app', role: permissao.role, ministerio });
        showToast('Acesso aprovado! Bem-vindo ao ministério.');
      } else {
        showToast('Ainda aguardando aprovação do líder.');
      }
    } catch {}
    setIsVerificando(false);
  };

  // ── Sync & dados ──────────────────────────────────────────────────────────
  const syncToSheetIfConnected = async (newData: AppDataState) => {
    if (!spreadsheetId || !accessToken || accessToken === 'local-demo') return;
    if (!navigator.onLine) return; // #12 não tenta sync offline
    setSyncStatus('saving');
    try {
      await writeFullAppDataToSheet(spreadsheetId, accessToken, newData);
      setSyncStatus('saved');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (e: any) {
      // #1 Detectar token expirado
      if (e.message?.includes('401') || e.message?.includes('403')) {
        setTokenExpirado(true);
      }
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!accessToken) { handleGoogleLogin(); return; }
    setIsLoading(true);
    try {
      const { id } = await createDefaultSpreadsheet(accessToken);
      setSpreadsheetId(id);
      localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id);
      showToast('Nova planilha criada com sucesso!');
      setActiveTab('home');
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao criar planilha');
    } finally { setIsLoading(false); }
  };

  const handleSaveSpreadsheetId = async (id: string) => {
    if (!accessToken) { handleGoogleLogin(); return; }
    setIsLoading(true);
    try {
      const loadedData = await fetchSpreadsheetData(id, accessToken);
      setSpreadsheetId(id);
      localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id);
      setAppData(loadedData);
      showToast('Planilha carregada com sucesso!');
      setActiveTab('home');
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao conectar à planilha');
    } finally { setIsLoading(false); }
  };

  const handleConfirmPresence = (escaladoId: string, status: StatusConfirmacao) => {
    setAppData(prev => {
      const next = { ...prev, escalados: prev.escalados.map(e => e.id === escaladoId ? { ...e, confirmado: status } : e) };
      syncToSheetIfConnected(next);
      return next;
    });
    showToast(status === 'sim' ? 'Presença confirmada!' : 'Aviso registrado.');
  };

  const handleSaveEscala = (
    escalaData: Omit<Escala, 'id'>,
    escaladosList: Array<{ membro_id: string; funcao: string }>,
    setlistList: Array<{ musica_id: string; ordem: number; tom_definido: string }>,
    existingId?: string
  ) => {
    const escalaId = existingId || `esc_${Date.now()}`;
    const newEscala: Escala = { ...escalaData, id: escalaId };
    const newEscalados: Escalado[] = escaladosList.map((item, idx) => ({
      id: `escd_${escalaId}_${idx}`, escala_id: escalaId,
      membro_id: item.membro_id, funcao: item.funcao, confirmado: 'pendente',
    }));
    const newSetlist: MusicaEscala[] = setlistList.map((item, idx) => ({
      id: `re_${escalaId}_${idx}`, escala_id: escalaId,
      musica_id: item.musica_id, ordem: item.ordem, tom_definido: item.tom_definido,
    }));
    setAppData(prev => {
      const next = {
        ...prev,
        escalas: [newEscala, ...prev.escalas.filter(e => e.id !== escalaId)],
        escalados: [...newEscalados, ...prev.escalados.filter(e => e.escala_id !== escalaId)],
        repertorioEscala: [...newSetlist, ...prev.repertorioEscala.filter(re => re.escala_id !== escalaId)],
      };
      syncToSheetIfConnected(next);
      return next;
    });
    showToast(escalaData.status === 'publicada' ? 'Escala publicada!' : 'Rascunho salvo!');
    setSelectedEscalaId(escalaId);
    setActiveTab('escala_detalhe');
  };

  const handlePublishEscala = (id: string) => {
    setAppData(prev => {
      const next = { ...prev, escalas: prev.escalas.map(e => e.id === id ? { ...e, status: 'publicada' as const } : e) };
      syncToSheetIfConnected(next);
      return next;
    });
    showToast('Escala publicada!');
  };

  const handleDeleteEscala = (id: string) => {
    setAppData(prev => {
      const next = { ...prev, escalas: prev.escalas.filter(e => e.id !== id), escalados: prev.escalados.filter(e => e.escala_id !== id), repertorioEscala: prev.repertorioEscala.filter(re => re.escala_id !== id) };
      syncToSheetIfConnected(next);
      return next;
    });
    showToast('Escala excluída.');
    setActiveTab('escalas');
  };

  const handleAddMusica = (musica: Omit<Musica, 'id'>) => {
    const newSong: Musica = { ...musica, id: `mus_${Date.now()}` };
    setAppData(prev => { const next = { ...prev, repertorio: [newSong, ...prev.repertorio] }; syncToSheetIfConnected(next); return next; });
    showToast('Música adicionada!');
  };
  const handleEditMusica = (id: string, musica: Omit<Musica, 'id'>) => {
    setAppData(prev => { const next = { ...prev, repertorio: prev.repertorio.map(m => m.id === id ? { ...musica, id } : m) }; syncToSheetIfConnected(next); return next; });
    showToast('Música atualizada!');
  };
  const handleDeleteMusica = (id: string) => {
    setAppData(prev => { const next = { ...prev, repertorio: prev.repertorio.filter(m => m.id !== id) }; syncToSheetIfConnected(next); return next; });
    showToast('Música removida.');
  };
  const handleAddMembro = (membro: Omit<Membro, 'id'>) => {
    const newMembro: Membro = { ...membro, id: `m_${Date.now()}` };
    setAppData(prev => { const next = { ...prev, membros: [...prev.membros, newMembro] }; syncToSheetIfConnected(next); return next; });
    showToast('Membro cadastrado!');
  };
  const handleEditMembro = (id: string, membro: Omit<Membro, 'id'>) => {
    setAppData(prev => { const next = { ...prev, membros: prev.membros.map(m => m.id === id ? { ...membro, id } : m) }; syncToSheetIfConnected(next); return next; });
    showToast('Membro atualizado!');
  };
  const handleDeleteMembro = (id: string) => {
    setAppData(prev => { const next = { ...prev, membros: prev.membros.filter(m => m.id !== id) }; syncToSheetIfConnected(next); return next; });
    showToast('Membro removido.');
  };
  const handleAddDisponibilidade = (membroId: string, dataIndisponivel: string, motivo: string) => {
    const newInd: Indisponibilidade = { id: `ind_${Date.now()}`, membro_id: membroId, data_indisponivel: dataIndisponivel, motivo };
    setAppData(prev => { const next = { ...prev, disponibilidades: [newInd, ...prev.disponibilidades] }; syncToSheetIfConnected(next); return next; });
    showToast('Aviso cadastrado!');
  };
  const handleDeleteDisponibilidade = (id: string) => {
    setAppData(prev => { const next = { ...prev, disponibilidades: prev.disponibilidades.filter(d => d.id !== id) }; syncToSheetIfConnected(next); return next; });
    showToast('Aviso removido.');
  };

  // ── Salvar perfil do usuário ──────────────────────────────────────────────
  const handleSavePerfil = (telefone: string, funcoes: string[]) => {
    if (!user) return;
    setAppData(prev => {
      const idx = prev.membros.findIndex(m => m.email.toLowerCase() === user.email.toLowerCase());
      let novos: typeof prev.membros;
      if (idx !== -1) {
        novos = prev.membros.map((m, i) => i === idx ? { ...m, telefone, funcoes } : m);
      } else {
        const novoMembro: Membro = {
          id: `m_${Date.now()}`,
          nome: user.name,
          email: user.email,
          telefone,
          funcoes,
          ministerio: ministerio?.nome || '',
          ativo: true,
        };
        novos = [...prev.membros, novoMembro];
      }
      const next = { ...prev, membros: novos };
      syncToSheetIfConnected(next);
      return next;
    });
    showToast('Perfil atualizado!');
  };

  // ── Render por stage ──────────────────────────────────────────────────────
  if (session.stage === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center animate-pulse">
            <span className="text-slate-950 font-black text-lg">E</span>
          </div>
          <p className="text-slate-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (session.stage === 'login') {
    return <LoginView isLoading={isLoading} onGoogleLogin={handleGoogleLogin} />;
  }

  if (session.stage === 'onboarding' && user && accessToken) {
    return (
      <OnboardingView
        user={user}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onCriarMinisterio={handleCriarMinisterio}
        onEntrarMinisterio={handleEntrarMinisterio}
        onLogout={handleLogout}
      />
    );
  }

  if (session.stage === 'aguardando_aprovacao' && user) {
    return (
      <AguardandoView
        user={user}
        ministerio={session.ministerio}
        onLogout={handleLogout}
        onVerificar={handleVerificarAprovacao}
        isVerificando={isVerificando}
      />
    );
  }

  if (session.stage === 'super_admin' && user && accessToken) {
    return <SuperAdminView user={user} accessToken={accessToken} onLogout={handleLogout} />;
  }

  // ── App principal ─────────────────────────────────────────────────────────
  const isLeader = session.stage === 'app' && (session.role === 'lider' || session.role === 'super_admin');
  const currentMinisterio = session.stage === 'app' ? session.ministerio : null;

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-slate-950 px-4 py-3 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-2 border border-amber-400">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* #1 Banner token expirado */}
      {tokenExpirado && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-rose-600 text-white text-xs font-semibold text-center py-2 flex items-center justify-center gap-3">
          <span>Sessão expirada. Faça login novamente para continuar sincronizando.</span>
          <button onClick={handleGoogleLogin} className="underline font-extrabold">Reconectar</button>
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && !tokenExpirado && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-800 text-slate-300 text-xs font-semibold text-center py-1.5 flex items-center justify-center gap-2">
          <CloudOff className="w-3.5 h-3.5 text-rose-400" />
          Modo offline — mostrando dados salvos localmente
        </div>
      )}

      {/* #8 Indicador de sincronização */}
      {syncStatus !== 'idle' && isOnline && (
        <div className={`fixed bottom-20 left-4 md:bottom-8 z-40 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg transition-all ${
          syncStatus === 'saving' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
          syncStatus === 'saved' ? 'bg-emerald-800 text-emerald-300 border border-emerald-700' :
          'bg-rose-800 text-rose-300 border border-rose-700'
        }`}>
          {syncStatus === 'saving' && <SyncIcon className="w-3.5 h-3.5 animate-spin" />}
          {syncStatus === 'saved' && <Cloud className="w-3.5 h-3.5" />}
          {syncStatus === 'error' && <CloudOff className="w-3.5 h-3.5" />}
          {syncStatus === 'saving' ? 'Salvando...' : syncStatus === 'saved' ? 'Sincronizado' : 'Erro ao salvar'}
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isLeader={isLeader}
        ministerio={currentMinisterio}
        spreadsheetId={spreadsheetId}
        isInstallable={isInstallable}
        pendentesCount={pendentesCount}
        onInstallPwa={handleInstallPwa}
        onOpenSetup={() => setActiveTab('setup')}
      />

      <main className={`flex-1 max-w-6xl w-full mx-auto px-4 py-6 ${tokenExpirado || !isOnline ? 'mt-8' : ''}`}>
        {activeTab === 'home' && (
          <HomeDashboard appData={appData} user={user} isLeader={isLeader} setActiveTab={setActiveTab}
            onSelectEscala={id => { setSelectedEscalaId(id); setActiveTab('escala_detalhe'); }}
            onConfirmPresence={handleConfirmPresence}
            onCreateEscala={() => { setEditingEscalaId(null); setActiveTab('escala_form'); }} />
        )}
        {activeTab === 'escalas' && (
          <EscalasList appData={appData} isLeader={isLeader}
            onSelectEscala={id => { setSelectedEscalaId(id); setActiveTab('escala_detalhe'); }}
            onCreateEscala={() => { setEditingEscalaId(null); setActiveTab('escala_form'); }} />
        )}
        {activeTab === 'escala_detalhe' && selectedEscalaId && (
          <EscalaDetail escalaId={selectedEscalaId} appData={appData} isLeader={isLeader} user={user}
            onBack={() => setActiveTab('escalas')}
            onEditEscala={id => { setEditingEscalaId(id); setActiveTab('escala_form'); }}
            onPublishEscala={handlePublishEscala} onDeleteEscala={handleDeleteEscala}
            onConfirmPresence={handleConfirmPresence} />
        )}
        {activeTab === 'escala_form' && (
          <EscalaForm escalaIdToEdit={editingEscalaId} appData={appData}
            onBack={() => setActiveTab(selectedEscalaId ? 'escala_detalhe' : 'escalas')}
            onSaveEscala={handleSaveEscala} />
        )}
        {activeTab === 'repertorio' && (
          <RepertorioView appData={appData} isLeader={isLeader}
            onAddMusica={handleAddMusica} onEditMusica={handleEditMusica} onDeleteMusica={handleDeleteMusica} />
        )}
        {activeTab === 'membros' && (
          <MembrosView appData={appData} isLeader={isLeader} currentUserEmail={user?.email}
            onAddMembro={handleAddMembro} onEditMembro={handleEditMembro} onDeleteMembro={handleDeleteMembro} />
        )}
        {activeTab === 'disponibilidade' && (
          <DisponibilidadeView appData={appData} user={user} isLeader={isLeader}
            onAddDisponibilidade={handleAddDisponibilidade} onDeleteDisponibilidade={handleDeleteDisponibilidade} />
        )}
        {activeTab === 'setup' && (
          <SetupView user={user} spreadsheetId={spreadsheetId} accessToken={accessToken}
            onSaveSpreadsheetId={handleSaveSpreadsheetId} onCreateNewSpreadsheet={handleCreateNewSpreadsheet}
            onGoogleLogin={handleGoogleLogin} onUseLocalMode={handleUseLocalMode}
            isLoading={isLoading} errorMessage={errorMessage} />
        )}
        {activeTab === 'perfil' && (
          <PerfilView user={user} isLeader={isLeader} ministerio={currentMinisterio}
            appData={appData}
            spreadsheetId={spreadsheetId} isInstallable={isInstallable}
            onInstallPwa={handleInstallPwa} onOpenSetup={() => setActiveTab('setup')}
            onGoogleLogin={handleGoogleLogin} onLogout={handleLogout}
            onSavePerfil={handleSavePerfil} />
        )}
      </main>

      {/* #11 Botão de feedback flutuante */}
      <FeedbackButton user={user} accessToken={accessToken} ministerio={currentMinisterio} />

      <footer className="border-t border-slate-200/80 bg-[#F8F7F3] py-6 text-center text-xs text-slate-500 mb-16 md:mb-0">
        <p>Escalas de Louvor • Sistema de Gestão de Escalas e Ministérios</p>
      </footer>
    </div>
  );
}
