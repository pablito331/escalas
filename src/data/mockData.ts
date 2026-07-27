import { AppDataState, Membro, Escala, Escalado, Musica, MusicaEscala, Indisponibilidade } from '../types';

export const INITIAL_MEMBROS: Membro[] = [
  {
    id: 'm1',
    nome: 'Pablo Guimarães',
    email: 'pablocostaguimaraes@gmail.com', // Match active user email
    telefone: '(11) 98765-4321',
    funcoes: ['Líder', 'Ministro', 'Vocal', 'Violão'],
    ministerio: 'Louvor',
    ativo: true,
  },
  {
    id: 'm2',
    nome: 'Sarah Oliveira',
    email: 'sarah.louvor@igreja.org',
    telefone: '(11) 97654-3210',
    funcoes: ['Vocal', 'Teclado'],
    ministerio: 'Louvor',
    ativo: true,
  },
  {
    id: 'm3',
    nome: 'Lucas Mendes',
    email: 'lucas.guitar@igreja.org',
    telefone: '(11) 96543-2109',
    funcoes: ['Guitarra', 'Violão'],
    ministerio: 'Louvor',
    ativo: true,
  },
  {
    id: 'm4',
    nome: 'Mateus Silva',
    email: 'mateus.batera@igreja.org',
    telefone: '(11) 95432-1098',
    funcoes: ['Bateria'],
    ministerio: 'Louvor',
    ativo: true,
  },
  {
    id: 'm5',
    nome: 'Daniela Lima',
    email: 'dani.baixo@igreja.org',
    telefone: '(11) 94321-0987',
    funcoes: ['Baixo'],
    ministerio: 'Louvor',
    ativo: true,
  },
  {
    id: 'm6',
    nome: 'Thiago Rocha',
    email: 'thiago.som@igreja.org',
    telefone: '(11) 93210-9876',
    funcoes: ['Som', 'Transmissão'],
    ministerio: 'Mídia',
    ativo: true,
  },
  {
    id: 'm7',
    nome: 'Beatriz Costa',
    email: 'bea.projecao@igreja.org',
    telefone: '(11) 92109-8765',
    funcoes: ['Projeção'],
    ministerio: 'Mídia',
    ativo: true,
  }
];

// Helper to generate dynamic upcoming Sunday dates
const today = new Date();
const getNextSunday = (daysToAdd: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysToAdd);
  return d.toISOString().split('T')[0];
};

export const INITIAL_ESCALAS: Escala[] = [
  {
    id: 'esc1',
    data: getNextSunday(2),
    horario: '18:00',
    tipo_culto: 'Domingo Noite',
    status: 'publicada',
    observacoes: 'Culto de Celebração e Ceia do Senhor. Chegar às 16:30 para ensaio geral e passagem de som.',
  },
  {
    id: 'esc2',
    data: getNextSunday(5),
    horario: '19:30',
    tipo_culto: 'Ensaio Geral',
    status: 'publicada',
    observacoes: 'Ensaio focado nas novas arranjos de Páscoa. Todos os instrumentistas e vocais.',
  },
  {
    id: 'esc3',
    data: getNextSunday(9),
    horario: '09:00',
    tipo_culto: 'Domingo Manhã',
    status: 'publicada',
    observacoes: 'Culto da Família. Fazer tom suave nas músicas de abertura.',
  },
  {
    id: 'esc4',
    data: getNextSunday(16),
    horario: '18:00',
    tipo_culto: 'Culto de Jovens',
    status: 'rascunho',
    observacoes: 'Rascunho de escala para o próximo Culto de Jovens. Aguardando confirmação de baterista.',
  }
];

export const INITIAL_ESCALADOS: Escalado[] = [
  // Escala 1 (Domingo Noite)
  { id: 'escd1', escala_id: 'esc1', membro_id: 'm1', funcao: 'Ministro', confirmado: 'sim' },
  { id: 'escd2', escala_id: 'esc1', membro_id: 'm2', funcao: 'Teclado', confirmado: 'sim' },
  { id: 'escd3', escala_id: 'esc1', membro_id: 'm3', funcao: 'Guitarra', confirmado: 'pendente' },
  { id: 'escd4', escala_id: 'esc1', membro_id: 'm4', funcao: 'Bateria', confirmado: 'sim' },
  { id: 'escd5', escala_id: 'esc1', membro_id: 'm5', funcao: 'Baixo', confirmado: 'sim' },
  { id: 'escd6', escala_id: 'esc1', membro_id: 'm6', funcao: 'Som', confirmado: 'sim' },
  { id: 'escd7', escala_id: 'esc1', membro_id: 'm7', funcao: 'Projeção', confirmado: 'pendente' },

  // Escala 2 (Ensaio)
  { id: 'escd8', escala_id: 'esc2', membro_id: 'm1', funcao: 'Vocal', confirmado: 'sim' },
  { id: 'escd9', escala_id: 'esc2', membro_id: 'm2', funcao: 'Vocal', confirmado: 'sim' },
  { id: 'escd10', escala_id: 'esc2', membro_id: 'm3', funcao: 'Guitarra', confirmado: 'sim' },
  { id: 'escd11', escala_id: 'esc2', membro_id: 'm4', funcao: 'Bateria', confirmado: 'sim' },

  // Escala 3 (Domingo Manhã)
  { id: 'escd12', escala_id: 'esc3', membro_id: 'm1', funcao: 'Ministro', confirmado: 'pendente' },
  { id: 'escd13', escala_id: 'esc3', membro_id: 'm2', funcao: 'Vocal', confirmado: 'sim' },
  { id: 'escd14', escala_id: 'esc3', membro_id: 'm5', funcao: 'Baixo', confirmado: 'sim' }
];

