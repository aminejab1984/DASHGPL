import { getStore } from '@netlify/blobs';

const store = getStore('gpl-dashboard');
const KEY = 'latest-dashboard-data';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default async function handler(req) {
  try {
    if (req.method === 'GET') {
      const data = await store.get(KEY, { type: 'json' });
      return json(data || { meta: {}, records: [], savedAt: null });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      if (!body || !Array.isArray(body.records)) {
        return json({ error: 'Format invalide: records doit être un tableau.' }, 400);
      }

      const payload = {
        meta: body.meta || {},
        records: body.records,
        savedAt: body.savedAt || new Date().toLocaleString('fr-FR'),
        savedAtISO: new Date().toISOString()
      };

      await store.setJSON(KEY, payload, {
        metadata: {
          rowCount: String(payload.records.length),
          savedAtISO: payload.savedAtISO,
          sourceFile: String(payload.meta.sourceFile || '')
        }
      });

      return json({ ok: true, rowCount: payload.records.length, savedAt: payload.savedAt });
    }

    return json({ error: 'Méthode non autorisée.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: error?.message || 'Erreur serveur.' }, 500);
  }
}
