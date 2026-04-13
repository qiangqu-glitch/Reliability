// ReliToolbox v0.1 (c) reliability.chemcalc.cn


const wbF = (t,b,e) => 1 - Math.exp(-Math.pow(t/e, b));
const wbR = (t,b,e) => Math.exp(-Math.pow(t/e, b));
const wbf = (t,b,e) => (b/e)*Math.pow(t/e, b-1)*Math.exp(-Math.pow(t/e, b));

function logLik(data, beta, eta){
  let ll = 0;
  for(const d of data){
    if(d.type==='exact')    ll += Math.log(Math.max(1e-300, wbf(d.t,beta,eta)));
    else if(d.type==='right') ll += Math.log(Math.max(1e-300, wbR(d.t,beta,eta)));
    else if(d.type==='left')  ll += Math.log(Math.max(1e-300, wbF(d.t,beta,eta)));
    else if(d.type==='interval'){
      const p = wbF(d.tR,beta,eta) - wbF(d.tL,beta,eta);
      ll += Math.log(Math.max(1e-300, p));
    }
  }
  return ll;
}

function fdGrad(f, beta, eta, h=1e-5){
  const f0 = f(beta, eta);
  const dB = (f(beta+h*beta, eta) - f0)/(h*beta);
  const dE = (f(beta, eta+h*eta) - f0)/(h*eta);
  return [dB, dE];
}
function fdHess(f, beta, eta, h=1e-4){
  const hb=h*beta, he=h*eta;
  const f00 = f(beta,eta);
  const fpp = f(beta+hb,eta+he), fpm = f(beta+hb,eta-he);
  const fmp = f(beta-hb,eta+he), fmm = f(beta-hb,eta-he);
  const fp0 = f(beta+hb,eta), fm0 = f(beta-hb,eta);
  const f0p = f(beta,eta+he), f0m = f(beta,eta-he);
  const Hbb = (fp0 - 2*f00 + fm0)/(hb*hb);
  const Hee = (f0p - 2*f00 + f0m)/(he*he);
  const Hbe = (fpp - fpm - fmp + fmm)/(4*hb*he);
  return [[Hbb,Hbe],[Hbe,Hee]];
}

function nelderMead(f, x0, opts={}){
  const {maxIter=500, tol=1e-8} = opts;
  const n = x0.length;
  
  let simplex = [x0.slice()];
  for(let i=0;i<n;i++){
    const x = x0.slice();
    x[i] = x[i]*1.05 + 1e-4;
    simplex.push(x);
  }
  let fvals = simplex.map(x=>-f(x[0],x[1])); 
  for(let iter=0;iter<maxIter;iter++){
    
    const order = fvals.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]);
    simplex = order.map(o=>simplex[o[1]]);
    fvals   = order.map(o=>o[0]);
    if(Math.abs(fvals[n]-fvals[0])<tol) break;
    
    const c = new Array(n).fill(0);
    for(let i=0;i<n;i++) for(let j=0;j<n;j++) c[j]+=simplex[i][j]/n;
    
    const xr = c.map((cj,j)=>cj + (cj-simplex[n][j]));
    if(xr[0]<=0||xr[1]<=0){simplex[n]=simplex[0].map((v,j)=>(v+simplex[n][j])/2); fvals[n]=-f(simplex[n][0],simplex[n][1]); continue;}
    const fr = -f(xr[0],xr[1]);
    if(fr<fvals[0]){
      const xe = c.map((cj,j)=>cj + 2*(cj-simplex[n][j]));
      const fe = (xe[0]>0&&xe[1]>0)?-f(xe[0],xe[1]):Infinity;
      if(fe<fr){simplex[n]=xe;fvals[n]=fe;}else{simplex[n]=xr;fvals[n]=fr;}
    } else if(fr<fvals[n-1]){simplex[n]=xr;fvals[n]=fr;}
    else {
      const xc = c.map((cj,j)=>cj + 0.5*(simplex[n][j]-cj));
      const fc = -f(xc[0],xc[1]);
      if(fc<fvals[n]){simplex[n]=xc;fvals[n]=fc;}
      else {for(let i=1;i<=n;i++){simplex[i]=simplex[0].map((v,j)=>(v+simplex[i][j])/2);fvals[i]=-f(simplex[i][0],simplex[i][1]);}}
    }
  }
  return {x:simplex[0], f:-fvals[0]};
}

function inv2(M){
  const det = M[0][0]*M[1][1]-M[0][1]*M[1][0];
  if(Math.abs(det)<1e-30) return null;
  return [[M[1][1]/det,-M[0][1]/det],[-M[1][0]/det,M[0][0]/det]];
}

function fitWeibullCensored(data, alpha=0.05){
  
  const exacts = data.filter(d=>d.type==='exact').map(d=>d.t);
  const allT = data.map(d=>d.t||((d.tL+d.tR)/2));
  const meanT = allT.reduce((a,b)=>a+b,0)/allT.length;
  const x0 = [1.5, meanT];
  const f = (b,e)=>logLik(data,b,e);
  const opt = nelderMead(f, x0);
  const [beta, eta] = opt.x;
  const ll = opt.f;

  const H = fdHess(f, beta, eta);
  
  const negH = [[-H[0][0],-H[0][1]],[-H[1][0],-H[1][1]]];
  const cov = inv2(negH);
  const z = 1.959963984540054; 
  let ciB=[null,null], ciE=[null,null];
  if(cov && cov[0][0]>0 && cov[1][1]>0){
    const sB = Math.sqrt(cov[0][0]);
    const sE = Math.sqrt(cov[1][1]);
    
    ciB = [beta*Math.exp(-z*sB/beta), beta*Math.exp(z*sB/beta)];
    ciE = [eta*Math.exp(-z*sE/eta),  eta*Math.exp(z*sE/eta)];
  }
  return {
    beta, eta, ll,
    ci_beta: ciB, ci_eta: ciE,
    R: (t)=>Math.exp(-Math.pow(t/eta,beta)),
    F: (t)=>1-Math.exp(-Math.pow(t/eta,beta)),
    cov,
  };
}

if(typeof module!=='undefined') module.exports = {fitWeibullCensored, logLik, wbR, wbF};
if(typeof window!=='undefined') window.WeibullCensored = {fitWeibullCensored, logLik};
