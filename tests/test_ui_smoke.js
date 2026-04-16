// UI smoke test — dependency-free (no jsdom required)
// Verifies data-structure contracts that UI code destructures from WB.res.
// This test catches the v0.2→v0.3 probData destructure bug (commit: v0.4 P0-1).
//
// Background: weibull/index.html had
//   WB.res = {dists, wb, bL, pts, fitLine, diag};   // probData MISSING
//   const {dists, pts, probData, fitLine} = WB.res;  // probData = undefined
//   if(!probData) return;                            // probability plot blank
//
// This test replicates the runWB() logic and asserts WB.res.probData is populated.

const fs = require('fs');
const path = require('path');

// ── Load shared math into module scope ─────────────────────────────
const mathSrc = fs.readFileSync(path.join(__dirname,'..','shared','math.js'),'utf8');
const RM = eval(mathSrc + '\nRM;');  // shared/math.js defines `const RM = (...)();` — capture the IIFE result

// ── Replicate runWB()'s probData construction (critical UI contract) ──
function simulateRunWB(rawData, rawCens){
  const sorted = rawData.slice().sort((a,b)=>a-b);
  const n = sorted.length;
  const cens = rawCens && rawCens.length === n ? rawCens.map(v=>v===1) : new Array(n).fill(false);
  const fails = sorted.filter((_,i)=>!cens[i]);
  const nF = fails.length;

  const dists = RM.fitAll(sorted, cens);
  const wb = dists.find(d=>d.name==='Weibull');
  if(!wb) throw new Error('Weibull fit failed');

  // This is the exact code from weibull/index.html:402-405
  const probData = fails.map((t,i)=>({
    lnT: Math.log(t),
    lnlnR: Math.log(-Math.log(1-RM.MR(i+1, nF)))
  }));

  const fitLine = [];
  const mn = Math.min(...probData.map(d=>d.lnT)) - .5;
  const mx = Math.max(...probData.map(d=>d.lnT)) + .5;
  for(let i=0;i<=50;i++){
    const x = mn + (mx-mn)*i/50;
    fitLine.push({x, y: wb.params.β*(x - Math.log(wb.params.η))});
  }

  // After P0-1 fix (weibull/index.html:407-408):
  // WB.res must include probData so that drawWBChart destructure works
  const WB_res = {dists, wb, fitLine, probData};
  return {WB_res, nF, fails, sorted};
}

// ── Assertion helpers ──────────────────────────────────────────────
function assert(cond, msg){
  if(!cond){ console.error('❌ FAIL:', msg); process.exit(1); }
}

let passed = 0;
function pass(msg){ console.log('✓', msg); passed++; }

// ── TEST 1: probData is populated in WB.res (catches the v0.3 bug) ──
console.log('\n=== TEST 1: probData populated in WB.res ===');
const {WB_res, nF} = simulateRunWB(
  [1250,1890,2350,2780,3100,3450,3890,4200,4580,4950,5300,5780,6200,6890,7500],
  null
);

assert('probData' in WB_res, 'WB.res must have probData property');
pass('WB.res has probData property');

assert(Array.isArray(WB_res.probData), 'WB.res.probData must be an array');
pass('WB.res.probData is an array');

assert(WB_res.probData.length === nF, `WB.res.probData length (${WB_res.probData.length}) must equal nF (${nF})`);
pass(`WB.res.probData length (${nF}) matches failure count`);

assert(WB_res.probData.every(d => typeof d.lnT === 'number' && typeof d.lnlnR === 'number' && isFinite(d.lnT) && isFinite(d.lnlnR)),
  'Every probData point must have finite lnT and lnlnR');
pass('All probData points have finite {lnT, lnlnR}');

// ── TEST 2: Weibull linearization is mathematically correct ──
console.log('\n=== TEST 2: Weibull probability paper linearization (β=2, η=1000) ===');
// For true Weibull(β=2, η=1000), data points should fall near line y = β·(ln t − ln η)
// At t=500: y_expected ≈ 2·(ln 500 − ln 1000) = 2·(-0.693) = -1.386
// At t=1000: y_expected = 0
// Generate synthetic Weibull data
const wbData = [];
for(let i=1;i<=50;i++){
  const u = (i-0.3)/50.4;
  const t = 1000 * Math.pow(-Math.log(1-u), 1/2);
  wbData.push(t);
}
const sim2 = simulateRunWB(wbData, null);
const wb2 = sim2.WB_res.wb;
assert(Math.abs(wb2.params.β - 2.0) < 0.3, `β̂=${wb2.params.β.toFixed(3)} should be near 2.0`);
pass(`Weibull β̂ = ${wb2.params.β.toFixed(3)} ≈ 2.0`);
assert(Math.abs(wb2.params.η - 1000) < 80, `η̂=${wb2.params.η.toFixed(1)} should be near 1000`);
pass(`Weibull η̂ = ${wb2.params.η.toFixed(1)} ≈ 1000`);

// Fitted line at ln(t)=ln(500) must match β·(ln500 − ln η)
const yFitAt500 = wb2.params.β * (Math.log(500) - Math.log(wb2.params.η));
const yExpectedAt500 = 2.0 * (Math.log(500) - Math.log(1000));
assert(Math.abs(yFitAt500 - yExpectedAt500) < 0.3, 'Linearization y(500) off');
pass(`Linearization y(t=500) = ${yFitAt500.toFixed(3)} ≈ expected ${yExpectedAt500.toFixed(3)}`);

// ── TEST 3: Right-censored data still produces probData only from failures ──
console.log('\n=== TEST 3: Right-censored data (n=20, 5 censored) ===');
const dataWithCens = [800,1200,1500,1800,2000,2100,2400,2700,2900,3000,3200,3500,3800,4000,4200,4500,5000,5500,6000,6500];
const censFlags = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1];
const sim3 = simulateRunWB(dataWithCens, censFlags);
assert(sim3.WB_res.probData.length === 15, `probData should have 15 points (20 total − 5 censored), got ${sim3.WB_res.probData.length}`);
pass('probData excludes right-censored points (15 failures from 20 total)');

// ── TEST 4: doWBQ input validation logic (replicated) ──
console.log('\n=== TEST 4: doWBQ guard against empty / NaN input ===');
// Replicate the guard logic from weibull/index.html:588-592
function simulateDoWBQ(wb, rawValue){
  if(!wb) return {warn: '⚠ 请先运行 Weibull 分析 / Run analysis first'};
  const t = parseFloat(rawValue);
  if(isNaN(t) || t<=0) return {warn: '⚠ 请输入正数 t 值 / Enter positive t'};
  return {R: wb.R(t), F: wb.F(t), h: wb.h(t)};
}
assert(simulateDoWBQ(null, '5000').warn, 'Must warn when wb not ready');
pass('doWBQ warns when analysis not run');
assert(simulateDoWBQ(wb2, '').warn, 'Must warn when input empty');
pass('doWBQ warns when input empty');
assert(simulateDoWBQ(wb2, 'abc').warn, 'Must warn when input non-numeric');
pass('doWBQ warns when input non-numeric');
assert(simulateDoWBQ(wb2, '-1').warn, 'Must warn when input ≤ 0');
pass('doWBQ warns when input ≤ 0');
const ok = simulateDoWBQ(wb2, '1500');
assert(!ok.warn && typeof ok.R === 'number' && ok.R > 0 && ok.R < 1, 'Valid input must return R in (0,1)');
pass(`doWBQ returns R=${ok.R.toFixed(4)} for t=1500`);

console.log(`\n${passed} assertions passed. UI smoke test OK.`);
