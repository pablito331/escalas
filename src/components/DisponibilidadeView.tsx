import React, { useState } from 'react';
import { Clock, Calendar, Plus, Trash2, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { AppDataState, Indisponibilidade, GoogleUserProfile } from '../types';

interface DisponibilidadeViewProps {
  appData: AppDataState;
  user: GoogleUserProfile | null;
  isLeader: boolean;
  onAddDisponibilidade: (membroId: string, dataIndisponivel: string, motivo: string) => void;
  onDeleteDisponibilidade: (id: string) => void;
}

export const DisponibilidadeView: React.FC<DisponibilidadeViewProps> = ({
  appData,
  user,
  isLeader,
  onAddDisponibilidade,
  onDeleteDisponibilidade,
}) => {
  const loggedMember = appData.membros.find(
    m => user?.email && m.email.toLowerCase() === user.email.toLowerCase()
  ) || appData.membros[0];

  const [dataIndisponivel, setDataIndisponivel] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [motivo, setMotivo] = useState('');
  const [targetMembroId, setTargetMembroId] = useState<string>(loggedMember?.id || '');

  const myDisponibilidades = appData.disponibilidades.filter(
    d => d.membro_id === (isLeader ? targetMembroId : loggedMember?.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activeMemberId = isLeader ? targetMembroId : loggedMember?.id;
    if (!activeMemberId || !dataIndisponivel) return;

    onAddDisponibilidade(activeMemberId, dataIndisponivel, motivo);
    setMotivo('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-500" />
          Minha Disponibilidade / Ausências
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Avise a liderança com antecedência sobre datas em que você não poderá servir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Mark Unavailability */}
        <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" />
            Cadastrar Data Indisponível
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isLeader && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Membro *</label>
                <select
                  value={targetMembroId}
                  onChange={e => setTargetMembroId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  {appData.membros.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data Indisponível *</label>
              <input
                type="date"
                value={dataIndisponivel}
                onChange={e => setDataIndisponivel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo (Opcional)</label>
              <input
                type="text"
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                placeholder="Ex: Viagem de trabalho, Prova de faculdade..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Registrar Indisponibilidade</span>
            </button>
          </form>
        </div>

        {/* List of My Unavailability Entries */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
            <span>Datas Bloqueadas ({myDisponibilidades.length})</span>
          </h2>

          <div className="space-y-3">
            {myDisponibilidades.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-slate-200/80 text-center shadow-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Sem ausências registradas</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Você está 100% disponível para ser escalado nos próximos cultos!
                </p>
              </div>
            ) : (
              myDisponibilidades.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-between gap-3 hover:border-amber-400 transition-colors shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">
                        {item.data_indisponivel}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        {item.motivo ? `Motivo: ${item.motivo}` : 'Sem motivo informado'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteDisponibilidade(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Excluir este aviso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* All Team Members' Unavailability (Overview for Leader) */}
          {isLeader && appData.disponibilidades.length > 0 && (
            <div className="mt-8 space-y-3 pt-6 border-t border-slate-200">
              <h3 className="text-sm font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Visão Geral da Equipe (Liderança)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {appData.disponibilidades.map(d => {
                  const m = appData.membros.find(mem => mem.id === d.membro_id);
                  return (
                    <div key={d.id} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 text-xs flex items-center justify-between shadow-sm">
                      <div>
                        <strong className="text-slate-900 font-extrabold block">{m?.nome || 'Membro'}</strong>
                        <span className="text-amber-800 font-bold">{d.data_indisponivel}</span>
                        {d.motivo && <span className="text-slate-500 font-medium block mt-0.5">{d.motivo}</span>}
                      </div>
                      <button
                        onClick={() => onDeleteDisponibilidade(d.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
