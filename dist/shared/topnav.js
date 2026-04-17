/*! ReliToolbox | reliability.chemcalc.cn | Copyright (c) All rights reserved. Unauthorized reproduction, decompilation, reverse engineering or redistribution is prohibited. Contact: CHEMCALC@outlook.com */
(function(global){const GROUPS=[{id:'data',zh:'数据分析',en:'Data Analysis',paths:['/weibull/','/amsaa/']},{id:'system',zh:'系统建模',en:'System Modeling',paths:['/rbd/','/rbd_mcs/','/fta/','/ram/','/alloc/']},{id:'risk',zh:'风险 · 安全',en:'Risk & Safety',paths:['/fmea/','/sil/','/rbi/']},{id:'maint',zh:'维修 · 成本',en:'Maint & Cost',paths:['/pm/','/spa/','/lcc/','/equipment/','/predict/']},];function currentGroup(){const p=location.pathname;for(const g of GROUPS){if(g.paths.some(x=>p.includes(x)))return g.id;}return null;}function toBase(n){const depth=location.pathname.replace(/\/[^/]*$/,'').split('/').filter(Boolean).length;return depth>0?'../':'./';}function render(){const lang=(localStorage.getItem('rtLang')||'zh');const base=toBase();const cur=currentGroup();const firstPath=g=>(g.paths[0].replace(/^\//,''));const tabs=GROUPS.map(g=>`<a class="rt-tab${cur===g.id?' on':''}" href="${base}${firstPath(g)}index.html">${lang==='zh'?g.zh:g.en}</a>`).join('');const nav=document.createElement('div');nav.className='rt-topnav';nav.innerHTML=`<div class="rt-topnav-in">
        <a class="rt-brand" href="${base}index.html">🛠 ReliToolbox</a>
        <div class="rt-tabs">${tabs}</div>
      </div>`;document.body.insertBefore(nav,document.body.firstChild);}function injectStyle(){if(document.getElementById('rt-topnav-css'))return;const s=document.createElement('style');s.id='rt-topnav-css';s.textContent=`
   .rt-topnav{background:#0f172a;border-bottom:1px solid #1e293b;position:sticky;top:0;z-index:900}
   .rt-topnav-in{max-width:980px;margin:0 auto;padding:6px 14px;display:flex;align-items:center;gap:18px;flex-wrap:wrap}
   .rt-brand{color:#fff;font-weight:800;font-size:13px;text-decoration:none;letter-spacing:-.3px}
   .rt-brand:hover,.rt-brand:visited{color:#fff;text-decoration:none}
   .rt-tabs{display:flex;gap:4px;flex-wrap:wrap}
   .rt-tab{color:rgba(255,255,255,.72);font-size:12px;font-weight:600;padding:5px 12px;border-radius:14px;
      text-decoration:none;border:1px solid transparent;transition:all .15s}
   .rt-tab:hover{color:#fff;background:rgba(255,255,255,.06)}
   .rt-tab:visited{color:rgba(255,255,255,.72)}
   .rt-tab.on{background:#0d9488;color:#fff;border-color:#0d9488}
   .rt-tab.on:visited{color:#fff}
   @media print{.rt-topnav{display:none!important}}
   `;document.head.appendChild(s);}function init(){injectStyle();render();}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();global.ReliTopNav={render};})(typeof window!=='undefined'?window:globalThis);