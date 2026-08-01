export type FuncaoMembro = 
  | 'Vocal'
  | 'Ministro'
  | 'Guitarra'
  | 'Violão'
  | 'Baixo'
  | 'Bateria'
  | 'Teclado'
  | 'Som'
  | 'Projeção'
  | 'Transmissão'
  | 'Recepção'
  | 'Outro';

export type StatusEscala = 'rascunho' | 'publicada';
export type StatusConfirmacao = 'sim' | 'não' | 'pendente';

export interface Membro {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  funcoes: string[]; // e.g. ["Vocal", "Guitarra"]
  ministerio: string; // e.g. "Louvor", "Mídia"
  ativo: boolean;
}

export interface Escala {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:MM
  tipo_culto: string; // Domingo Manhã, Domingo Noite, Ensaio, etc.
  status: StatusEscala;
  observacoes: string;
}

export interface Escalado {
  id: string;
  escala_id: string;
  membro_id: string;
  funcao: string;
  confirmado: StatusConfirmacao;
  motivo_recusa?: string;
}

export interface Musica {
  id: string;
  musica: string;
  artista_original: string;
  tom: string;
  link_cifra: string;
  link_audio: string;
  link_video: string;
  tags: string[];
}

export interface MusicaEscala {
  id: string;
  escala_id: string;
  musica_id: string;
  ordem: number;
  tom_definido: string;
}

export interface Indisponibilidade {
  id: string;
  membro_id: string;
  data_indisponivel: string; // YYYY-MM-DD
  motivo: string;
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
}

export interface AppDataState {
  membros: Membro[];
  escalas: Escala[];
  escalados: Escalado[];
  repertorio: Musica[];
  repertorioEscala: MusicaEscala[];
  disponibilidades: Indisponibilidade[];
}

export type ActiveTab = 
  | 'home' 
  | 'escalas' 
  | 'escala_detalhe' 
  | 'escala_form' 
  | 'repertorio' 
  | 'membros' 
  | 'disponibilidade' 
  | 'perfil' 
  | 'setup';

// ─── Sistema de Ministérios ───────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'lider' | 'membro';

export interface PermissaoMembro {
  email: string;
  nome: string;
  role: UserRole;
  spreadsheet_id: string; // ID da planilha do ministério
  ministerio_nome: string;
  ministerio_codigo: string;
  aprovado: boolean; // false = aguardando aprovação do líder
}

export interface MinisterioInfo {
  spreadsheet_id: string;
  nome: string;
  codigo: string; // ex: IGRSIA
  lider_email: string;
  lider_nome: string;
  membros: PermissaoMembro[];
}

// Estado da sessão do app
export type AppSession =
  | { stage: 'loading' }
  | { stage: 'login' }
  | { stage: 'onboarding' }
  | { stage: 'aguardando_aprovacao'; ministerio: MinisterioInfo }
  | { stage: 'app'; role: UserRole; ministerio: MinisterioInfo }
  | { stage: 'super_admin' };

export const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL as string || 'pablocostaguimaraes@gmail.com';
