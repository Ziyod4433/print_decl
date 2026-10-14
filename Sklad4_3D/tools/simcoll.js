(()=>{ SIM.enter(); const S=SIM.state(), F=FILM; scene.updateMatrixWorld(true);
 /* статические препятствия: видимые сетки сцены, кроме объектов фильма/симуляции, машин и пола */
 const skip=new Set(); [F.grp,S.grp,F.cnT,F.kzT,G.people].forEach(r=>r&&r.traverse(o=>skip.add(o)));
 const vis=o=>{ for(let p=o;p;p=p.parent) if(!p.visible) return false; return true; };
 const nameOf=o=>{ for(let p=o;p;p=p.parent){ const u=p.userData||{}; if(u.info&&(u.info.t||u.info.n)) return (u.info.t||u.info.n).slice(0,40); if(u.nm) return u.nm.slice(0,40); if(u.role) return 'чел:'+u.role; } return (o.material&&o.material.name)||o.type; };
 const obs=[], bb=new THREE.Box3();
 scene.traverse(o=>{ if(!o.isMesh||skip.has(o)||!vis(o)) return; if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
   bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
   if(bb.max.y<0.07||bb.min.y>2.4) return; if(bb.max.x-bb.min.x>30&&bb.max.z-bb.min.z>30) return; if(bb.max.y-bb.min.y<0.02&&bb.min.y<0.1) return;
   if(o.material&&!Array.isArray(o.material)&&(o.material.transparent&&o.material.opacity<0.35)) return;
   obs.push({x0:bb.min.x,x1:bb.max.x,z0:bb.min.z,z1:bb.max.z,y0:bb.min.y,y1:bb.max.y,n:nameOf(o)}); });
 /* аппараты DWS фильма/процесса (в F.grp, поэтому выше пропущены) — тоже препятствия */
 [F.dws,F.gs].forEach(g=>g&&g.traverse(o=>{ if(!o.isMesh||!vis(o)) return; if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
   if(bb.max.y<0.07||bb.min.y>2.4) return; if(o.material&&!Array.isArray(o.material)&&(o.material.transparent&&o.material.opacity<0.35)) return;
   obs.push({x0:bb.min.x,x1:bb.max.x,z0:bb.min.z,z1:bb.max.z,y0:bb.min.y,y1:bb.max.y,n:'DWS:'+nameOf(o)}); }));
 const G2=new Map(), key=(i,j)=>i*1000+j;
 obs.forEach((b,k)=>{ for(let i=Math.floor(b.x0/2);i<=Math.floor(b.x1/2);i++) for(let j=Math.floor(b.z0/2);j<=Math.floor(b.z1/2);j++){ const kk=key(i+50,j+50); if(!G2.has(kk)) G2.set(kk,[]); G2.get(kk).push(k); } });
 const hits={};
 function test(cx,cz,yaw,hx,hz,y0,y1,what,T,pad,extra){ const s=Math.sin(yaw), c=Math.cos(yaw);
   const ex=Math.abs(c)*hx+Math.abs(s)*hz, ez=Math.abs(s)*hx+Math.abs(c)*hz, seen=new Set();
   const chk=b=>{ if(b.y1<y0||b.y0>y1) return; if(b.x1<cx-ex||b.x0>cx+ex||b.z1<cz-ez||b.z0>cz+ez) return;
       const bx=(b.x0+b.x1)/2-cx, bz=(b.z0+b.z1)/2-cz, bhx=(b.x1-b.x0)/2, bhz=(b.z1-b.z0)/2;
       const dl=Math.abs(bx*c-bz*s)-(Math.abs(c)*bhx+Math.abs(s)*bhz)-hx, df=Math.abs(bx*s+bz*c)-(Math.abs(s)*bhx+Math.abs(c)*bhz)-hz;
       const pen=-Math.max(dl,df,(Math.abs(bx)-bhx-ex),(Math.abs(bz)-bhz-ez));
       if(pen>(pad||0.01)){ const id=what+' × '+b.n+' @'+((b.x0+b.x1)/2).toFixed(1)+','+((b.z0+b.z1)/2).toFixed(1); const h=hits[id]||(hits[id]={pen:0,T0:T,T1:T,at:null}); h.T1=T; if(pen>h.pen){ h.pen=pen; h.at=[+cx.toFixed(2),+cz.toFixed(2),+T.toFixed(1)]; } } };
   for(let i=Math.floor((cx-ex)/2);i<=Math.floor((cx+ex)/2);i++) for(let j=Math.floor((cz-ez)/2);j<=Math.floor((cz+ez)/2);j++){ const L=G2.get(key(i+50,j+50)); if(!L) continue; for(const k of L){ if(seen.has(k)) continue; seen.add(k); chk(obs[k]); } }
   if(extra) extra.forEach(chk); }
 /* стойки симуляции в покое — тоже препятствия для погрузчика (кроме той, что на вилах, и той, в которую он въезжает) */
 const P=new THREE.Vector3(), T1=+(window.__SIMT||1500), hum={}; let n=0; const racksBox=()=>S.racks.map(r=>{ if(r.mode==='x') return null; r.o.getWorldPosition(P); return {x0:P.x-0.75,x1:P.x+0.75,z0:P.z-0.75,z1:P.z+0.75,y0:P.y+0.02,y1:P.y+1.6,n:'стойка#'+r.id,r}; });
 const humans=[['CT',F.CT],['PK',S.hum.PW.H],['K1',F.KH.K1],['K2',F.KH.K2],['K3',F.KH.K3],['K4',F.KH.K4],['W3',F.W3],['W5',F.W5]];
 /* люди против неподвижных препятствий (стены, колонны, ограждения, оборудование, аппараты DWS) и стоек процесса:
    ближе 0,12 м к коробке препятствия на высоте 0,25…1,5 м над ступнями (как в tools/checks/coll.js для фильма) */
 const hp={}; function hstat(T,rb){ humans.forEach(([nm,H])=>{ if(!H||!H.root.visible) return; H.root.getWorldPosition(P); const y=P.y, px=P.x, pz=P.z; if(y>0.5) return;
     const near=b=>{ if(b.y1<y+0.25||b.y0>y+1.5) return; const dx=Math.max(b.x0-px,0,px-b.x1), dz=Math.max(b.z0-pz,0,pz-b.z1);
       if(Math.hypot(dx,dz)<0.12){ const id=nm+' × '+b.n; const h=hp[id]||(hp[id]={n:0,T0:+T.toFixed(1),at:[+px.toFixed(2),+pz.toFixed(2)]}); h.n++; h.T1=+T.toFixed(1); } };
     const seen=new Set(); for(let i=Math.floor((px-0.12)/2);i<=Math.floor((px+0.12)/2);i++) for(let j=Math.floor((pz-0.12)/2);j<=Math.floor((pz+0.12)/2);j++){ const L=G2.get(key(i+50,j+50)); if(L) for(const k of L){ if(!seen.has(k)){ seen.add(k); near(obs[k]); } } }
     rb.forEach(near); }); }
 while(S.T<T1){ SIM.tick(0.08); n++; const T=S.T, fk=F.fk; fk.updateMatrixWorld(true);
   const yaw=fk.rotation.y, s=Math.sin(yaw), c=Math.cos(yaw), ox=fk.position.x, oz=fk.position.z;
   const rb=racksBox().filter(Boolean); let carried=null; rb.forEach(b=>{ const d=Math.hypot((b.x0+b.x1)/2-(ox+s*1.97),(b.z0+b.z1)/2-(oz+c*1.97)); if(d<0.3) carried=b; });
   const near=b=>Math.hypot((b.x0+b.x1)/2-(ox+s*1.97),(b.z0+b.z1)/2-(oz+c*1.97))<1.0;
   const others=rb.filter(b=>b!==carried&&!near(b));
   test(ox+s*(-0.275),oz+c*(-0.275),yaw,0.6,1.175,0.12,2.1,'погрузчик',T,0.01,others);
   if(carried){ const cx=(carried.x0+carried.x1)/2, cz=(carried.z0+carried.z1)/2; test(cx,cz,yaw,0.75,0.75,carried.y0+0.03,carried.y1,'стойка на вилах',T,0.01,others); }
   else { const lift=fk.userData.rig?fk.userData.rig.lift||0:0; test(ox+s*1.5,oz+c*1.5,yaw,0.36,0.6,Math.max(0.02,lift-0.02),lift+0.1,'вилы',T,0.03,others); }
   humans.forEach(([nm,H])=>{ if(!H||!H.root.visible) return; H.root.getWorldPosition(P); if(P.y>0.5) return;
     const bx=P.x-ox, bz=P.z-oz, dl=Math.abs(bx*c-bz*s), df=bx*s+bz*c; const front=carried?2.72:0.9; const out=Math.max(dl-(carried&&df>1.2?0.75:0.6), df-front, -1.45-df);
     if(out<0.25){ const h=hum[nm]||(hum[nm]={d:9,T:0,n:0}); h.n++; if(out<h.d){ h.d=+out.toFixed(2); h.T=+T.toFixed(1); } } });
   if(n%3===0) hstat(T,rb); }
 const out=Object.entries(hits).map(([k,h])=>[k,+h.pen.toFixed(2),+h.T0.toFixed(1),+h.T1.toFixed(1),h.at]).sort((a,b)=>b[1]-a[1]);
 return {nobs:obs.length,steps:n,hits:out.slice(0,40),hum,hp:Object.entries(hp).slice(0,40),stat:SIM.stat}; })()
