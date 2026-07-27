import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, Plus, Trash2, AlertTriangle, Check, Save, Send, Music } from 'lucide-react';
import { AppDataState, Escala, Escalado, MusicaEscala, FuncaoMembro, StatusEscala } from '../types';

interface EscalaFormProps {
  escalaIdToEdit?: string | null;
  appData: AppDataState;
  onBack: () => void;
  onSaveEscala: (
    escalaData: Omit<Escala, 'id'>,
    escaladosList: Array<{ membro_id: string; funcao: string }>,
    setlistList: Array<{ musica_id: string; ordem: number; tom_definido: string }>,
    existingId?: string
  ) => void;
}

const DEFAULT_FUNCOES: FuncaoMembro[] = [
  'Ministro',
  'Vocal',
  'Teclado',
  'Guitarra',
  'Violão',
  'Baixo',
  'Bateria',
  'Som',
  'Projeção',
];

interface VolunteerItem {
  id: string;
  membro_id: string;
  funcoes: string[];
}

export const EscalaForm: React.FC<EscalaFormProps> = ({
  escalaIdToEdit,
  appData,
  onBack,
  onSaveEscala,
}) => {
  const existingEscala = appData.escalas.find(e => e.id === escalaIdToEdit);
  const existingEscalados = existingEscala
    ? appData.escalados.filter(e => e.escala_id === existingEscala.id)
    : [];
  const existingSetlist = existingEscala
    ? appData.repertorioEscala.filter(re => re.escala_id === existingEscala.id)
    : [];

  const [data, setData] = useState(
    existingEscala?.data || new Date().toISOString().split('T')[0]
  );
  const [horario, setHorario] = useState(existingEscala?.horario || '18:00');
  const [tipoCulto, setTipoCulto] = useState(existingEscala?.tipo_culto || 'Domingo Noite');
  const [status, setStatus] = useState<StatusEscala>(existingEscala?.status || 'publicada');
  const [observacoes, setObservacoes] = useState(existingEscala?.observacoes || '');

  // Helper to group existing escalados by member
  const getInitialVolunteers = (): VolunteerItem[] => {
    if (existingEscalados.length > 0) {
      const map = new Map<string, VolunteerItem>();
      existingEscalados.forEach((e, idx) => {
        const existing = map.get(e.membro_id);
        if (existing) {
          if (!existing.funcoes.includes(e.funcao)) {
            existing.funcoes.push(e.funcao);
          }
        } else {
          map.set(e.membro_id, {
            id: `vol_${e.membro_id}_${idx}`,
            membro_id: e.membro_id,
            funcoes: [e.funcao],
          });
        }
      });
      return Array.from(map.values());
    }

    // Default template with 4 empty volunteer slots
    return [
      { id: 'v1', membro_id: '', funcoes: ['Ministro'] },
      { id: 'v2', membro_id: '', funcoes: ['Vocal'] },
      { id: 'v3', membro_id: '', funcoes: ['Violão'] },
      { id: 'v4', membro_id: '', funcoes: ['Bateria'] },
    ];
  };

  const [volunteersList, setVolunteersList] = useState<VolunteerItem[]>(getInitialVolunteers);

  // Setlist state
  const [setlistList, setSetlistList] = useState<Array<{ id: string; musica_id: string; ordem: number; tom_definido: string }>>(
    existingSetlist.length > 0
      ? existingSetlist.map(s => ({ id: s.id, musica_id: s.musica_id, ordem: s.ordem, tom_definido: s.tom_definido }))
      : []
  );

  // Unavailability map
  const unavailableMap = new Map<string, string>();
  appData.disponibilidades.forEach(d => {
    if (d.data_indisponivel === data) {
      unavailableMap.set(d.membro_id, d.motivo || 'Indisponível nesta data');
    }
  });

  const handleAddVolunteerSlot = () => {
    setVolunteersList(prev => [
      ...prev,
      { id: `vol_${Date.now()}`, membro_id: '', funcoes: ['Vocal'] },
    ]);
  };

  const handleRemoveVolunteerSlot = (index: number) => {
    setVolunteersList(prev => prev.filter((_, i) => i !== index));
  };

  const handleMemberChange = (index: number, newMembroId: string) => {
    const selectedMember = appData.membros.find(m => m.id === newMembroId);
    setVolunteersList(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;

        // Auto-select member's primary/default functions if available and currently default
        let updatedFuncoes = item.funcoes;
        if (selectedMember && selectedMember.funcoes.length > 0) {
          updatedFuncoes = selectedMember.funcoes;
        }

        return {
          ...item,
          membro_id: newMembroId,
          funcoes: updatedFuncoes,
        };
      })
    );
  };

  const handleToggleFunction = (volunteerIndex: number, funcao: string) => {
    setVolunteersList(prev =>
      prev.map((item, i) => {
        if (i !== volunteerIndex) return item;
        const exists = item.funcoes.includes(funcao);
        const newFuncoes = exists
          ? item.funcoes.filter(f => f !== funcao)
          : [...item.funcoes, funcao];
        return {
          ...item,
          funcoes: newFuncoes,
        };
      })
    );
  };

  const handleAddSongSlot = () => {
    if (appData.repertorio.length === 0) return;
    const firstSong = appData.repertorio[0];
    setSetlistList(prev => [
      ...prev,
      {
        id: `song_${Date.now()}`,
        musica_id: firstSong.id,
        ordem: prev.length + 1,
        tom_definido: firstSong.tom,
      },
    ]);
  };

  const handleRemoveSongSlot = (index: number) => {
    setSetlistList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (finalStatus: StatusEscala) => {
    // Flatten volunteersList into individual { membro_id, funcao } pairs
    const validEscalados: Array<{ membro_id: string; funcao: string }> = [];

    volunteersList.forEach(vol => {
      if (vol.membro_id !== '') {
        const funcsToSave = vol.funcoes.length > 0 ? vol.funcoes : ['Vocal'];
        funcsToSave.forEach(f => {
          validEscalados.push({ membro_id: vol.membro_id, funcao: f });
        });
      }
    });

    const validSetlist = setlistList.filter(s => s.musica_id !== '');

    onSaveEscala(
      {
        data,
        horario,
        tipo_culto: tipoCulto,
        status: finalStatus,
        observacoes,
      },
      validEscalados,
      validSetlist.map((s, idx) => ({ musica_id: s.musica_id, ordem: idx + 1, tom_definido: s.tom_definido })),
      existingEscala?.id
    );
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto text-slate-900">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-bold shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>

        <h1 className="text-xl font-extrabold text-slate-900">
          {existingEscala ? 'Editar Escala' : 'Criar Nova Escala'}
        </h1>
      </div>

      {/* Main Form Container */}
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 space-y-8 shadow-sm">
        {/* Section 1: Service Details */}
        <div className="space-y-4">
          <h2 className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            1. Dados do Culto / Ensaio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
              <input
                type="date"
                value={data}
                onChange={e => setData(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Horário *</label>
              <input
                type="time"
                value={horario}
                onChange={e => setHorario(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Culto *</label>
              <select
                value={tipoCulto}
                onChange={e => setTipoCulto(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500"
              >
                <option value="Domingo Noite">Domingo Noite</option>
                <option value="Domingo Manhã">Domingo Manhã</option>
                <option value="Ensaio Geral">Ensaio Geral</option>
                <option value="Culto de Jovens">Culto de Jovens</option>
                <option value="Culto Especial">Culto Especial</option>
                <option value="Quarta-feira">Quarta-feira</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Observações / Orientações</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Ex: Traje preto, chegada às 16:30 para passagem de som..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Section 2: Choose Volunteer & Stack Functions (Empilhar Funções) */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                2. Montar Equipe Escalada (Empilhar Funções por Pessoa)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Escolha a pessoa e clique nas funções/instrumentos para empilhar (ex: Gabriel = Vocal + Violão).
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddVolunteerSlot}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-extrabold transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Adicionar Voluntário
            </button>
          </div>

          <div className="space-y-4">
            {volunteersList.map((vol, index) => {
              const selectedMember = appData.membros.find(m => m.id === vol.membro_id);
              const selectedUnavailReason = vol.membro_id ? unavailableMap.get(vol.membro_id) : undefined;

              return (
                <div
                  key={vol.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    selectedUnavailReason
                      ? 'bg-rose-50 border-rose-300'
                      : vol.membro_id
                      ? 'bg-slate-50/80 border-slate-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Volunteer Dropdown */}
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Voluntário #{index + 1}
                      </label>
                      <select
                        value={vol.membro_id}
                        onChange={e => handleMemberChange(index, e.target.value)}
                        className={`w-full bg-white border rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-amber-500 font-bold ${
                          selectedUnavailReason ? 'border-rose-400 text-rose-900' : 'border-slate-200'
                        }`}
                      >
                        <option value="">-- Selecionar Voluntário --</option>
                        {appData.membros
                          .filter(m => m.ativo)
                          .map(membro => {
                            const isUnavail = unavailableMap.has(membro.id);
                            return (
                              <option key={membro.id} value={membro.id}>
                                {membro.nome} ({membro.funcoes.join(', ')}) {isUnavail ? '⚠️ [INDISPONÍVEL]' : ''}
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveVolunteerSlot(index)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors self-end sm:self-center"
                      title="Remover voluntário"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Function Badges (Empilhar Funções) */}
                  {vol.membro_id && (
                    <div className="pt-2 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">Funções / Instrumentos nesta escala:</span>
                        {vol.funcoes.length > 0 && (
                          <span className="font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md text-[11px]">
                            {vol.funcoes.join(' + ')}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {DEFAULT_FUNCOES.map(f => {
                          const isSelected = vol.funcoes.includes(f);
                          return (
                            <button
                              key={f}
                              type="button"
                              onClick={() => handleToggleFunction(index, f)}
                              className={`px-3 py-1 rounded-full text-xs font-extrabold transition-all border ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300'
                              }`}
                            >
                              {isSelected ? `✓ ${f}` : `+ ${f}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Unavailability Conflict Warning */}
                  {selectedUnavailReason && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-100 p-2.5 rounded-xl border border-rose-200">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>ATENÇÃO: Voluntário marcou ausência nesta data! Motivo: {selectedUnavailReason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Setlist Selection */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4 text-amber-500" />
              3. Selecionar Repertório de Músicas
            </h2>

            <button
              type="button"
              onClick={handleAddSongSlot}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-extrabold transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Adicionar Música
            </button>
          </div>

          <div className="space-y-3">
            {setlistList.length === 0 ? (
              <p className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-500 text-center border border-slate-200/80">
                Nenhuma música adicionada ainda. Clique em "Adicionar Música".
              </p>
            ) : (
              setlistList.map((slot, index) => {
                return (
                  <div
                    key={slot.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 text-xs font-extrabold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      <select
                        value={slot.musica_id}
                        onChange={e => {
                          const newMusicaId = e.target.value;
                          const selectedSong = appData.repertorio.find(r => r.id === newMusicaId);
                          setSetlistList(prev =>
                            prev.map((item, i) =>
                              i === index
                                ? { ...item, musica_id: newMusicaId, tom_definido: selectedSong?.tom || 'G' }
                                : item
                            )
                          );
                        }}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500"
                      >
                        {appData.repertorio.map(songItem => (
                          <option key={songItem.id} value={songItem.id}>
                            {songItem.musica} ({songItem.artista_original}) - Tom Orig: {songItem.tom}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-600 font-semibold">Tom:</span>
                        <input
                          type="text"
                          value={slot.tom_definido}
                          onChange={e => {
                            const newTom = e.target.value;
                            setSetlistList(prev =>
                              prev.map((item, i) => (i === index ? { ...item, tom_definido: newTom } : item))
                            );
                          }}
                          className="w-16 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-extrabold text-amber-700 text-center uppercase focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSongSlot(index)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remover música"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('rascunho')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Rascunho</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit('publicada')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Salvar e Publicar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
