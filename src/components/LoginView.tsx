import React from 'react';
import { Sparkles, Music } from 'lucide-react';

interface LoginViewProps {
  isLoading: boolean;
  onGoogleLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ isLoading, onGoogleLogin }) => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
            <Sparkles className="w-8 h-8 fill-slate-950 text-slate-950" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Escalas de Louvor</h1>
            <p className="text-amber-400 text-sm font-semibold tracking-wider uppercase mt-1">
              Gestão de Ministérios
            </p>
          </div>
          <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
            Organize escalas, repertório e equipe do seu ministério de louvor com facilidade.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🎵', label: 'Repertório' },
            { icon: '📅', label: 'Escalas' },
            { icon: '👥', label: 'Equipe' },
          ].map(f => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50"
            >
              <span className="text-2xl">{f.icon}</span>
              <span className="text-xs font-bold text-slate-300">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-3xl p-6 space-y-4 shadow-2xl">
          <div className="text-center">
            <h2 className="text-lg font-extrabold text-white">Entrar no Escalas de Louvor</h2>
            <p className="text-slate-400 text-xs mt-1">
              Use sua conta Google para acessar
            </p>
          </div>

          <button
            onClick={onGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Entrando...</span>
              </>
            ) : (
              <>
                {/* Google logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continuar com Google</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-500 leading-relaxed">
            Ao entrar, você concorda com o uso do Google Sheets para armazenar os dados do seu ministério.
          </p>
        </div>

        <p className="text-center text-xs text-slate-600">
          Escalas de Louvor • Gestão de Escalas e Ministérios
        </p>
      </div>
    </div>
  );
};
