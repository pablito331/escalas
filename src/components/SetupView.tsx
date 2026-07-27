import React, { useState } from 'react';
import { FileSpreadsheet, Sparkles, AlertCircle, CheckCircle2, ShieldAlert, ArrowRight, ExternalLink, RefreshCw } from 'lucide-react';
import { GoogleUserProfile } from '../types';
import { extractSpreadsheetId } from '../services/googleSheets';

interface SetupViewProps {
  user: GoogleUserProfile | null;
  spreadsheetId: string | null;
  accessToken: string | null;
  onSaveSpreadsheetId: (id: string) => Promise<void>;
  onCreateNewSpreadsheet: () => Promise<void>;
  onGoogleLogin: () => void;
  onUseLocalMode: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const SetupView: React.FC<SetupViewProps> = ({
  user,
  spreadsheetId,
  accessToken,
  onSaveSpreadsheetId,
  onCreateNewSpreadsheet,
  onGoogleLogin,
  onUseLocalMode,
  isLoading,
  errorMessage,
}) => {
  const [inputUrlOrId, setInputUrlOrId] = useState(spreadsheetId || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrlOrId.trim()) return;

    // Smartly extract Google Sheet ID from any Drive share link or Sheet URL
    const idToUse = extractSpreadsheetId(inputUrlOrId);

    await onSaveSpreadsheetId(idToUse);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12 pt-4 text-slate-900">
      {/* Top Banner */}
      <div className="rounded-3xl bg-white p-8 border border-slate-200/80 shadow-sm text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
          <FileSpreadsheet className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Conexão com Banco de Dados Google Sheets</h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          O EscalaLouvor armazena todos os seus dados diretamente na sua planilha do Google Sheets.
          Nenhum dado fica salvo em servidores terceiros — total controle e privacidade!
        </p>
      </div>

      {/* Login Requirement Banner if token is missing */}
      {!accessToken ? (
        <div className="rounded-3xl bg-amber-50 border border-amber-200 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-extrabold text-amber-950">Conectar Conta do Google</h3>
              <p className="text-xs text-amber-800 leading-relaxed mt-1">
                Para ler e salvar dados na sua planilha do Google Drive, clique em <strong>Entrar com Google</strong>.
                Se a janela de login não abrir no visualizador incorporado, clique em <strong>Abrir em Nova Aba</strong> para autenticar sem bloqueios de navegador.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={onGoogleLogin}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition-all"
            >
              🔑 Entrar com Google
            </button>

            <button
              onClick={() => window.open(window.location.href, '_blank')}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-amber-100/80 text-amber-900 border border-amber-300 font-extrabold text-xs transition-all inline-flex items-center gap-1.5"
            >
              <span>Abrir em Nova Aba</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onUseLocalMode}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-all"
            >
              💾 Continuar em Modo Local (Sem Google)
            </button>
          </div>
        </div>
      ) : accessToken === 'local-demo' ? (
        <div className="rounded-3xl bg-slate-900 text-white p-6 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Modo Local Ativo</span>
            </div>
            <button
              onClick={onGoogleLogin}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
            >
              Conectar ao Google Sheets
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Seus dados estão sendo salvos localmente neste navegador com sucesso. Você pode cadastrar escalas, membros, músicas e disponibilidades normalmente!
          </p>
        </div>
      ) : null}

      {/* 1-Click Create New Spreadsheet Card */}
      {accessToken && (
        <div className="rounded-3xl bg-white border-2 border-amber-400 p-6 shadow-md space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Criar Nova Planilha no Seu Google Drive</h2>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Clique no botão abaixo para gerar automaticamente uma nova planilha do Google Sheets com todas as abas,
                colunas e dados iniciais de exemplo (Membros, Escalas, Repertório) já prontos para uso!
              </p>
            </div>
          </div>

          <button
            onClick={onCreateNewSpreadsheet}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Criando Planilha no Google Drive...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-slate-950" />
                <span>✨ Criar Planilha Padrão com 1 Clique</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Paste Existing Spreadsheet ID / Link Form */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-amber-500" />
          Ou Conectar Planilha Existente
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Link ou ID da Planilha do Google Sheets
            </label>
            <input
              type="text"
              value={inputUrlOrId}
              onChange={e => setInputUrlOrId(e.target.value)}
              placeholder="Cole aqui a URL (https://docs.google.com/spreadsheets/d/...) ou o ID"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
            <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
              Dica: A planilha deve conter as abas: <code>Membros</code>, <code>Escalas</code>, <code>Escalados</code>, <code>Repertorio</code>, <code>Repertorio_Escala</code> e <code>Disponibilidade</code>.
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !accessToken}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>Validar e Conectar Planilha</span>
          </button>
        </form>

        {/* Permission Denied Error Card */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Acesso Negado ou Planilha Não Encontrada (403)</span>
            </div>
            <p className="leading-relaxed">
              O Google Sheets informou que você não possui permissão de leitura/escrita nesta planilha.
            </p>
            {user?.email && (
              <div className="p-2.5 rounded-xl bg-white border border-rose-200 text-[11px] text-slate-700">
                👉 <strong>O que fazer:</strong> Peça ao administrador da planilha para compartilhá-la com o e-mail:
                <code className="text-amber-700 font-bold block mt-1">{user.email}</code>
              </div>
            )}
          </div>
        )}

        {/* Success Status */}
        {spreadsheetId && !errorMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <strong className="block text-slate-900 text-sm font-extrabold">Planilha Conectada!</strong>
                <span className="text-[11px] font-mono text-slate-600">ID: {spreadsheetId}</span>
              </div>
            </div>

            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold text-xs inline-flex items-center gap-1 transition-colors"
            >
              <span>Abrir no Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
