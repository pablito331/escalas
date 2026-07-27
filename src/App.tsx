/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ActiveTab, AppDataState, Escala, Escalado, GoogleUserProfile, 
  Indisponibilidade, Membro, Musica, MusicaEscala, StatusConfirmacao 
} from './types';
import { INITIAL_APP_DATA } from './data/mockData';
import { 
  createDefaultSpreadsheet, fetchSpreadsheetData, writeFullAppDataToSheet 
} from './services/googleSheets';
import { googleSignInWithFirebase, getOAuthClientId, logout as firebaseLogout } from './services/firebaseAuth';
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
import { Check, AlertCircle } from 'lucide-react';

const STORAGE_KEYS = {
  SPREADSHEET_ID: 'escalalouvor_spreadsheet_id',
  ACCESS_TOKEN: 'escalalouvor_access_token',
  USER_PROFILE: 'escalalouvor_user_profile',
  APP_DATA: 'escalalouvor_app_data_v1',
  IS_LEADER: 'escalalouvor_is_leader',
};

// Declare window.google type for GIS client
declare global {
  interface Window {
    google?: any;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedEscalaId, setSelectedEscalaId] = useState<string | null>(null);
  const [editingEscalaId, setEditingEscalaId] = useState<string | null>(null);

  // App Data State
  const [appData, setAppData] = useState<AppDataState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.APP_DATA);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached app data', e);
      }
    }
    return INITIAL_APP_DATA;
  });

  // User & OAuth State
  const [user, setUser] = useState<GoogleUserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return saved ? JSON.parse(saved) : {
      email: 'pablocostaguimaraes@gmail.com',
      name: 'Pablo Guimarães',
      picture: '',
    };
  });

  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
  );

  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(
    localStorage.getItem(STORAGE_KEYS.SPREADSHEET_ID)
  );

  const [isLeader, setIsLeader] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.IS_LEADER);
    return saved !== null ? JSON.parse(saved) : true;
  });

  // UI Status State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  // Save changes to localStorage on data state update
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APP_DATA, JSON.stringify(appData));
  }, [appData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_LEADER, JSON.stringify(isLeader));
  }, [isLeader]);

  // Ensure active user (Leader) is present in Membros list
  useEffect(() => {
    if (!user || !user.email) return;

    setAppData(prev => {
      const userEmailLower = user.email.toLowerCase();
      const existingMemberIndex = prev.membros.findIndex(
        m => m.email.toLowerCase() === userEmailLower
      );

      if (existingMemberIndex !== -1) {
        const existing = prev.membros[existingMemberIndex];
        let changed = false;
        let updated = { ...existing };

        if (user.name && existing.nome !== user.name && (existing.nome === 'Gabriel Santos' || existing.id === 'm1')) {
          updated.nome = user.name;
          changed = true;
        }
        if (!existing.funcoes.includes('Líder')) {
          updated.funcoes = ['Líder', ...existing.funcoes];
          changed = true;
        }

        if (changed) {
          const updatedMembros = [...prev.membros];
          updatedMembros[existingMemberIndex] = updated;
          const nextData = { ...prev, membros: updatedMembros };
          syncToSheetIfConnected(nextData);
          return nextData;
        }
        return prev;
      } else {
        const newLeaderMembro: Membro = {
          id: `mem_leader_${Date.now()}`,
          nome: user.name || 'Líder de Louvor',
          email: user.email,
          telefone: '',
          funcoes: ['Líder', 'Ministro', 'Vocal'],
          ministerio: 'Louvor',
          ativo: true,
        };
        const nextData = {
          ...prev,
          membros: [newLeaderMembro, ...prev.membros],
        };
        syncToSheetIfConnected(nextData);
        return nextData;
      }
    });
  }, [user]);

  // PWA BeforeInstallPrompt Handler
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.log('SW registration error:', err);
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Google OAuth Login Flow via Firebase Auth popup & GIS fallback
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // 1. Primary path: Firebase Auth popup with Google Provider & scopes
      const result = await googleSignInWithFirebase();
      if (result && result.accessToken) {
        setAccessToken(result.accessToken);
        setUser(result.user);
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
        localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(result.user));
        showToast(`Bem-vindo, ${result.user.name}! Conectado com sucesso ao Google.`);
        setIsLoading(false);
        return;
      }
    } catch (firebaseErr: any) {
      console.warn('Firebase popup login failed, trying GIS client fallback:', firebaseErr);

      // 2. Fallback: GIS client with valid OAuth Client ID from firebase config
      const clientId = getOAuthClientId();
      if (window.google?.accounts?.oauth2 && clientId) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive.file',
            callback: async (response: any) => {
              setIsLoading(false);
              if (response.error) {
                showToast('Aviso de autenticação Google: ' + (response.error_description || response.error));
                return;
              }
              if (response.access_token) {
                setAccessToken(response.access_token);
                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.access_token);

                try {
                  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                    headers: { Authorization: `Bearer ${response.access_token}` },
                  });
                  if (userRes.ok) {
                    const userData = await userRes.json();
                    const profile: GoogleUserProfile = {
                      email: userData.email,
                      name: userData.name,
                      picture: userData.picture,
                    };
                    setUser(profile);
                    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
                  }
                } catch (e) {
                  console.error('Error fetching user info', e);
                }

                showToast('Autenticação Google concluída com sucesso!');
              }
            },
            error_callback: () => {
              setIsLoading(false);
              showToast('Serviço de login cancelado.');
            },
          });
          client.requestAccessToken();
          return;
        } catch (e) {
          console.error('GIS fallback error:', e);
        }
      }
      setIsLoading(false);
      showToast(firebaseErr?.message || 'Não foi possível completar o login do Google.');
    }
  };

  const handleUseLocalMode = () => {
    setAccessToken('local-demo');
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, 'local-demo');
    if (!user) {
      const demoProfile: GoogleUserProfile = {
        name: 'Usuário Líder / Local',
        email: 'lider.louvor@igreja.com',
        picture: '',
      };
      setUser(demoProfile);
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(demoProfile));
    }
    showToast('Modo Local ativado com sucesso!');
  };

  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    firebaseLogout().catch(() => {});
    showToast('Você saiu da conta.');
  };

  // Sync to Google Sheet Helper
  const syncToSheetIfConnected = async (newData: AppDataState) => {
    if (spreadsheetId && accessToken && accessToken !== 'local-demo') {
      try {
        await writeFullAppDataToSheet(spreadsheetId, accessToken, newData);
      } catch (e: any) {
        console.error('Failed to auto-sync to Google Sheet:', e);
      }
    }
  };

  // 1-Click Create Spreadsheet Handler
  const handleCreateNewSpreadsheet = async () => {
    if (!accessToken) {
      handleGoogleLogin();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { id } = await createDefaultSpreadsheet(accessToken);
      setSpreadsheetId(id);
      localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id);
      showToast('✨ Nova planilha criada com sucesso no seu Google Drive!');
      setActiveTab('home');
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || 'Erro ao criar planilha');
    } finally {
      setIsLoading(false);
    }
  };

  // Load / Connect Existing Spreadsheet Handler
  const handleSaveSpreadsheetId = async (id: string) => {
    if (!accessToken) {
      handleGoogleLogin();
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loadedData = await fetchSpreadsheetData(id, accessToken);
      setSpreadsheetId(id);
      localStorage.setItem(STORAGE_KEYS.SPREADSHEET_ID, id);
      setAppData(loadedData);
      showToast('Planilha validada e carregada com sucesso!');
      setActiveTab('home');
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('PERMISSION_DENIED')) {
        setErrorMessage('403: Sem permissão de acesso nesta planilha.');
      } else {
        setErrorMessage(e.message || 'Erro ao conectar à planilha');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Escalados Presence Confirmation
  const handleConfirmPresence = (escaladoId: string, status: StatusConfirmacao) => {
    setAppData(prev => {
      const newEscalados = prev.escalados.map(e =>
        e.id === escaladoId ? { ...e, confirmado: status } : e
      );
      const nextData = { ...prev, escalados: newEscalados };
      syncToSheetIfConnected(nextData);
      return nextData;
    });

    showToast(status === 'sim' ? 'Presença confirmada!' : 'Aviso de indisponibilidade registrado.');
  };

  // Schedule Actions
  const handleSaveEscala = (
    escalaData: Omit<Escala, 'id'>,
    escaladosList: Array<{ membro_id: string; funcao: string }>,
    setlistList: Array<{ musica_id: string; ordem: number; tom_definido: string }>,
    existingId?: string
  ) => {
    const escalaId = existingId || `esc_${Date.now()}`;

    const newEscalaObj: Escala = {
      ...escalaData,
      id: escalaId,
    };

    const newEscaladosObjs: Escalado[] = escaladosList.map((item, idx) => ({
      id: `escd_${escalaId}_${idx}`,
      escala_id: escalaId,
      membro_id: item.membro_id,
      funcao: item.funcao,
      confirmado: 'pendente',
    }));

    const newSetlistObjs: MusicaEscala[] = setlistList.map((item, idx) => ({
      id: `re_${escalaId}_${idx}`,
      escala_id: escalaId,
      musica_id: item.musica_id,
      ordem: item.ordem,
      tom_definido: item.tom_definido,
    }));

    setAppData(prev => {
      const filteredEscalas = prev.escalas.filter(e => e.id !== escalaId);
      const filteredEscalados = prev.escalados.filter(e => e.escala_id !== escalaId);
      const filteredSetlist = prev.repertorioEscala.filter(re => re.escala_id !== escalaId);

      const nextData = {
        ...prev,
        escalas: [newEscalaObj, ...filteredEscalas],
        escalados: [...newEscaladosObjs, ...filteredEscalados],
        repertorioEscala: [...newSetlistObjs, ...filteredSetlist],
      };

      syncToSheetIfConnected(nextData);
      return nextData;
    });

    showToast(escalaData.status === 'publicada' ? 'Escala publicada com sucesso!' : 'Rascunho de escala salvo!');
    setSelectedEscalaId(escalaId);
    setActiveTab('escala_detalhe');
  };

  const handlePublishEscala = (id: string) => {
    setAppData(prev => {
      const nextEscalas = prev.escalas.map(e => (e.id === id ? { ...e, status: 'publicada' as const } : e));
      const nextData = { ...prev, escalas: nextEscalas };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Escala publicada para a equipe!');
  };

  const handleDeleteEscala = (id: string) => {
    setAppData(prev => {
      const nextData = {
        ...prev,
        escalas: prev.escalas.filter(e => e.id !== id),
        escalados: prev.escalados.filter(e => e.escala_id !== id),
        repertorioEscala: prev.repertorioEscala.filter(re => re.escala_id !== id),
      };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Escala excluída.');
    setActiveTab('escalas');
  };

  // Repertoire Actions
  const handleAddMusica = (musica: Omit<Musica, 'id'>) => {
    const newSong: Musica = { ...musica, id: `mus_${Date.now()}` };
    setAppData(prev => {
      const nextData = { ...prev, repertorio: [newSong, ...prev.repertorio] };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Música adicionada ao repertório!');
  };

  const handleEditMusica = (id: string, musica: Omit<Musica, 'id'>) => {
    setAppData(prev => {
      const nextData = {
        ...prev,
        repertorio: prev.repertorio.map(m => (m.id === id ? { ...musica, id } : m)),
      };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Dados da música atualizados!');
  };

  const handleDeleteMusica = (id: string) => {
    setAppData(prev => {
      const nextData = {
        ...prev,
        repertorio: prev.repertorio.filter(m => m.id !== id),
      };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Música removida.');
  };

  // Member Actions
  const handleAddMembro = (membro: Omit<Membro, 'id'>) => {
    const newMembro: Membro = { ...membro, id: `m_${Date.now()}` };
    setAppData(prev => {
      const nextData = { ...prev, membros: [...prev.membros, newMembro] };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Membro cadastrado com sucesso!');
  };

  const handleEditMembro = (id: string, membro: Omit<Membro, 'id'>) => {
    setAppData(prev => {
      const nextData = {
        ...prev,
        membros: prev.membros.map(m => (m.id === id ? { ...membro, id } : m)),
      };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Cadastro do voluntário atualizado!');
  };

  const handleDeleteMembro = (id: string) => {
    setAppData(prev => {
      const nextData = {
        ...prev,
        membros: prev.membros.filter(m => m.id !== id),
      };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Membro removido.');
  };

  // Unavailability Actions
  const handleAddDisponibilidade = (membroId: string, dataIndisponivel: string, motivo: string) => {
    const newInd: Indisponibilidade = {
      id: `ind_${Date.now()}`,
      membro_id: membroId,
      data_indisponivel: dataIndisponivel,
      motivo,
    };

    setAppData(prev => {
      const nextData = { ...prev, disponibilidades: [newInd, ...prev.disponibilidades] };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Aviso de ausência cadastrado!');
  };

  const handleDeleteDisponibilidade = (id: string) => {
    setAppData(prev => {
      const nextData = {
        ...prev,
        disponibilidades: prev.disponibilidades.filter(d => d.id !== id),
      };
      syncToSheetIfConnected(nextData);
      return nextData;
    });
    showToast('Aviso de ausência removido.');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-slate-900 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-slate-950 px-4 py-3 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-2 border border-amber-400">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        isLeader={isLeader}
        setIsLeader={setIsLeader}
        spreadsheetId={spreadsheetId}
        isInstallable={isInstallable}
        onInstallPwa={handleInstallPwa}
        onOpenSetup={() => setActiveTab('setup')}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {activeTab === 'home' && (
          <HomeDashboard
            appData={appData}
            user={user}
            isLeader={isLeader}
            setActiveTab={setActiveTab}
            onSelectEscala={id => {
              setSelectedEscalaId(id);
              setActiveTab('escala_detalhe');
            }}
            onConfirmPresence={handleConfirmPresence}
            onCreateEscala={() => {
              setEditingEscalaId(null);
              setActiveTab('escala_form');
            }}
          />
        )}

        {activeTab === 'escalas' && (
          <EscalasList
            appData={appData}
            isLeader={isLeader}
            onSelectEscala={id => {
              setSelectedEscalaId(id);
              setActiveTab('escala_detalhe');
            }}
            onCreateEscala={() => {
              setEditingEscalaId(null);
              setActiveTab('escala_form');
            }}
          />
        )}

        {activeTab === 'escala_detalhe' && selectedEscalaId && (
          <EscalaDetail
            escalaId={selectedEscalaId}
            appData={appData}
            isLeader={isLeader}
            user={user}
            onBack={() => setActiveTab('escalas')}
            onEditEscala={id => {
              setEditingEscalaId(id);
              setActiveTab('escala_form');
            }}
            onPublishEscala={handlePublishEscala}
            onDeleteEscala={handleDeleteEscala}
            onConfirmPresence={handleConfirmPresence}
          />
        )}

        {activeTab === 'escala_form' && (
          <EscalaForm
            escalaIdToEdit={editingEscalaId}
            appData={appData}
            onBack={() => setActiveTab(selectedEscalaId ? 'escala_detalhe' : 'escalas')}
            onSaveEscala={handleSaveEscala}
          />
        )}

        {activeTab === 'repertorio' && (
          <RepertorioView
            appData={appData}
            isLeader={isLeader}
            onAddMusica={handleAddMusica}
            onEditMusica={handleEditMusica}
            onDeleteMusica={handleDeleteMusica}
          />
        )}

        {activeTab === 'membros' && (
          <MembrosView
            appData={appData}
            isLeader={isLeader}
            currentUserEmail={user?.email}
            onAddMembro={handleAddMembro}
            onEditMembro={handleEditMembro}
            onDeleteMembro={handleDeleteMembro}
          />
        )}

        {activeTab === 'disponibilidade' && (
          <DisponibilidadeView
            appData={appData}
            user={user}
            isLeader={isLeader}
            onAddDisponibilidade={handleAddDisponibilidade}
            onDeleteDisponibilidade={handleDeleteDisponibilidade}
          />
        )}

        {activeTab === 'setup' && (
          <SetupView
            user={user}
            spreadsheetId={spreadsheetId}
            accessToken={accessToken}
            onSaveSpreadsheetId={handleSaveSpreadsheetId}
            onCreateNewSpreadsheet={handleCreateNewSpreadsheet}
            onGoogleLogin={handleGoogleLogin}
            onUseLocalMode={handleUseLocalMode}
            isLoading={isLoading}
            errorMessage={errorMessage}
          />
        )}

        {activeTab === 'perfil' && (
          <PerfilView
            user={user}
            isLeader={isLeader}
            setIsLeader={setIsLeader}
            spreadsheetId={spreadsheetId}
            isInstallable={isInstallable}
            onInstallPwa={handleInstallPwa}
            onOpenSetup={() => setActiveTab('setup')}
            onGoogleLogin={handleGoogleLogin}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-[#F8F7F3] py-6 text-center text-xs text-slate-500 mb-16 md:mb-0">
        <p>EscalaLouvor • Sistema de Gestão de Escalas e Ministérios com Google Sheets</p>
      </footer>
    </div>
  );
}
