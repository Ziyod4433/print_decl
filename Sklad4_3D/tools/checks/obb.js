(()=>{ FILM.enter({size:[320,180],paused:true}); const F=FILM, MK=F.MK;
 const list=[]; const add=(o,tag)=>{ if(o&&o.isObject3D) list.push({o,tag}); };
 (F.box||[]).forEach((b,i)=>add(b,'belt'+i)); (F.kb||[]).forEach((r,ri)=>r.forEach((b,i)=>add(b,'kb'+ri+'_'+i))); (F.WTbox||[]).forEach((b,i)=>add(b,'wt'+i));
 // локальные габариты
 const bb=new THREE.Box3(), tb=new THREE.Box3(), inv=new THREE.Matrix4();
 list.forEach(L=>{ const o=L.o; o.updateMatrixWorld(true); inv.copy(o.matrixWorld).invert(); bb.makeEmpty();
   o.traverse(m=>{ if(!m.isMesh) return; if(!m.geometry.boundingBox) m.geometry.computeBoundingBox(); tb.copy(m.geometry.boundingBox).applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,m.matrixWorld)); bb.union(tb); });
   L.c=bb.getCenter(new THREE.Vector3()); L.h=bb.getSize(new THREE.Vector3()).multiplyScalar(0.5); });
 const ax=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()], bx=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
 const pa=new THREE.Vector3(), pb=new THREE.Vector3(), d=new THREE.Vector3(), t=new THREE.Vector3();
 function sat(A,B){ // возвращает глубину проникновения (м) или 0
   A.o.matrixWorld.extractBasis(ax[0],ax[1],ax[2]); B.o.matrixWorld.extractBasis(bx[0],bx[1],bx[2]);
   const sa=[ax[0].length(),ax[1].length(),ax[2].length()], sb=[bx[0].length(),bx[1].length(),bx[2].length()]; ax.forEach(a=>a.normalize()); bx.forEach(b=>b.normalize());
   const ha=[A.h.x*sa[0],A.h.y*sa[1],A.h.z*sa[2]], hb=[B.h.x*sb[0],B.h.y*sb[1],B.h.z*sb[2]];
   pa.copy(A.c).applyMatrix4(A.o.matrixWorld); pb.copy(B.c).applyMatrix4(B.o.matrixWorld); d.subVectors(pb,pa);
   if(d.length()>Math.hypot(...ha)+Math.hypot(...hb)) return 0;
   let minPen=Infinity; const axes=[...ax,...bx]; for(let i=0;i<3;i++) for(let j=0;j<3;j++){ t.crossVectors(ax[i],bx[j]); if(t.lengthSq()>1e-6) axes.push(t.clone().normalize()); }
   for(const n of axes){ const ra=ha[0]*Math.abs(ax[0].dot(n))+ha[1]*Math.abs(ax[1].dot(n))+ha[2]*Math.abs(ax[2].dot(n));
     const rb=hb[0]*Math.abs(bx[0].dot(n))+hb[1]*Math.abs(bx[1].dot(n))+hb[2]*Math.abs(bx[2].dot(n)); const pen=ra+rb-Math.abs(d.dot(n)); if(pen<=0) return 0; if(pen<minPen) minPen=pen; }
   return minPen; }
 const vis=o=>{ for(let p=o;p;p=p.parent) if(!p.visible) return false; return true; };
 const hits={}; let n=0;
 for(let T=0;T<MK.end;T+=0.1){ F._apply(F.tfOf(T)); n++; const V=list.filter(L=>vis(L.o)); V.forEach(L=>L.o.updateMatrixWorld(true));
   for(let i=0;i<V.length;i++) for(let j=i+1;j<V.length;j++){ const p=sat(V[i],V[j]); if(p>0.006){ const k=V[i].tag+'×'+V[j].tag; const h=hits[k]||(hits[k]={n:0,T0:T,max:0}); h.n++; h.T1=T; h.max=Math.max(h.max,p); } }
   V.forEach(L=>{ pa.copy(L.c).applyMatrix4(L.o.matrixWorld); const low=pa.y-L.h.y; if(low<-0.01){ const k='floor:'+L.tag; const h=hits[k]||(hits[k]={n:0,T0:T,max:0}); h.n++; h.T1=T; h.max=Math.max(h.max,-low); } }); }
 const out=Object.entries(hits).map(([k,h])=>[k,h.n,+h.T0.toFixed(1),+h.T1.toFixed(1),+h.max.toFixed(3)]).sort((a,b)=>b[1]-a[1]);
 return {cartons:list.length,samples:n,hits:out.slice(0,60),total:out.length}; })()
