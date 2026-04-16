// RAM k-out-of-n capacity regression
// Extracts the WORKER_SRC from ram/index.html and runs simulateOne with known inputs.
// Validates that capacity formula respects k-out-of-n semantics (running units = min(up, k)).

const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname,'..','ram','index.html'),'utf8');
const m = html.match(/const WORKER_SRC = `([\s\S]*?)`;/);
if(!m){ console.error('WORKER_SRC not found'); process.exit(1); }
// Strip the onmessage handler (we don't need it) and extract functions
const src = m[1].replace(/onmessage[\s\S]*$/,'');
// Evaluate functions into our scope
eval(src + '; globalThis.simulateOne = simulateOne; globalThis.mulberry32 = mulberry32;');

function runMany(comps, missionHrs, nRuns, seed){
  const rng = mulberry32(seed);
  const avs=[], prods=[];
  for(let r=0;r<nRuns;r++){
    const o = simulateOne(comps, missionHrs, rng);
    avs.push(o.availability); prods.push(o.totalProd);
  }
  const mean = a=>a.reduce((s,x)=>s+x,0)/a.length;
  return { avgAvail: mean(avs), avgProd: mean(prods) };
}

// TEST 1: Non-redundant component — 1 unit × 1000 Nm³/h × MTBF 8000h × MTTR 24h
// Steady-state availability ≈ MTBF/(MTBF+MTTR) = 8000/8024 = 0.99701
// Expected production = capacity × missionHrs × availability
const mission = 8760; // 1 year
const comp1 = [{ name:'single', mtbf:8000, mttr:24, count:1, kReq:1, capacity:1000 }];
const r1 = runMany(comp1, mission, 500, 42);
console.log('=== TEST 1: 1×1 non-redundant ===');
console.log(`Observed availability = ${r1.avgAvail.toFixed(5)}  (analytical ≈ 0.99701)`);
console.log(`Observed production   = ${r1.avgProd.toFixed(0)}  (expected ≈ ${(1000*mission*0.99701).toFixed(0)})`);

// TEST 2: 2-out-of-3 redundant — 3 units, only 2 need to run. capacity per unit = 500.
// Expected production when all 3 up = 2 × 500 = 1000 Nm³/h (not 3 × 500 = 1500!)
// When 2 up = 2 × 500 = 1000 (still meets k)
// When 1 up = 0 (below k, system down)
// Steady-state probability all 3 up is high, so expected ≈ 1000 × missionHrs × ~0.9999
const comp2 = [{ name:'2oo3', mtbf:8000, mttr:24, count:3, kReq:2, capacity:500 }];
const r2 = runMany(comp2, mission, 500, 42);
const expCap2 = 500 * 2; // min(up, k) × capacity; when ≥2 up, produces 2 × 500
console.log('\n=== TEST 2: 2-out-of-3 (k=2, n=3, cap=500/unit) ===');
console.log(`Observed production   = ${r2.avgProd.toFixed(0)}  (expected cap = ${expCap2}/h × ~1yr ≈ ${(expCap2*mission*0.9999).toFixed(0)})`);
console.log(`Observed availability = ${r2.avgAvail.toFixed(5)}  (near 1.0 for 2oo3 with these params)`);
// Check: production / mission_hrs should be ≤ k × capacity = 1000, NOT 1500
const effectiveRate = r2.avgProd / mission;
console.log(`Effective rate = ${effectiveRate.toFixed(1)} Nm³/h; MUST be ≤ ${expCap2} (k×cap)`);
if(effectiveRate > expCap2 * 1.01){
  console.log('FAIL: effective rate exceeds k×capacity — k-out-of-n cap not enforced!');
  process.exit(2);
} else {
  console.log('PASS: effective rate respects k×capacity bound');
}

// TEST 3: Series system with downstream bottleneck
// Block A: 1 unit × 2000 Nm³/h; Block B: 1 unit × 500 Nm³/h
// System capacity = min(2000, 500) = 500
const comp3 = [
  { name:'A', mtbf:10000, mttr:24, count:1, kReq:1, capacity:2000 },
  { name:'B', mtbf:10000, mttr:24, count:1, kReq:1, capacity:500 }
];
const r3 = runMany(comp3, mission, 500, 42);
const rate3 = r3.avgProd / mission;
console.log('\n=== TEST 3: Series bottleneck ===');
console.log(`Effective rate = ${rate3.toFixed(1)}; MUST be ≤ 500 (downstream cap)`);
if(rate3 > 500 * 1.01){
  console.log('FAIL: system produces more than bottleneck');
  process.exit(3);
}
console.log('PASS: series bottleneck respected');

console.log('\nAll RAM capacity tests passed.');
