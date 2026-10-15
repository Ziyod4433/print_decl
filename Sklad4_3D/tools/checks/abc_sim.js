// Симуляция варианта хранения (сборка python3 build.py --abc): счёт без кадров, контроль зазоров между машинами.
// node tools/evasync.js Sklad4_variants_ABC.html tools/checks/abc_sim.js   (вариант и часы — строкой перед скриптом: window.__V='B'; window.__HRS=2;)
// Норма (15.10): tph ≥ 45 при приходе и отборе по 30/ч; ghost (вынужденный разъезд впритирку) — единицы–десятки за 2 ч; stall/«нет пути» — без
// повторов у одной машины; minD < 0 бывает только в моменты ghost.
(async()=>{ const out={}, v=window.__V||'A', H=window.__HRS||1; ABC.setVariant(v);
  const t0=performance.now(); ABC.SIMX.start(v,{seed:1}); out.startMs=Math.round(performance.now()-t0); out.navMs=ABC.NAV.ms;
  const W=ABC.SIMX.W; out.agents=W.agents.map(a=>a.k+':'+a.roles.join('/')); out.slots=W.slots.length; out.lanes=W.lanes.length; out.cranes=W.cranes.length;
  let minD=1e9, minAt=null, steps=0; const tl=performance.now(), CA=[], CB=[];
  const circ=(a,o)=>{ const K=a.K,sx=Math.sin(a.h),sz=Math.cos(a.h); o.length=0; for(const [d,r] of K.circ) o.push(a.x+sx*d,a.z+sz*d,r); return o; };
  while(W.t<H*3600&&performance.now()-tl<900000){ ABC.SIMX.S.speed=1; ABC.SIMX.tick(0.1); steps++;
    if(steps%5===0) for(let i=0;i<W.agents.length;i++) for(let j=i+1;j<W.agents.length;j++){ const a=W.agents[i], b=W.agents[j]; circ(a,CA); circ(b,CB);
      for(let p=0;p<CA.length;p+=3) for(let q=0;q<CB.length;q+=3){ const d=Math.hypot(CA[p]-CB[q],CA[p+1]-CB[q+1])-CA[p+2]-CB[q+2]; if(d<minD){ minD=d; minAt=[Math.round(W.t),a.nm,b.nm]; } } } }
  const r=ABC.SIMX.summary(); out.wall=Math.round((performance.now()-tl)/1000); out.minD=+minD.toFixed(2); out.minAt=minAt;
  out.sum={T:Math.round(r.T),put:r.put,ret:r.ret,unl:r.unl,load:r.load,wrap:r.wrap,shx:r.shx,reloc:r.reloc,rej:r.rej,tph:+r.tph.toFixed(1),
    cyc:Object.fromEntries(Object.entries(r.cyc).map(([k,x])=>[k,Math.round(x)])),d2s:Math.round(r.d2s),lead:Math.round(r.lead),trIn:r.trIn,trOut:r.trOut,
    bufIn:r.bufIn.map(x=>+(+x).toFixed(1)),bufOut:r.bufOut.map(x=>+(+x).toFixed(1)),backlog:r.backlog.map(x=>+(+x).toFixed(1)),stall:r.stall,ghost:r.ghost,blockS:Math.round(r.blockS),
    ag:r.ag.map(a=>a.n+' '+Math.round(a.u*100)+'%'),cr:r.cr.map(a=>Math.round(a.u*100)),sh:r.sh.length?Math.round(r.sh.reduce((s,a)=>s+a.u,0)/r.sh.length*100):null,log:r.log,used:r.used,cap:r.cap};
  out.gh=(W.gh||[]).map(g=>g.join(' '));
  return out; })()
