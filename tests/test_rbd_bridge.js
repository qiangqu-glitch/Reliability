// RBD regression — classic bridge circuit
// Topology:  START──A──┬──C──END
//                      X (shared)
//             START──B──┴──D──END
// Paths from START to END: A-X-C, A-X-D, B-X-C, B-X-D wait... actual bridge:
// Classic bridge: A,B in parallel to X, then X to C,D in parallel.
// But the well-known BRIDGE has a diagonal. Let me encode the canonical bridge:
//
//        A        C
//   S ──────► 1 ──────► E
//   │         │         │
//   │         X (bridge)│
//   │         │         │
//   S ──────► 2 ──────► E
//        B        D
//
// Nodes: S, 1, 2, E. Diagonal X connects 1↔2.
// Edges:  S→1 (A), S→2 (B), 1→E (C), 2→E (D), 1→2 (X) and/or 2→1 (X).
// In this simplified directed version with bridge node, we embed X as an intermediate node:
// S → A → (N1) → C → E
// S → B → (N2) → D → E
// N1 → X → N2  (or bidirectional via edge X)
//
// For the reliability comparison, use 5 basic events with R = 0.9 each.
// Exact bridge formula: R = 2p^2 + 2p^3 - 5p^4 + 2p^5  (undirected bridge)
// where p = 0.9: R = 2(.81) + 2(.729) - 5(.6561) + 2(.59049)
//          = 1.62 + 1.458 - 3.2805 + 1.18098
//          = 0.97848

// --- Replicate the RBD algorithm ---
function findPaths(adj, start, end){
  const paths = [];
  function dfs(cur, path, vis){
    if(cur===end){ paths.push([...path]); return; }
    for(const nx of adj[cur]||[]){
      if(vis.has(nx)) continue;
      vis.add(nx); path.push(nx);
      dfs(nx, path, vis);
      path.pop(); vis.delete(nx);
    }
  }
  dfs(start, [start], new Set([start]));
  return paths;
}

function minimalPathSets(paths, skipSet){
  const sets = paths.map(p=>p.filter(n=>!skipSet.has(n)));
  const uniq=[], seen=new Set();
  for(const s of sets){
    const k=[...s].sort().join('|');
    if(!seen.has(k)){ seen.add(k); uniq.push(s); }
  }
  return uniq.filter(P=>!uniq.some(Q=>Q!==P && Q.length<P.length && Q.every(x=>P.includes(x))));
}

function solveExact(mps, Rmap){
  const N = mps.length;
  if(N===0) return 0;
  let total = 0;
  for(let mask=1; mask<(1<<N); mask++){
    const union = new Set();
    let bits = 0;
    for(let i=0;i<N;i++){
      if(mask&(1<<i)){ mps[i].forEach(n=>union.add(n)); bits++; }
    }
    let p = 1;
    union.forEach(n=>p*=(Rmap[n]||0));
    total += (bits%2===1?1:-1)*p;
  }
  return total;
}

function solveApprox(mps, Rmap){
  const pathProbs = mps.map(p=>p.reduce((a,n)=>a*(Rmap[n]||0),1));
  return 1 - pathProbs.reduce((a,p)=>a*(1-p),1);
}

// ----- TEST 1: Bridge circuit -----
// Graph: S → A → 1 → C → E
//        S → B → 2 → D → E
//        1 ⇄ X ⇄ 2   (two-way bridge encoded as two edges)
// Basic events: A, B, C, D, X  (nodes N1, N2 are pass-through)
// Model with components only (using "A,B,C,D,X" as intermediate nodes):
const adj = {
  S:   ['A','B'],
  A:   ['1'],
  B:   ['2'],
  '1': ['C','X1'],       // X1 = bridge going 1→2
  '2': ['D','X2'],       // X2 = bridge going 2→1
  X1:  ['2'],
  X2:  ['1'],
  C:   ['E'],
  D:   ['E'],
  E:   []
};
// X1 and X2 represent the SAME physical component X, so they share Rx.
// But the exact algorithm treats them as independent nodes — which is wrong
// unless we give each a unique identity. In real RBD we would typically have
// a single "bridge" node X that both paths traverse; encode X as ONE node:
const adj2 = {
  S:   ['A','B'],
  A:   ['N1'],
  B:   ['N2'],
  N1:  ['C','X'],
  N2:  ['D','X'],    // X is shared target
  X:   ['N1','N2'],  // bridge goes both ways
  C:   ['E'],
  D:   ['E'],
  E:   []
};
const skipSet = new Set(['S','E','N1','N2']); // S,E,N1,N2 are not components
const R = 0.9;
const Rmap = {A:R, B:R, C:R, D:R, X:R};

const paths = findPaths(adj2, 'S', 'E');
const mps = minimalPathSets(paths, skipSet);
console.log('Minimal path sets (should be {ABD, BCD impossible wait})');
mps.forEach((p,i)=>console.log('  MPS'+(i+1)+':', p.sort().join(',')));

// The expected min path sets for the bridge:
// {A,C}, {B,D}, {A,X,D}, {B,X,C}
const Rexact = solveExact(mps, Rmap);
const Rapprox = solveApprox(mps, Rmap);

// Analytical reference for 5-component bridge with equal R=p:
const p = R;
const Rref = 2*p*p + 2*p*p*p - 5*p*p*p*p + 2*p*p*p*p*p;

console.log('\n=== BRIDGE CIRCUIT TEST (p=0.9) ===');
console.log('Analytical R_ref  =', Rref.toFixed(6));
console.log('Algorithm exact   =', Rexact.toFixed(6));
console.log('Algorithm approx  =', Rapprox.toFixed(6));
console.log('Exact  error vs ref:', ((Rexact-Rref)*100).toFixed(4), '%');
console.log('Approx error vs ref:', ((Rapprox-Rref)*100).toFixed(4), '%');

// ----- TEST 2: Pure series -----
// S→A→B→C→E; expected R = 0.9^3 = 0.729
const adjS = {S:['A'], A:['B'], B:['C'], C:['E'], E:[]};
const pathsS = findPaths(adjS,'S','E');
const mpsS = minimalPathSets(pathsS, new Set(['S','E']));
const Rs = solveExact(mpsS, {A:.9,B:.9,C:.9});
console.log('\n=== SERIES TEST (3 components R=0.9) ===');
console.log('Expected R = 0.9^3 =', (0.9**3).toFixed(6));
console.log('Algorithm  =', Rs.toFixed(6));

// ----- TEST 3: Pure parallel -----
// S→A→E; S→B→E; S→C→E; expected R = 1-(1-0.9)^3 = 0.999
const adjP = {S:['A','B','C'], A:['E'], B:['E'], C:['E'], E:[]};
const pathsP = findPaths(adjP,'S','E');
const mpsP = minimalPathSets(pathsP, new Set(['S','E']));
const Rp = solveExact(mpsP, {A:.9,B:.9,C:.9});
console.log('\n=== PARALLEL TEST (3 components R=0.9) ===');
console.log('Expected R = 1-0.1^3 =', (1-0.1**3).toFixed(6));
console.log('Algorithm  =', Rp.toFixed(6));
