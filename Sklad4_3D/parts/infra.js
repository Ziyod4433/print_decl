/* ---------- свет и инженерка под кровлей: пятна света ламп, спринклеры, кабельные лотки ---------- */
{
  const lt=(()=>{ const c=cnv(128,128),g=c.getContext('2d');
    const gr=g.createRadialGradient(64,64,0,64,64,64);
    gr.addColorStop(0,'rgba(255,238,205,1)'); gr.addColorStop(.35,'rgba(255,232,196,.55)');
    gr.addColorStop(.7,'rgba(255,228,190,.14)'); gr.addColorStop(1,'rgba(255,228,190,0)');
    g.fillStyle=gr; g.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); })();
  const pm=new THREE.MeshBasicMaterial({map:lt,transparent:true,opacity:.17,blending:THREE.AdditiveBlending,
    depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false});
  const pos=[]; for(let x=5;x<W;x+=7.5) for(let z=4;z<D;z+=5.5) pos.push([x,z]);
  const im=new THREE.InstancedMesh(new THREE.PlaneGeometry(7.4,7.4),pm,pos.length);
  const d=new THREE.Object3D();
  pos.forEach((p,i)=>{ d.position.set(p[0],0.007,p[1]); d.rotation.set(-Math.PI/2,0,0); d.updateMatrix(); im.setMatrixAt(i,d.matrix); });
  im.castShadow=im.receiveShadow=false; G.roof.add(im);
  /* спринклерная система: три магистрали вдоль зала, ветки через 3,5 м, оросители */
  const red=std(0xb3261e,.5,.3), mains=[8.05,24.05,40.05];
  mains.forEach(x=>{ const y=roofY(x)-1.32; cyl(0.056,D-0.6,red,x,y,D/2,G.roof,12).rotation.x=Math.PI/2;
    for(let z=3.55;z<D;z+=PITCH) box(0.04,0.95,0.04,M.galv,x,y+0.5,z,G.roof); });   // подвесы
  const br=[], hd=[];
  for(let z=1.8;z<D-1;z+=3.525) mains.forEach(x=>{ br.push([x,z]); for(const k of [-2,-1,1,2]) hd.push([x+k*1.85,z]); });
  const bI=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.024,0.024,7.6,8),red,br.length);
  const hI=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.034,0.012,0.09,8),M.galv,hd.length);
  br.forEach((p,i)=>{ d.position.set(p[0],roofY(p[0])-1.32,p[1]); d.rotation.set(0,0,Math.PI/2); d.updateMatrix(); bI.setMatrixAt(i,d.matrix); });
  hd.forEach((p,i)=>{ d.position.set(p[0],roofY(p[0])-1.4,p[1]); d.rotation.set(0,0,0); d.updateMatrix(); hI.setMatrixAt(i,d.matrix); });
  bI.castShadow=hI.castShadow=true; G.roof.add(bI,hI);
  /* кабельные лотки вдоль линий колонн */
  COLX.forEach(x=>{ const y=roofY(x)-1.75;
    box(0.32,0.07,D-0.4,M.galv,x+0.75,y,D/2,G.roof);
    for(const s of [-1,1]) box(0.012,0.12,D-0.4,M.galv,x+0.75+s*0.16,y+0.04,D/2,G.roof).castShadow=false; });
}
/* ---------- пожарные шкафы у колонн (красные, как на объекте) ---------- */
[[16.05,COLZ[0]+0.52,0],[32.05,COLZ[0]+0.52,0],[16.05,COLZ[2]-0.52,Math.PI],[32.05,COLZ[2]-0.52,Math.PI]].forEach((p,i)=>{
  const g=grp(p[0],0,p[1]); g.rotation.y=p[2];
  const rd=std(0xc8221c,.45,.25);
  rbox(0.7,1.5,0.26,0.03,rd,0,0.85,0,g);
  box(0.62,1.36,0.012,std(0xe7ebee,.15,.3,{transparent:true,opacity:.55}),0,0.87,0.132,g).castShadow=false;
  box(0.46,0.14,0.012,M.white,0,1.42,0.14,g).castShadow=false;
  const hose=mesh(new THREE.TorusGeometry(0.2,0.05,8,20),std(0xd9d3c3,.8,0),0,1.0,0.03,g); hose.castShadow=false;
  cyl(0.085,0.5,std(0xd23b2c,.45,.2),-0.16,0.42,0.04,g,14);                 // огнетушитель
  box(0.7,0.06,0.28,M.dark,0,0.07,0,g);
  g.userData.eid='fire'+i;                                               // свой ID: не сдвигает нумерацию исходных объектов
  if(i===0) tag(g,{t:'Пожарный шкаф с рукавом и огнетушителем',q:'4 шт · у колонн внутренних рядов',
    n:'Красные шкафы уже стоят на объекте у колонн. Правило разметки: перед шкафом красная зона 1 × 1 м, ничего не ставится, даже на минуту.',
    k:'fire hose cabinet / пожарный шкаф / 消火栓箱'});
  else tag(g,{t:'Пожарный шкаф',q:'у колонны',n:'Зона 1 × 1 м перед шкафом свободна всегда.',k:'fire hose cabinet / 消火栓箱'});
});
