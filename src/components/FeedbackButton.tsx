import React, { useState } from 'react';
import { MessageSquarePlus, X, Bug, Lightbulb, Heart, HelpCircle, Send, Check, Copy, Coffee } from 'lucide-react';
import { TipoFeedback, enviarFeedback } from '../services/feedback';
import { GoogleUserProfile, MinisterioInfo } from '../types';

const PIX_KEY = '5aabe679-3be5-458f-8f9e-78da48ad4303';

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
  const [aba, setAba] = useState<'feedback' | 'apoiar'>('feedback');
  const [tipo, setTipo] = useState<TipoFeedback>('melhoria');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);

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
    } catch {
      setErro('Não foi possível enviar. Verifique sua conexão.');
    } finally {
      setEnviando(false);
    }
  };

  const handleCopiarPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2500);
  };

  const handleFechar = () => {
    setOpen(false);
    setEnviado(false);
    setTitulo('');
    setDescricao('');
    setTipo('melhoria');
    setErro(null);
    setAba('feedback');
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-8 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold shadow-lg transition-all hover:scale-105"
        title="Feedback e Apoio"
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
                <h3 className="text-base font-extrabold text-white">Fale com a gente</h3>
              </div>
              <button onClick={handleFechar}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Abas */}
            <div className="flex gap-2 p-4 pb-0">
              <button
                onClick={() => setAba('feedback')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  aba === 'feedback'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Feedback
              </button>
              <button
                onClick={() => setAba('apoiar')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  aba === 'apoiar'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                Apoiar
              </button>
            </div>

            {/* ── ABA FEEDBACK ── */}
            {aba === 'feedback' && (
              enviado ? (
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
                        <button key={t.value} type="button" onClick={() => setTipo(t.value)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            tipo === t.value ? t.color : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}>
                          {t.icon}{t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Título */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Título *</label>
                    <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
                      placeholder={tipo === 'bug' ? 'Ex: Botão não funciona na tela X' : tipo === 'melhoria' ? 'Ex: Filtro por data nas escalas' : 'Assunto'}
                      maxLength={80} required
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Descrição *</label>
                    <textarea value={descricao} onChange={e => setDescricao(e.target.value)}
                      placeholder={tipo === 'bug' ? 'O que aconteceu e como reproduzir...' : 'Descreva com mais detalhes...'}
                      rows={3} maxLength={500} required
                      className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    />
                    <p className="text-xs text-slate-500 mt-1 text-right">{descricao.length}/500</p>
                  </div>

                  {/* Info usuário */}
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
                    <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">{erro}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={handleFechar}
                      className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-colors">
                      Cancelar
                    </button>
                    <button type="submit" disabled={enviando || !titulo.trim() || !descricao.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {enviando
                        ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
                        : <Send className="w-3.5 h-3.5" />}
                      {enviando ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </form>
              )
            )}

            {/* ── ABA APOIAR ── */}
            {aba === 'apoiar' && (
              <div className="p-5 space-y-5">
                {/* Texto */}
                <div className="text-center space-y-2">
                  <div className="text-4xl">☕</div>
                  <h4 className="text-base font-extrabold text-white">Apoie o Escalas de Louvor</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    O app é gratuito e sempre será. Se ele tem ajudado o seu ministério, considere contribuir com qualquer valor via PIX.
                  </p>
                </div>

                {/* Card PIX */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/50 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <span className="text-emerald-400 font-extrabold text-xs">PIX</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-300">Chave PIX (Aleatória)</p>
                      <p className="text-xs text-slate-500">Pablo Guimarães</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-800 border border-slate-700">
                    <p className="flex-1 font-mono text-xs text-slate-300 break-all">{PIX_KEY}</p>
                    <button onClick={handleCopiarPix}
                      className={`shrink-0 p-2 rounded-lg transition-all ${
                        pixCopiado
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                      }`}>
                      {pixCopiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {pixCopiado && (
                    <p className="text-xs text-emerald-400 text-center font-semibold">
                      Chave copiada! Obrigado pelo apoio 🙏
                    </p>
                  )}
                </div>

                <p className="text-center text-xs text-slate-600">
                  Qualquer valor é bem-vindo e ajuda a manter o app gratuito para todos os ministérios.
                </p>

                <button onClick={handleFechar}
                  className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-colors">
                  Fechar
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};