export const INITIAL_REPERTORIO: Musica[] = [
  {
    id: 'mus1',
    musica: 'Bondade de Deus',
    artista_original: 'Isaías Saad / Bethel',
    tom: 'G',
    link_cifra: 'https://www.cifraclub.com.br/isaias-saad/bondade-de-deus/',
    link_audio: 'https://open.spotify.com/search/Bondade%20de%20Deus',
    link_video: 'https://www.youtube.com/results?search_query=Bondade+de+Deus+Isaias+Saad',
    tags: ['adoração', 'gratidão', 'suave'],
  },
  {
    id: 'mus2',
    musica: 'Ruja o Leão',
    artista_original: 'Talita Catanzaro / Casa Worship',
    tom: 'C#m',
    link_cifra: 'https://www.cifraclub.com.br/casa-worship/ruja-o-leao/',
    link_audio: 'https://open.spotify.com/search/Ruja%20o%20Leao',
    link_video: 'https://www.youtube.com/results?search_query=Ruja+o+Leao',
    tags: ['jovens', 'celebração', 'jebs'],
  },
  {
    id: 'mus3',
    musica: 'Vim Para Adorar-te',
    artista_original: 'Adhemar de Campos',
    tom: 'E',
    link_cifra: 'https://www.cifraclub.com.br/adhemar-de-campos/vim-para-adorar-te/',
    link_audio: 'https://open.spotify.com/search/Vim%20Para%20Adorar-te',
    link_video: 'https://www.youtube.com/results?search_query=Vim+Para+Adorar+te',
    tags: ['ceia', 'adoração', 'tradicional'],
  },
  {
    id: 'mus4',
    musica: 'Santo pra Sempre',
    artista_original: 'Gabriel Guedes',
    tom: 'A',
    link_cifra: 'https://www.cifraclub.com.br/gabriel-guedes/santo-pra-sempre/',
    link_audio: 'https://open.spotify.com/search/Santo%20pra%20Sempre',
    link_video: 'https://www.youtube.com/results?search_query=Santo+pra+Sempre+Gabriel+Guedes',
    tags: ['exaltação', 'adoração', 'ceia'],
  },
  {
    id: 'mus5',
    musica: 'Eu Tenho a Marca da Promessa',
    artista_original: 'Trazendo a Arca',
    tom: 'F',
    link_cifra: 'https://www.cifraclub.com.br/trazendo-a-arca/marca-da-promessa/',
    link_audio: 'https://open.spotify.com/search/Marca%20da%20Promessa',
    link_video: 'https://www.youtube.com/results?search_query=Marca+da+Promessa',
    tags: ['celebração', 'ânimo'],
  }
];

export const INITIAL_REPERTORIO_ESCALA: MusicaEscala[] = [
  { id: 're1', escala_id: 'esc1', musica_id: 'mus1', ordem: 1, tom_definido: 'G' },
  { id: 're2', escala_id: 'esc1', musica_id: 'mus4', ordem: 2, tom_definido: 'A' },
  { id: 're3', escala_id: 'esc1', musica_id: 'mus3', ordem: 3, tom_definido: 'E' },
  { id: 're4', escala_id: 'esc2', musica_id: 'mus2', ordem: 1, tom_definido: 'C#m' },
  { id: 're5', escala_id: 'esc2', musica_id: 'mus5', ordem: 2, tom_definido: 'F' },
];

export const INITIAL_DISPONIBILIDADE: Indisponibilidade[] = [
  {
    id: 'ind1',
    membro_id: 'm3', // Lucas Mendes
    data_indisponivel: getNextSunday(9),
    motivo: 'Viagem de trabalho da empresa',
  }
];

export const INITIAL_APP_DATA: AppDataState = {
  membros: INITIAL_MEMBROS,
  escalas: INITIAL_ESCALAS,
  escalados: INITIAL_ESCALADOS,
  repertorio: INITIAL_REPERTORIO,
  repertorioEscala: INITIAL_REPERTORIO_ESCALA,
  disponibilidades: INITIAL_DISPONIBILIDADE,
};
