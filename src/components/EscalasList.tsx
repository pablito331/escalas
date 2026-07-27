import React, { useState } from 'react';
import { Calendar, Clock, Plus, Search, Filter, CheckCircle2, Users, FileText } from 'lucide-react';
import { AppDataState, Escala, StatusEscala } from '../types';

interface EscalasListProps {
  appData: AppDataState;
  isLeader: boolean;
  onSelectEscala: (escalaId: string) => void;
  onCreateEscala: () => void;
}

export const EscalasList: React.FC<EscalasListProps> = ({
  appData,
  isLeader,
  onSelectEscala,
  onCreateEscala,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | StatusEscala>('todas');
  const [timePeriod, setTimePeriod] = useState<'proximas' | 'passadas' | 'todas'>('proximas');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEscalas = appData.escalas.filter(escala => {
    // Non-leaders only see published schedules unless viewing overall list
    if (!isLeader && escala.status !== 'publicada') {
      return false;
    }

    if (statusFilter !== 'todas' && escala.status !== statusFilter) {
      return false;
    }

    if (timePeriod === 'proximas' && escala.data < todayStr) {
      return false;
    }
    if (timePeriod === 'passadas' && escala.data >= todayStr) {
      return false;
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchType = escala.tipo_culto.toLowerCase().includes(term);
      const matchObs = (escala.observacoes || '').toLowerCase().includes(term);
      const matchDate = escala.data.includes(term);
      if (!matchType && !matchObs && !matchDate) return false;
    }

    return true;
  }).sort((a, b) => (a.data > b.data ? (timePeriod === 'passadas' ? -1 : 1) : (timePeriod === 'passadas' ? 1 : -1)));

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            Escalas de Culto & Ensaios
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Gerencie e acompanhe a programação das equipes em cada celebração.
          </p>
        </div>

        {isLeader && (
          <button
            onClick={onCreateEscala}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Escala</span>
          </button>
        )}
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por culto, observação ou data (ex: Domingo, Ensaio)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Period Filter */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setTimePeriod('proximas')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timePeriod === 'proximas' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Próximas
            </button>
            <button
              onClick={() => setTimePeriod('passadas')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timePeriod === 'passadas' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Passadas
            </button>
            <button
              onClick={() => setTimePeriod('todas')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timePeriod === 'todas' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
          </div>

          {/* Leader Status Filter (Rascunho vs Publicada) */}
          {isLeader && (
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setStatusFilter('todas')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'todas' ? 'bg-white text-slate-900 font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos Status
              </button>
              <button
                onClick={() => setStatusFilter('publicada')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'publicada' ? 'bg-emerald-600 text-white font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Publicadas
              </button>
              <button
                onClick={() => setStatusFilter('rascunho')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'rascunho' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Rascunhos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Escalas List Grid */}
      {filteredEscalas.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center shadow-sm">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma escala encontrada</h3>
          <p className="text-xs text-slate-500 mt-1">
            Tente ajustar os filtros de busca ou crie uma nova escala para este período.
          </p>
          {isLeader && (
            <button
              onClick={onCreateEscala}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Nova Escala
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEscalas.map(escala => {
            const escalados = appData.escalados.filter(e => e.escala_id === escala.id);
            const confirmados = escalados.filter(e => e.confirmado === 'sim');
            const recusados = escalados.filter(e => e.confirmado === 'não');
            const musicsCount = appData.repertorioEscala.filter(re => re.escala_id === escala.id).length;

            return (
              <div
                key={escala.id}
                onClick={() => onSelectEscala(escala.id)}
                className="group cursor-pointer rounded-3xl bg-white border border-slate-200/80 hover:border-amber-400/80 p-6 transition-all hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Type Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wide">
                      {escala.tipo_culto}
                    </span>

                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                        escala.status === 'publicada'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {escala.status === 'publicada' ? 'Publicada' : 'Rascunho'}
                    </span>
                  </div>

                  {/* Service Title / Date / Time */}
                  <div className="space-y-1">
                    <div className="text-xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {escala.data}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{escala.horario} hs</span>
                      <span>•</span>
                      <span>{musicsCount} música(s)</span>
                    </div>
                  </div>

                  {/* Observations */}
                  {escala.observacoes && (
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 italic bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      "{escala.observacoes}"
                    </p>
                  )}
                </div>

                {/* Card Footer: Volunteer Slot Progress */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Users className="w-4 h-4 text-amber-500" />
                    <span>
                      <strong className="text-slate-900 font-extrabold">{confirmados.length}</strong>/{escalados.length} Vagas Confirmadas
                    </span>
                  </div>

                  {recusados.length > 0 && (
                    <span className="text-[11px] text-rose-600 font-bold">
                      {recusados.length} recusou
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
