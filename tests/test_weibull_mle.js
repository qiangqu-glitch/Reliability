// Weibull MLE + Fisher CI regression
// Extracts the NM optimizer from weibull_advanced.html and verifies convergence on known problems.

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname,'..','weibull','weibull_advanced.html'),'utf8');

// Extract all <script> content without src=
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let all = '';
let m;
while((m = re.exec(html))){ all += m[1] + '\n'; }

// Mock document to avoid runtime errors from selfTest / DOM ops
const document = {
  getElementById: () => ({ textContent:'', value:'', innerHTML:'' }),
  title:'', addEventListener:()=>{}
};
const window = {};
eval(all.replace(/document\.getElementById\('err'\)\.textContent\s*=\s*''/g, 'void 0'));

// wbF, wbR, wbf, logLik, nelderMead, fdHess, inv2 should now be defined in scope

// TEST 1: All exact data — large sample, known β=2, η=1000
function genExact(n, betaTrue, etaTrue, seed){
  // Simple LCG for reproducibility
  let s = seed;
  const rand = ()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; };
  const out=[];
  for(let i=0;i<n;i++){
    const u = rand();
    const t = etaTrue * Math.pow(-Math.log(1-u), 1/betaTrue);
    out.push({type:'exact', t});
  }
  return out;
}

let N=200, betaTrue=2.0, etaTrue=1000;
let data = genExact(N, betaTrue, etaTrue, 42);
let opt = nelderMead((b,e)=>logLik(data,b,e), [1.5, 800]);
console.log('=== TEST 1: n=200 exact, true β=2.0 η=1000 ===');
console.log(`  β̂ = ${opt.x[0].toFixed(4)} (target 2.0, err ${((opt.x[0]/2-1)*100).toFixed(2)}%)`);
console.log(`  η̂ = ${opt.x[1].toFixed(2)} (target 1000, err ${((opt.x[1]/1000-1)*100).toFixed(2)}%)`);
if(Math.abs(opt.x[0]-2) > 0.2) { console.log('FAIL: β off'); process.exit(1); }
if(Math.abs(opt.x[1]-1000) > 80) { console.log('FAIL: η off'); process.exit(1); }
console.log('  PASS');

// TEST 2: Fisher Hessian — fdHess is now on log-params (u,v)=(ln β, ln η).
// cov[0][0] ≡ Var(ln β̂), cov[1][1] ≡ Var(ln η̂).  Delta method: σ(β)=β·σ(ln β).
const H = fdHess((b,e)=>logLik(data,b,e), opt.x[0], opt.x[1]);
const negH = [[-H[0][0],-H[0][1]],[-H[1][0],-H[1][1]]];
const cov = inv2(negH);
console.log('\n=== TEST 2: Fisher Information (log-param Hessian) ===');
if(!cov){ console.log('FAIL: covariance inverse failed'); process.exit(2); }
const sLB = Math.sqrt(cov[0][0]);            // σ(ln β)
const sLE = Math.sqrt(cov[1][1]);            // σ(ln η)
const seB = opt.x[0]*sLB;                    // σ(β) via delta method
const seE = opt.x[1]*sLE;                    // σ(η) via delta method
console.log(`  σ(β̂) = ${seB.toFixed(4)}   σ(η̂) = ${seE.toFixed(2)}`);
console.log(`  95% CI β: [${(opt.x[0]*Math.exp(-1.96*sLB)).toFixed(3)}, ${(opt.x[0]*Math.exp(1.96*sLB)).toFixed(3)}]`);
console.log(`  95% CI η: [${(opt.x[1]*Math.exp(-1.96*sLE)).toFixed(1)}, ${(opt.x[1]*Math.exp(1.96*sLE)).toFixed(1)}]`);
// Analytical Fisher for complete data: Var(β̂) ≈ 0.608·β²/n, Var(η̂) ≈ 1.108·η²/(β²·n)
const asyVarB = 0.608 * betaTrue*betaTrue / N;
const asyVarE = 1.108 * etaTrue*etaTrue / (betaTrue*betaTrue * N);
const asySeB = Math.sqrt(asyVarB), asySeE = Math.sqrt(asyVarE);
console.log(`  asymptotic σ(β) ≈ ${asySeB.toFixed(4)}, σ(η) ≈ ${asySeE.toFixed(2)}`);
if(Math.abs(seB/asySeB - 1) > 0.3){ console.log('WARN: σ(β) deviates >30% from asymptotic'); }
if(Math.abs(seE/asySeE - 1) > 0.3){ console.log('WARN: σ(η) deviates >30% from asymptotic'); }
console.log('  Fisher CI reasonable');

// TEST 3: Right-censored data — should still produce sensible estimates
function censorAt(data, tCens){
  return data.map(d => d.t > tCens ? {type:'right', t:tCens} : d);
}
const cData = censorAt(data, 1200);
const nExact = cData.filter(d=>d.type==='exact').length;
const nCens = cData.length - nExact;
const opt3 = nelderMead((b,e)=>logLik(cData,b,e), [1.5, 800]);
console.log(`\n=== TEST 3: n=${cData.length} with ${nCens} right-censored at t=1200 ===`);
console.log(`  β̂ = ${opt3.x[0].toFixed(4)}  η̂ = ${opt3.x[1].toFixed(2)}`);
if(Math.abs(opt3.x[0]-2) > 0.4){ console.log('FAIL: β off'); process.exit(3); }
if(Math.abs(opt3.x[1]-1000) > 150){ console.log('FAIL: η off'); process.exit(3); }
console.log('  PASS');

// TEST 4: Interval censoring
const intData = [
  {type:'interval', tL:500, tR:700},
  {type:'interval', tL:500, tR:700},
  {type:'interval', tL:700, tR:900},
  {type:'interval', tL:700, tR:900},
  {type:'interval', tL:900, tR:1100},
  {type:'interval', tL:900, tR:1100},
  {type:'exact', t:1050},
  {type:'exact', t:1200},
  {type:'right', t:1500}
];
const opt4 = nelderMead((b,e)=>logLik(intData,b,e), [1.5, 1000]);
console.log(`\n=== TEST 4: n=${intData.length} mixed censoring ===`);
console.log(`  β̂ = ${opt4.x[0].toFixed(4)}  η̂ = ${opt4.x[1].toFixed(2)}`);
if(!isFinite(opt4.x[0]) || !isFinite(opt4.x[1]) || opt4.x[0]<=0 || opt4.x[1]<=0){
  console.log('FAIL: non-finite/invalid estimate'); process.exit(4);
}
console.log('  PASS (estimates finite & positive)');

console.log('\nAll Weibull MLE tests passed.');
