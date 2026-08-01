/**
 * Serviço de índice central de ministérios.
 * Lê e escreve na planilha central do super admin.
 *
 * Estrutura da aba Indice (colunas A–G):
 * spreadsheet_id | ministerio_nome | ministerio_codigo | lider_email | lider_nome | total_membros | criado_em
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const INDICE_SPREADSHEET_ID = import.meta.env.VITE_SUPER_ADMIN_INDEX_SHEET_ID as string;
const INDICE_RANGE = 'Indice!A1:G500';
const HEADER_ROW = ['spreadsheet_id', 'ministerio_nome', 'ministerio_codigo', 'lider_email', 'lider_nome', 'total_membros', 'criado_em'];

export interface MinisterioIndice {
  spreadsheet_id: string;
  ministerio_nome: string;
  ministerio_codigo: string;
  lider_email: string;
  lider_nome: string;
  total_membros: number;
  criado_em: string;
}

// ── Garantir aba Indice ───────────────────────────────────────────────────────

async function garantirAbaIndice(accessToken: string): Promise<void> {
  const metaRes = await fetch(
    `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!metaRes.ok) throw new Error('Erro ao acessar planilha central.');

  const meta = await metaRes.json();
  const titles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title || '');

  if (!titles.includes('Indice')) {
    await fetch(`${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: 'Indice' } } }] }),
    });
    await fetch(
      `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}/values/Indice!A1:G1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [HEADER_ROW] }),
      }
    );
  }
}

// ── Ler todos os ministérios do índice ────────────────────────────────────────

export async function lerIndice(accessToken: string): Promise<MinisterioIndice[]> {
  await garantirAbaIndice(accessToken);

  const res = await fetch(
    `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}/values/${encodeURIComponent(INDICE_RANGE)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) throw new Error('Erro ao ler índice central.');

  const data = await res.json();
  const rows: string[][] = data.values || [];

  return rows.slice(1).filter(r => r[0]).map(r => ({
    spreadsheet_id: r[0] || '',
    ministerio_nome: r[1] || '',
    ministerio_codigo: r[2] || '',
    lider_email: r[3] || '',
    lider_nome: r[4] || '',
    total_membros: parseInt(r[5] || '0', 10),
    criado_em: r[6] || '',
  }));
}

// ── Registrar novo ministério no índice ───────────────────────────────────────

export async function registrarNoIndice(
  accessToken: string,
  ministerio: Omit<MinisterioIndice, 'total_membros' | 'criado_em'>
): Promise<void> {
  await garantirAbaIndice(accessToken);

  // Verifica se já existe
  const todos = await lerIndice(accessToken);
  const jaExiste = todos.some(m => m.spreadsheet_id === ministerio.spreadsheet_id);
  if (jaExiste) return;

  const row = [
    ministerio.spreadsheet_id,
    ministerio.ministerio_nome,
    ministerio.ministerio_codigo,
    ministerio.lider_email,
    ministerio.lider_nome,
    '1', // lider já é membro
    new Date().toLocaleDateString('pt-BR'),
  ];

  await fetch(
    `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}/values/Indice!A1:G1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

// ── Atualizar total de membros no índice ──────────────────────────────────────

export async function atualizarTotalMembros(
  accessToken: string,
  spreadsheetId: string,
  total: number
): Promise<void> {
  const res = await fetch(
    `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}/values/${encodeURIComponent(INDICE_RANGE)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return;

  const data = await res.json();
  const rows: string[][] = data.values || [];
  const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === spreadsheetId);
  if (rowIndex === -1) return;

  const sheetRow = rowIndex + 1;
  await fetch(
    `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}/values/Indice!F${sheetRow}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [[String(total)]] }),
    }
  );
}
