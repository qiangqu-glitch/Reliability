// ReliToolbox v0.1 (c) reliability.chemcalc.cn


(function(global){
  const DB_NAME = 'ReliToolbox';
  const DB_VER  = 3;  // v3 adds shared `components` library (RAM ↔ RBD)
  const STORES  = {
    equipments:      { key:'id', indexes:['tag','type'] },
    failures:        { key:'id', indexes:['equipId','date'] },
    fmea:            { key:'id', indexes:['equipId','rpn'] },
    fmea_worksheets: { key:'id', indexes:['equipId','updatedAt'] },
    weibull_results: { key:'id', indexes:['equipId','createdAt'] },
    fta_models:      { key:'id', indexes:['name','updatedAt'] },
    rbd_models:      { key:'id', indexes:['name','updatedAt'] },
    rbi_assessments: { key:'id', indexes:['equipId','riskLevel'] },
    components:      { key:'id', indexes:['name','updatedAt'] },  // {name, mtbf, mttr, n, k, capacity, notes}
  };

  let _db = null;

  function open(){
    if(_db) return Promise.resolve(_db);
    return new Promise((res,rej)=>{
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = (e)=>{
        const db = e.target.result;
        for(const [name,cfg] of Object.entries(STORES)){
          if(!db.objectStoreNames.contains(name)){
            const s = db.createObjectStore(name, {keyPath: cfg.key});
            (cfg.indexes||[]).forEach(idx => s.createIndex(idx, idx, {unique:false}));
          }
        }
      };
      req.onsuccess = ()=>{ _db = req.result; res(_db); };
      req.onerror   = ()=>rej(req.error);
    });
  }

  function tx(store, mode='readonly'){
    return open().then(db => db.transaction(store, mode).objectStore(store));
  }

  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

  async function put(store, obj){
    if(!obj.id) obj.id = uid();
    if(!obj.createdAt) obj.createdAt = Date.now();
    obj.updatedAt = Date.now();
    const s = await tx(store,'readwrite');
    return new Promise((res,rej)=>{
      const r = s.put(obj);
      r.onsuccess = ()=>res(obj);
      r.onerror   = ()=>rej(r.error);
    });
  }

  async function get(store, id){
    const s = await tx(store);
    return new Promise((res,rej)=>{
      const r = s.get(id);
      r.onsuccess = ()=>res(r.result||null);
      r.onerror   = ()=>rej(r.error);
    });
  }

  async function all(store){
    const s = await tx(store);
    return new Promise((res,rej)=>{
      const r = s.getAll();
      r.onsuccess = ()=>res(r.result||[]);
      r.onerror   = ()=>rej(r.error);
    });
  }

  async function del(store, id){
    const s = await tx(store,'readwrite');
    return new Promise((res,rej)=>{
      const r = s.delete(id);
      r.onsuccess = ()=>res(true);
      r.onerror   = ()=>rej(r.error);
    });
  }

  async function findBy(store, indexName, value){
    const s = await tx(store);
    return new Promise((res,rej)=>{
      const idx = s.index(indexName);
      const r = idx.getAll(value);
      r.onsuccess = ()=>res(r.result||[]);
      r.onerror   = ()=>rej(r.error);
    });
  }

  async function clear(store){
    const s = await tx(store,'readwrite');
    return new Promise((res,rej)=>{
      const r = s.clear();
      r.onsuccess = ()=>res(true);
      r.onerror   = ()=>rej(r.error);
    });
  }

  async function exportAll(){
    const out = {version:DB_VER, exportedAt: new Date().toISOString(), data:{}};
    for(const name of Object.keys(STORES)) out.data[name] = await all(name);
    return out;
  }

  async function importAll(json){
    if(!json || !json.data) throw new Error('Invalid backup file');
    for(const [name,rows] of Object.entries(json.data)){
      if(!STORES[name]) continue;
      await clear(name);
      for(const r of rows) await put(name, r);
    }
    return true;
  }

  async function addFailure(equipId, failureRecord){
    const rec = {...failureRecord, equipId};
    await put('failures', rec);
    if(global.ReliDB._onFailureAdded) await global.ReliDB._onFailureAdded(equipId);
    return rec;
  }

  async function getFailuresByEquip(equipId){
    return findBy('failures','equipId',equipId);
  }

  async function saveWeibullResult(equipId, result){
    return put('weibull_results',{...result, equipId});
  }

  async function getLatestWeibull(equipId){
    const all = await findBy('weibull_results','equipId',equipId);
    return all.sort((a,b)=>b.createdAt-a.createdAt)[0]||null;
  }

  global.ReliDB = {
    open, put, get, all, del, findBy, clear,
    exportAll, importAll,
    addFailure, getFailuresByEquip, saveWeibullResult, getLatestWeibull,
    _onFailureAdded: null,
    STORES: Object.keys(STORES),
  };
})(typeof window!=='undefined'?window:globalThis);
