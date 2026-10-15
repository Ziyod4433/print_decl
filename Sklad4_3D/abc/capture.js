/* ===================== ВАРИАНТЫ ХРАНЕНИЯ A/B/C (Buraq 2026): ЗАХВАТ ТЕКУЩЕЙ ПЛАНИРОВКИ =====================
   Вставляется перед слиянием геометрии (batchStatic). Всё, что относится к нынешней планировке в зоне хранения
   (ячейки, стоечные поддоны, проезды, разметка, приёмка у Л2) переносится в группу ZCUR — она сливается отдельно и при выборе
   варианта A, B или C скрывается; оборудование, люди и подписи остаются в своих группах и прячутся поштучно (ZCUR.userData.inPlace). Колонны, стены, ворота, кровля,
   здание охраны, зона DWS и пост П2 не трогаются. */
{
  const zc=new THREE.Group(); zc.name='zcur'; scene.add(zc); window.ZCUR=zc;   // сама группа — не контейнер слияния, контейнеры — её подгруппы (G.zc_*)
  const R1={x0:0.3,x1:47.75,z0:12.3,z1:35.42}, R2={x0:0.3,x1:21.2,z0:6.75,z1:12.3};
  const inR=(x,z)=>[R1,R2].some(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1);
  const b=new THREE.Box3(), c=new THREE.Vector3(); scene.updateMatrixWorld(true);
  const bbox=o=>{ b.makeEmpty(); o.traverse(m=>{ if(m.isMesh||m.isSprite||m.isInstancedMesh) b.expandByObject(m); }); return b; };
  const take=[], sub={};                                   // по подгруппе на исходную группу: слои панели «Слои» продолжают их включать
  const scan=(g,test)=>{ if(!g) return; const key=Object.keys(G).find(k=>G[k]===g);
    g.children.slice().forEach(o=>{ const bb=bbox(o); if(bb.isEmpty()) return; bb.getCenter(c); if(test(o,bb,c)) take.push([o,key]); }); };
  const centre=(o,bb,c)=>inR(c.x,c.z)&&(bb.max.x-bb.min.x)<60&&(bb.max.z-bb.min.z)<60;
  [G.floorgfx,G.addr,G.labels,G.roles,G.dims].forEach(g=>scan(g,centre));
  scan(G.struct,(o,bb,c)=>{ if(!centre(o,bb,c)) return false; if(bb.max.y-bb.min.y>6.5) return false;          // колонны (до кровли) остаются
    return [R1,R2].some(r=>bb.min.x>=r.x0-0.05&&bb.max.x<=r.x1+0.05&&bb.min.z>=r.z0-0.6&&bb.max.z<=r.z1+0.05); });
  scan(G.equip,(o,bb,c)=>centre(o,bb,c)&&o!==(typeof CHOCKS!=='undefined'?CHOCKS:null)&&!(o.userData&&o.userData.H&&o.userData.H.role==='ОХРАННИК')
    &&!(/^fire/.test(o.userData.eid||'')&&c.z<12));                                    // пожарные шкафы у южных колонн остаются (у колонн зоны хранения — уходят: в рядах стеллажей)
  scan(G.people,(o,bb,c)=>centre(o,bb,c)&&!(o.userData.H&&o.userData.H.role==='ОХРАННИК'));
  /* люди, подписи, адреса и размеры не сливаются (batchStatic их пропускает) — остаются в своих группах, слои «Слои» их включают;
     вариант прячет их поштучно (inPlace). Разметка пола, конструкции и оборудование — в подгруппы G.zc_*: сливаются отдельно */
  /* оборудование тоже остаётся в G.equip (каждый объект — выбираемый, не сливается; фильм и живой процесс ищут там «Запас пустых стоек») */
  const inPlace=[], STAY=new Set(['people','labels','roles','addr','dims','equip']), I=new THREE.Matrix4();
  take.forEach(([o,key])=>{ if(STAY.has(key)){ inPlace.push(o); return; }
    if(!sub[key]){ sub[key]=new THREE.Group(); sub[key].name='zcur-'+key; zc.add(sub[key]); G['zc_'+key]=sub[key]; }
    if(o.parent.matrixWorld.equals(I)) sub[key].add(o); else sub[key].attach(o); });   // add, а не attach: attach раскладывает поворот 180° в (π, 0, π) — rotation.y читался бы как 0
  zc.userData.sub=sub; zc.userData.inPlace=inPlace; zc.userData.n=take.length;
}
