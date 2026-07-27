import React, { useState } from 'react';
import { Users, Search, Plus, MessageCircle, Phone, Mail, Edit2, Trash2, X, CheckCircle, Share2, Copy, Check, Send, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';
import { AppDataState, Membro } from '../types';

interface MembrosViewProps {
  appData: AppDataState;
  isLeader: boolean;
  currentUserEmail?: string;
  onAddMembro: (membro: Omit<Membro, 'id'>) => void;
  onEditMembro: (id: string, membro: Omit<Membro, 'id'>) => void;
  onDeleteMembro: (id: string) => void;
}

export const getCleanAppUrl = (): string => {
  return window.location.href.split('?')[0].split('#')[0];
};

export const MembrosView: React.FC<MembrosViewProps> = ({
  appData,
  isLeader,
  currentUserEmail,
  onAddMembro,
  onEditMembro,
  onDeleteMembro,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMinisterio, setSelectedMinisterio] = useState<string>('todos');
  const [copiedLink, setCopiedLink] = useState(false);

  // Invite Modal state for newly created/edited member
  const [invitedMemberModal, setInvitedMemberModal] = useState<{
    nome: string;
    email: string;
    telefone: string;
  } | null>(null);

  const getInviteTextForMember = (membroNome?: string, membroEmail?: string) => {
    const appUrl = getCleanAppUrl();
    const nomeGreeting = membroNome ? `Olá ${membroNome}! ` : 'Olá equipe de louvor! 🎵\n\n';
    return `${nomeGreeting}Você foi cadastrado(a) no nosso aplicativo de Escalas e Repertório de Louvor!\n\nAcesse pelo link oficial da equipe:\n${appUrl}\n\nFaça login com seu e-mail do Google (${membroEmail || 'seu e-mail cadastrado'}) para consultar suas escalas, ensaiar as músicas e marcar sua disponibilidade!`;
  };

  const handleCopyInvite = (membroNome?: string, membroEmail?: string) => {
    navigator.clipboard.writeText(getInviteTextForMember(membroNome, membroEmail));
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendGroupWhatsApp = (membroNome?: string, membroEmail?: string, membroTel?: string) => {
    const text = encodeURIComponent(getInviteTextForMember(membroNome, membroEmail));
    if (membroTel) {
      const cleanTel = membroTel.replace(/\D/g, '');
      window.open(`https://wa.me/55${cleanTel}?text=${text}`, '_blank');
    } else {
      window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
    }
  };

  const handleSendEmailInvite = (emailTo: string, memberName: string) => {
    if (!emailTo) return;
    const subject = encodeURIComponent('Convite: App de Escalas de Louvor e Ministérios');
    const body = encodeURIComponent(getInviteTextForMember(memberName, emailTo));
    window.open(`mailto:${emailTo}?subject=${subject}&body=${body}`, '_blank');
  };

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMembroId, setEditingMembroId] = useState<string | null>(null);

  // Modal Inputs
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [funcoesInput, setFuncoesInput] = useState('');
  const [ministerio, setMinisterio] = useState('Louvor');
  const [ativo, setAtivo] = useState(true);

  const ministeriosList = Array.from(new Set(appData.membros.map(m => m.ministerio || 'Louvor')));

  const filteredMembros = appData.membros.filter(m => {
    if (selectedMinisterio !== 'todos' && m.ministerio !== selectedMinisterio) {
      return false;
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchName = m.nome.toLowerCase().includes(term);
      const matchEmail = m.email.toLowerCase().includes(term);
      const matchFunc = m.funcoes.some(f => f.toLowerCase().includes(term));
      if (!matchName && !matchEmail && !matchFunc) return false;
    }

    return true;
  });

  const handleOpenAdd = () => {
    setEditingMembroId(null);
    setNome('');
    setEmail('');
    setTelefone('(11) 9');
    setFuncoesInput('Vocal');
    setMinisterio('Louvor');
    setAtivo(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: Membro) => {
    setEditingMembroId(m.id);
    setNome(m.nome);
    setEmail(m.email);
    setTelefone(m.telefone);
    setFuncoesInput(m.funcoes.join(', '));
    setMinisterio(m.ministerio || 'Louvor');
    setAtivo(m.ativo);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFuncoes = funcoesInput
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);

    const membroData = {
      nome,
      email,
      telefone,
      funcoes: parsedFuncoes,
      ministerio,
      ativo,
    };

    if (editingMembroId) {
      onEditMembro(editingMembroId, membroData);
    } else {
      onAddMembro(membroData);
    }

    setIsModalOpen(false);

    // Open invitation confirmation dialog if an email or phone is present
    if (email) {
      // Automatically attempt to launch default email composer with the invite
      handleSendEmailInvite(email, nome);
      setInvitedMemberModal({ nome, email, telefone });
    }
  };

  const cleanPublicUrl = getCleanAppUrl();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            Membros & Voluntários
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Cadastro de integrantes, contatos e funções nos ministérios da igreja.
          </p>
        </div>

        {isLeader && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Cadastrar Membro</span>
          </button>
        )}
      </div>

      {/* Convite para Voluntários Card (para o Líder) */}
      {isLeader && (
        <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                <Share2 className="w-4 h-4" />
                <span>Link Oficial de Acesso da Equipe</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Como os membros da equipe entram no aplicativo?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ao cadastrar o e-mail do membro aqui, basta enviar o link oficial abaixo. Ao abrir e clicar em <strong className="text-amber-300 font-extrabold">"Entrar com o Google"</strong> usando o mesmo e-mail, ele acessará as escalas e o repertório diretamente!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0">
              <button
                onClick={() => handleSendGroupWhatsApp()}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar pelo WhatsApp</span>
              </button>

              <button
                onClick={() => handleCopyInvite()}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Convite</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-slate-300 truncate w-full sm:w-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-mono text-[11px] text-amber-300 select-all truncate">{cleanPublicUrl}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Link público sem bloqueio de desenvolvedor (403)
            </span>
          </div>
        </div>
      )}

      {/* Search & Ministry Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou função (ex: Bateria, Vocal)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setSelectedMinisterio('todos')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              selectedMinisterio === 'todos' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos
          </button>
          {ministeriosList.map(min => (
            <button
              key={min}
              onClick={() => setSelectedMinisterio(min)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedMinisterio === min ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {min}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembros.map(membro => (
          <div
            key={membro.id}
            className={`rounded-3xl bg-white border p-6 transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
              membro.ativo ? 'border-slate-200/80 hover:border-amber-400/80' : 'border-slate-200 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-amber-600 text-base">
                    {membro.nome.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900">{membro.nome}</h3>
                      {membro.email && currentUserEmail && membro.email.toLowerCase() === currentUserEmail.toLowerCase() && (
                        <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md shadow-xs">
                          Você
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-amber-700">{membro.ministerio}</span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    membro.ativo
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {membro.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {/* Roles Badges */}
              <div className="flex flex-wrap gap-1.5 my-3">
                {membro.funcoes.map(f => (
                  <span
                    key={f}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-amber-800 font-extrabold text-xs"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* Contact Details */}
              <div className="space-y-1.5 text-xs text-slate-500 font-medium mt-2">
                {membro.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{membro.email}</span>
                  </div>
                )}
                {membro.telefone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{membro.telefone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions & Invite Options */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {membro.email && (
                  <button
                    onClick={() => handleSendEmailInvite(membro.email, membro.nome)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-200 transition-colors"
                    title="Enviar e-mail de convite com link de acesso"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    <span>Convidar E-mail</span>
                  </button>
                )}

                {membro.telefone && (
                  <button
                    onClick={() => handleSendGroupWhatsApp(membro.nome, membro.email, membro.telefone)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200 transition-colors"
                    title="Enviar convite direto no WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>

              {isLeader && (
                <div className="flex items-center justify-end gap-1 pt-1">
                  <button
                    onClick={() => handleOpenEdit(membro)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                    title="Editar dados"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteMembro(membro.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remover membro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Member */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingMembroId ? 'Editar Voluntário' : 'Cadastrar Novo Voluntário'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Gabriel Santos"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail (Google/Gmail) *</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="gabriel@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  O e-mail será usado pelo voluntário para entrar no app via Google. Um convite por e-mail será aberto automaticamente ao salvar.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone (WhatsApp) *</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={e => setTelefone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Funções (separadas por vírgula) *</label>
                <input
                  type="text"
                  value={funcoesInput}
                  onChange={e => setFuncoesInput(e.target.value)}
                  placeholder="Ex: Ministro, Vocal, Guitarra, Som"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ministério</label>
                  <select
                    value={ministerio}
                    onChange={e => setMinisterio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  >
                    <option value="Louvor">Louvor</option>
                    <option value="Mídia">Mídia</option>
                    <option value="Recepção">Recepção</option>
                    <option value="Infantil">Infantil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={ativo ? 'true' : 'false'}
                    onChange={e => setAtivo(e.target.value === 'true')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
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
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Salvar e Enviar Convite</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Save Invitation Modal */}
      {invitedMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl relative text-slate-900 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
              <CheckCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">
                Membro Cadastrado com Sucesso!
              </h3>
              <p className="text-xs text-slate-600">
                <strong>{invitedMemberModal.nome}</strong> foi registrado(a). O convite por e-mail para <strong className="text-slate-800">{invitedMemberModal.email}</strong> foi preparado!
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instruções para o voluntário:</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                1. O voluntário receberá o link público do app.<br />
                2. Ele deve clicar em <strong>"Entrar com o Google"</strong> usando o e-mail {invitedMemberModal.email}.<br />
                3. O aplicativo o identificará automaticamente!
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSendEmailInvite(invitedMemberModal.email, invitedMemberModal.nome)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Re-abrir E-mail de Convite</span>
              </button>

              {invitedMemberModal.telefone && (
                <button
                  onClick={() => handleSendGroupWhatsApp(invitedMemberModal.nome, invitedMemberModal.email, invitedMemberModal.telefone)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Convite pelo WhatsApp</span>
                </button>
              )}

              <button
                onClick={() => setInvitedMemberModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

