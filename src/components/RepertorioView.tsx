import React, { useState } from 'react';
import { Music, Search, Plus, ExternalLink, FileText, Video, Radio, Edit2, Trash2, X, RefreshCw } from 'lucide-react';
import { AppDataState, Musica } from '../types';

interface RepertorioViewProps {
  appData: AppDataState;
  isLeader: boolean;
  onAddMusica: (musica: Omit<Musica, 'id'>) => void;
  onEditMusica: (id: string, musica: Omit<Musica, 'id'>) => void;
  onDeleteMusica: (id: string) => void;
}

export const RepertorioView: React.FC<RepertorioViewProps> = ({
  appData,
  isLeader,
  onAddMusica,
  onEditMusica,
  onDeleteMusica,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSongId, setEditingSongId] = useState<string | null>(null);

  // Modal Form Inputs
  const [musicaName, setMusicaName] = useState('');
  const [artista, setArtista] = useState('');
  const [tom, setTom] = useState('G');
  const [linkCifra, setLinkCifra] = useState('');
  const [linkAudio, setLinkAudio] = useState('');
  const [linkVideo, setLinkVideo] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Auto-Fill State
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiSuggest = () => {
    if (!musicaName.trim()) {
      setAiError('Por favor, digite o título da música primeiro.');
      return;
    }
    setAiError(null);
    setIsAiSearching(true);

    const query = encodeURIComponent(`${musicaName} ${artista}`.trim());
    const queryVideo = encodeURIComponent(`${musicaName} ${artista} louvor oficial`.trim());

    if (!linkCifra) {
      setLinkCifra(`https://www.cifraclub.com.br/?q=${query}`);
    }
    if (!linkVideo) {
      setLinkVideo(`https://www.youtube.com/results?search_query=${queryVideo}`);
    }

    setIsAiSearching(false);
  };

  // Extract all unique tags
  const allTags = Array.from(
    new Set(appData.repertorio.flatMap(r => r.tags || []))
  ).filter(Boolean);

  const filteredRepertorio = appData.repertorio.filter(item => {
    if (selectedTag && (!item.tags || !item.tags.includes(selectedTag))) {
      return false;
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchName = item.musica.toLowerCase().includes(term);
      const matchArtist = item.artista_original.toLowerCase().includes(term);
      const matchKey = item.tom.toLowerCase().includes(term);
      if (!matchName && !matchArtist && !matchKey) return false;
    }

    return true;
  });

  const handleOpenAddModal = () => {
    setEditingSongId(null);
    setMusicaName('');
    setArtista('');
    setTom('G');
    setLinkCifra('');
    setLinkAudio('');
    setLinkVideo('');
    setTagsInput('adoração');
    setAiError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (song: Musica) => {
    setEditingSongId(song.id);
    setMusicaName(song.musica);
    setArtista(song.artista_original);
    setTom(song.tom);
    setLinkCifra(song.link_cifra);
    setLinkAudio(song.link_audio);
    setLinkVideo(song.link_video);
    setTagsInput((song.tags || []).join(', '));
    setAiError(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const songData = {
      musica: musicaName,
      artista_original: artista,
      tom,
      link_cifra: linkCifra,
      link_audio: linkAudio,
      link_video: linkVideo,
      tags: parsedTags,
    };

    if (editingSongId) {
      onEditMusica(editingSongId, songData);
    } else {
      onAddMusica(songData);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Music className="w-6 h-6 text-amber-500" />
            Repertório de Músicas
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Banco centralizado de canções, tons, cifras e links para ensaio da equipe.
          </p>
        </div>

        {isLeader && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Adicionar Música</span>
          </button>
        )}
      </div>

      {/* Search & Tags Filters */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome da música, artista ou tom..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Tag Filter Chips */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-bold text-slate-500 mr-1">Tags:</span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-extrabold transition-colors ${
                selectedTag === null
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Todas ({appData.repertorio.length})
            </button>

            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-extrabold transition-colors ${
                  selectedTag === tag
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Music Cards Grid */}
      {filteredRepertorio.length === 0 ? (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center shadow-sm">
          <Music className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Nenhuma música cadastrada</h3>
          <p className="text-xs text-slate-500 mt-1">Tente ajustar a busca ou adicionar canções ao repertório.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRepertorio.map(song => (
            <div
              key={song.id}
              className="rounded-3xl bg-white border border-slate-200/80 hover:border-amber-400/80 p-6 transition-all hover:shadow-md flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{song.musica}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{song.artista_original}</p>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-slate-100 text-amber-800 font-extrabold text-xs border border-slate-200 shrink-0">
                    Tom: {song.tom}
                  </span>
                </div>

                {/* Tags */}
                {song.tags && song.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 my-3">
                    {song.tags.map(t => (
                      <span key={t} className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] border border-slate-200">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons & Links */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
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
                    </a>
                  )}

                  {song.link_video && (
                    <a
                      href={song.link_video}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs flex items-center gap-1 border border-rose-200 transition-colors"
                      title="Assistir Vídeo no YouTube"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Vídeo</span>
                    </a>
                  )}
                </div>

                {/* Leader Edit/Delete */}
                {isLeader && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(song)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                      title="Editar canção"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteMusica(song.id)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir canção"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Song Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingSongId ? 'Editar Canção' : 'Cadastrar Nova Canção'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              {/* AI Auto-Fill Header Card */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-amber-950 font-medium">
                  <Search className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Digite o nome da música para gerar links de busca de cifra e vídeo automaticamente!</span>
                </div>
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={isAiSearching}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isAiSearching ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Gerar Links</span>
                    </>
                  )}
                </button>
              </div>

              {aiError && (
                <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {aiError}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Música *</label>
                <input
                  type="text"
                  value={musicaName}
                  onChange={e => setMusicaName(e.target.value)}
                  placeholder="Ex: Bondade de Deus"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Artista / Ministério *</label>
                <input
                  type="text"
                  value={artista}
                  onChange={e => setArtista(e.target.value)}
                  placeholder="Ex: Isaías Saad"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tom Original *</label>
                <input
                  type="text"
                  value={tom}
                  onChange={e => setTom(e.target.value)}
                  placeholder="Ex: G, C, F#m"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-amber-600 font-extrabold uppercase focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link Cifra Club / Cifra</label>
                <input
                  type="url"
                  value={linkCifra}
                  onChange={e => setLinkCifra(e.target.value)}
                  placeholder="https://www.cifraclub.com.br/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link Vídeo (YouTube)</label>
                <input
                  type="url"
                  value={linkVideo}
                  onChange={e => setLinkVideo(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="Ex: adoração, celebração, ceia"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm transition-colors"
                >
                  Salvar Canção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
