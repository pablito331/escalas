import React, { useState, useEffect } from 'react';
import { Shield, Users, LogOut, RefreshCw, ChevronDown, ChevronUp, Crown, User, AlertCircle, Sparkles, Copy, Check, ExternalLink } from 'lucide-react';
import { GoogleUserProfile, MinisterioInfo, PermissaoMembro, UserRole } from '../types';
import { lerPermissoes, atualizarPermissao, gerarTokenConvite } from '../services/permissoes';

interface MinisterioCard {
  spreadsheet_id: string;
  nome: string;
  codigo: string;
  lider: PermissaoMembro | null;
  membros: PermissaoMembro[];
  pendentes: PermissaoMembro[];
}

interface SuperAdminViewProps {
  user: GoogleUserProfile;
  accessToken: string;
  onLogout: () => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ user, accessToken, onLogout }) => {
  // O super admin gerencia ministérios cujos spreadsheet IDs foram registrados
  // Os IDs são armazenados em localStorage para persistência entre sessões
  const [ministeriosIds, setMinisteriosIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('superadmin_ministerios') || '[]');
    } catch { return []; }
  });

  const [ministerios, setMinisterios] = useState<MinisterioCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [novoId, setNovoId] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const carregarTodos = async () => {
    if (ministeriosIds.length === 0) return;
    setIsLoading(true);
    setErro(null);
    const cards: MinisterioCard[] = [];

    for (const sid of ministeriosIds) {
      try {
        const permissoes = await lerPermissoes(sid, accessToken);
        const lider = permissoes.find(p => p.role === 'lider') || null;
        const membros = permissoes.filter(p => p.role === 'membro' && p.aprovado);
        const pendentes = permissoes.filter(p => !p.aprovado);
        const primeiro = permissoes[0];

        cards.push({
          spreadsheet_id: sid,
          nome: primeiro?.ministerio_nome || 'Ministério sem nome',
          codigo: primeiro?.ministerio_codigo || '',
          lider,
          membros,
          pendentes,
        });
      } catch (e) {
        cards.push({
          spreadsheet_id: sid,
          nome: `Planilha ${sid.slice(0, 8)}...`,
          codigo: '',
          lider: null,
          membros: [],
          pendentes: [],
        });
      }
    }

    setMinisterios(cards);
    setIsLoading(false);
  };

  useEffect(() => {
    carregarTodos();
  }, [ministeriosIds]);

  const handleAdicionarMinisterio = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = novoId.trim();
    if (!id || ministeriosIds.includes(id)) return;
    const novos = [...ministeriosIds, id];
    setMinisteriosIds(novos);
    localStorage.setItem('superadmin_ministerios', JSON.stringify(novos));
    setNovoId('');
  };

  const handleRemoverMinisterio = (sid: string) => {
    const novos = ministeriosIds.filter(id => id !== sid);
    setMinisteriosIds(novos);
    localStorage.setItem('superadmin_ministerios', JSON.stringify(novos));
    setMinisterios(prev => prev.filter(m => m.spreadsheet_id !== sid));
  };

  const handleAlterarRole = async (sid: string, email: string, novoRole: UserRole) => {
    setAtualizando(email);
    try {
      await atualizarPermissao(sid, accessToken, email, { role: novoRole });
      await carregarTodos();
    } catch (e: any) {
      setErro(e.message || 'Erro ao atualizar papel.');
    } finally {
      setAtualizando(null);
    }
  };

  const handleAprovar = async (sid: string, email: string) => {
    setAtualizando(email);
    try {
      await atualizarPermissao(sid, accessToken, email, { aprovado: true });
      await carregarTodos();
    } catch (e: any) {
      setErro(e.message || 'Erro ao aprovar membro.');
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

  const totalMembros = ministerios.reduce((acc, m) => acc + m.membros.length + (m.lider ? 1 : 0), 0);
  const totalPendentes = ministerios.reduce((acc, m) => acc + m.pendentes.length, 0);

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
              <span className="font-extrabold text-white">EscalaLouvor</span>
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
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Ministérios', value: ministerios.length, icon: '⛪' },
            { label: 'Membros Ativos', value: totalMembros, icon: '👥' },
            { label: 'Aguardando', value: totalPendentes, icon: '⏳' },
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

        {/* Adicionar ministério */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 space-y-3">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            Adicionar Ministério para Gerenciar
          </h2>
          <form onSubmit={handleAdicionarMinisterio} className="flex gap-2">
            <input
              type="text"
              value={novoId}
              onChange={e => setNovoId(e.target.value)}
              placeholder="ID da planilha Google Sheets..."
              className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!novoId.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm transition-all disabled:opacity-50"
            >
              Adicionar
            </button>
          </form>
          <p className="text-xs text-slate-500">
            Cole o ID da planilha Google Sheets do ministério (encontrado na URL da planilha).
          </p>
        </div>

        {/* Lista de ministérios */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white">Ministérios</h2>
            <button
              onClick={carregarTodos}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
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
              <p className="text-slate-400 text-sm font-bold">Nenhum ministério adicionado</p>
              <p className="text-slate-600 text-xs mt-1">Adicione o ID de uma planilha acima para começar.</p>
            </div>
          )}

          {ministerios.map(m => (
            <div key={m.spreadsheet_id} className="bg-slate-800/60 border border-slate-700/60 rounded-3xl overflow-hidden">
              {/* Card header */}
              <div className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-white">{m.nome}</h3>
                    {m.codigo && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                        {m.codigo}
                      </span>
                    )}
                    {m.pendentes.length > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs">
                        {m.pendentes.length} pendente{m.pendentes.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {m.lider ? `Líder: ${m.lider.nome}` : 'Sem líder definido'}
                    {' · '}
                    {m.membros.length} membro{m.membros.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {m.codigo && (
                    <button
                      onClick={() => handleCopiarConvite(m.spreadsheet_id, m.codigo)}
                      title="Copiar código de convite"
                      className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    >
                      {copiado === m.spreadsheet_id
                        ? <Check className="w-4 h-4 text-emerald-400" />
                        : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${m.spreadsheet_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    title="Abrir planilha"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setExpandido(expandido === m.spreadsheet_id ? null : m.spreadsheet_id)}
                    className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                  >
                    {expandido === m.spreadsheet_id
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expandido */}
              {expandido === m.spreadsheet_id && (
                <div className="border-t border-slate-700/50 divide-y divide-slate-700/30">
                  {/* Pendentes */}
                  {m.pendentes.length > 0 && (
                    <div className="p-5 space-y-3">
                      <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider">
                        Aguardando Aprovação
                      </h4>
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
                          <button
                            onClick={() => handleAprovar(m.spreadsheet_id, p.email)}
                            disabled={atualizando === p.email}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
                          >
                            {atualizando === p.email ? '...' : 'Aprovar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Membros ativos */}
                  {(m.lider || m.membros.length > 0) && (
                    <div className="p-5 space-y-3">
                      <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                        Membros Ativos
                      </h4>
                      {[...(m.lider ? [m.lider] : []), ...m.membros].map(p => (
                        <div key={p.email} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-700/40">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              p.role === 'lider'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-slate-700 text-slate-300'
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
                              p.role === 'lider'
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                : 'bg-slate-700/50 border-slate-600/50 text-slate-300'
                            }`}>
                              {p.role === 'lider' ? 'Líder' : 'Membro'}
                            </span>
                            {/* Botão de promoção/rebaixamento */}
                            {p.role === 'membro' ? (
                              <button
                                onClick={() => handleAlterarRole(m.spreadsheet_id, p.email, 'lider')}
                                disabled={atualizando === p.email}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-bold text-xs transition-colors disabled:opacity-50"
                                title="Promover a Líder"
                              >
                                {atualizando === p.email ? '...' : '↑ Líder'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAlterarRole(m.spreadsheet_id, p.email, 'membro')}
                                disabled={atualizando === p.email}
                                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-400 font-bold text-xs transition-colors disabled:opacity-50"
                                title="Rebaixar para Membro"
                              >
                                {atualizando === p.email ? '...' : '↓ Membro'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Remover */}
                  <div className="p-4 flex justify-end">
                    <button
                      onClick={() => handleRemoverMinisterio(m.spreadsheet_id)}
                      className="text-xs text-slate-600 hover:text-rose-400 transition-colors font-semibold"
                    >
                      Remover da lista do admin
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
