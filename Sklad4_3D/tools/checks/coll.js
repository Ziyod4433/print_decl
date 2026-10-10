(()=>{ FILM.enter({size:[640,360],paused:true}); const F=FILM, MK=F.MK;
 F._apply(F.tfOf(MK.set1)); scene.updateMatrixWorld(true);   // автопоезд стоит на посту, шторы открыты
 /* --- статические препятствия: видимые сетки сцены, кроме актёров фильма, пола и того, что выше 2,3 м --- */
 const skip=new Set(); F.grp.traverse(o=>skip.add(o)); [F.cnT,F.PW&&F.PW.root,F.SUP&&F.SUP.root,F.WP&&F.WP.root].forEach(r=>r&&r.traverse(o=>skip.add(o)));
 const movers=new Set(); [F.kzT].forEach(r=>r.traverse(o=>movers.add(o)));
 const vis=o=>{ for(let p=o;p;p=p.parent) if(!p.visible) return false; return true; };
 const nameOf=o=>{ for(let p=o;p;p=p.parent){ const u=p.userData||{}; if(u.info&&(u.info.t||u.info.n)) return (u.info.t||u.info.n).slice(0,40); if(u.nm) return u.nm.slice(0,40); if(u.role) return 'чел:'+u.role; } return (o.material&&o.material.name)||o.type; };
 const obs=[], bb=new THREE.Box3();
 scene.traverse(o=>{ if(!o.isMesh||skip.has(o)||!vis(o)) return; if(!o.geometry.boundingBox) o.geometry.computeBoundingBox();
   bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
   if(bb.max.y<0.07||bb.min.y>2.4) return; if(bb.max.x-bb.min.x>30&&bb.max.z-bb.min.z>30) return;         // пол, площадки
   if(bb.max.y-bb.min.y<0.02&&bb.min.y<0.1) return;
   if(o.material&&!Array.isArray(o.material)&&(o.material.transparent&&o.material.opacity<0.35)) return;   // тени-подложки, световые пятна
   obs.push({x0:bb.min.x,x1:bb.max.x,z0:bb.min.z,z1:bb.max.z,y0:bb.min.y,y1:bb.max.y,n:nameOf(o),mv:movers.has(o)}); });
 const G2=new Map(), key=(i,j)=>i*1000+j;
 obs.forEach((b,k)=>{ for(let i=Math.floor(b.x0/2);i<=Math.floor(b.x1/2);i++) for(let j=Math.floor(b.z0/2);j<=Math.floor(b.z1/2);j++){ const kk=key(i+50,j+50); if(!G2.has(kk)) G2.set(kk,[]); G2.get(kk).push(k); } });
 /* --- ориентированная коробка против выровненных --- */
 const hits={};
 function test(cx,cz,yaw,hx,hz,y0,y1,what,T,pad){ const s=Math.sin(yaw), c=Math.cos(yaw);       // оси коробки: вперёд (s,c), вбок (c,-s)
   const ex=Math.abs(c)*hx+Math.abs(s)*hz, ez=Math.abs(s)*hx+Math.abs(c)*hz, seen=new Set();
   for(let i=Math.floor((cx-ex)/2);i<=Math.floor((cx+ex)/2);i++) for(let j=Math.floor((cz-ez)/2);j<=Math.floor((cz+ez)/2);j++){ const L=G2.get(key(i+50,j+50)); if(!L) continue;
     for(const k of L){ if(seen.has(k)) continue; seen.add(k); const b=obs[k]; if(b.mv&&(T>MK.go-0.5||T<MK.cop1)) continue; if(b.y1<y0||b.y0>y1) continue;
       if(b.x1<cx-ex||b.x0>cx+ex||b.z1<cz-ez||b.z0>cz+ez) continue;
       const bx=(b.x0+b.x1)/2-cx, bz=(b.z0+b.z1)/2-cz, bhx=(b.x1-b.x0)/2, bhz=(b.z1-b.z0)/2;
       const dl=Math.abs(bx*c-bz*s)-(Math.abs(c)*bhx+Math.abs(s)*bhz)-hx, df=Math.abs(bx*s+bz*c)-(Math.abs(s)*bhx+Math.abs(c)*bhz)-hz;   // по боковой и продольной осям коробки
       const pen=-Math.max(dl,df,(Math.abs(bx)-bhx-ex),(Math.abs(bz)-bhz-ez));
       if(what!=='погрузчик'&&/Стоечный поддон/.test(b.n)&&Math.hypot((b.x0+b.x1)/2-cx,(b.z0+b.z1)/2-cz)<(what==="вилы"?1.7:0.9)) continue;
       if(pen>(pad||0.01)){ const id=what+' × '+b.n+' @'+((b.x0+b.x1)/2).toFixed(1)+','+((b.z0+b.z1)/2).toFixed(1); const h=hits[id]||(hits[id]={pen:0,T0:T,T1:T,at:null}); h.T1=T; if(pen>h.pen){ h.pen=pen; h.at=[+cx.toFixed(2),+cz.toFixed(2),+((b.x0+b.x1)/2).toFixed(2),+((b.z0+b.z1)/2).toFixed(2),+T.toFixed(1)]; } } } } }
 const P=new THREE.Vector3(), Q=new THREE.Quaternion(), E=new THREE.Euler(0,0,0,'YXZ');
 const racks=[F.RK,F.R14[0],F.R14[1]], rr=[F.RKr,F.R14r[0],F.R14r[1]];
 const humans=[['CT',F.CT],['PK',F.PW],['K1',F.KH.K1],['K2',F.KH.K2],['K3',F.KH.K3],['K4',F.KH.K4],['W3',F.W3],['W4',F.W4],['W5',F.W5],['SUP',F.SUP]].filter(h=>h[1]);
 const T1=MK.go-0.2, hum={};
 for(let T=MK.fk0-2;T<T1;T+=0.08){ F._apply(F.tfOf(T)); const fk=F.fk; fk.updateMatrixWorld(true);
   const yaw=fk.rotation.y, s=Math.sin(yaw), c=Math.cos(yaw), ox=fk.position.x, oz=fk.position.z;
   test(ox+s*(-0.275),oz+c*(-0.275),yaw,0.6,1.175,0.12,2.1,'погрузчик',T);                       // корпус: от −1,45 до +0,9
   let carried=null; racks.forEach((o,i)=>{ o.getWorldPosition(P); const d=Math.hypot(P.x-(ox+s*1.97),P.z-(oz+c*1.97)); if(d<0.25) carried=o; });
   if(carried){ carried.getWorldPosition(P); test(P.x,P.z,yaw,0.75,0.75,P.y+0.03,P.y+1.7,'стойка на вилах',T); }
   else { const lift=fk.userData.rig?fk.userData.rig.lift||0:0; test(ox+s*1.5,oz+c*1.5,yaw,0.36,0.6,Math.max(0.02,lift-0.02),lift+0.1,'вилы',T,0.03); }
   humans.forEach(([n,H])=>{ if(!H.root.visible) return; H.root.getWorldPosition(P); if(P.y>0.5) return;
     const bx=P.x-ox, bz=P.z-oz, dl=Math.abs(bx*c-bz*s), df=bx*s+bz*c;                                // человек относительно машины (с грузом)
     const front=carried?2.72:0.9; const out=Math.max(dl-(carried&&df>1.2?0.75:0.6), df-front, -1.45-df);
     if(out<0.25){ const h=hum[n]||(hum[n]={d:9,T:0}); if(out<h.d){ h.d=+out.toFixed(2); h.T=+T.toFixed(1); } } }); }
 /* --- люди против препятствий --- */
 const hp={};
 for(let T=0;T<T1;T+=0.25){ F._apply(F.tfOf(T)); humans.forEach(([n,H])=>{ if(!H.root.visible) return; H.root.getWorldPosition(P); const y=P.y;
     const L=G2.get(key(Math.floor(P.x/2)+50,Math.floor(P.z/2)+50)); if(!L) return;
     for(const k of L){ const b=obs[k]; if(b.y1<y+0.25||b.y0>y+1.5) continue; const dx=Math.max(b.x0-P.x,0,P.x-b.x1), dz=Math.max(b.z0-P.z,0,P.z-b.z1);
       if(Math.hypot(dx,dz)<0.12){ const id=n+' × '+b.n; const h=hp[id]||(hp[id]={n:0,T0:+T.toFixed(1),at:[+P.x.toFixed(2),+P.z.toFixed(2)]}); h.n++; h.T1=+T.toFixed(1); } } }); }
 const out=Object.entries(hits).map(([k,h])=>[k,+h.pen.toFixed(2),+h.T0.toFixed(1),+h.T1.toFixed(1),h.at]).sort((a,b)=>b[1]-a[1]);
 return {nobs:obs.length,hits:out.slice(0,40),hum,hp:Object.entries(hp).slice(0,40)}; })()
