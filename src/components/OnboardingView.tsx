import React, { useState } from 'react';
import { Plus, LogIn, Sparkles, ArrowLeft, Copy, Check, AlertCircle } from 'lucide-react';
import { GoogleUserProfile } from '../types';
import { gerarCodigoMinisterio, gerarTokenConvite, decodificarTokenConvite } from '../services/permissoes';

interface OnboardingViewProps {
  user: GoogleUserProfile;
  isLoading: boolean;
  errorMessage: string | null;
  onCriarMinisterio: (nome: string, codigo: string) => Promise<void>;
  onEntrarMinisterio: (spreadsheetId: string, codigo: string) => Promise<void>;
  onLogout: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({
  user,
  isLoading,
  errorMessage,
  onCriarMinisterio,
  onEntrarMinisterio,
  onLogout,
}) => {
  const [modo, setModo] = useState<'escolha' | 'criar' | 'entrar'>('escolha');
  const [nomeMinisterio, setNomeMinisterio] = useState('');
  const [codigoGerado, setCodigoGerado] = useState('');
  const [tokenEntrada, setTokenEntrada] = useState('');
  const [copiado, setCopiado] = useState(false);

  const handleGerarCodigo = (nome: string) => {
    setNomeMinisterio(nome);
    if (nome.trim().length >= 2) {
      setCodigoGerado(gerarCodigoMinisterio(nome));
    } else {
      setCodigoGerado('');
    }
  };

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeMinisterio.trim() || !codigoGerado) return;
    await onCriarMinisterio(nomeMinisterio.trim(), codigoGerado);
  };

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenEntrada.trim();
    if (!token) return;

    const decoded = decodificarTokenConvite(token);
    if (!decoded) {
      return;
    }
    await onEntrarMinisterio(decoded.spreadsheetId, decoded.codigo);
  };

  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <span className="font-extrabold text-white">EscalaLouvor</span>
          </div>
          <button
            onClick={onLogout}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Sair
          </button>
        </div>

        {/* User greeting */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full border-2 border-amber-500/50" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-extrabold">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-extrabold text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── ESCOLHA ── */}
        {modo === 'escolha' && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-extrabold text-white">Bem-vindo!</h2>
              <p className="text-slate-400 text-sm">O que você quer fazer?</p>
            </div>

            <button
              onClick={() => setModo('criar')}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition-all shadow-lg shadow-amber-500/20"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-950/20 flex items-center justify-center shrink-0">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold">Criar meu ministério</p>
                <p className="text-xs font-medium opacity-70 mt-0.5">Sou líder e quero começar um novo ministério</p>
              </div>
            </button>

            <button
              onClick={() => setModo('entrar')}
              className="w-full flex items-center gap-4 p-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-extrabold transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                <LogIn className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold">Entrar num ministério</p>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Tenho o código — novo dispositivo ou novo membro</p>
              </div>
            </button>
          </div>
        )}

        {/* ── CRIAR ── */}
        {modo === 'criar' && (
          <form onSubmit={handleCriar} className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModo('escolha')}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-extrabold text-white">Criar Ministério</h2>
                <p className="text-xs text-slate-400">Você será o líder deste ministério</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nome do Ministério *
                </label>
                <input
                  type="text"
                  value={nomeMinisterio}
                  onChange={e => handleGerarCodigo(e.target.value)}
                  placeholder="Ex: Igreja Sião, Ministério Ágape..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>

              {codigoGerado && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Código do Ministério
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <span className="flex-1 font-mono font-extrabold text-amber-400 text-lg tracking-widest">
                      {codigoGerado}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopiar(codigoGerado)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      {copiado ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Este código será compartilhado com sua equipe para entrar no ministério.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !nomeMinisterio.trim() || !codigoGerado}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Criando ministério...
                  </>
                ) : (
                  'Criar Ministério'
                )}
              </button>
            </div>
          </form>
        )}

        {/* ── ENTRAR ── */}
        {modo === 'entrar' && (
          <form onSubmit={handleEntrar} className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModo('escolha')}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-extrabold text-white">Entrar no Ministério</h2>
                <p className="text-xs text-slate-400">Novo membro ou acessando de outro dispositivo</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Código de Convite *
                </label>
                <input
                  type="text"
                  value={tokenEntrada}
                  onChange={e => setTokenEntrada(e.target.value.trim())}
                  placeholder="Cole o código aqui..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                  required
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  Peça ao líder o código de convite. Se já é membro e está num dispositivo novo, use o mesmo código de sempre.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !tokenEntrada.trim()}
                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Enviando solicitação...
                  </>
                ) : (
                  'Solicitar Entrada'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
