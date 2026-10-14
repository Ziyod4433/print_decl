// Фильм: люди не заходят телом в оборудование, конвейер, стойки, аппараты DWS и стены.
// NOBATCH=1 node tools/ev.js Sklad4_realistic_film.html tools/checks/people_space_film.js
// Тело — вертикальный цилиндр r 0,2 м от 0,12 до 1,7 м над ступнями; препятствие — повёрнутая коробка каждой видимой сетки:
// неподвижные (NOBATCH=1) и подвижные объекты фильма (конвейер, стойки, поддоны, аппараты DWS). Кузова машин (в них работают люди),
// погрузчик (для него — tools/run_coll.sh) и короба (их носят) не считаются. Кадры — каждые 0,25 с фильма.
// Норма: bad [] (проникновение глубже 3 см; ключ — кто × во что, n — сколько кадров, pen — глубина м, at — x, z, t фильма), err [].
(()=>{ const out={err:[],bad:{}}; const R=0.2, PAD=0.03;
 try{ FILM.enter({size:[320,180],paused:true}); const F=FILM; F._apply(0); scene.updateMatrixWorld(true);
 const vis=o=>{ for(let p=o;p;p=p.parent) if(!p.visible) return false; return true; };
 const nameOf=o=>{ for(let p=o;p;p=p.parent){ const u=p.userData||{}; if(u.info&&(u.info.t||u.info.n)) return (u.info.t||u.info.n).slice(0,36); if(u.nm) return u.nm.slice(0,36); } return (o.material&&o.material.name)||o.name||o.type; };
 const isCarton=m=>LOOK.cartons.includes(m)||(Array.isArray(m)&&LOOK.ctypeM.includes(m[0]))||LOOK.ctypeM.includes(m);
 const H={PW:F.PW,CT:F.CT,SUP:F.SUP,WP:F.WP,W3:F.W3,W4:F.W4,W5:F.W5}; if(F.KH) for(const k in F.KH) H[k]=F.KH[k];
 const skipAll=new Set(); [F.cnT,F.kzT,F.fk,G.people,G.labels,G.addr,G.roles,G.dims,G.flow].forEach(r=>r&&r.traverse(o=>skipAll.add(o))); PEOPLE.concat(Object.values(H).filter(Boolean)).forEach(h=>h.root.traverse(o=>skipAll.add(o)));
 const inFilm=new Set(); F.grp.traverse(o=>inFilm.add(o));
 const st=[], dyn=[], bb=new THREE.Box3();
 const okMesh=o=>{ if(!o.isMesh||o.isSkinnedMesh||skipAll.has(o)) return false; const m=o.material; if(!m) return false; if(!Array.isArray(m)&&((m.transparent&&m.opacity<0.35)||m.isShadowMaterial)) return false; return !isCarton(m); };
 scene.traverse(o=>{ if(!okMesh(o)) return; if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); if(inFilm.has(o)){ dyn.push({o,box:new THREE.Box3()}); return; }
   if(!vis(o)) return; bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
   if(bb.max.y<0.12||bb.min.y>2.2||bb.max.x-bb.min.x>20||bb.max.z-bb.min.z>20||bb.max.y-bb.min.y<0.02) return; st.push({o,box:bb.clone()}); });
 const GR=new Map(), key=(i,j)=>(i+60)*1000+(j+60);
 st.forEach(b=>{ for(let i=Math.floor(b.box.min.x);i<=Math.floor(b.box.max.x);i++) for(let j=Math.floor(b.box.min.z);j<=Math.floor(b.box.max.z);j++){ const kk=key(i,j); if(!GR.has(kk)) GR.set(kk,[]); GR.get(kk).push(b); } });
 out.nst=st.length; out.ndyn=dyn.length;
 const inv=new THREE.Matrix4(), lp=new THREE.Vector3(), cp=new THREE.Vector3(), wp=new THREE.Vector3(), P=new THREE.Vector3();
 const pen=(b,y0,y1)=>{ const B=b.box; if(B.max.y<y0||B.min.y>y1||B.max.x<P.x-R||B.min.x>P.x+R||B.max.z<P.z-R||B.min.z>P.z+R) return -9; const lb=b.o.geometry.boundingBox; inv.copy(b.o.matrixWorld).invert(); let w=-9;
   for(const hy of [y0,(y0+y1)/2,y1]){ lp.set(P.x,hy,P.z).applyMatrix4(inv); cp.copy(lp).clamp(lb.min,lb.max); wp.copy(cp).applyMatrix4(b.o.matrixWorld); if(Math.abs(wp.y-hy)>0.02) continue;
     const d=Math.hypot(wp.x-P.x,wp.z-P.z); w=Math.max(w,lp.equals(cp)?R+0.05:R-d); } return w; };
 const DT=+(window.__PSF_DT||0.25); let n=0;
 for(let tf=0;tf<=F.T;tf+=DT){ F._apply(tf); n++;
   dyn.forEach(d=>{ if(!vis(d.o)){ d.box.makeEmpty(); return; } d.o.updateWorldMatrix(true,false); d.box.copy(d.o.geometry.boundingBox).applyMatrix4(d.o.matrixWorld);
     const B=d.box; if(B.max.y<0.12||B.min.y>2.2||B.max.y-B.min.y<0.02||B.max.x-B.min.x>20||B.max.z-B.min.z>20) d.box.makeEmpty(); });
   for(const k in H){ const h=H[k]; if(!h||!vis(h.root)) continue; if(h.st&&(h.st.sit||h.st.drive)) continue; let inBody=false; for(let p=h.root.parent;p;p=p.parent) if(p===F.cnT||p===F.kzT) inBody=true; if(inBody) continue;
     h.root.getWorldPosition(P); if(P.y>0.5||P.y<-0.5) continue; const y0=P.y+0.12, y1=P.y+1.7, seen=new Set(), cand=[];
     for(let i=Math.floor(P.x-R);i<=Math.floor(P.x+R);i++) for(let j=Math.floor(P.z-R);j<=Math.floor(P.z+R);j++){ const L=GR.get(key(i,j)); if(L) L.forEach(b=>{ if(!seen.has(b)){ seen.add(b); cand.push(b); } }); }
     dyn.forEach(d=>{ if(!d.box.isEmpty()) cand.push(d); });
     const carrying=h.st&&h.st.carry;
     for(const b of cand){ const p=pen(b,y0,y1); if(p>PAD){ const id=k+' × '+nameOf(b.o); const e=out.bad[id]||(out.bad[id]={n:0,pen:0,at:null,t0:+tf.toFixed(2)}); e.n++; e.t1=+tf.toFixed(2); if(p>e.pen){ e.pen=+p.toFixed(2); e.at=[+P.x.toFixed(2),+P.z.toFixed(2),+tf.toFixed(2)]; } } } } }
 out.frames=n; F.exit();
 }catch(e){ out.err.push(e.message+' | '+(e.stack||'').split('\n').slice(0,3).join(' / ')); }
 return out; })()
