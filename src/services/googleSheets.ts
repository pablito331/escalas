import { AppDataState, Membro, Escala, Escalado, Musica, MusicaEscala, Indisponibilidade, StatusConfirmacao, StatusEscala } from '../types';
import { INITIAL_APP_DATA } from '../data/mockData';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const REQUIRED_SHEETS = ['Membros', 'Escalas', 'Escalados', 'Repertorio', 'Repertorio_Escala', 'Disponibilidade'];

/**
 * Extracts a clean Google Sheet ID from any URL format (Drive file link, Sheets link, etc.) or raw ID.
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Pattern 1: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const sheetsMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (sheetsMatch && sheetsMatch[1]) return sheetsMatch[1];

  // Pattern 2: /file/d/([a-zA-Z0-9-_]+)
  const driveFileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (driveFileMatch && driveFileMatch[1]) return driveFileMatch[1];

  // Pattern 3: /d/([a-zA-Z0-9-_]+)
  const dMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];

  // Pattern 4: ?id=([a-zA-Z0-9-_]+) or &id=([a-zA-Z0-9-_]+)
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9-_]+)/);
  if (idParamMatch && idParamMatch[1]) return idParamMatch[1];

  // Pattern 5: Raw ID string (without slashes or url params)
  if (!trimmed.includes('/') && !trimmed.includes('?')) {
    return trimmed;
  }

  return trimmed;
}

/**
 * Checks if the target spreadsheet has all necessary tabs.
 * Creates missing tabs automatically and populates initial structure if needed.
 */
export async function ensureSpreadsheetStructure(
  spreadsheetId: string,
  accessToken: string
): Promise<void> {
  const getUrl = `${SHEETS_API_BASE}/${spreadsheetId}?fields=sheets.properties.title`;
  const metaRes = await fetch(getUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (metaRes.status === 403 || metaRes.status === 401) {
    throw new Error('PERMISSION_DENIED');
  }

  if (metaRes.status === 404) {
    throw new Error('Planilha não encontrada. Verifique se o link ou ID da planilha está correto e se o arquivo não foi excluído.');
  }

  if (!metaRes.ok) {
    const errorText = await metaRes.text();
    throw new Error(`Erro ao acessar planilha: ${metaRes.status} - ${errorText}`);
  }

  const metaData = await metaRes.json();
  const existingSheetTitles: string[] = (metaData.sheets || []).map(
    (s: any) => s.properties?.title || ''
  );

  const missingSheets = REQUIRED_SHEETS.filter(req => !existingSheetTitles.includes(req));

  if (missingSheets.length > 0) {
    // Add missing sheets via batchUpdate
    const requests = missingSheets.map(title => ({
      addSheet: {
        properties: {
          title,
        },
      },
    }));

    const updateUrl = `${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`;
    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error('Erro ao criar abas na planilha:', errText);
      throw new Error(`Não foi possível criar as abas necessárias na planilha: ${updateRes.status}`);
    }

    // Populate default data into the newly configured spreadsheet
    await writeFullAppDataToSheet(spreadsheetId, accessToken, INITIAL_APP_DATA);
  }
}

export async function createDefaultSpreadsheet(accessToken: string): Promise<{ id: string; url: string }> {
  const requestBody = {
    properties: {
      title: 'EscalaLouvor - Banco de Dados da Igreja',
    },
    sheets: [
      { properties: { title: 'Membros' } },
      { properties: { title: 'Escalas' } },
      { properties: { title: 'Escalados' } },
      { properties: { title: 'Repertorio' } },
      { properties: { title: 'Repertorio_Escala' } },
      { properties: { title: 'Disponibilidade' } },
    ],
  };

  const response = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao criar planilha no Google Sheets: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl;

  // Now populate initial rows in the newly created spreadsheet
  await writeFullAppDataToSheet(spreadsheetId, accessToken, INITIAL_APP_DATA);

  return { id: spreadsheetId, url: spreadsheetUrl };
}

export async function writeFullAppDataToSheet(
  spreadsheetId: string,
  accessToken: string,
  appData: AppDataState
): Promise<void> {
  // Convert appData models to 2D row arrays
  const membrosRows = [
    ['id', 'nome', 'email', 'telefone', 'funcoes', 'ministerio', 'ativo'],
    ...appData.membros.map(m => [
      m.id,
      m.nome,
      m.email,
      m.telefone,
      m.funcoes.join(', '),
      m.ministerio,
      m.ativo ? 'Sim' : 'Não',
    ]),
  ];

  const escalasRows = [
    ['id', 'data', 'horario', 'tipo_culto', 'status', 'observacoes'],
    ...appData.escalas.map(e => [
      e.id,
      e.data,
      e.horario,
      e.tipo_culto,
      e.status,
      e.observacoes || '',
    ]),
  ];

  const escaladosRows = [
    ['id', 'escala_id', 'membro_id', 'funcao', 'confirmado'],
    ...appData.escalados.map(es => [
      es.id,
      es.escala_id,
      es.membro_id,
      es.funcao,
      es.confirmado,
    ]),
  ];

  const repertorioRows = [
    ['id', 'musica', 'artista_original', 'tom', 'link_cifra', 'link_audio', 'link_video', 'tags'],
    ...appData.repertorio.map(r => [
      r.id,
      r.musica,
      r.artista_original,
      r.tom,
      r.link_cifra || '',
      r.link_audio || '',
      r.link_video || '',
      (r.tags || []).join(', '),
    ]),
  ];

  const repertorioEscalaRows = [
    ['id', 'escala_id', 'musica_id', 'ordem', 'tom_definido'],
    ...appData.repertorioEscala.map(re => [
      re.id,
      re.escala_id,
      re.musica_id,
      String(re.ordem),
      re.tom_definido || '',
    ]),
  ];

  const disponibilidadeRows = [
    ['id', 'membro_id', 'data_indisponivel', 'motivo'],
    ...appData.disponibilidades.map(d => [
      d.id,
      d.membro_id,
      d.data_indisponivel,
      d.motivo || '',
    ]),
  ];

  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      { range: 'Membros!A1:G500', values: membrosRows },
      { range: 'Escalas!A1:F2000', values: escalasRows },
      { range: 'Escalados!A1:E5000', values: escaladosRows },
      { range: 'Repertorio!A1:H2000', values: repertorioRows },
      { range: 'Repertorio_Escala!A1:E5000', values: repertorioEscalaRows },
      { range: 'Disponibilidade!A1:D2000', values: disponibilidadeRows },
    ],
  };

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Erro ao escrever dados na planilha:', err);
    throw new Error(`Erro ao atualizar planilha Google Sheets: ${response.status}`);
  }
}

