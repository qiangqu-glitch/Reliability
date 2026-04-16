// ReliToolbox v0.1 — Shared CSV loader.
// Minimal-surface parser: one file input, pluggable column parser.
// Usage:  ReliCSV.attach(fileInput, (rows, raw) => { ... });
// Row format: array of {t:number, cens:0|1, type?:'exact'|'right'|'left'|'interval', tL?, tR?}
// Header detection: first line with non-numeric first cell treated as header.
// Censor codes: 'R'/'r' = right, 'L'/'l' = left, 'F'/'f'/''/'1' = exact failure, '0' = exact by convention.
(function(global){
  function parseLine(line){
    // Strip BOM / trim
    line = line.replace(/^\uFEFF/, '').trim();
    if(!line || line.startsWith('#')) return null;
    // Support comma / semicolon / tab
    return line.split(/[\t,;]/).map(s=>s.trim());
  }
  function isNumeric(s){ return /^-?\d+\.?\d*(?:[eE][+-]?\d+)?$/.test(s); }
  function parse(text){
    const lines = text.split(/\r?\n/);
    const rows = [];
    let header = null;
    for(const raw of lines){
      const cells = parseLine(raw);
      if(!cells) continue;
      if(header===null && !isNumeric(cells[0])){ header = cells.map(c=>c.toLowerCase()); continue; }
      // Interval form: "tL-tR" or two numeric cols with both numeric and a matching header
      if(cells.length>=2 && isNumeric(cells[0]) && isNumeric(cells[1])){
        const tL=+cells[0], tR=+cells[1];
        if(tL>0 && tR>tL){ rows.push({type:'interval', tL, tR, t:(tL+tR)/2}); continue; }
      }
      if(!isNumeric(cells[0])) continue;
      const t = +cells[0];
      if(!(t>0)) continue;
      const flag = (cells[1]||'').toUpperCase();
      if(flag==='R'||flag==='+'){ rows.push({type:'right', t, cens:1}); }
      else if(flag==='L'){ rows.push({type:'left', t, cens:0}); }
      else { rows.push({type:'exact', t, cens:0}); }
    }
    return {rows, header};
  }
  function attach(input, cb){
    input.addEventListener('change', ev=>{
      const f = ev.target.files && ev.target.files[0]; if(!f) return;
      const r = new FileReader();
      r.onload = ()=>{ try{ cb(parse(r.result), r.result); }catch(e){ alert('CSV 解析失败: '+e.message); } };
      r.onerror = ()=>alert('读取文件失败');
      r.readAsText(f);
    });
  }
  global.ReliCSV = {parse, attach};
})(typeof window!=='undefined'?window:globalThis);
