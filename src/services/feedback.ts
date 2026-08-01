/**
 * Serviço de feedback dos usuários.
 * Grava na aba "Feedback" da planilha central do super admin.
 *
 * Estrutura da aba Feedback (colunas A–H):
 * id | tipo | titulo | descricao | email | nome | ministerio | data
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const FEEDBACK_SPREADSHEET_ID = import.meta.env.VITE_SUPER_ADMIN_INDEX_SHEET_ID as string;
const HEADER_ROW = ['id', 'tipo', 'titulo', 'descricao', 'email', 'nome', 'ministerio', 'data'];

export type TipoFeedback = 'bug' | 'melhoria' | 'elogio' | 'outro';

export interface Feedback {
  tipo: TipoFeedback;
  titulo: string;
  descricao: string;
  email: string;
  nome: string;
  ministerio: string;
}

async function garantirAbaFeedback(accessToken: string): Promise<void> {
  const metaRes = await fetch(
    `${SHEETS_API_BASE}/${FEEDBACK_SPREADSHEET_ID}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!metaRes.ok) throw new Error('Erro ao acessar planilha de feedback.');

  const meta = await metaRes.json();
  const titles: string[] = (meta.sheets || []).map((s: any) => s.properties?.title || '');

  if (!titles.includes('Feedback')) {
    await fetch(`${SHEETS_API_BASE}/${FEEDBACK_SPREADSHEET_ID}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: 'Feedback' } } }] }),
    });
    await fetch(
      `${SHEETS_API_BASE}/${FEEDBACK_SPREADSHEET_ID}/values/Feedback!A1:H1?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [HEADER_ROW] }),
      }
    );
  }
}

export async function enviarFeedback(
  accessToken: string,
  feedback: Feedback
): Promise<void> {
  await garantirAbaFeedback(accessToken);

  const row = [
    `fb_${Date.now()}`,
    feedback.tipo,
    feedback.titulo,
    feedback.descricao,
    feedback.email,
    feedback.nome,
    feedback.ministerio,
    new Date().toLocaleString('pt-BR'),
  ];

  const res = await fetch(
    `${SHEETS_API_BASE}/${FEEDBACK_SPREADSHEET_ID}/values/Feedback!A1:H1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!res.ok) throw new Error('Erro ao enviar feedback.');
}
