/* --------------------------------------------------------- environment */
/* окружение для отражений и рассеянного света: как внутри реального цеха —
   тёмная кровля с рядами светильников, светлые стены с ленточным остеклением, серый бетонный пол */
{
  const s=new THREE.Scene(); s.background=new THREE.Color(0x2c3034);
  const bm=(c,k)=>{ const m=new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}); if(k) m.color.multiplyScalar(k); return m; };
  const put=(m,w,h,d,x,y,z)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); o.position.set(x,y,z); s.add(o); return o; };
  put(bm(0x7a7c7e),60,.2,60,0,-5,0);                                   // пол
  put(bm(0x8f9396),60,9,.2,0,0,-24); put(bm(0x8f9396),60,9,.2,0,0,24);  // стены
  put(bm(0x8f9396),.2,9,60,-24,0,0); put(bm(0x8f9396),.2,9,60,24,0,0);
  put(bm(0xcfe0f2,1.5),60,1.2,.3,0,5,-23.8); put(bm(0xcfe0f2,1.5),60,1.2,.3,0,5,23.8);   // ленточное остекление
  put(bm(0xcfe0f2,1.5),.3,1.2,60,-23.8,5,0); put(bm(0xdbe8f7,1.9),.3,1.2,60,23.8,5,0);
  put(bm(0xa9aeb3),60,.2,60,0,8,0);                                    // кровля: светлый профнастил, подсвечен отражённым от пола светом
  for(let x=-18;x<=18;x+=6) for(let z=-18;z<=18;z+=6) put(bm(0xfff4e2,6),1.0,.1,1.0,x,7.6,z);   // светильники
  for(const x of [-16,-4,4,16]) put(bm(0xe6eef7,3.2),2,.1,50,x,7.8,0);                          // световые фонари (как в кровле зала)
  const pm=new THREE.PMREMGenerator(renderer);
  scene.environment=pm.fromScene(s,0.02).texture; pm.dispose();
  s.traverse(o=>{ if(o.geometry) o.geometry.dispose(); });
}
