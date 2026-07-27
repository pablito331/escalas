/**
 * Serviço de permissões — lê e escreve a aba "Permissoes" na planilha Google Sheets.
 *
 * Estrutura da aba Permissoes (colunas A–H):
 * email | nome | role | spreadsheet_id | ministerio_nome | ministerio_codigo | aprovado | picture
 */

import { PermissaoMembro, MinisterioInfo, UserRole } from '../types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const PERMISSOES_RANGE = 'Permissoes!A1:H200';
const HEADER_ROW = ['email', 'nome', 'role', 'spreadsheet_id', 'ministerio_nome', 'ministerio_codigo', 'aprovado', 'picture'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToPermissao(row: string[]): PermissaoMembro {
  return {
    email: row[0] || '',
    nome: row[1] || '',
    role: (row[2] as UserRole) || 'membro',
    spreadsheet_id: row[3] || '',
    ministerio_nome: row[4] || '',
    ministerio_codigo: row[5] || '',
    aprovado: row[6] === 'true',
  };
}

function permissaoToRow(p: PermissaoMembro, picture = ''): string[] {
  return [
    p.email,
    p.nome,
    p.role,
    p.spreadsheet_id,
    p.ministerio_nome,
    p.ministerio_codigo,
    String(p.aprovado),
    picture,
  ];
}

/** Gera código de 6 letras a partir do nome do ministério */
export function gerarCodigoMinisterio(nome: string): string {
  const limpo = nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // só letras e números

  if (limpo.length >= 6) return limpo.slice(0, 6);

  // Preenche com números aleatórios se nome for curto
  const sufixo = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (limpo + sufixo).slice(0, 6);
}

// ─── Garantir aba Permissoes ──────────────────────────────────────────────────

export async function garantirAbaPermissoes(
  spreadsheetId: string,
  accessToken: string
): Promise<void> {
  // Verifica se a aba já existe
  const metaRes = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!metaRes.ok) throw new Error('Erro ao verificar abas da planilha.');

  const meta = await metaRes.json();
  const titles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title || '');

  if (!titles.includes('Permissoes')) {
    // Cria a aba
    await fetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: 'Permissoes' } } }] }),
    });

    // Escreve cabeçalho
    await fetch(
      `${SHEETS_API_BASE}/${spreadsheetId}/values/Permissoes!A1:H1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [HEADER_ROW] }),
      }
    );
  }
}

// ─── Ler todas as permissões ──────────────────────────────────────────────────

export async function lerPermissoes(
  spreadsheetId: string,
  accessToken: string
): Promise<PermissaoMembro[]> {
  await garantirAbaPermissoes(spreadsheetId, accessToken);

  const res = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(PERMISSOES_RANGE)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error('Erro ao ler permissões.');

  const data = await res.json();
  const rows: string[][] = data.values || [];

  // Pula cabeçalho
  return rows.slice(1).filter(r => r[0]).map(rowToPermissao);
}

// ─── Buscar permissão de um usuário específico ────────────────────────────────

export async function buscarPermissaoUsuario(
  spreadsheetId: string,
  accessToken: string,
  email: string
): Promise<PermissaoMembro | null> {
  const todas = await lerPermissoes(spreadsheetId, accessToken);
  return todas.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
}

// ─── Registrar novo usuário na planilha ───────────────────────────────────────

export async function registrarUsuario(
  spreadsheetId: string,
  accessToken: string,
  permissao: PermissaoMembro,
  picture = ''
): Promise<void> {
  await garantirAbaPermissoes(spreadsheetId, accessToken);

  const todas = await lerPermissoes(spreadsheetId, accessToken);
  const jaExiste = todas.some(p => p.email.toLowerCase() === permissao.email.toLowerCase());
  if (jaExiste) return;

  await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/Permissoes!A1:H1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [permissaoToRow(permissao, picture)] }),
    }
  );
}

// ─── Atualizar papel/aprovação de um usuário ──────────────────────────────────

export async function atualizarPermissao(
  spreadsheetId: string,
  accessToken: string,
  email: string,
  updates: Partial<Pick<PermissaoMembro, 'role' | 'aprovado'>>
): Promise<void> {
  await garantirAbaPermissoes(spreadsheetId, accessToken);

  // Lê todos os valores brutos incluindo cabeçalho
  const res = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(PERMISSOES_RANGE)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error('Erro ao ler planilha.');

  const data = await res.json();
  const rows: string[][] = data.values || [];

  const rowIndex = rows.findIndex(
    (r, i) => i > 0 && r[0]?.toLowerCase() === email.toLowerCase()
  );
  if (rowIndex === -1) throw new Error('Usuário não encontrado na planilha.');

  const row = [...rows[rowIndex]];
  if (updates.role !== undefined) row[2] = updates.role;
  if (updates.aprovado !== undefined) row[6] = String(updates.aprovado);

  // Linha na planilha é 1-indexed + 1 pelo cabeçalho
  const sheetRow = rowIndex + 1;
  await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/Permissoes!A${sheetRow}:H${sheetRow}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

// ─── Montar MinisterioInfo a partir das permissões ────────────────────────────

export async function carregarMinisterioInfo(
  spreadsheetId: string,
  accessToken: string
): Promise<MinisterioInfo> {
  const membros = await lerPermissoes(spreadsheetId, accessToken);

  const lider = membros.find(m => m.role === 'lider');
  const primeiro = membros[0];

  return {
    spreadsheet_id: spreadsheetId,
    nome: primeiro?.ministerio_nome || 'Ministério',
    codigo: primeiro?.ministerio_codigo || '',
    lider_email: lider?.email || '',
    lider_nome: lider?.nome || '',
    membros,
  };
}

// ─── Buscar ministério pelo código (varre a planilha de índice) ───────────────
// Como não temos um banco central, o membro precisa informar o spreadsheet_id
// ou o líder compartilha o link. O código é apenas identificador visual.
// A busca real é feita pelo spreadsheet_id que o líder inclui no link/código.

/**
 * Codifica spreadsheetId + código num token compartilhável curto.
 * Formato: <codigo>-<spreadsheetId_base64url_truncado>
 * Ex: IGRSIA-1BxY...
 */
export function gerarTokenConvite(spreadsheetId: string, codigo: string): string {
  const b64 = btoa(spreadsheetId).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${codigo}-${b64}`;
}

/**
 * Decodifica o token de convite para recuperar spreadsheetId e código.
 */
export function decodificarTokenConvite(token: string): { spreadsheetId: string; codigo: string } | null {
  try {
    const dashIndex = token.indexOf('-');
    if (dashIndex === -1) return null;
    const codigo = token.slice(0, dashIndex);
    const b64 = token.slice(dashIndex + 1).replace(/-/g, '+').replace(/_/g, '/');
    const spreadsheetId = atob(b64);
    return { spreadsheetId, codigo };
  } catch {
    return null;
  }
}
