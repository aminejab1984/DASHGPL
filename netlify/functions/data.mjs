import { getStore } from '@netlify/blobs';

const store = getStore('gpl-dashboard');
const MANIFEST = 'manifest';
const MAX_CHUNK_BYTES = 4_500_000;

function json(data, status=200){
  return new Response(JSON.stringify(data), {status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
}
function validPin(pin){
  const expected = process.env.GPL_PIN || 'CMGPL';
  return typeof pin === 'string' && pin.length > 0 && pin === expected;
}

export default async function handler(req){
  try{
    if(req.method === 'GET'){
      const manifest = await store.get(MANIFEST,{type:'json'});
      if(!manifest) return json({meta:{},records:[],updatedAt:null});
      const parts = await Promise.all(
        Array.from({length:manifest.total},(_,i)=>store.get(`batch/${manifest.batchId}/${i}`,{type:'json'}))
      );
      const records = parts.flatMap(x=>Array.isArray(x)?x:[]);
      return json({meta:manifest.meta||{},records,updatedAt:manifest.updatedAt||null});
    }

    const body = await req.json().catch(()=>({}));
    if(!validPin(body.pin)) return json({error:'PIN incorrect ou absent.'},401);

    if(req.method === 'DELETE'){
      const manifest = await store.get(MANIFEST,{type:'json'});
      if(manifest?.batchId){
        await Promise.all(Array.from({length:manifest.total},(_,i)=>store.delete(`batch/${manifest.batchId}/${i}`)));
      }
      await store.delete(MANIFEST);
      return json({ok:true});
    }

    if(req.method !== 'POST') return json({error:'Méthode non autorisée.'},405);

    if(body.action === 'chunk'){
      if(!body.batchId || !Number.isInteger(body.index) || !Number.isInteger(body.total) || body.total < 1) return json({error:'Chunk invalide.'},400);
      const records = Array.isArray(body.records)?body.records:[];
      const raw = JSON.stringify(records);
      if(new TextEncoder().encode(raw).byteLength > MAX_CHUNK_BYTES) return json({error:'Chunk trop volumineux.'},413);
      await store.setJSON(`batch/${body.batchId}/${body.index}`,records);
      return json({ok:true,index:body.index});
    }

    if(body.action === 'commit'){
      if(!body.batchId || !Number.isInteger(body.total) || body.total < 1) return json({error:'Commit invalide.'},400);
      const previous = await store.get(MANIFEST,{type:'json'});
      const updatedAt = new Date().toISOString();
      const manifest = {batchId:body.batchId,total:body.total,meta:body.meta||{},updatedAt};
      await store.setJSON(MANIFEST,manifest);
      if(previous?.batchId && previous.batchId !== body.batchId){
        await Promise.all(Array.from({length:previous.total||0},(_,i)=>store.delete(`batch/${previous.batchId}/${i}`)));
      }
      return json({ok:true,updatedAt});
    }

    return json({error:'Action inconnue.'},400);
  }catch(err){
    console.error(err);
    return json({error:err?.message||'Erreur serveur.'},500);
  }
}

export const config = { path: '/api/data' };
