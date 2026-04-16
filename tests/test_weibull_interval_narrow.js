// Weibull interval-censoring — narrow vs wide consistency + expm1 path correctness.
// Regression for HANDOFF §6 item: catastrophic cancellation in F(tR)-F(tL).

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname,'..','weibull','weibull_advanced.html'),'utf8');

const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let all=''; let m; while((m=re.exec(html))){ all += m[1] + '\n'; }
const document = { getElementById:()=>({textContent:'',value:'',innerHTML:''}), title:'', addEventListener:()=>{} };
const window = {};
eval(all.replace(/document\.getElementById\('err'\)\.textContent\s*=\s*''/g,'void 0'));

// LCG for reproducibility
function gen(n, betaTrue, etaTrue, seed){
  let s=seed;
  const r=()=>{s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff;};
  const out=[];
  for(let i=0;i<n;i++){
    const u=r();
    out.push(etaTrue*Math.pow(-Math.log(1-u),1/betaTrue));
  }
  return out;
}

const betaTrue=2.0, etaTrue=1000, N=100;
const ts = gen(N, betaTrue, etaTrue, 7);

// Wide intervals: ±10%
const wide   = ts.map(t=>({type:'interval', tL:0.9*t, tR:1.1*t, t}));
// Narrow intervals: ±0.5% — WOULD TRIGGER CANCELLATION under the old F(tR)-F(tL) path.
const narrow = ts.map(t=>({type:'interval', tL:0.995*t, tR:1.005*t, t}));

const optW = nelderMead((b,e)=>logLik(wide,  b,e), [1.5, 800]);
const optN = nelderMead((b,e)=>logLik(narrow,b,e), [1.5, 800]);

console.log('=== TEST: wide [±10%] interval censoring ===');
console.log(`  β̂ = ${optW.x[0].toFixed(4)}  η̂ = ${optW.x[1].toFixed(2)}  ll=${optW.f.toFixed(3)}`);
console.log('=== TEST: narrow [±0.5%] interval censoring (expm1 path) ===');
console.log(`  β̂ = ${optN.x[0].toFixed(4)}  η̂ = ${optN.x[1].toFixed(2)}  ll=${optN.f.toFixed(3)}`);

if(!isFinite(optN.x[0]) || !isFinite(optN.x[1]) || optN.x[0]<=0 || optN.x[1]<=0){
  console.log('FAIL: narrow-interval MLE non-finite/invalid'); process.exit(1);
}
if(Math.abs(optN.x[0]-betaTrue)/betaTrue > 0.15){
  console.log(`FAIL: narrow β̂ deviates >15% (got ${optN.x[0]})`); process.exit(1);
}
if(Math.abs(optN.x[1]-etaTrue)/etaTrue > 0.15){
  console.log(`FAIL: narrow η̂ deviates >15% (got ${optN.x[1]})`); process.exit(1);
}
// Narrow should be *close* to wide (same information source, just tighter brackets).
const dB = Math.abs(optN.x[0]-optW.x[0])/optW.x[0];
const dE = Math.abs(optN.x[1]-optW.x[1])/optW.x[1];
console.log(`  narrow vs wide: Δβ/β = ${(dB*100).toFixed(2)}%  Δη/η = ${(dE*100).toFixed(2)}%`);
if(dB>0.10 || dE>0.10){ console.log('FAIL: narrow estimate drifts >10% from wide'); process.exit(1); }

// Direct probe: extremely narrow interval [999,1000] at β=2, η=1000 must give finite positive log-p.
// Under naive F(tR)-F(tL), both F values ≈ 0.6321... and their diff can lose >10 significant digits.
const ll1 = logLik([{type:'interval', tL:999, tR:1000}], 2.0, 1000);
console.log(`\n  logLik of one [999,1000] interval at (β=2,η=1000) = ${ll1.toFixed(6)}`);
if(!isFinite(ll1)){ console.log('FAIL: narrow-interval ll non-finite (cancellation)'); process.exit(1); }
// Analytical: f(1000)·1 ≈ (2/1000)·(1)·exp(-1)·1 ≈ 7.358e-4, so ll ≈ -7.215
if(Math.abs(ll1 - (-7.215)) > 0.1){
  console.log(`FAIL: narrow-interval ll off analytical (-7.215), got ${ll1}`); process.exit(1);
}

console.log('\nAll narrow-interval / expm1 tests passed.');
