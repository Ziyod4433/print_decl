/* ---------------------------------------------------------------- навигация техники: сетка 0,2 м по залу, расстояние до препятствий, A*
   Препятствия берутся из самой сцены (стены, колонны, здание охраны, DWS, пост П2, ограждения, станции) — треугольники в полосе высот
   0,08…2,4 м; стеллажи, конвейеры и машины — сплошным прямоугольником по габариту (между стойками нижнего яруса не проехать).
   Техника — в пространстве конфигураций: свободна клетка, до препятствия от которой не меньше радиуса (0,7 м). */
const NAV=(()=>{
  const CS=0.2, X0=-0.6, Z0=0.2, NX=Math.ceil((48.6-X0)/CS), NZ=Math.ceil((36.2-Z0)/CS), N=NX*NZ;
  const Y0=0.08, Y1=2.4, RP=0.7;                                    // полоса высот, радиус планирования
  let occ=null, dist=null, soft=null, aisle=null, aisles=[], lane=null, lanes=[], ms=0;
  const ci=x=>Math.floor((x-X0)/CS), cj=z=>Math.floor((z-Z0)/CS), cx=i=>X0+(i+0.5)*CS, cz=j=>Z0+(j+0.5)*CS;
  const inG=(i,j)=>i>=0&&j>=0&&i<NX&&j<NZ;
  const va=new THREE.Vector3(), vb=new THREE.Vector3(), vc=new THREE.Vector3(), mi=new THREE.Matrix4(), mw=new THREE.Matrix4(), bb=new THREE.Box3(), inv=new THREE.Matrix4();
  function markTri(a,b,c){
    const ymin=Math.min(a.y,b.y,c.y), ymax=Math.max(a.y,b.y,c.y); if(ymax<Y0||ymin>Y1) return;
    const i0=Math.max(0,ci(Math.min(a.x,b.x,c.x))), i1=Math.min(NX-1,ci(Math.max(a.x,b.x,c.x)));
    const j0=Math.max(0,cj(Math.min(a.z,b.z,c.z))), j1=Math.min(NZ-1,cj(Math.max(a.z,b.z,c.z)));
    if(i1<i0||j1<j0) return;
    if(i1-i0<=1||j1-j0<=1){ for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) occ[j*NX+i]=1; return; }   // тонкий треугольник — вся его рамка
    const d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
    if(Math.abs(d)<1e-9){ for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++) occ[j*NX+i]=1; return; }      // вертикальная грань — отрезок
    const e=CS*0.75;
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const px=cx(i), pz=cz(j);
      const l1=((b.z-c.z)*(px-c.x)+(c.x-b.x)*(pz-c.z))/d, l2=((c.z-a.z)*(px-c.x)+(a.x-c.x)*(pz-c.z))/d, l3=1-l1-l2;
      const tol=e/Math.max(0.05,Math.sqrt(Math.abs(d)));                // запас на полклетки: тонкие стенки не просвечивают
      if(l1>=-tol&&l2>=-tol&&l3>=-tol) occ[j*NX+i]=1; } }
  function markBox(o,pad){                                           // сплошной габарит объекта (в его осях) по полу
    o.updateMatrixWorld(true); inv.copy(o.matrixWorld).invert(); bb.makeEmpty();
    o.traverse(m=>{ if(!(m.isMesh||m.isInstancedMesh)||!m.geometry||m.userData.isAO||m.userData.walkDyn) return; if(!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      if(m.isInstancedMesh){ for(let i=0;i<m.count;i++){ m.getMatrixAt(i,mi); mw.multiplyMatrices(inv,m.matrixWorld).multiply(mi); const b=m.geometry.boundingBox.clone().applyMatrix4(mw); if(b.max.y>Y0) bb.union(b); } }
      else { const b=m.geometry.boundingBox.clone().applyMatrix4(mw.multiplyMatrices(inv,m.matrixWorld)); if(b.max.y>Y0) bb.union(b); } });
    if(bb.isEmpty()) return; pad=pad||0;
    const w=o.matrixWorld, P=[[bb.min.x-pad,bb.min.z-pad],[bb.max.x+pad,bb.min.z-pad],[bb.max.x+pad,bb.max.z+pad],[bb.min.x-pad,bb.max.z+pad]].map(([x,z])=>new THREE.Vector3(x,0.5,z).applyMatrix4(w));
    markTri(P[0],P[1],P[2]); markTri(P[0],P[2],P[3]); }
  /* сборка: skip — корни, которые не препятствие (техника, люди); solid — корни с габаритом прямоугольником */
  function build(o){
    const t0=performance.now(); occ=new Uint8Array(N); soft=new Uint8Array(N);
    const skipG=new Set([G.people,G.labels,G.addr,G.roles,G.dims,G.flow,G.floorgfx,G.roof,G.sky].filter(Boolean));
    if(typeof DOORS!=='undefined') DOORS.forEach(d=>d.panels.forEach(p=>skipG.add(p)));
    const skip=o.skip||new Set(), solid=o.solid||new Set();
    scene.updateMatrixWorld(true);
    (function walk(n){ if(!n.visible||skipG.has(n)||skip.has(n)) return; const u=n.userData;
      if(u.isHuman||u.walkMe||u.abcMob) return;
      if(solid.has(n)){ markBox(n,0.02); return; }
      if((n.isMesh||n.isInstancedMesh)&&!n.isSkinnedMesh&&!u.walkDyn&&!u.isAO){ const g=n.geometry;
        if(g&&g.attributes&&g.attributes.position){ if(!g.boundingSphere) g.computeBoundingSphere();
          if(g.boundingSphere.radius<90){ const P=g.attributes.position, I=g.index, cnt=I?I.count:P.count;
            const one=M=>{ /* быстрый отсев по сфере */ vc.copy(g.boundingSphere.center).applyMatrix4(M); const r=g.boundingSphere.radius*M.getMaxScaleOnAxis();
              if(vc.x+r<X0||vc.x-r>X0+NX*CS||vc.z+r<Z0||vc.z-r>Z0+NZ*CS||vc.y+r<Y0||vc.y-r>Y1) return;
              for(let k=0;k+2<cnt;k+=3){ va.fromBufferAttribute(P,I?I.getX(k):k).applyMatrix4(M); vb.fromBufferAttribute(P,I?I.getX(k+1):k+1).applyMatrix4(M); vc.fromBufferAttribute(P,I?I.getX(k+2):k+2).applyMatrix4(M); markTri(va,vb,vc); } };
            if(n.isInstancedMesh){ for(let i=0;i<n.count;i++){ n.getMatrixAt(i,mi); mw.multiplyMatrices(n.matrixWorld,mi); if(Math.abs(mw.determinant())>1e-9) one(mw); } }
            else one(n.matrixWorld); } } }
      for(const c of n.children) walk(c); })(scene);
    /* за стеной Л1/Л2 (x < 0) — только проёмы ворот; дальше — площадка и двор, туда техника заезжает по сценарию дока */
    for(let j=0;j<NZ;j++) for(let i=0;i<NX;i++) if(cx(i)<-0.15) occ[j*NX+i]=1;
    (o.extra||[]).forEach(([x0,z0,x1,z1])=>{ for(let j=Math.max(0,cj(z0));j<=Math.min(NZ-1,cj(z1));j++) for(let i=Math.max(0,ci(x0));i<=Math.min(NX-1,ci(x1));i++) occ[j*NX+i]=1; });
    (o.soft||[]).forEach(([x0,z0,x1,z1])=>{ for(let j=Math.max(0,cj(z0));j<=Math.min(NZ-1,cj(z1));j++) for(let i=Math.max(0,ci(x0));i<=Math.min(NX-1,ci(x1));i++) soft[j*NX+i]=1; });
    for(let i=0;i<NX;i++){ occ[i]=1; occ[(NZ-1)*NX+i]=1; } for(let j=0;j<NZ;j++){ occ[j*NX]=1; occ[j*NX+NX-1]=1; }
    edt();
    aisles=o.aisles||[]; aisle=new Int16Array(N).fill(-1);
    aisles.forEach((a,k)=>{ for(let j=Math.max(0,cj(a.z0));j<=Math.min(NZ-1,cj(a.z1));j++) for(let i=Math.max(0,ci(a.x0));i<=Math.min(NX-1,ci(a.x1));i++) aisle[j*NX+i]=k; });
    lanes=o.lanes||[]; lane=new Int8Array(N).fill(-1);                // двусторонние полосы: держаться правой стороны
    lanes.forEach((L,k)=>{ for(let j=Math.max(0,cj(L.z0));j<=Math.min(NZ-1,cj(L.z1));j++) for(let i=Math.max(0,ci(L.x0));i<=Math.min(NX-1,ci(L.x1));i++) lane[j*NX+i]=k; });
    ms=Math.round(performance.now()-t0); }
  /* точное евклидово расстояние до ближайшего занятого (Felzenszwalb–Huttenlocher), в метрах */
  function edt(){
    const INF=1e20, f=new Float64Array(Math.max(NX,NZ)), d=new Float64Array(Math.max(NX,NZ)), v=new Int32Array(Math.max(NX,NZ)), zz=new Float64Array(Math.max(NX,NZ)+1), tmp=new Float64Array(N);
    const d1=(n)=>{ let k=0; v[0]=0; zz[0]=-INF; zz[1]=INF;
      for(let q=1;q<n;q++){ let p=v[k], s=((f[q]+q*q)-(f[p]+p*p))/(2*q-2*p);
        while(s<=zz[k]){ k--; p=v[k]; s=((f[q]+q*q)-(f[p]+p*p))/(2*q-2*p); }
        k++; v[k]=q; zz[k]=s; zz[k+1]=INF; }
      k=0; for(let q=0;q<n;q++){ while(zz[k+1]<q) k++; const p=v[k]; d[q]=(q-p)*(q-p)+f[p]; } };
    for(let i=0;i<NX;i++){ for(let j=0;j<NZ;j++) f[j]=occ[j*NX+i]?0:INF; d1(NZ); for(let j=0;j<NZ;j++) tmp[j*NX+i]=d[j]; }
    dist=new Float32Array(N);
    for(let j=0;j<NZ;j++){ for(let i=0;i<NX;i++) f[i]=tmp[j*NX+i]; d1(NX); for(let i=0;i<NX;i++) dist[j*NX+i]=Math.sqrt(d[i])*CS; } }
  const D=(x,z)=>{ const i=ci(x), j=cj(z); return inG(i,j)?dist[j*NX+i]:0; };
  const aisleAt=(x,z)=>{ const i=ci(x), j=cj(z); return inG(i,j)?aisle[j*NX+i]:-1; };
  /* A*: 8 соседей; стоимость — длина + штраф у препятствий (держаться середины проезда) и на «мягких» клетках (места на полу);
     blk — временные круги {x,z,r} (стоящая техника); rp — радиус */
  let heapI=null, heapF=null, gS=null, came=null, stamp=null, st=1, cpen=null, ctouch=[];
  function corridors(cor){                                           // штраф за клетки у чужих путей (r 1,4 м): свой путь — параллельной полосой
    for(const k of ctouch) cpen[k]=0; ctouch.length=0; if(!cor||!cor.length) return;
    const R=7, disc=[]; for(let dj=-R;dj<=R;dj++) for(let di=-R;di<=R;di++) if(di*di+dj*dj<=R*R) disc.push(dj*NX+di);
    for(const P of cor) for(let s=1;s<P.length;s++){ const [x0,z0]=P[s-1], [x1,z1]=P[s], L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.ceil(L/0.4));
      for(let q=0;q<=n;q++){ const i=ci(x0+(x1-x0)*q/n), j=cj(z0+(z1-z0)*q/n); if(i<R||j<R||i>=NX-R||j>=NZ-R) continue; const c=j*NX+i;
        for(const d of disc){ const k=c+d; if(!cpen[k]){ cpen[k]=1; ctouch.push(k); } } } } }
  function plan(ax,az,bx,bz,o){ o=o||{}; const rp=o.rp||RP, blk=o.blk||[];
    if(!heapI){ heapI=new Int32Array(N*2); heapF=new Float32Array(N*2); gS=new Float32Array(N); came=new Int32Array(N); stamp=new Uint32Array(N); cpen=new Uint8Array(N); }
    corridors(o.cor);
    const ok=k=>{ if(dist[k]<rp) return false; if(blk.length){ const x=cx(k%NX), z=cz((k/NX)|0); for(const b of blk) if((x-b.x)*(x-b.x)+(z-b.z)*(z-b.z)<b.r*b.r) return false; } return true; };
    const near=(x,z,lim)=>{ let i=ci(x), j=cj(z); if(inG(i,j)&&ok(j*NX+i)) return j*NX+i;
      for(let r=1;r*CS<=lim;r++){ let best=-1, bd=1e9; for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ if(Math.max(Math.abs(di),Math.abs(dj))!==r) continue; const a=i+di, b=j+dj; if(!inG(a,b)) continue; const k=b*NX+a; if(!ok(k)) continue; const dd=di*di+dj*dj; if(dd<bd){ bd=dd; best=k; } } if(best>=0) return best; }
      return -1; };
    const s=near(ax,az,o.snapA===undefined?1.2:o.snapA), g=near(bx,bz,o.snapB===undefined?0.6:o.snapB); if(s<0||g<0) return null;
    st++; if(st>4e9){ stamp.fill(0); st=1; }
    const gi=g%NX, gj=(g/NX)|0, H=k=>{ const dx=Math.abs(k%NX-gi), dz=Math.abs(((k/NX)|0)-gj); return (Math.max(dx,dz)+0.4142*Math.min(dx,dz)); };
    let hn=0; const push=(k,f)=>{ let i=hn++; while(i>0){ const p=(i-1)>>1; if(heapF[p]<=f) break; heapI[i]=heapI[p]; heapF[i]=heapF[p]; i=p; } heapI[i]=k; heapF[i]=f; };
    const pop=()=>{ const r=heapI[0], k=heapI[--hn], f=heapF[hn]; let i=0; while(true){ let c=2*i+1; if(c>=hn) break; if(c+1<hn&&heapF[c+1]<heapF[c]) c++; if(heapF[c]>=f) break; heapI[i]=heapI[c]; heapF[i]=heapF[c]; i=c; } heapI[i]=k; heapF[i]=f; return r; };
    stamp[s]=st; gS[s]=0; came[s]=-1; push(s,H(s)); let found=false, it=0;
    const DI=[1,-1,0,0,1,1,-1,-1], DJ=[0,0,1,-1,1,-1,1,-1], DC=[1,1,1,1,1.4142,1.4142,1.4142,1.4142];
    while(hn>0&&it++<200000){ const k=pop(); if(k===g){ found=true; break; } const i=k%NX, j=(k/NX)|0, gk=gS[k];
      for(let d=0;d<8;d++){ const a=i+DI[d], b=j+DJ[d]; if(!inG(a,b)) continue; const n=b*NX+a; if(!ok(n)) continue;
        if(d>=4&&(!ok(j*NX+a)||!ok(b*NX+i))) continue;                     // по диагонали — не срезая угол
        let pen=1+Math.max(0,1.35-dist[n])*1.6+(soft[n]?3:0)+(cpen[n]?2.5:0); const ln=lane[n];
        if(ln>=0){ const L=lanes[ln], z=cz(b); if((DI[d]>0&&z<L.mid)||(DI[d]<0&&z>L.mid)) pen+=0.9; }
        const ng=gk+DC[d]*pen;
        if(stamp[n]!==st||ng<gS[n]-1e-6){ stamp[n]=st; gS[n]=ng; came[n]=k; push(n,ng+H(n)); } } }
    if(!found) return null;
    const cells=[]; for(let k=g;k>=0;k=came[k]) cells.push(k); cells.reverse(); if(cells.length<2) return [{x:ax,z:az},{x:bx,z:bz}];
    /* сглаживание: прямые участки, пока видимость по свободной клетке (с тем же радиусом) */
    const pts=cells.map(k=>({x:cx(k%NX),z:cz((k/NX)|0)})); pts[0]={x:ax,z:az}; pts[pts.length-1]={x:bx,z:bz};
    const out=[pts[0]]; let a=0;
    while(a<pts.length-1){ let b=pts.length-1; while(b>a+1&&!los(pts[a],pts[b],rp,blk,soft)) b--; out.push(pts[b]); a=b; }
    return out; }
  function los(p,q,rp,blk,sf){ const L=Math.hypot(q.x-p.x,q.z-p.z), n=Math.max(1,Math.ceil(L/(CS*0.5)));
    for(let s=1;s<n;s++){ const x=p.x+(q.x-p.x)*s/n, z=p.z+(q.z-p.z)*s/n, i=ci(x), j=cj(z); if(!inG(i,j)) return false; const k=j*NX+i;
      if(dist[k]<rp||(sf&&sf[k]&&s>2&&s<n-2)) return false; for(const b of blk) if((x-b.x)*(x-b.x)+(z-b.z)*(z-b.z)<b.r*b.r) return false; }
    return true; }
  /* ближайшая свободная клетка (поиск в ширину) с условием — место, чтобы уступить дорогу */
  function freeNear(x,z,lim,test,rp,aisleOk){ rp=rp||RP; const s0=ci(x), t0=cj(z); if(!inG(s0,t0)) return null;
    const seen=new Uint8Array(N), q=[t0*NX+s0]; seen[q[0]]=1;
    for(let h=0;h<q.length;h++){ const k=q[h], i=k%NX, j=(k/NX)|0, px=cx(i), pz=cz(j); if(Math.hypot(px-x,pz-z)>lim) continue;
      if(dist[k]>=rp&&(aisle[k]<0||(aisleOk&&aisleOk(aisle[k])))&&test(px,pz)) return {x:px,z:pz};
      for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){ const a=i+di, b=j+dj; if(!inG(a,b)) continue; const n=b*NX+a; if(seen[n]||dist[n]<rp) continue; seen[n]=1; q.push(n); } }
    return null; }
  return {build,plan,los:(p,q,rp,blk)=>los(p,q,rp||RP,blk||[],null),D,aisleAt,freeNear,get aisles(){ return aisles; },get ms(){ return ms; },RP,CS,
    debug:()=>({NX,NZ,occ,dist,X0,Z0,CS})};
})();
