/* ---------- стоечный поддон (stack rack / post pallet, 巧固架): штабелируемая стойка под короба ----------
   По образцу складных стоек: основание 1500 × 1500 из профильной трубы 60 × 60 с сетчатым настилом,
   четыре съёмные стойки в угловых стаканах, сверху — чаши-ловители, снизу — опоры, которые садятся
   в чаши нижней стойки. Петли под вилы с двух сторон. Клиренс под вилы 115 мм, шаг яруса 1,53 м. */
const RACK={W:1.5,D:1.5,H:1.60,PITCH:1.53,UND:0.115,Y0:0.19,P:0.72,KG:75};
const RACKTEX=(function(){                                   // порошковая окраска с потёртостями, сколами и грязью у кромок
  const R=LOOK.R, s=256, c=cnv(s,s), g=c.getContext('2d'), r=cnv(s,s), q=r.getContext('2d');
  g.fillStyle='#f58a26'; g.fillRect(0,0,s,s); q.fillStyle='rgb(0,112,76)'; q.fillRect(0,0,s,s);          // G — шероховатость, B — металличность
  for(let i=0;i<900;i++){ g.fillStyle=`rgba(${R()<.5?255:60},${R()<.5?160:40},20,${R()*.05})`; g.fillRect(R()*s,R()*s,2+R()*3,2+R()*3); }
  for(let i=0;i<46;i++){ const x=R()*s,y=R()*s,l=8+R()*60,a=(R()-.5)*0.5+(R()<.5?0:1.57);
    g.strokeStyle=`rgba(255,196,150,${.18+R()*.25})`; g.lineWidth=.6+R()*1.4; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); g.stroke();
    q.strokeStyle='rgba(0,70,120,.5)'; q.lineWidth=1; q.beginPath(); q.moveTo(x,y); q.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); q.stroke(); }
  for(let i=0;i<30;i++){ const x=R()*s,y=(R()<.6?(R()<.5?R()*18:s-R()*18):R()*s),w=2+R()*7,h=2+R()*5;       // сколы до металла — чаще у кромок
    g.fillStyle=`rgba(${70+R()*40|0},${66+R()*30|0},${62+R()*20|0},.9)`; g.fillRect(x,y,w,h); g.fillStyle='rgba(120,52,14,.5)'; g.fillRect(x-1,y+h,w+2,1.5);
    q.fillStyle='rgb(0,90,230)'; q.fillRect(x,y,w,h); }
  const e=g.createLinearGradient(0,0,0,s); e.addColorStop(0,'rgba(50,28,10,.22)'); e.addColorStop(.08,'rgba(50,28,10,0)'); e.addColorStop(.92,'rgba(50,28,10,0)'); e.addColorStop(1,'rgba(50,28,10,.26)');
  g.fillStyle=e; g.fillRect(0,0,s,s);
  return {map:LOOK.tex(c,1,1,true),rm:LOOK.tex(r,1,1)}; })();
