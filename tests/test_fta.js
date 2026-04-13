// FTA算法独立测试 - 不依赖DOM
const events = new Set(['A','B','C','D']);
const gates = {
  TOP:  {type:'OR',  children:['G1','G2']},
  G1:   {type:'AND', children:['A','B']},
  G2:   {type:'AND', children:['C','D']},
};
function mocus(gates, eventNames){
  const isBasic = n => eventNames.has(n);
  let matrix = [['TOP']];
  let changed = true, safety = 0;
  while(changed && safety++ < 1000){
    changed = false;
    const next = [];
    for(const row of matrix){
      const idx = row.findIndex(n=>!isBasic(n));
      if(idx===-1){next.push(row);continue;}
      const g = gates[row[idx]];
      if(!g) throw new Error('undef '+row[idx]);
      changed = true;
      const before=row.slice(0,idx), after=row.slice(idx+1);
      if(g.type==='AND') next.push([...before,...g.children,...after]);
      else for(const c of g.children) next.push([...before,c,...after]);
    }
    matrix = next;
  }
  const sets = matrix.map(r=>[...new Set(r)].sort());
  const seen=new Set(),uniq=[];
  for(const s of sets){const k=s.join('|');if(!seen.has(k)){seen.add(k);uniq.push(s);}}
  return uniq.filter(s=>!uniq.some(o=>o!==s&&o.length<s.length&&o.every(x=>s.includes(x))));
}
const cs = mocus(gates,events);
console.log('Test1 - Two parallel AND gates under OR:');
console.log('Expected: [[A,B],[C,D]], Got:', JSON.stringify(cs));
console.assert(cs.length===2 && cs[0].join(',')==='A,B' && cs[1].join(',')==='C,D','FAIL T1');

// Test2: superset removal
const g2 = {TOP:{type:'OR',children:['A','G1']}, G1:{type:'AND',children:['A','B']}};
const cs2 = mocus(g2,new Set(['A','B']));
console.log('\nTest2 - Superset removal:');
console.log('Expected: [[A]] only (because [A,B] is superset of [A]), Got:', JSON.stringify(cs2));
console.assert(cs2.length===1 && cs2[0][0]==='A','FAIL T2');

// Test3: probability calc
function topProb(mcs, pmap){
  if(mcs.length<=12){
    let total=0; const N=mcs.length;
    for(let mask=1;mask<(1<<N);mask++){
      const bits=[];for(let i=0;i<N;i++)if(mask&(1<<i))bits.push(i);
      const u=new Set();bits.forEach(i=>mcs[i].forEach(e=>u.add(e)));
      const p=[...u].reduce((a,n)=>a*(pmap[n]||0),1);
      total+=(bits.length%2?1:-1)*p;
    }
    return total;
  }
  return mcs.reduce((a,c)=>a+c.reduce((x,n)=>x*(pmap[n]||0),1),0);
}
// Two independent AND gates, p=0.1 each: cs1=AB(0.01), cs2=CD(0.01)
// Union = 0.01+0.01-0.0001 = 0.0199
const p = topProb(cs,{A:0.1,B:0.1,C:0.1,D:0.1});
console.log('\nTest3 - Top prob (expect ~0.0199):',p.toFixed(6));
console.assert(Math.abs(p-0.0199)<1e-6,'FAIL T3');

console.log('\n✅ All FTA tests passed');
