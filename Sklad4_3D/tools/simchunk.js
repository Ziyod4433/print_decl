(()=>{ const C=window.__C, S=SIM.state(), F=FILM, P=C.P, T1=S.T+600; let n=0; const c0=S.cycle;
 try{ while(S.T<T1){ SIM.tick(0.08); n++; const T=S.T, fk=F.fk; fk.updateMatrixWorld(true);
   const yaw=fk.rotation.y, s=Math.sin(yaw), c=Math.cos(yaw), ox=fk.position.x, oz=fk.position.z;
   const rb=C.racksBox().filter(Boolean); let carried=null; rb.forEach(b=>{ const d=Math.hypot((b.x0+b.x1)/2-(ox+s*1.97),(b.z0+b.z1)/2-(oz+c*1.97)); if(d<0.3) carried=b; });
   const near=b=>Math.hypot((b.x0+b.x1)/2-(ox+s*1.97),(b.z0+b.z1)/2-(oz+c*1.97))<1.0; const others=rb.filter(b=>b!==carried&&!near(b));
   C.test(ox+s*(-0.275),oz+c*(-0.275),yaw,0.6,1.175,0.12,2.1,'погрузчик',T,0.01,others);
   if(carried){ const cx=(carried.x0+carried.x1)/2, cz=(carried.z0+carried.z1)/2; C.test(cx,cz,yaw,0.75,0.75,carried.y0+0.03,carried.y1,'стойка на вилах',T,0.01,others); }
   else { const lift=fk.userData.rig?fk.userData.rig.lift||0:0; C.test(ox+s*1.5,oz+c*1.5,yaw,0.36,0.6,Math.max(0.02,lift-0.02),lift+0.1,'вилы',T,0.03,others); }
   C.humans.forEach(([nm,H])=>{ if(!H||!H.root.visible) return; H.root.getWorldPosition(P); if(P.y>0.5) return;
     const bx=P.x-ox, bz=P.z-oz, dl=Math.abs(bx*c-bz*s), df=bx*s+bz*c; const front=carried?2.72:0.9; const out=Math.max(dl-(carried&&df>1.2?0.75:0.6), df-front, -1.45-df);
     if(out<0.25){ const h=C.hum[nm]||(C.hum[nm]={d:9,T:0,n:0}); h.n++; if(out<h.d){ h.d=+out.toFixed(2); h.T=+T.toFixed(1); } } });
   if(S.cycle!==c0) break; } }catch(e){ return {err:e.message+' '+(e.stack||'').split('\n').slice(0,3).join(' | '),T:S.T}; }
 return {T:Math.round(S.T),cycle:S.cycle,stat:SIM.stat.slice(0,150),eo:S.eo.map(s=>s.tiers.length),nhits:Object.keys(C.hits).length}; })()
