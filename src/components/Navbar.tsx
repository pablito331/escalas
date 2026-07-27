import React from 'react';
import { Calendar, Music, Users, User, Home, Clock, Sparkles, Download, Shield, ShieldAlert, FileSpreadsheet } from 'lucide-react';
import { ActiveTab, GoogleUserProfile, MinisterioInfo } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: GoogleUserProfile | null;
  isLeader: boolean;
  ministerio: MinisterioInfo | null;
  spreadsheetId: string | null;
  isInstallable: boolean;
  onInstallPwa: () => void;
  onOpenSetup: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab, setActiveTab, user, isLeader, ministerio,
  spreadsheetId, isInstallable, onInstallPwa, onOpenSetup,
}) => {
  return (
    <>
      <header className="sticky top-0 z-40 bg-[#1E293B] border-b border-slate-800/80 px-4 py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => setActiveTab('home')} className="flex items-center gap-3 text-left focus:outline-none group">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white">EscalaLouvor</span>
              {ministerio && (
                <span className="block text-[10px] font-semibold text-amber-400 tracking-wider uppercase leading-none mt-0.5 truncate max-w-[160px]">
                  {ministerio.nome}
                </span>
              )}
            </div>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Spreadsheet status */}
            {spreadsheetId ? (
              <button onClick={onOpenSetup} title="Planilha Conectada"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 transition-colors">
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sheets OK</span>
              </button>
            ) : (
              <button onClick={onOpenSetup}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-colors animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Conectar Planilha</span>
                <span className="sm:hidden">Planilha</span>
              </button>
            )}

            {/* Role badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isLeader
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isLeader ? 'Líder' : 'Membro'}</span>
            </div>

            {/* PWA install */}
            {isInstallable && (
              <button onClick={onInstallPwa}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}

            {/* Avatar */}
            <button onClick={() => setActiveTab('perfil')}
              className={`p-0.5 rounded-full border-2 transition-all ${activeTab === 'perfil' ? 'border-amber-400' : 'border-slate-700 hover:border-slate-500'}`}>
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-amber-400 font-bold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Desktop nav */}
      <nav className="hidden md:block bg-[#1E293B]/95 border-b border-slate-800/80 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 py-2">
          {[
            { tab: 'home' as ActiveTab, icon: <Home className="w-4 h-4" />, label: 'Início' },
            { tab: 'escalas' as ActiveTab, icon: <Calendar className="w-4 h-4" />, label: 'Escalas', match: ['escalas','escala_detalhe','escala_form'] },
            { tab: 'repertorio' as ActiveTab, icon: <Music className="w-4 h-4" />, label: 'Repertório' },
            { tab: 'membros' as ActiveTab, icon: <Users className="w-4 h-4" />, label: 'Membros da Equipe' },
            { tab: 'disponibilidade' as ActiveTab, icon: <Clock className="w-4 h-4" />, label: 'Minha Disponibilidade' },
          ].map(({ tab, icon, label, match }) => {
            const active = match ? match.includes(activeTab) : activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  active ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}>
                {icon}{label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#1E293B]/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 pb-safe">
        <div className="grid grid-cols-5 gap-1">
          {[
            { tab: 'home' as ActiveTab, icon: <Home className="w-5 h-5" />, label: 'Início' },
            { tab: 'escalas' as ActiveTab, icon: <Calendar className="w-5 h-5" />, label: 'Escalas', match: ['escalas','escala_detalhe','escala_form'] },
            { tab: 'repertorio' as ActiveTab, icon: <Music className="w-5 h-5" />, label: 'Repertório' },
            { tab: 'disponibilidade' as ActiveTab, icon: <Clock className="w-5 h-5" />, label: 'Datas' },
            { tab: 'perfil' as ActiveTab, icon: <User className="w-5 h-5" />, label: 'Perfil' },
          ].map(({ tab, icon, label, match }) => {
            const active = match ? match.includes(activeTab) : activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
                  active ? 'text-amber-400 font-bold bg-amber-500/15' : 'text-slate-400 hover:text-slate-200'
                }`}>
                {icon}
                <span className="text-[10px] mt-1">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