M.rackOr=new THREE.MeshStandardMaterial({color:0xffffff,map:RACKTEX.map,roughnessMap:RACKTEX.rm,metalnessMap:RACKTEX.rm,roughness:1,metalness:1,envMapIntensity:.9});
M.rackGalv=std(0xdfe4e8,.38,.7,{envMapIntensity:1.0});       // оцинкованная сетка настила
M.rackOr.name='RACK'; M.rackGalv.name='RACKGALV'; M.rackOr.side=THREE.DoubleSide;         // чаши открыты сверху — видна внутренняя сторона
function mergeGeos(list){
  let n=0; list.forEach(g=>n+=g.attributes.position.count);
  const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2); let o=0;
  list.forEach(g=>{ P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3);
    if(g.attributes.uv) U.set(g.attributes.uv.array,o*2); o+=g.attributes.position.count; });
  const G2=new THREE.BufferGeometry();
  G2.setAttribute('position',new THREE.BufferAttribute(P,3)); G2.setAttribute('normal',new THREE.BufferAttribute(N,3));
  G2.setAttribute('uv',new THREE.BufferAttribute(U,2)); return G2;
}
const RACKGEO=(function(){
  const or=[], gv=[], P=RACK.P;
  const add=(L,geo,x,y,z)=>{ const g=geo.index?geo.toNonIndexed():geo; g.computeVertexNormals(); g.translate(x,y,z); L.push(g); };
  const bx=(L,w,h,d,x,y,z)=>add(L,new THREE.BoxGeometry(w,h,d),x,y,z);
  const fr=(L,wt,wb,h,x,y,z,open)=>{ const g=new THREE.CylinderGeometry(wt*0.7071,wb*0.7071,h,4,1,!!open); g.rotateY(Math.PI/4); add(L,g,x,y,z); };
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    fr(or,0.07,0.044,0.04,sx*P,0.02,sz*P);                       // опора: конус-ловитель
    bx(or,0.07,0.075,0.07,sx*P,0.0775,sz*P);                     // опора: стойка
    bx(or,0.088,0.25,0.088,sx*P,0.24,sz*P);                      // угловой стакан
    bx(or,0.06,1.335,0.06,sx*P,0.8325,sz*P);                     // стойка 60 × 60
    fr(or,0.17,0.07,0.10,sx*P,1.55,sz*P,true);                   // чаша под опору верхнего яруса
    bx(or,0.085,0.008,0.085,sx*P,1.526,sz*P);                    // дно чаши
    bx(or,0.012,0.012,0.17,sx*P+0.085,1.6,sz*P); bx(or,0.012,0.012,0.17,sx*P-0.085,1.6,sz*P);   // отбортовка чаши
    bx(or,0.17,0.012,0.012,sx*P,1.6,sz*P+0.085); bx(or,0.17,0.012,0.012,sx*P,1.6,sz*P-0.085);
  }
  for(const s of [-1,1]){
    bx(or,1.5,0.06,0.06,0,0.145,s*P);                           // рама: продольные
    bx(or,0.06,0.06,1.38,s*P,0.145,0);                          // рама: поперечные
    for(const fx of [-0.3,0.3]){                                // петли под вилы
      bx(or,0.012,0.082,0.05,fx-0.114,0.076,s*P); bx(or,0.012,0.082,0.05,fx+0.114,0.076,s*P);
      bx(or,0.24,0.012,0.05,fx,0.041,s*P); }
  }
  for(const x of [-0.36,0,0.36]) bx(or,0.04,0.05,1.38,x,0.15,0);  // лаги под настилом
  bx(or,1.38,0.05,0.04,0,0.15,0);
  for(const sx of [-1,1]) for(const sz of [-1,1]){                 // косынки в углах рамы и фиксаторы стоек
    const k=new THREE.BoxGeometry(0.16,0.008,0.16); k.rotateY(Math.PI/4); k.scale(1,1,0.5); add(or,k,sx*(P-0.09),0.178,sz*(P-0.09));
    const pin=new THREE.CylinderGeometry(0.011,0.011,0.11,8); pin.rotateZ(Math.PI/2); add(or,pin,sx*P,0.33,sz*P); }
  for(let i=0;i<23;i++) bx(gv,1.40,0.006,0.006,0,0.178,-0.66+i*0.06);    // настил: сетка 60 × 110
  for(let i=0;i<13;i++) bx(gv,0.006,0.006,1.40,-0.66+i*0.11,0.184,0);
  return {or:mergeGeos(or),gv:mergeGeos(gv)};
})();
const RACKPLATE=(function(){ const c=cnv(128,192), g=c.getContext('2d'); g.fillStyle='#f4f5f2'; g.fillRect(0,0,128,192); g.fillStyle='#1f48a8'; g.fillRect(0,0,128,46);
  g.fillStyle='#fff'; g.font='700 30px "Barlow Condensed",sans-serif'; g.textAlign='center'; g.fillText('BURAQ',64,34);
  g.fillStyle='#14161a'; g.font='700 40px "Barlow Condensed",sans-serif'; g.fillText('1000 кг',64,92); g.font='600 22px "Barlow Condensed",sans-serif'; g.fillText('ярусов ≤ 4',64,124);
  g.font='500 17px monospace'; g.fillText('1500×1500×1600',64,152); g.fillText('BRQ-R · QC ✓',64,176);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=ANISO;
  return {geo:new THREE.PlaneGeometry(0.066,0.1),mat:new THREE.MeshStandardMaterial({map:t,roughness:.45,metalness:.1})}; })();
/* раскладка стойки: 20 коробов. Тяжёлое вниз: 4 D → 4 B → 6 A; спереди — колонка 3 C и колонка 3 A.
   Порядок = порядок укладки (снизу вверх); спереди (+z) — сторона петель, откуда берёт погрузчик. */
