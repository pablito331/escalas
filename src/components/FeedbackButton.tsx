import React, { useState } from 'react';
import { MessageSquarePlus, X, Bug, Lightbulb, Heart, HelpCircle, Send, Check } from 'lucide-react';
import { TipoFeedback, enviarFeedback } from '../services/feedback';
import { GoogleUserProfile, MinisterioInfo } from '../types';

interface FeedbackButtonProps {
  user: GoogleUserProfile | null;
  accessToken: string | null;
  ministerio: MinisterioInfo | null;
}

const TIPOS: { value: TipoFeedback; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'bug', label: 'Reportar Bug', icon: <Bug className="w-4 h-4" />, color: 'bg-rose-500/15 border-rose-500/30 text-rose-400' },
  { value: 'melhoria', label: 'Sugerir Melhoria', icon: <Lightbulb className="w-4 h-4" />, color: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
  { value: 'elogio', label: 'Elogio', icon: <Heart className="w-4 h-4" />, color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' },
  { value: 'outro', label: 'Outro', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-slate-500/15 border-slate-500/30 text-slate-400' },
];

export const FeedbackButton: React.FC<FeedbackButtonProps> = ({ user, accessToken, ministerio }) => {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoFeedback>('melhoria');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !accessToken || !titulo.trim() || !descricao.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await enviarFeedback(accessToken, {
        tipo,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        email: user.email,
        nome: user.name,
        ministerio: ministerio?.nome || 'N/A',
      });
      setEnviado(true);
      setTimeout(() => {
        setOpen(false);
        setEnviado(false);
        setTitulo('');
        setDescricao('');
        setTipo('melhoria');
      }, 2000);
    } catch (e: any) {
      setErro('Não foi possível enviar. Verifique sua conexão.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold shadow-lg transition-all hover:scale-105"
        title="Enviar feedback"
      >
        <MessageSquarePlus className="w-4 h-4 text-amber-400" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700/60 rounded-3xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white">Enviar Feedback</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {enviado ? (
              <div className="p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Check className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white font-extrabold">Feedback enviado!</p>
                <p className="text-slate-400 text-sm">Obrigado por ajudar a melhorar o app.</p>
              </div>
            ) : (
              <form onSubmit={handleEnviar} className="p-5 space-y-4">
                {/* Tipo */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Tipo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIPOS.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTipo(t.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          tipo === t.value
                            ? t.color
                            : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {t.icon}
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Título */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Título *</label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    placeholder={
                      tipo === 'bug' ? 'Ex: Botão de confirmar não funciona' :
                      tipo === 'melhoria' ? 'Ex: Adicionar filtro por data nas escalas' :
                      tipo === 'elogio' ? 'Ex: App muito fácil de usar!' :
                      'Assunto do feedback'
                    }
                    maxLength={80}
                    required
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Descrição *</label>
                  <textarea
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    placeholder={
                      tipo === 'bug'
                        ? 'Descreva o que aconteceu, em qual tela e como reproduzir o problema...'
                        : 'Descreva sua sugestão ou comentário com mais detalhes...'
                    }
                    rows={4}
                    maxLength={500}
                    required
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1 text-right">{descricao.length}/500</p>
                </div>

                {/* Info do usuário */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-xs text-slate-400">
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 shrink-0">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-300">{user?.name}</p>
                    <p>{ministerio?.nome || 'Sem ministério'} • {user?.email}</p>
                  </div>
                </div>

                {erro && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                    {erro}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={enviando || !titulo.trim() || !descricao.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {enviando ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                    ) : <Send className="w-3.5 h-3.5" />}
                    {enviando ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