export async function fetchSpreadsheetData(
  spreadsheetId: string,
  accessToken: string
): Promise<AppDataState> {
  // Ensure the spreadsheet has required tabs (Membros, Escalas, etc.), creating them automatically if missing
  await ensureSpreadsheetStructure(spreadsheetId, accessToken);

  const ranges = [
    'Membros!A1:G500',
    'Escalas!A1:F2000',
    'Escalados!A1:E5000',
    'Repertorio!A1:H2000',
    'Repertorio_Escala!A1:E5000',
    'Disponibilidade!A1:D2000',
  ].map(r => `ranges=${encodeURIComponent(r)}`).join('&');

  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchGet?${ranges}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (response.status === 403 || response.status === 401) {
    throw new Error('PERMISSION_DENIED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao ler planilha: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  const valueRanges = result.valueRanges || [];

  const getValues = (index: number) => (valueRanges[index] && valueRanges[index].values) || [];

  // Parse Membros
  const membrosValues = getValues(0);
  const membros: Membro[] = [];
  if (membrosValues.length > 1) {
    for (let i = 1; i < membrosValues.length; i++) {
      const row = membrosValues[i];
      if (!row[0]) continue;
      membros.push({
        id: row[0],
        nome: row[1] || '',
        email: row[2] || '',
        telefone: row[3] || '',
        funcoes: row[4] ? row[4].split(',').map((s: string) => s.trim()) : [],
        ministerio: row[5] || 'Louvor',
        ativo: row[6] ? row[6].toLowerCase() === 'sim' || row[6] === 'true' : true,
      });
    }
  }

  // Parse Escalas
  const escalasValues = getValues(1);
  const escalas: Escala[] = [];
  if (escalasValues.length > 1) {
    for (let i = 1; i < escalasValues.length; i++) {
      const row = escalasValues[i];
      if (!row[0]) continue;
      escalas.push({
        id: row[0],
        data: row[1] || '',
        horario: row[2] || '18:00',
        tipo_culto: row[3] || 'Domingo',
        status: (row[4] as StatusEscala) || 'rascunho',
        observacoes: row[5] || '',
      });
    }
  }

  // Parse Escalados
  const escaladosValues = getValues(2);
  const escalados: Escalado[] = [];
  if (escaladosValues.length > 1) {
    for (let i = 1; i < escaladosValues.length; i++) {
      const row = escaladosValues[i];
      if (!row[0]) continue;
      escalados.push({
        id: row[0],
        escala_id: row[1] || '',
        membro_id: row[2] || '',
        funcao: row[3] || 'Vocal',
        confirmado: (row[4] as StatusConfirmacao) || 'pendente',
      });
    }
  }

  // Parse Repertorio
  const repertorioValues = getValues(3);
  const repertorio: Musica[] = [];
  if (repertorioValues.length > 1) {
    for (let i = 1; i < repertorioValues.length; i++) {
      const row = repertorioValues[i];
      if (!row[0]) continue;
      repertorio.push({
        id: row[0],
        musica: row[1] || '',
        artista_original: row[2] || '',
        tom: row[3] || 'G',
        link_cifra: row[4] || '',
        link_audio: row[5] || '',
        link_video: row[6] || '',
        tags: row[7] ? row[7].split(',').map((s: string) => s.trim()) : [],
      });
    }
  }

  // Parse Repertorio_Escala
  const repertorioEscalaValues = getValues(4);
  const repertorioEscala: MusicaEscala[] = [];
  if (repertorioEscalaValues.length > 1) {
    for (let i = 1; i < repertorioEscalaValues.length; i++) {
      const row = repertorioEscalaValues[i];
      if (!row[0]) continue;
      repertorioEscala.push({
        id: row[0],
        escala_id: row[1] || '',
        musica_id: row[2] || '',
        ordem: Number(row[3]) || i,
        tom_definido: row[4] || '',
      });
    }
  }

  // Parse Disponibilidade
  const disponibilidadeValues = getValues(5);
  const disponibilidades: Indisponibilidade[] = [];
  if (disponibilidadeValues.length > 1) {
    for (let i = 1; i < disponibilidadeValues.length; i++) {
      const row = disponibilidadeValues[i];
      if (!row[0]) continue;
      disponibilidades.push({
        id: row[0],
        membro_id: row[1] || '',
        data_indisponivel: row[2] || '',
        motivo: row[3] || '',
      });
    }
  }

  // If fetched empty sheet structure, fall back gracefully to default state
  if (membros.length === 0 && escalas.length === 0) {
    return INITIAL_APP_DATA;
  }

  return {
    membros,
    escalas,
    escalados,
    repertorio,
    repertorioEscala,
    disponibilidades,
  };
}
