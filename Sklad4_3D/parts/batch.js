/* ===================== ОПТИМИЗАЦИЯ: ОБЪЕДИНЕНИЕ СТАТИЧЕСКОЙ ГЕОМЕТРИИ =====================
   Сцена состоит из ~10 000 мелких сеток (короба, болты, стойки, рёбра стен): браузер тратил на каждую отдельный вызов
   отрисовки. Здесь неподвижные сетки внутри каждого объекта сливаются в несколько сеток — по одной на материал.
   Границы, через которые слияние не проходит: объекты расстановки (их двигает редактор), подвижные части (колёса, кузова,
   полотнища штор, створки ворот, ярусы стоек, грузы на лентах), скрытые узлы, прозрачные материалы, люди, погрузчики.
   Внешний вид и поведение не меняются: сливается только то, что не двигается само по себе.
   Отключить: ?nobatch в адресе или window.__NOBATCH = true до загрузки. */
const BATCH={on:false,before:0,after:0,ms:0};
function batchStatic(){
  if(window.__NOBATCH||/[?&]nobatch\b/.test(location.search)) return;
  const t0=performance.now(), KEEP=new Set(), SKIP=new Set(), keep=o=>{ if(o) KEEP.add(o); };
  const PICK=new Set(pickables);
  /* подвижное и то, на что ссылаются фильм и анимации */
  Object.values(DOOR).forEach(d=>d.panels.forEach(keep));
  beltCargo.forEach(c=>keep(c.o)); spinAnim.forEach(s=>keep(s.o)); if(typeof HALL!=='undefined'&&HALL.spin) HALL.spin.forEach(s=>keep(s.o));   // крыльчатки вентиляторов
  flexAnim.forEach(f=>{ (f.spin||[]).forEach(keep); (f.cargo||[]).forEach(c=>keep(c.o||c)); });
  flowMeshes.forEach(keep); keep(CHOCKS);
  const isCartonMat=m=>LOOK.cartons.includes(m)||(Array.isArray(m)&&LOOK.ctypeM.includes(m[0]))||LOOK.ctypeM.includes(m);
  [TRK_L2,TRK_IN].forEach(t=>t.traverse(o=>{ if(o.userData.isWheel) keep(o); }));
  TRK_L2.children.forEach(o=>{ if(o.isMesh&&isCartonMat(o.material)&&o.userData.cnWork) keep(o); });   // рабочая зона кузова (от x ≈ −3,7 к задним воротам, метка cnSemi): эти короба фильм и живой процесс скрывают и заменяют своими; груз в передней части остаётся (транзит)
  [TRK_IN.userData.b1,TRK_IN.userData.b2].forEach(b=>{ keep(b); const C=b.userData.curt; if(C){ C.strips.forEach(keep); C.posts.forEach(keep); } });
  scene.traverse(o=>{ const u=o.userData; if(u.tiers) u.tiers.forEach(keep); if(u.cab) keep(u.cab); if(u.rdoors) u.rdoors.forEach(keep); if(u.tele) u.tele.secG.forEach(keep); if(u.gs) u.gs.K.forEach(keep);
    if(u.rig){ const R=u.rig; keep(o); [R.mast,R.inner,R.carriage,R.swSpin].forEach(keep); R.wheels.forEach(keep); R.steer.forEach(keep); if(R.driver) SKIP.add(R.driver); } });
  [G.people,G.flow,G.labels,G.roles,G.addr,G.dims].forEach(g=>g&&SKIP.add(g));
  const fake=m=>!m||m.transparent||m.isShadowMaterial||m.isPointsMaterial||m.isLineBasicMaterial||m.isSpriteMaterial||(m.visible===false);
  const mergeable=o=>{ if(!o.isMesh||o.isSkinnedMesh||o.isInstancedMesh||o.children.length||o.renderOrder) return false;
    const g=o.geometry; if(!g||!g.isBufferGeometry||!g.attributes.position||g.morphAttributes.position) return false;
    if(g.drawRange.start!==0||g.drawRange.count!==Infinity) return false;
    const ms=Array.isArray(o.material)?o.material:[o.material]; if(ms.some(fake)) return false;
    if(Array.isArray(o.material)&&!g.groups.length) return false;
    return true; };
  scene.updateMatrixWorld(true);
  let before=0; scene.traverse(o=>{ if(o.isMesh) before++; });
  const containers=[]; const isBoundary=o=>KEEP.has(o)||PICK.has(o)||SKIP.has(o)||!o.visible||!!o.userData.isHuman;   // человек — граница: его реквизит (планшет, телефон) и снаряжение двигаются с позой (14.10: планшет «приваривался» в позе при загрузке)
  Object.values(G).forEach(g=>{ if(g&&g.isObject3D&&!SKIP.has(g)) containers.push(g); });
  PICK.forEach(o=>{ if(!SKIP.has(o)&&!o.isMesh&&!o.userData.isHuman) containers.push(o); }); KEEP.forEach(o=>{ if(!SKIP.has(o)&&!o.isMesh) containers.push(o); });
  const done=new Set(), _m=new THREE.Matrix4(), _inv=new THREE.Matrix4(), _n=new THREE.Matrix3(), _v=new THREE.Vector3();
  let made=0;
  for(const C of containers){
    if(done.has(C)) continue; done.add(C);
    if(!C.visible) { let hidden=false; }
    /* сетки контейнера, не пересекая границ */
    const list=[]; (function walk(o){ for(const ch of o.children){ if(ch!==C&&isBoundary(ch)) continue; if(mergeable(ch)) list.push(ch); if(ch.children.length) walk(ch); } })(C);
    if(list.length<2) continue;
    _inv.copy(C.matrixWorld).invert();
    const B=new Map();
    for(const o of list){
      const g=o.geometry, ms=Array.isArray(o.material)?o.material:[o.material];
      const sig=Object.keys(g.attributes).filter(k=>['position','normal','uv','uv2','color'].includes(k)).sort().map(k=>k+g.attributes[k].itemSize).join(',');
      const ranges=Array.isArray(o.material)?g.groups.map(gr=>({m:ms[gr.materialIndex],s:gr.start,c:gr.count})):[{m:ms[0],s:0,c:g.index?g.index.count:g.attributes.position.count}];
      _m.multiplyMatrices(_inv,o.matrixWorld); _n.getNormalMatrix(_m); const flip=_m.determinant()<0;
      const per=new Map(); ranges.forEach(r=>{ if(!r.m||r.c<=0) return; const k=r.m.uuid+'|'+sig+'|'+(o.castShadow?1:0)+(o.receiveShadow?1:0); if(!per.has(k)) per.set(k,[]); per.get(k).push(r); });
      for(const [k,rs] of per){ let b=B.get(k); if(!b){ b={m:rs[0].m,sig,cast:o.castShadow,recv:o.receiveShadow,parts:[],nv:0,ni:0}; B.set(k,b); }
        const ni=rs.reduce((a,r)=>a+r.c,0); b.parts.push({g,mat:_m.clone(),nm:_n.clone(),rs,flip}); b.nv+=g.attributes.position.count; b.ni+=ni; }
    }
    for(const b of B.values()){
      const names=b.sig.split(',').map(s=>s.replace(/\d+$/,'')), A={}; names.forEach(n=>{ const it=b.parts[0].g.attributes[n].itemSize; A[n]=new Float32Array(b.nv*it); });
      const idx=(b.nv>65535?new Uint32Array(b.ni):new Uint16Array(b.ni)); let vo=0, io=0;
      for(const p of b.parts){ const g=p.g, n=g.attributes.position.count;
        const P=g.attributes.position; for(let i=0;i<n;i++){ _v.fromBufferAttribute(P,i).applyMatrix4(p.mat); A.position[(vo+i)*3]=_v.x; A.position[(vo+i)*3+1]=_v.y; A.position[(vo+i)*3+2]=_v.z; }
        if(A.normal){ const N=g.attributes.normal; for(let i=0;i<n;i++){ _v.fromBufferAttribute(N,i).applyMatrix3(p.nm).normalize(); A.normal[(vo+i)*3]=_v.x; A.normal[(vo+i)*3+1]=_v.y; A.normal[(vo+i)*3+2]=_v.z; } }
        for(const nm of ['uv','uv2','color']) if(A[nm]){ const S=g.attributes[nm], it=S.itemSize; for(let i=0;i<n;i++) for(let c=0;c<it;c++) A[nm][(vo+i)*it+c]=S.getComponent?S.getComponent(i,c):S.array[i*it+c]; }
        const I=g.index;
        for(const r of p.rs){ for(let j=0;j+2<r.c;j+=3){ const a=I?I.getX(r.s+j):r.s+j, bb=I?I.getX(r.s+j+1):r.s+j+1, cc=I?I.getX(r.s+j+2):r.s+j+2;
            idx[io++]=vo+a; if(p.flip){ idx[io++]=vo+cc; idx[io++]=vo+bb; } else { idx[io++]=vo+bb; idx[io++]=vo+cc; } } }
        vo+=n; }
      const geo=new THREE.BufferGeometry(); names.forEach(nm=>geo.setAttribute(nm,new THREE.BufferAttribute(A[nm],b.parts[0].g.attributes[nm].itemSize)));
      geo.setIndex(new THREE.BufferAttribute(idx.subarray(0,io),1)); geo.computeBoundingSphere(); geo.computeBoundingBox();
      const mesh=new THREE.Mesh(geo,b.m); mesh.castShadow=b.cast; mesh.receiveShadow=b.recv; mesh.name='batch'; mesh.userData.batch=true;
      C.add(mesh); made++;
    }
    for(const o of list) if(o.parent) o.parent.remove(o);          // всё из списка вошло в объединённые сетки
  }
  let after=0; scene.traverse(o=>{ if(o.isMesh) after++; });
  Object.assign(BATCH,{on:true,before,after,made,ms:Math.round(performance.now()-t0)});
  renderer.shadowMap.needsUpdate=true;
}
batchStatic();
