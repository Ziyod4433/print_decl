// Люди в обычном виде не стоят внутри оборудования, стоек, конвейера, стен и друг в друге.
// NOBATCH=1 node tools/ev.js Sklad4_realistic_film.html tools/checks/people_space.js
// Тело — вертикальный цилиндр r 0,2 м от 0,12 до 1,7 м над ступнями; препятствие — повёрнутая коробка каждой видимой сетки
// (без слияния геометрии, поэтому NOBATCH=1). Сидящие (водители) и люди в кузовах — пропускаются.
// Норма: bad [] (проникновение глубже 3 см), pairs [] (люди ближе 0,42 м друг к другу), err [].
// window.__PS_R / __PS_PAD — свой радиус и порог; window.__PS_FROM — список корней людей (иначе PEOPLE в обычном виде).
(()=>{ const out={err:[],bad:[],pairs:[],n:0}; const R=window.__PS_R||0.2, PAD=window.__PS_PAD||0.03;
 try{ scene.updateMatrixWorld(true);
 const vis=o=>{ for(let p=o;p;p=p.parent) if(!p.visible) return false; return true; };
 const nameOf=o=>{ for(let p=o;p;p=p.parent){ const u=p.userData||{}; if(u.eid&&u.nm) return u.eid+':'+u.nm.slice(0,30); if(u.info&&(u.info.t||u.info.n)) return (u.info.t||u.info.n).slice(0,36); if(u.nm) return u.nm.slice(0,36); } return (o.material&&o.material.name)||o.name||o.type; };
 const people=(window.__PS_FROM||PEOPLE.map(H=>H.root)).filter(r=>vis(r)&&r.userData.H&&!(r.userData.H.st&&(r.userData.H.st.sit||r.userData.H.st.drive)));
 const skip=new Set(); PEOPLE.forEach(H=>H.root.traverse(o=>skip.add(o))); [G.labels,G.addr,G.roles,G.dims,G.flow].forEach(g=>g&&g.traverse(o=>skip.add(o)));
 const obs=[], bb=new THREE.Box3(), inv=new THREE.Matrix4();
 scene.traverse(o=>{ if(!o.isMesh||o.isSkinnedMesh||skip.has(o)||!vis(o)) return; const m=o.material; if(!m||Array.isArray(m)?false:(m.transparent&&m.opacity<0.35)||m.isShadowMaterial) return;
   if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
   if(bb.max.y<0.12||bb.min.y>2.2) return; if(bb.max.x-bb.min.x>20||bb.max.z-bb.min.z>20) return; if(bb.max.y-bb.min.y<0.02) return;
   obs.push({o,box:bb.clone(),lb:o.geometry.boundingBox}); });
 out.nobs=obs.length;
 const lp=new THREE.Vector3(), cp=new THREE.Vector3(), wp=new THREE.Vector3(), P=new THREE.Vector3();
 for(const r of people){ const H=r.userData.H; r.getWorldPosition(P); out.n++;
   if(r.parent&&r.parent.userData&&(r.parent.userData.isTruck||r.parent.userData.cab)) continue;
   const y0=P.y+0.12, y1=P.y+1.7, hits=[];
   for(const b of obs){ const B=b.box; if(B.max.y<y0||B.min.y>y1) continue; if(B.max.x<P.x-R||B.min.x>P.x+R||B.max.z<P.z-R||B.min.z>P.z+R) continue;
     inv.copy(b.o.matrixWorld).invert(); let worst=-9;
     for(const hy of [y0,(y0+y1)/2,y1]){ lp.set(P.x,hy,P.z).applyMatrix4(inv); cp.copy(lp).clamp(b.lb.min,b.lb.max); wp.copy(cp).applyMatrix4(b.o.matrixWorld);
       if(Math.abs(wp.y-hy)>0.02) continue; const d=Math.hypot(wp.x-P.x,wp.z-P.z); let pen=R-d;
       if(lp.equals(cp)){ const L=b.lb; pen=R+Math.min(lp.x-L.min.x,L.max.x-lp.x,lp.z-L.min.z,L.max.z-lp.z)*Math.abs(b.o.matrixWorld.elements[0]||1); }
       worst=Math.max(worst,pen); }
     if(worst>PAD) hits.push([nameOf(b.o),+worst.toFixed(2)]); }
   if(hits.length){ hits.sort((a,b)=>b[1]-a[1]); const u=r.userData; out.bad.push({who:(u.eid||'')+' '+(H.role||''),at:[+P.x.toFixed(2),+P.z.toFixed(2)],hit:hits.slice(0,4)}); } }
 for(let i=0;i<people.length;i++) for(let j=i+1;j<people.length;j++){ const a=people[i].getWorldPosition(new THREE.Vector3()), b=people[j].getWorldPosition(new THREE.Vector3());
   if(Math.abs(a.y-b.y)<0.5&&Math.hypot(a.x-b.x,a.z-b.z)<0.42) out.pairs.push([(people[i].userData.eid||i)+'',(people[j].userData.eid||j)+'',+Math.hypot(a.x-b.x,a.z-b.z).toFixed(2)]); }
 }catch(e){ out.err.push(e.message+' | '+(e.stack||'').split('\n').slice(0,3).join(' / ')); }
 return out; })()
