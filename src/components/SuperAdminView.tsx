import React, { useState, useEffect } from 'react';
import { Shield, Users, LogOut, RefreshCw, ChevronDown, ChevronUp, Crown, AlertCircle, Sparkles, Copy, Check, ExternalLink, MessageSquarePlus } from 'lucide-react';
import { GoogleUserProfile, PermissaoMembro, UserRole } from '../types';
import { lerPermissoes, atualizarPermissao, gerarTokenConvite } from '../services/permissoes';
import { lerIndice, MinisterioIndice } from '../services/indice';

interface SuperAdminViewProps {
  user: GoogleUserProfile;
  accessToken: string;
  onLogout: () => void;
}

interface MinisterioCard extends MinisterioIndice {
  membros: PermissaoMembro[];
  pendentes: PermissaoMembro[];
  carregado: boolean;
  erro?: string;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ user, accessToken, onLogout }) => {
  const [ministerios, setMinisterios] = useState<MinisterioCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'ministerios' | 'feedback'>('ministerios');

  const carregarMinisterios = async () => {
    setIsLoading(true);
    setErro(null);
    try {
      const indice = await lerIndice(accessToken);
      const cards: MinisterioCard[] = indice.map(m => ({
        ...m,
        membros: [],
        pendentes: [],
        carregado: false,
      }));
      setMinisterios(cards);
    } catch (e: any) {
      setErro('Erro ao carregar ministérios: ' + (e.message || ''));
    } finally {
      setIsLoading(false);
    }
  };

  const carregarDetalheMinisterio = async (sid: string) => {
    try {
      const perms = await lerPermissoes(sid, accessToken);
      setMinisterios(prev => prev.map(m => m.spreadsheet_id === sid ? {
        ...m,
        membros: perms.filter(p => p.aprovado),
        pendentes: perms.filter(p => !p.aprovado),
        carregado: true,
      } : m));
    } catch {
      setMinisterios(prev => prev.map(m => m.spreadsheet_id === sid ? {
        ...m, carregado: true, erro: 'Sem acesso à planilha',
      } : m));
    }
  };

  const carregarFeedbacks = async () => {
    try {
      const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
      const sheetId = import.meta.env.VITE_SUPER_ADMIN_INDEX_SHEET_ID;
      const res = await fetch(
        `${SHEETS_API_BASE}/${sheetId}/values/Feedback!A1:H500`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const rows: string[][] = data.values || [];
        const items = rows.slice(1).filter(r => r[0]).map(r => ({
          id: r[0], tipo: r[1], titulo: r[2], descricao: r[3],
          email: r[4], nome: r[5], ministerio: r[6], data: r[7],
        })).reverse(); // mais recentes primeiro
        setFeedbacks(items);
      }
    } catch {}
  };

  useEffect(() => {
    carregarMinisterios();
    carregarFeedbacks();
  }, []);

  const handleToggleExpandir = async (sid: string) => {
    if (expandido === sid) {
      setExpandido(null);
      return;
    }
    setExpandido(sid);
    const card = ministerios.find(m => m.spreadsheet_id === sid);
    if (card && !card.carregado) {
      await carregarDetalheMinisterio(sid);
    }
  };

  const handleAprovar = async (sid: string, email: string) => {
    setAtualizando(email);
    try {
      await atualizarPermissao(sid, accessToken, email, { aprovado: true });
      await carregarDetalheMinisterio(sid);
    } catch (e: any) {
      setErro(e.message || 'Erro ao aprovar.');
    } finally {
      setAtualizando(null);
    }
  };

  const handleAlterarRole = async (sid: string, email: string, role: UserRole) => {
    setAtualizando(email);
    try {
      await atualizarPermissao(sid, accessToken, email, { role });
      await carregarDetalheMinisterio(sid);
    } catch (e: any) {
      setErro(e.message || 'Erro ao alterar papel.');
    } finally {
      setAtualizando(null);
    }
  };

  const handleCopiarConvite = (sid: string, codigo: string) => {
    const token = gerarTokenConvite(sid, codigo);
    navigator.clipboard.writeText(token);
    setCopiado(sid);
    setTimeout(() => setCopiado(null), 2000);
  };

  const totalMembros = ministerios.reduce((acc, m) => acc + m.total_membros, 0);
  const totalPendentes = ministerios.reduce((acc, m) => acc + m.pendentes.length, 0);

  const TIPO_COLORS: Record<string, string> = {
    bug: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    melhoria: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    elogio: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    outro: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur border-b border-slate-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-white">Escalas de Louvor</span>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                Super Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border-2 border-amber-500/50" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                {user.name.charAt(0)}
              </div>
            )}
            <button onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">
              <LogOut className="w-3.5 h-3.5" />Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Ministérios', value: ministerios.length, icon: '⛪' },
            { label: 'Membros Totais', value: totalMembros, icon: '👥' },
            { label: 'Feedbacks', value: feedbacks.length, icon: '💬' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-extrabold text-white">{s.value}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Erro */}
        {erro && (
          <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-2 bg-slate-800/50 p-1 rounded-2xl border border-slate-700/50 w-fit">
          {[
            { id: 'ministerios', label: 'Ministérios', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'feedback', label: `Feedback (${feedbacks.length})`, icon: <MessageSquarePlus className="w-3.5 h-3.5" /> },
          ].map(aba => (
            <button key={aba.id} onClick={() => setAbaAtiva(aba.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                abaAtiva === aba.id ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}>
              {aba.icon}{aba.label}
            </button>
          ))}
        </div>

        {/* ── ABA MINISTÉRIOS ── */}
        {abaAtiva === 'ministerios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">
                Todos os Ministérios ({ministerios.length})
              </h2>
              <button onClick={carregarMinisterios} disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            {isLoading && (
              <div className="text-center py-12 text-slate-500 text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-amber-400" />
                Carregando ministérios...
              </div>
            )}

            {!isLoading && ministerios.length === 0 && (
              <div className="text-center py-12 bg-slate-800/40 rounded-3xl border border-slate-700/50">
                <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-bold">Nenhum ministério cadastrado ainda</p>
                <p className="text-slate-600 text-xs mt-1">Quando um líder criar um ministério, aparecerá aqui.</p>
              </div>
            )}

            {ministerios.map(m => (
              <div key={m.spreadsheet_id} className="bg-slate-800/60 border border-slate-700/60 rounded-3xl overflow-hidden">
                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white">{m.ministerio_nome}</h3>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                        {m.ministerio_codigo}
                      </span>
                      {m.pendentes.length > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs">
                          {m.pendentes.length} pendente{m.pendentes.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Líder: {m.lider_nome} • {m.total_membros} membro{m.total_membros !== 1 ? 's' : ''} • Criado em {m.criado_em}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleCopiarConvite(m.spreadsheet_id, m.ministerio_codigo)}
                      className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors" title="Copiar código de convite">
                      {copiado === m.spreadsheet_id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a href={`https://docs.google.com/spreadsheets/d/${m.spreadsheet_id}`} target="_blank" rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors" title="Abrir planilha">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button onClick={() => handleToggleExpandir(m.spreadsheet_id)}
                      className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
                      {expandido === m.spreadsheet_id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {expandido === m.spreadsheet_id && (
                  <div className="border-t border-slate-700/50">
                    {!m.carregado ? (
                      <div className="p-5 text-center text-slate-500 text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-amber-400" />
                        Carregando membros...
                      </div>
                    ) : m.erro ? (
                      <div className="p-5 text-xs text-rose-400">{m.erro}</div>
                    ) : (
                      <div className="divide-y divide-slate-700/30">
                        {m.pendentes.length > 0 && (
                          <div className="p-5 space-y-3">
                            <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">Aguardando Aprovação</h4>
                            {m.pendentes.map(p => (
                              <div key={p.email} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-xs shrink-0">
                                    {p.nome.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{p.nome}</p>
                                    <p className="text-xs text-slate-400 truncate">{p.email}</p>
                                  </div>
                                </div>
                                <button onClick={() => handleAprovar(m.spreadsheet_id, p.email)} disabled={atualizando === p.email}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-colors shrink-0 disabled:opacity-50">
                                  {atualizando === p.email ? '...' : 'Aprovar'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {m.membros.length > 0 && (
                          <div className="p-5 space-y-3">
                            <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Membros Ativos</h4>
                            {m.membros.map(p => (
                              <div key={p.email} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    p.role === 'lider' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'
                                  }`}>
                                    {p.role === 'lider' ? <Crown className="w-3.5 h-3.5" /> : p.nome.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{p.nome}</p>
                                    <p className="text-xs text-slate-400 truncate">{p.email}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                                    p.role === 'lider' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-slate-700/50 border-slate-600/50 text-slate-300'
                                  }`}>
                                    {p.role === 'lider' ? 'Líder' : 'Membro'}
                                  </span>
                                  {p.role === 'membro' ? (
                                    <button onClick={() => handleAlterarRole(m.spreadsheet_id, p.email, 'lider')} disabled={atualizando === p.email}
                                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs transition-colors disabled:opacity-50">
                                      {atualizando === p.email ? '...' : '↑ Líder'}
                                    </button>
                                  ) : (
                                    <button onClick={() => handleAlterarRole(m.spreadsheet_id, p.email, 'membro')} disabled={atualizando === p.email}
                                      className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-400 font-bold text-xs transition-colors disabled:opacity-50">
                                      {atualizando === p.email ? '...' : '↓ Membro'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── ABA FEEDBACK ── */}
        {abaAtiva === 'feedback' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white">Feedbacks dos Usuários</h2>
              <button onClick={carregarFeedbacks}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />Atualizar
              </button>
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/40 rounded-3xl border border-slate-700/50">
                <MessageSquarePlus className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-bold">Nenhum feedback ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map(f => (
                  <div key={f.id} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${TIPO_COLORS[f.tipo] || TIPO_COLORS['outro']}`}>
                          {f.tipo}
                        </span>
                        <span className="text-sm font-bold text-white">{f.titulo}</span>
                      </div>
                      <span className="text-xs text-slate-500">{f.data}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{f.descricao}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 border-t border-slate-700/40">
                      <span className="font-semibold text-slate-400">{f.nome}</span>
                      <span>•</span>
                      <span>{f.ministerio}</span>
                      <span>•</span>
                      <span>{f.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
