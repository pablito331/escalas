/**
 * Serviço de índice central de ministérios.
 * Lê e escreve na planilha central do super admin.
 *
 * Estrutura da aba Indice (colunas A–H):
 * spreadsheet_id | ministerio_nome | ministerio_codigo | lider_email | lider_nome | total_membros | criado_em | emails_membros
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const INDICE_SPREADSHEET_ID = import.meta.env.VITE_SUPER_ADMIN_INDEX_SHEET_ID as string;
const INDICE_RANGE = 'Indice!A1:H500';
const HEADER_ROW = ['spreadsheet_id', 'ministerio_nome', 'ministerio_codigo', 'lider_email', 'lider_nome', 'total_membros', 'criado_em', 'emails_membros'];

export interface MinisterioIndice {
  spreadsheet_id: string;
  ministerio_nome: string;
  ministerio_codigo: string;
  lider_email: string;
  lider_nome: string;
  total_membros: number;
  criado_em: string;
  emails_membros: string[]; // lista de emails aprovados
}

// ── Garantir aba Indice ───────────────────────────────────────────────────────

async function garantirAbaIndice(accessToken: string): Promise<void> {
  const metaRes = await fetch(
    `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!metaRes.ok) {
    const errText = await metaRes.text().catch(() => '');
    throw new Error(`Erro ao acessar planilha central (${metaRes.status}): ${errText.slice(0, 100)}`);
  }

  const meta = await metaRes.json();
  const titles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title || '');

  if (!titles.includes('Indice')) {
    await fetch(`${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: 'Indice' } } }] }),
    });
    await fetch(
      `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}/values/Indice!A1:H1?valueInputOption=RAW`,
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
    emails_membros: r[7] ? r[7].split(',').map((e: string) => e.trim()).filter(Boolean) : [],
  }));
}

// ── Buscar ministério pelo email do usuário ───────────────────────────────────

export async function buscarMinisterioPorEmail(
  accessToken: string,
  email: string
): Promise<MinisterioIndice | null> {
  try {
    const todos = await lerIndice(accessToken);
    const emailLower = email.toLowerCase();
    return todos.find(m =>
      m.lider_email.toLowerCase() === emailLower ||
      m.emails_membros.some(e => e.toLowerCase() === emailLower)
    ) || null;
  } catch {
    return null;
  }
}

// ── Registrar novo ministério no índice ───────────────────────────────────────

export async function registrarNoIndice(
  accessToken: string,
  ministerio: Omit<MinisterioIndice, 'total_membros' | 'criado_em' | 'emails_membros'>
): Promise<void> {
  await garantirAbaIndice(accessToken);

  const todos = await lerIndice(accessToken);
  const jaExiste = todos.some(m => m.spreadsheet_id === ministerio.spreadsheet_id);
  if (jaExiste) return;

  const row = [
    ministerio.spreadsheet_id,
    ministerio.ministerio_nome,
    ministerio.ministerio_codigo,
    ministerio.lider_email,
    ministerio.lider_nome,
    '1',
    new Date().toLocaleDateString('pt-BR'),
    ministerio.lider_email, // lider já é membro
  ];

  await fetch(
    `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}/values/Indice!A1:H1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );
}

// ── Adicionar email de membro aprovado no índice ──────────────────────────────

export async function adicionarEmailNoIndice(
  accessToken: string,
  spreadsheetId: string,
  email: string
): Promise<void> {
  try {
    const res = await fetch(
      `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}/values/${encodeURIComponent(INDICE_RANGE)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return;

    const data = await res.json();
    const rows: string[][] = data.values || [];
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === spreadsheetId);
    if (rowIndex === -1) return;

    // Emails atuais
    const emailsAtuais = rows[rowIndex][7]
      ? rows[rowIndex][7].split(',').map((e: string) => e.trim()).filter(Boolean)
      : [];

    if (emailsAtuais.some(e => e.toLowerCase() === email.toLowerCase())) return;

    emailsAtuais.push(email);
    const sheetRow = rowIndex + 1;

    await fetch(
      `${SHEETS_API_BASE}/${INDICE_SPREADSHEET_ID}/values/Indice!H${sheetRow}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[emailsAtuais.join(', ')]] }),
      }
    );
  } catch {}
}

// ── Atualizar total de membros no índice ──────────────────────────────────────

export async function atualizarTotalMembros(
  accessToken: string,
  spreadsheetId: string,
  total: number
): Promise<void> {
  try {
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
  } catch {}
}
