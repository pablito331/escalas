import React from 'react';
import { User, FileSpreadsheet, Shield, Download, ExternalLink, LogOut, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { GoogleUserProfile } from '../types';

interface PerfilViewProps {
  user: GoogleUserProfile | null;
  isLeader: boolean;
  setIsLeader: (isLeader: boolean) => void;
  spreadsheetId: string | null;
  isInstallable: boolean;
  onInstallPwa: () => void;
  onOpenSetup: () => void;
  onGoogleLogin: () => void;
  onLogout: () => void;
}

export const PerfilView: React.FC<PerfilViewProps> = ({
  user,
  isLeader,
  setIsLeader,
  spreadsheetId,
  isInstallable,
  onInstallPwa,
  onOpenSetup,
  onGoogleLogin,
  onLogout,
}) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 text-slate-900">
      {/* User Profile Card */}
      <div className="rounded-3xl bg-white p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="w-20 h-20 rounded-full border-4 border-amber-400 shadow-md object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-slate-200 flex items-center justify-center text-amber-600 font-extrabold text-2xl">
              {user?.name ? user.name.charAt(0) : <User className="w-8 h-8" />}
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{user?.name || 'Usuário Convidado'}</h1>
            <p className="text-xs text-slate-500 font-medium">{user?.email || 'Nenhum e-mail Google conectado'}</p>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-slate-100 text-amber-800 font-extrabold text-xs border border-slate-200">
                {isLeader ? 'Perfil Líder / Gestor' : 'Perfil Voluntário'}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Leader View */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Modo de Acesso</h3>
            <p className="text-xs text-slate-500 font-medium">Ative para gerenciar escalas, publicar e cadastrar músicas/membros.</p>
          </div>

          <button
            onClick={() => setIsLeader(!isLeader)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all border ${
              isLeader
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isLeader ? 'Modo Líder Ativo' : 'Visão Membro'}
          </button>
        </div>
      </div>

      {/* Connected Google Sheet Info */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            Planilha Google Sheets Conectada
          </h2>

          <button
            onClick={onOpenSetup}
            className="text-xs font-extrabold text-amber-600 hover:underline"
          >
            Reconfigurar
          </button>
        </div>

        {spreadsheetId ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Conexão Ativa com o Google Sheets API</span>
            </div>

            <div className="font-mono text-slate-500 break-all text-[11px]">
              ID: {spreadsheetId}
            </div>

            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold text-xs transition-colors"
            >
              <span>Abrir Planilha no Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span className="font-medium">Nenhuma planilha conectada ainda.</span>
            <button
              onClick={onOpenSetup}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow-sm hover:bg-amber-400 transition-colors"
            >
              Conectar Agora
            </button>
          </div>
        )}
      </div>

      {/* PWA App Installation Card */}
      {isInstallable && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Instalar o EscalaLouvor como PWA</h3>
              <p className="text-xs text-slate-500 font-medium">
                Instale o ícone na tela do seu celular para abrir como um aplicativo nativo!
              </p>
            </div>
          </div>

          <button
            onClick={onInstallPwa}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm shrink-0 transition-colors"
          >
            Instalar
          </button>
        </div>
      )}

      {/* Account Actions */}
      <div className="pt-2 flex justify-end">
        {user ? (
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-extrabold text-xs border border-slate-200 hover:border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta Google</span>
          </button>
        ) : (
          <button
            onClick={onGoogleLogin}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Entrar com Google</span>
          </button>
        )}
      </div>
    </div>
  );
};
