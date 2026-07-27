import React from 'react';
import { Calendar, CheckCircle2, XCircle, Clock, Music, Users, ArrowRight, Plus, Sparkles, MessageSquare } from 'lucide-react';
import { AppDataState, ActiveTab, Escala, Escalado, GoogleUserProfile, StatusConfirmacao } from '../types';

interface HomeDashboardProps {
  appData: AppDataState;
  user: GoogleUserProfile | null;
  isLeader: boolean;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectEscala: (escalaId: string) => void;
  onConfirmPresence: (escaladoId: string, status: StatusConfirmacao) => void;
  onCreateEscala: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  appData,
  user,
  isLeader,
  setActiveTab,
  onSelectEscala,
  onConfirmPresence,
  onCreateEscala,
}) => {
  // Find current logged-in member ID by matching email only — no fallback to mock data
  const loggedMember = appData.membros.find(
    m => user?.email && m.email.toLowerCase() === user.email.toLowerCase()
  ) || null;

  // Find upcoming schedule where loggedMember is scheduled
  const myEscalados = appData.escalados.filter(e => e.membro_id === loggedMember?.id);

  // Group user's escalados by escala_id
  const myEscalaGroupsMap = new Map<string, {
    escala: Escala;
    items: Escalado[];
    funcoes: string[];
    confirmado: StatusConfirmacao;
  }>();

  myEscalados.forEach(es => {
    const escala = appData.escalas.find(e => e.id === es.escala_id);
    if (escala && escala.status === 'publicada') {
      const existing = myEscalaGroupsMap.get(escala.id);
      if (existing) {
        if (!existing.funcoes.includes(es.funcao)) {
          existing.funcoes.push(es.funcao);
        }
        existing.items.push(es);
      } else {
        myEscalaGroupsMap.set(escala.id, {
          escala,
          items: [es],
          funcoes: [es.funcao],
          confirmado: es.confirmado,
        });
      }
    }
  });

  const myUpcomingEscalaGroups = Array.from(myEscalaGroupsMap.values())
    .sort((a, b) => (a.escala.data > b.escala.data ? 1 : -1));

  const nextMyScheduleGroup = myUpcomingEscalaGroups[0];

  const handleConfirmNextScheduleGroup = (status: StatusConfirmacao) => {
    if (nextMyScheduleGroup) {
      nextMyScheduleGroup.items.forEach(item => {
        onConfirmPresence(item.id, status);
      });
    }
  };

  // Published upcoming schedules
  const publishedUpcomingEscalas = [...appData.escalas]
    .filter(e => e.status === 'publicada')
    .sort((a, b) => (a.data > b.data ? 1 : -1));

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#1E293B] p-8 shadow-md border border-slate-800 text-white">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold mb-3 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bem-vindo ao EscalaLouvor</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Olá, {loggedMember ? loggedMember.nome.split(' ')[0] : user?.name || 'Membro'}.
            </h1>
            <p className="text-slate-300 text-sm mt-2 max-w-xl leading-relaxed font-normal">
              Acompanhe suas escalas, confirme presença nos ensaios e cultos, e acesse as cifras do repertório da semana.
            </p>
          </div>

          {isLeader && (
            <button
              onClick={onCreateEscala}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all hover:scale-102 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Criar Nova Escala</span>
            </button>
          )}
        </div>
      </div>

      {/* HIGHLIGHT: Next My Schedule Card */}
      {nextMyScheduleGroup ? (
        <div className="rounded-[32px] bg-white border border-slate-200/80 p-8 shadow-sm flex flex-col justify-between space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-extrabold uppercase tracking-wide">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Sua Próxima Escala
              </span>
              <h2 className="text-3xl font-bold mt-4 text-slate-900 tracking-tight">
                {nextMyScheduleGroup.escala.tipo_culto}
              </h2>
              <p className="text-slate-500 mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-slate-700">🕒 {nextMyScheduleGroup.escala.horario}</span>
                <span>•</span>
                <span className="text-slate-500">{nextMyScheduleGroup.escala.data}</span>
                <span>•</span>
                <span className="text-slate-600 italic">{nextMyScheduleGroup.escala.observacoes || 'Sem observações'}</span>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-200 inline-block shadow-sm">
                Sua Função: {nextMyScheduleGroup.funcoes.join(' + ')}
              </span>
            </div>
          </div>

          {/* Quick Confirmation Action */}
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Confirme sua presença com antecedência para ajudar na organização do ministério.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {nextMyScheduleGroup.confirmado === 'sim' ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-extrabold border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Presença Confirmada
                  </span>
                  <button
                    onClick={() => handleConfirmNextScheduleGroup('não')}
                    className="p-2.5 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Alterar para Indisponível"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : nextMyScheduleGroup.confirmado === 'não' ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-50 text-rose-700 text-xs font-extrabold border border-rose-200">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Indisponível
                  </span>
                  <button
                    onClick={() => handleConfirmNextScheduleGroup('sim')}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition-colors"
                  >
                    Mudei de ideia (Vou)
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleConfirmNextScheduleGroup('sim')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Presença
                  </button>
                  <button
                    onClick={() => handleConfirmNextScheduleGroup('não')}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs border border-slate-200 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Recusar
                  </button>
                </div>
              )}

              <button
                onClick={() => onSelectEscala(nextMyScheduleGroup.escala.id)}
                className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-all shadow-sm"
                title="Ver detalhes da escala"
              >
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 text-center shadow-sm">
          <p className="text-slate-500 text-sm font-medium">
            Você não está escalado para as próximas escalas publicadas ou todas as escalas já passaram.
          </p>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{appData.escalas.length}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Escalas cadastradas</p>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <Music className="w-5 h-5" />
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Repertório</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{appData.repertorio.length}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Músicas no banco</p>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Voluntários</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{appData.membros.length}</div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Membros ativos</p>
        </div>

        <div className="rounded-3xl bg-white border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Minha taxa</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {myEscalados.length > 0
              ? `${Math.round((myEscalados.filter(e => e.confirmado === 'sim').length / myEscalados.length) * 100)}%`
              : '100%'}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Presença confirmada</p>
        </div>
      </div>

      {/* Upcoming Schedules List Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Próximas Escalas da Equipe
          </h2>
          <button
            onClick={() => setActiveTab('escalas')}
            className="text-xs font-extrabold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors uppercase tracking-wide"
          >
            Ver Todas ({appData.escalas.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {publishedUpcomingEscalas.slice(0, 4).map(escala => {
            const escaladosCount = appData.escalados.filter(e => e.escala_id === escala.id).length;
            const confirmadosCount = appData.escalados.filter(
              e => e.escala_id === escala.id && e.confirmado === 'sim'
            ).length;
            const myAssigned = appData.escalados.find(
              e => e.escala_id === escala.id && e.membro_id === loggedMember?.id
            );

            return (
              <div
                key={escala.id}
                onClick={() => onSelectEscala(escala.id)}
                className="group cursor-pointer rounded-3xl bg-white border border-slate-200/80 hover:border-amber-400/80 p-6 transition-all hover:shadow-md flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wide">
                      {escala.tipo_culto}
                    </span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {escala.data} • {escala.horario}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {escala.observacoes || 'Sem observações'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      <strong className="text-slate-900">{confirmadosCount}</strong>/{escaladosCount} confirmados
                    </span>
                  </div>

                  {myAssigned && (
                    <span
                      className={`font-extrabold px-2.5 py-1 rounded-lg text-[11px] ${
                        myAssigned.confirmado === 'sim'
                          ? 'bg-emerald-100 text-emerald-800'
                          : myAssigned.confirmado === 'não'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Você: {myAssigned.funcao}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ministry Announcements Card (Professional Dark Accent) */}
      <div className="rounded-3xl bg-[#1E293B] p-6 text-white border border-slate-800 shadow-sm flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-2">Lembretes & Orientações do Ministério</h3>
          <p className="text-xs text-slate-300 leading-relaxed space-y-1">
            <span>• Lembre-se de ouvir as faixas de áudio e verificar os tons das músicas no módulo Repertório antes do ensaio.</span>
            <br />
            <span>• Caso precise faltar a um culto, favor cadastrar a data em <strong className="text-amber-400 font-bold underline cursor-pointer" onClick={() => setActiveTab('disponibilidade')}>Minha Disponibilidade</strong> com antecedência.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
