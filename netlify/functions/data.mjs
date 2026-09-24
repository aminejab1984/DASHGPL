import { getStore } from '@netlify/blobs';

const store = getStore('gpl-dashboard');
const MANIFEST = 'latest-manifest';
const CHUNK_PREFIX = 'latest-chunk-';
const LEGACY_KEY = 'latest-dashboard-data';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

export default async function handler(req) {
  try {
    const url = new URL(req.url);

    if (req.method === 'GET') {
      const chunkParam = url.searchParams.get('chunk');
      if (chunkParam !== null) {
        const index = Number(chunkParam);
        if (!Number.isInteger(index) || index < 0) return json({error:'Index invalide.'},400);
        const uploadId = url.searchParams.get('uploadId');
        const manifest = await store.get(MANIFEST, { type: 'json' });
        if (!manifest || !uploadId || manifest.uploadId !== uploadId) return json({error:'Version introuvable.'},404);
        const chunk = await store.get(`${CHUNK_PREFIX}${uploadId}-${index}`, { type: 'text' });
        if (chunk === null) return json({error:'Partie introuvable.'},404);
        return json({chunk});
      }

      const manifestOnly = url.searchParams.get('manifest');
      if (manifestOnly === '1') {
        const manifest = await store.get(MANIFEST, { type: 'json' });
        if (manifest) return json(manifest);
        // Compatibility with a previously saved small object, if one exists.
        const legacy = await store.get(LEGACY_KEY, { type: 'json' });
        if (legacy) return json({uploadId:'legacy',total:0,savedAt:legacy.savedAt||null,rowCount:legacy.records?.length||0,legacy});
        return json({total:0});
      }

      return json({error:'Paramètre GET manquant.'},400);
    }

    if (req.method === 'POST') {
      const body = await req.json();
      if (!body || typeof body.chunk !== 'string' || !body.uploadId) return json({error:'Chunk invalide.'},400);
      const index = Number(body.index), total = Number(body.total);
      if (!Number.isInteger(index) || !Number.isInteger(total) || index < 0 || total < 1 || index >= total) return json({error:'Index/total invalide.'},400);

      await store.set(`${CHUNK_PREFIX}${body.uploadId}-${index}`, body.chunk);

      if (index === total - 1) {
        const manifest = {
          uploadId: body.uploadId,
          total,
          savedAt: new Date().toLocaleString('fr-FR'),
          savedAtISO: new Date().toISOString()
        };
        await store.setJSON(MANIFEST, manifest);
      }
      return json({ok:true,index,total});
    }

    if (req.method === 'DELETE') {
      const manifest = await store.get(MANIFEST, { type: 'json' });
      if (manifest?.uploadId && Number.isInteger(manifest.total)) {
        await Promise.all(Array.from({length:manifest.total},(_,i)=>store.delete(`${CHUNK_PREFIX}${manifest.uploadId}-${i}`)));
        await store.delete(MANIFEST);
      }
      await store.delete(LEGACY_KEY);
      return json({ok:true});
    }

    return json({ error: 'Méthode non autorisée.' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: error?.message || 'Erreur serveur.' }, 500);
  }
}
