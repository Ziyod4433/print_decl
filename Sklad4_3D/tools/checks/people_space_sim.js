// Живой процесс: люди процесса не заходят телом в оборудование, конвейер, стойки, аппараты DWS и стены.
// NOBATCH=1 node tools/ev.js Sklad4_realistic_film.html tools/checks/people_space_sim.js   (window.__PSS_T — до какого времени процесса, с; __SIMV=2 — вариант П1)
// Тело — вертикальный цилиндр r 0,2 м от 0,12 до 1,7 м над ступнями; препятствие — повёрнутая коробка каждой видимой сетки: неподвижные
// (без слияния геометрии, поэтому NOBATCH=1) и подвижные — телескопический конвейер, аппараты DWS, стойки процесса. Кузова машин
// не считаются (в них работают люди); короба в стойках — только когда человек их не несёт и не берёт. Проверка раз в 0,4 с процесса.
// Норма: bad [] (проникновение глубже 3 см; ключ — кто × во что, n — сколько проверок, pen — глубина м, at — x, z, T), err [].
(()=>{ const out={err:[],bad:{}}; const R=0.2, PAD=0.03;
 try{ if(window.__SIMV) SIM.cfg.variant=+window.__SIMV; SIM.enter(); const S=SIM.state(), F=FILM; scene.updateMatrixWorld(true);
 const vis=o=>{ for(let p=o;p;p=p.parent) if(!p.visible) return false; return true; };
 const nameOf=o=>{ for(let p=o;p;p=p.parent){ const u=p.userData||{}; if(u.info&&(u.info.t||u.info.n)) return (u.info.t||u.info.n).slice(0,36); if(u.nm) return u.nm.slice(0,36); } return (o.material&&o.material.name)||o.name||o.type; };
 const isCarton=m=>LOOK.cartons.includes(m)||(Array.isArray(m)&&LOOK.ctypeM.includes(m[0]))||LOOK.ctypeM.includes(m);
 const okMesh=o=>{ if(!o.isMesh||o.isSkinnedMesh||!vis(o)) return false; const m=o.material; if(!m) return false; if(!Array.isArray(m)&&((m.transparent&&m.opacity<0.35)||m.isShadowMaterial)) return false; return !isCarton(m); };
 const skip=new Set(); [F.grp,S.grp,F.cnT,F.kzT,G.people,G.labels,G.addr,G.roles,G.dims,G.flow].forEach(r=>r&&r.traverse(o=>skip.add(o))); PEOPLE.forEach(H=>H.root.traverse(o=>skip.add(o)));
 const bb=new THREE.Box3(), st=[];
 scene.traverse(o=>{ if(skip.has(o)||!okMesh(o)) return; if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
   if(bb.max.y<0.12||bb.min.y>2.2||bb.max.x-bb.min.x>20||bb.max.z-bb.min.z>20||bb.max.y-bb.min.y<0.02) return; st.push({o,box:bb.clone()}); });
 const GR=new Map(), key=(i,j)=>(i+60)*1000+(j+60);
 st.forEach((b,k)=>{ for(let i=Math.floor(b.box.min.x);i<=Math.floor(b.box.max.x);i++) for(let j=Math.floor(b.box.min.z);j<=Math.floor(b.box.max.z);j++){ const kk=key(i,j); if(!GR.has(kk)) GR.set(kk,[]); GR.get(kk).push(b); } });
 const dyn=[]; [F.tl2,F.dws,F.gs].forEach(g=>g&&g.traverse(o=>{ if(o.isMesh&&!o.isSkinnedMesh){ if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); dyn.push({o,box:new THREE.Box3()}); } }));
 (S.racks||[]).forEach(r=>r.o&&r.o.traverse(o=>{ if(o.isMesh){ if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); dyn.push({o,box:new THREE.Box3(),rack:r}); } }));
 const cartonOf=o=>{ for(let p=o;p;p=p.parent) if(p.userData&&p.userData.carton) return true; return false; };
 out.nst=st.length; out.ndyn=dyn.length;
 const inv=new THREE.Matrix4(), lp=new THREE.Vector3(), cp=new THREE.Vector3(), wp=new THREE.Vector3(), P=new THREE.Vector3();
 const pen=(b,y0,y1)=>{ const B=b.box; if(B.max.y<y0||B.min.y>y1||B.max.x<P.x-R||B.min.x>P.x+R||B.max.z<P.z-R||B.min.z>P.z+R) return -9; const lb=b.o.geometry.boundingBox; inv.copy(b.o.matrixWorld).invert(); let w=-9;
   for(const hy of [y0,(y0+y1)/2,y1]){ lp.set(P.x,hy,P.z).applyMatrix4(inv); cp.copy(lp).clamp(lb.min,lb.max); wp.copy(cp).applyMatrix4(b.o.matrixWorld); if(Math.abs(wp.y-hy)>0.02) continue;
     const d=Math.hypot(wp.x-P.x,wp.z-P.z); w=Math.max(w,lp.equals(cp)?R+0.05:R-d); } return w; };
 const T1=+(window.__PSS_T||1500); let n=0;
 while(S.T<T1){ SIM.tick(0.08); if(++n%5) continue; const T=S.T;
   dyn.forEach(d=>{ if(!vis(d.o)||(d.rack&&d.rack.mode==='x')){ d.box.makeEmpty(); return; } d.o.updateWorldMatrix(true,false); d.box.copy(d.o.geometry.boundingBox).applyMatrix4(d.o.matrixWorld); });
   for(const k in S.hum){ const H=S.hum[k].H; if(!H||!vis(H.root)) continue; if(H.st&&(H.st.sit||H.st.drive)) continue; let inBody=false; for(let p=H.root.parent;p;p=p.parent) if(p===F.cnT||p===F.kzT||(p.userData&&p.userData.isTruck)) inBody=true;
     H.root.getWorldPosition(P); const y0=P.y+0.12, y1=P.y+1.7, seen=new Set(), cand=[];
     for(let i=Math.floor(P.x-R);i<=Math.floor(P.x+R);i++) for(let j=Math.floor(P.z-R);j<=Math.floor(P.z+R);j++){ const L=GR.get(key(i,j)); if(L) L.forEach(b=>{ if(!seen.has(b)){ seen.add(b); cand.push(b); } }); }
     if(!inBody) dyn.forEach(d=>{ if(!d.box.isEmpty()) cand.push(d); });
     else dyn.forEach(d=>{ if(!d.box.isEmpty()&&!d.rack) cand.push(d); });
     const busy=H.st&&(H.st.carry||H.st.reach);                                       // несёт или берёт короб — касание коробов не в счёт
     for(const b of cand){ if(H.st&&H.st.carry&&b.rack&&b.rack.mode==='fk') continue; if(busy&&b.rack&&(b.ct===undefined?(b.ct=cartonOf(b.o)):b.ct)) continue; const p=pen(b,y0,y1); if(p>PAD){ const id=k+' × '+(b.rack?'стойка#'+b.rack.id:nameOf(b.o)); const h=out.bad[id]||(out.bad[id]={n:0,pen:0,at:null,T0:+T.toFixed(1)}); h.n++; h.T1=+T.toFixed(1); if(p>h.pen){ h.pen=+p.toFixed(2); h.at=[+P.x.toFixed(2),+P.z.toFixed(2),+T.toFixed(1)]; h.y=+P.y.toFixed(2); const B=b.box; h.box=[B.min.x,B.min.y,B.min.z,B.max.x,B.max.y,B.max.z].map(v=>+v.toFixed(2)); if(b.rack) h.rk=[b.rack.mode||'',+b.rack.o.position.x.toFixed(2),+b.rack.o.position.z.toFixed(2)]; } } } } }
 out.steps=n; out.T=+S.T.toFixed(1); SIM.exit();
 }catch(e){ out.err.push(e.message+' | '+(e.stack||'').split('\n').slice(0,3).join(' / ')); }
 return out; })()