const RSLOT=(function(){
  const y=RACK.Y0, S=[];
  /* между соседними коробами зазор ~12 мм: короба стоят с небольшим разбросом и не должны входить друг в друга */
  /* по вертикали — 4 мм между коробами: грани не совпадают, картинка не «мерцает» */
  for(const z of [-0.476,0.036]) for(const x of [-0.306,0.306]) S.push({x,y,z,ti:3});           // 0–3   D
  for(let k=0;k<3;k++) S.push({x:0.212,y:y+k*0.354,z:0.5,ti:2});                                   // 4–6   C (колонка спереди)
  for(const z of [-0.426,-0.014]) for(const x of [-0.306,0.306]) S.push({x,y:y+0.504,z,ti:1});  // 7–10  B
  for(let k=0;k<3;k++) S.push({x:-0.41,y:y+k*0.304,z:0.5,ti:0});                                   // 11–13 A (колонка спереди)
  for(const z of [-0.376,-0.064]) for(const x of [-0.412,0,0.412]) S.push({x,y:y+0.908,z,ti:0}); // 14–19 A (верх)
  return S;
})();
function rackFrame(p,x,y,z,o){                                // пустая стойка; o.ao===false — без контактной тени
  const g=new THREE.Group(); g.position.set(x||0,y||0,z||0); if(p) p.add(g);
  g.userData.nm='Стоечный поддон 1500 × 1500 × 1600'; g.userData.rack=true;
  const a=new THREE.Mesh(RACKGEO.or,M.rackOr), b=new THREE.Mesh(RACKGEO.gv,M.rackGalv);
  a.castShadow=a.receiveShadow=b.castShadow=b.receiveShadow=true; g.add(a); g.add(b);
  for(const [px,pz,ry] of [[-RACK.P,RACK.P+0.0455,0],[RACK.P,-RACK.P-0.0455,Math.PI]]){     // табличка грузоподъёмности на стакане стойки
    const pl=new THREE.Mesh(RACKPLATE.geo,RACKPLATE.mat); pl.position.set(px,0.27,pz); pl.rotation.y=ry; g.add(pl); }
  if(!(o&&o.ao===false)&&!(y>0.01)) ao(1.75,1.75,0,0,g);
  return g;
}
function rackFill(g,n,R,cl){                                  // первые n коробов раскладки (по умолчанию все 20); cl — клиент: его SKU, высоты рядов по фактическим коробам
  R=R||LOOK.R; n=n===undefined?RSLOT.length:n;
  const sk=cl===undefined||cl===null?null:rackSkus(cl), ys=sk?slotYs(sk.map(si=>SKUS[si].h)):null;
  for(let i=0;i<n;i++){ const q=RSLOT[i], m=sk?skuMesh(sk[i]):cartonMesh(q.ti);
    m.position.set(q.x+(R()-.5)*0.008,sk?ys[i]:q.y,q.z+(R()-.5)*0.008); m.rotation.y=(R()-.5)*0.02; g.add(m); }   // три вызова R() на короб — как раньше (общий генератор)
  return g;
}
function rackStack(p,tiers,fill,day,o){                       // штабель стоек: tiers ярусов, fill — доля загрузки верхнего
  const g=new THREE.Group(); if(p) p.add(g); g.userData.tiers=[];
  for(let i=0;i<tiers;i++){ const r=rackFrame(g,0,i*RACK.PITCH,0,o);
    const n=fill===0?0:(i<tiers-1?20:Math.max(4,Math.round(20*(fill===undefined?1:fill))));
    if(n) rackFill(r,n,undefined,o&&o.cl!==undefined?o.cl:undefined);       // оба яруса ячейки — одна отправка
    if(day!==undefined&&n){ const tg=dayTag(r,-0.5,1.24,0.765,day); r.userData.tag=tg; }
    g.userData.tiers.push(r); }
  g.userData.nm='Стоечные поддоны · '+tiers+' яруса';
  return g;
}
function cellRack(c,tiers,day,idx){
  const cx=(c.x0+c.x1)/2, cz=(c.z0+c.z1)/2-(c.row==='B'?0.75:0);   // ряд B: стойка в глубине ячейки, у северной магистрали остаётся место для дуги погрузчика
  const g=rackStack(G.equip,tiers,[1,0.7,0.55,1,0.7][idx%5],day,{cl:(idx*5)%CLIENTS.length});   // ячейка — одна отправка (клиент), соседние ячейки — разные
  g.position.set(cx,0,cz); g.rotation.y=c.row==='A'?Math.PI:0;                     // петли и бирка — к своему проезду
  tag(g,{t:'Стоечные поддоны в ячейке '+c.id, q:'ярусов: '+tiers+' · бирка дня приёмки: '+DAYN[day],
    n:'Короба лежат не на паллете под плёнкой, а в стоечном поддоне: стойки несут верхний ярус, поэтому груз не давится, а ячейка вмещает два яруса вместо одного. В одной ячейке оба яруса — одного дня приёмки, поэтому FIFO не ломается: ячейка уходит целиком, сначала верхняя стойка, потом нижняя. Бирка цвета дня висит на каждой стойке.',
    k:'stack rack / post pallet / стоечный поддон штабелируемый / 巧固架 堆垛架'});
  return g;
}
