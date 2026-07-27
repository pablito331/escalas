import React, { useState } from 'react';
import { Clock, Copy, Check, LogOut, RefreshCw, Sparkles } from 'lucide-react';
import { GoogleUserProfile, MinisterioInfo } from '../types';
import { gerarTokenConvite } from '../services/permissoes';

interface AguardandoViewProps {
  user: GoogleUserProfile;
  ministerio: MinisterioInfo;
  onLogout: () => void;
  onVerificar: () => void;
  isVerificando: boolean;
}

export const AguardandoView: React.FC<AguardandoViewProps> = ({
  user,
  ministerio,
  onLogout,
  onVerificar,
  isVerificando,
}) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = () => {
    const token = gerarTokenConvite(ministerio.spreadsheet_id, ministerio.codigo);
    navigator.clipboard.writeText(token);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
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
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>

        {/* Card principal */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-6 space-y-5 text-center shadow-2xl">
          {/* Ícone animado */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-white">Aguardando Aprovação</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Sua solicitação para entrar no ministério{' '}
              <span className="text-amber-400 font-bold">{ministerio.nome}</span>{' '}
              foi enviada. O líder precisa aprovar seu acesso.
            </p>
          </div>

          {/* Info do usuário */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/50 text-left">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full border-2 border-slate-600" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-amber-400 font-bold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-white">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          {/* Info do ministério */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/50 text-left space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ministério</p>
            <p className="text-base font-extrabold text-white">{ministerio.nome}</p>
            {ministerio.lider_nome && (
              <p className="text-xs text-slate-400">
                Líder: <span className="text-slate-300 font-semibold">{ministerio.lider_nome}</span>
              </p>
            )}
          </div>

          {/* Botão verificar */}
          <button
            onClick={onVerificar}
            disabled={isVerificando}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isVerificando ? 'animate-spin' : ''}`} />
            {isVerificando ? 'Verificando...' : 'Verificar aprovação'}
          </button>
        </div>

        <p className="text-center text-xs text-slate-600 leading-relaxed">
          Assim que o líder aprovar, você terá acesso ao ministério.
          <br />Pode fechar o app e voltar depois.
        </p>
      </div>
    </div>
  );
};
