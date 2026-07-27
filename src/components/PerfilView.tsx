import React, { useState } from 'react';
import { User, FileSpreadsheet, Shield, Download, ExternalLink, LogOut, CheckCircle2, Copy, Check } from 'lucide-react';
import { GoogleUserProfile, MinisterioInfo } from '../types';
import { gerarTokenConvite } from '../services/permissoes';

interface PerfilViewProps {
  user: GoogleUserProfile | null;
  isLeader: boolean;
  ministerio: MinisterioInfo | null;
  spreadsheetId: string | null;
  isInstallable: boolean;
  onInstallPwa: () => void;
  onOpenSetup: () => void;
  onGoogleLogin: () => void;
  onLogout: () => void;
}

export const PerfilView: React.FC<PerfilViewProps> = ({
  user, isLeader, ministerio, spreadsheetId,
  isInstallable, onInstallPwa, onOpenSetup, onGoogleLogin, onLogout,
}) => {
  const [copiado, setCopiado] = useState(false);

  const handleCopiarConvite = () => {
    if (!ministerio) return;
    const token = gerarTokenConvite(ministerio.spreadsheet_id, ministerio.codigo);
    navigator.clipboard.writeText(token);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 text-slate-900">
      {/* User card */}
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
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{user?.name || 'Usuário'}</h1>
            <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <span className={`px-3 py-1 rounded-full font-extrabold text-xs border ${
                isLeader
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <Shield className="w-3 h-3 inline mr-1" />
                {isLeader ? 'Líder' : 'Membro'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ministério */}
      {ministerio && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900">Ministério</h2>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div>
              <p className="text-xs text-slate-500 font-medium">Nome</p>
              <p className="text-base font-extrabold text-slate-900">{ministerio.nome}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Código</p>
              <p className="font-mono font-extrabold text-amber-600 tracking-widest text-lg">{ministerio.codigo}</p>
            </div>
            {ministerio.lider_nome && (
              <div>
                <p className="text-xs text-slate-500 font-medium">Líder</p>
                <p className="text-sm font-bold text-slate-800">{ministerio.lider_nome}</p>
              </div>
            )}
            {/* Copiar convite (só líder) */}
            {isLeader && (
              <button
                onClick={handleCopiarConvite}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-xs transition-colors"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiado ? 'Copiado!' : 'Copiar código de convite'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Planilha */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-500" />
            Planilha Google Sheets
          </h2>
          <button onClick={onOpenSetup} className="text-xs font-extrabold text-amber-600 hover:underline">
            Reconfigurar
          </button>
        </div>
        {spreadsheetId ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Conexão ativa com Google Sheets
            </div>
            <p className="font-mono text-slate-500 break-all text-[11px]">ID: {spreadsheetId}</p>
            <a href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold transition-colors">
              <span>Abrir no Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span className="font-medium">Nenhuma planilha conectada.</span>
            <button onClick={onOpenSetup} className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-extrabold shadow-sm hover:bg-amber-400 transition-colors">
              Conectar
            </button>
          </div>
        )}
      </div>

      {/* PWA */}
      {isInstallable && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Instalar como App</h3>
              <p className="text-xs text-slate-500 font-medium">Adicione à tela inicial do celular.</p>
            </div>
          </div>
          <button onClick={onInstallPwa} className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-sm shrink-0 transition-colors">
            Instalar
          </button>
        </div>
      )}

      {/* Logout */}
      <div className="flex justify-end">
        {user ? (
          <button onClick={onLogout} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-extrabold text-xs border border-slate-200 hover:border-rose-200 transition-colors">
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        ) : (
          <button onClick={onGoogleLogin} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition-colors">
            <User className="w-4 h-4" />
            Entrar com Google
          </button>
        )}
      </div>
    </div>
  );
};
