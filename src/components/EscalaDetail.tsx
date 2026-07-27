import React, { useState } from 'react';
import { 
  ArrowLeft, Calendar, Clock, Share2, CheckCircle2, XCircle, AlertCircle, 
  ExternalLink, Music, Users, Edit3, Send, Trash2, Check, MessageCircle, FileText 
} from 'lucide-react';
import { AppDataState, Escala, StatusConfirmacao, GoogleUserProfile } from '../types';

interface EscalaDetailProps {
  escalaId: string;
  appData: AppDataState;
  isLeader: boolean;
  user: GoogleUserProfile | null;
  onBack: () => void;
  onEditEscala: (escalaId: string) => void;
  onPublishEscala: (escalaId: string) => void;
  onDeleteEscala: (escalaId: string) => void;
  onConfirmPresence: (escaladoId: string, status: StatusConfirmacao) => void;
}

export const EscalaDetail: React.FC<EscalaDetailProps> = ({
  escalaId,
  appData,
  isLeader,
  user,
  onBack,
  onEditEscala,
  onPublishEscala,
  onDeleteEscala,
  onConfirmPresence,
}) => {
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  const escala = appData.escalas.find(e => e.id === escalaId);

  if (!escala) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">Escala não encontrada.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-amber-400 rounded-xl text-xs font-bold">
          Voltar para Lista
        </button>
      </div>
    );
  }

  // Find assigned members
  const escalados = appData.escalados.filter(e => e.escala_id === escala.id);

  // Group assigned members by membro_id so each volunteer appears ONCE with stacked functions
  const groupedEscaladosMap = new Map<string, {
    membro_id: string;
    membro?: typeof appData.membros[0];
    funcoes: string[];
    items: typeof escalados;
    confirmado: StatusConfirmacao;
  }>();

  escalados.forEach(item => {
    const existing = groupedEscaladosMap.get(item.membro_id);
    if (existing) {
      if (!existing.funcoes.includes(item.funcao)) {
        existing.funcoes.push(item.funcao);
      }
      existing.items.push(item);
      if (item.confirmado === 'sim' && existing.confirmado !== 'não') {
        existing.confirmado = 'sim';
      } else if (item.confirmado === 'não') {
        existing.confirmado = 'não';
      }
    } else {
      const membro = appData.membros.find(m => m.id === item.membro_id);
      groupedEscaladosMap.set(item.membro_id, {
        membro_id: item.membro_id,
        membro,
        funcoes: [item.funcao],
        items: [item],
        confirmado: item.confirmado,
      });
    }
  });

  const groupedEscalados = Array.from(groupedEscaladosMap.values());

  // Find setlist songs
  const setlistItems = appData.repertorioEscala
    .filter(re => re.escala_id === escala.id)
    .sort((a, b) => a.ordem - b.ordem);

  // Find current user's assignment
  const loggedMember = appData.membros.find(
    m => user?.email && m.email.toLowerCase() === user.email.toLowerCase()
  ) || appData.membros[0];

  const myGroup = groupedEscalados.find(g => g.membro_id === loggedMember?.id);

  const handleConfirmAllMyAssigned = (status: StatusConfirmacao) => {
    if (myGroup) {
      myGroup.items.forEach(item => {
        onConfirmPresence(item.id, status);
      });
    }
  };

  // Function to build WhatsApp Share text
  const handleShareWhatsApp = () => {
    let text = `*ESCALA DE LOUVOR - ${escala.tipo_culto.toUpperCase()}*\n`;
    text += `📅 Data: ${escala.data} às ${escala.horario}hs\n`;
    if (escala.observacoes) {
      text += `📝 Obs: ${escala.observacoes}\n`;
    }
    text += `\n*EQUIPE ESCALADA:*\n`;

    groupedEscalados.forEach(group => {
      const statusIcon = group.confirmado === 'sim' ? '✅' : group.confirmado === 'não' ? '❌' : '⏳';
      text += `${statusIcon} *${group.membro?.nome || 'Voluntário'}:* ${group.funcoes.join(' + ')}\n`;
    });

    if (setlistItems.length > 0) {
      text += `\n*REPERTÓRIO & TONS:*\n`;
      setlistItems.forEach((item, index) => {
        const song = appData.repertorio.find(r => r.id === item.musica_id);
        if (song) {
          text += `${index + 1}. *${song.musica}* (${song.artista_original}) - Tom: *${item.tom_definido || song.tom}*\n`;
          if (song.link_cifra) text += `   Cifra: ${song.link_cifra}\n`;
        }
      });
    }

    text += `\n_Acesse o app para confirmar sua presença!_`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);

    // Open WhatsApp Web/App
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Escalas</span>
        </button>

        <div className="flex items-center gap-2">
          {/* WhatsApp Share Button */}
          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-sm transition-colors"
            title="Copiar resumo e enviar no WhatsApp da equipe"
          >
            {copiedWhatsApp ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">Compartilhar WhatsApp</span>
          </button>

          {/* Leader actions */}
          {isLeader && (
            <>
              {escala.status === 'rascunho' && (
                <button
                  onClick={() => onPublishEscala(escala.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Publicar</span>
                </button>
              )}

              <button
                onClick={() => onEditEscala(escala.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 shadow-sm transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Editar</span>
              </button>

              <button
                onClick={() => onDeleteEscala(escala.id)}
                className="p-2.5 rounded-2xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 shadow-sm transition-colors"
                title="Excluir Escala"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="rounded-[32px] bg-[#1E293B] p-8 border border-slate-800 shadow-md text-white relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs uppercase tracking-wider border border-amber-500/30">
                {escala.tipo_culto}
              </span>
              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full border ${
                  escala.status === 'publicada'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                {escala.status === 'publicada' ? 'Publicada' : 'Rascunho'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Data: {escala.data}
            </h1>

            <div className="flex items-center gap-3 mt-3 text-sm text-slate-300">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-amber-400" />
                Horário: <strong className="text-white font-bold">{escala.horario} hs</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-amber-400" />
                Equipe: <strong className="text-white font-bold">{groupedEscalados.length} voluntários</strong>
              </span>
            </div>

            {escala.observacoes && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 leading-relaxed">
                <strong className="text-amber-400 block mb-1 uppercase tracking-wider text-[11px]">Orientações do Culto:</strong>
                {escala.observacoes}
              </div>
            )}
          </div>

          {/* Quick Confirmation Box for Current User */}
          {myGroup && (
            <div className="shrink-0 p-5 rounded-3xl bg-slate-800/90 border border-amber-500/30 text-center space-y-3 min-w-[200px]">
              <span className="text-xs font-medium text-slate-300 block">
                Sua Função: <strong className="text-amber-400 font-extrabold">{myGroup.funcoes.join(' + ')}</strong>
              </span>

              {myGroup.confirmado === 'sim' ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold text-xs border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                    Presença Confirmada
                  </span>
                  <button
                    onClick={() => handleConfirmAllMyAssigned('não')}
                    className="text-[11px] text-slate-400 hover:text-rose-400 underline font-medium"
                  >
                    Marcar Indisponível
                  </button>
                </div>
              ) : myGroup.confirmado === 'não' ? (
                <div className="flex flex-col items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 text-rose-400 font-extrabold text-xs border border-rose-500/30">
                    <XCircle className="w-4 h-4" />
                    Você recusou
                  </span>
                  <button
                    onClick={() => handleConfirmAllMyAssigned('sim')}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    Mudar para Confirmado
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => handleConfirmAllMyAssigned('sim')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs hover:bg-emerald-400 transition-colors shadow-sm"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => handleConfirmAllMyAssigned('não')}
                    className="px-3 py-2 rounded-xl bg-slate-700 text-slate-200 hover:bg-rose-500/20 hover:text-rose-300 font-bold text-xs transition-colors"
                  >
                    Recusar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Escalados & Setlist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volunteers List */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Equipe Escalada ({groupedEscalados.length})
            </span>

            <span className="text-xs text-slate-500 font-normal">
              {groupedEscalados.filter(g => g.confirmado === 'sim').length} confirmados
            </span>
          </h2>

          <div className="space-y-3">
            {groupedEscalados.length === 0 ? (
              <p className="p-6 bg-white rounded-3xl border border-slate-200/80 text-xs text-slate-500 text-center shadow-sm">
                Nenhum membro escalado nesta data.
              </p>
            ) : (
              groupedEscalados.map(group => {
                const isMe = loggedMember?.id === group.membro_id;

                return (
                  <div
                    key={group.membro_id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-colors shadow-sm ${
                      isMe
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-extrabold text-xs text-amber-600 border border-slate-200">
                        {group.membro ? group.membro.nome.charAt(0) : '?'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          {group.membro?.nome || 'Membro não cadastrado'}
                          {isMe && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-extrabold text-[10px]">
                              Você
                            </span>
                          )}
                        </div>

                        {/* Stacked Function Badges */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {group.funcoes.map(f => (
                            <span
                              key={f}
                              className="px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-200"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* WhatsApp Contact Link */}
                      {group.membro?.telefone && (
                        <a
                          href={`https://wa.me/55${group.membro.telefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors border border-slate-200/80"
                          title="Enviar mensagem no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold ${
                          group.confirmado === 'sim'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : group.confirmado === 'não'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {group.confirmado === 'sim' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {group.confirmado === 'não' && <XCircle className="w-3.5 h-3.5" />}
                        {group.confirmado === 'pendente' && <AlertCircle className="w-3.5 h-3.5" />}
                        {group.confirmado === 'sim' ? 'Sim' : group.confirmado === 'não' ? 'Recusou' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Setlist / Repertório Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Music className="w-5 h-5 text-amber-500" />
              Repertório do Culto ({setlistItems.length})
            </span>
          </h2>

          <div className="space-y-3">
            {setlistItems.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-200/80 text-center shadow-sm">
                <Music className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Nenhuma música selecionada para este culto.</p>
              </div>
            ) : (
              setlistItems.map((item, index) => {
                const song = appData.repertorio.find(r => r.id === item.musica_id);
                if (!song) return null;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-amber-400/80 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">{song.musica}</h3>
                        <p className="text-xs text-slate-500 font-medium">{song.artista_original}</p>

                        <div className="inline-flex items-center gap-2 mt-2">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-amber-800 font-extrabold text-[11px] border border-slate-200">
                            Tom: {item.tom_definido || song.tom}
                          </span>
                          {song.tags && song.tags.length > 0 && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              #{song.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Links to Cifra, Audio, Video */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {song.link_cifra && (
                        <a
                          href={song.link_cifra}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs flex items-center gap-1 transition-colors"
                          title="Abrir Cifra Club / Cifra"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Cifra</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}

                      {song.link_video && (
                        <a
                          href={song.link_video}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs flex items-center gap-1 border border-rose-200 transition-colors"
                          title="Assistir no YouTube"
                        >
                          <span>Vídeo</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
