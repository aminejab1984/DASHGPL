import { getStore } from '@netlify/blobs';

const store = getStore('dashgpl-data');
const MAX_HISTORY = 12;
const PIN = process.env.DASHGPL_PIN || 'CMGPL';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function auth(body) {
  return body?.pin === PIN;
}

export default async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'load';

  try {
    if (req.method === 'GET' && action === 'load') {
      const manifest = await store.get('latest', { type: 'json' });
      if (!manifest) return json({ records: [], meta: {}, savedAt: '' });

      const records = [];
      for (let i = 0; i < manifest.total; i++) {
        const chunk = await store.get(`dataset/${manifest.datasetId}/chunk-${i}`, { type: 'json' });
        if (Array.isArray(chunk)) records.push(...chunk);
      }
      return json({ records, meta: manifest.meta || {}, savedAt: manifest.savedAt || '' });
    }

    if (req.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, 405);
    const body = await req.json();
    if (!auth(body)) return json({ error: 'PIN incorrect.' }, 401);

    if (action === 'chunk') {
      if (!body.datasetId || !Number.isInteger(body.index) || !Array.isArray(body.records)) {
        return json({ error: 'Bloc de données invalide.' }, 400);
      }
      await store.set(`dataset/${body.datasetId}/chunk-${body.index}`, JSON.stringify(body.records), {
        metadata: { type: 'dataset-chunk', datasetId: body.datasetId, index: String(body.index) }
      });
      return json({ ok: true, index: body.index });
    }

    if (action === 'finalize') {
      if (!body.datasetId || !Number.isInteger(body.total) || body.total < 1) {
        return json({ error: 'Manifeste invalide.' }, 400);
      }
      const previous = await store.get('latest', { type: 'json' });
      const manifest = {
        datasetId: body.datasetId,
        total: body.total,
        meta: body.meta || {},
        savedAt: body.savedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await store.set('latest', JSON.stringify(manifest), { metadata: { type: 'manifest' } });

      if (previous?.datasetId && previous.datasetId !== body.datasetId) {
        for (let i = 0; i < Number(previous.total || 0); i++) {
          await store.delete(`dataset/${previous.datasetId}/chunk-${i}`);
        }
      }
      return json({ ok: true, manifest });
    }

    if (action === 'reset') {
      const previous = await store.get('latest', { type: 'json' });
      if (previous?.datasetId) {
        for (let i = 0; i < Number(previous.total || 0); i++) {
          await store.delete(`dataset/${previous.datasetId}/chunk-${i}`);
        }
      }
      await store.delete('latest');
      return json({ ok: true });
    }

    return json({ error: 'Action inconnue.' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error?.message || 'Erreur serveur.' }, 500);
  }
};
