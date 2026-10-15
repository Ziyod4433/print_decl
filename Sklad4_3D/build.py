#!/usr/bin/env python3
"""Сборка модели: исходный файл заказчика base/Sklad4_realistic.html + модули parts/*.js + модуль фильма и живого
процесса film/*.js + встроенные ресурсы (assets/, vendor/) → один автономный HTML.
Запуск:  python3 build.py            → Sklad4_realistic_film.html рядом с этим скриптом
         python3 build.py out.html   → в указанный файл
Правки вносятся строковыми заменами rep()/cut(): каждая проверяет, что искомый кусок найден ровно нужное число раз,
иначе сборка падает с сообщением — так видно, какая правка перестала совпадать с основой."""
import re, sys, os, glob
ROOT=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(ROOT,'base','Sklad4_realistic.html')
ARGS=[a for a in sys.argv[1:] if not a.startswith('--')]
ABC='--abc' in sys.argv                                       # сборка с вариантами хранения A/B/C (abc/*.js)
OUT=ARGS[0] if ARGS else os.path.join(ROOT,'Sklad4_variants_ABC.html' if ABC else 'Sklad4_realistic_film.html')
P=os.path.join(ROOT,'parts')+os.sep
s=open(SRC,encoding='utf-8').read()
part=lambda n: open(P+n,encoding='utf-8').read()
film=lambda: ''.join(open(f,encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(ROOT,'film','*.js'))))   # модуль фильма: файлы film/ склеиваются по порядку номеров

def rep(a,b,cnt=1):
    global s
    n=s.count(a)
    assert n==cnt, f'ожидалось {cnt}, найдено {n}: {a[:90]!r}'
    s=s.replace(a,b)
def cut(start,end,new):
    """заменить кусок от start (включительно) до end (не включая)"""
    global s
    i=s.index(start); j=s.index(end,i)
    s=s[:i]+new+s[j:]

# ---------- 1. тон и материалы ----------
rep("renderer.toneMappingExposure = 1.0;","renderer.toneMappingExposure = 0.95;")
rep("const renderer = new THREE.WebGLRenderer({antialias:true, preserveDrawingBuffer:true});",
    "const renderer = new THREE.WebGLRenderer({antialias:!window.__noAA, preserveDrawingBuffer:true});   // __noAA — только для покадрового экспорта")
rep("renderer.toneMappingExposure=evening?0.85:1.0;","renderer.toneMappingExposure=evening?0.82:0.95;")
rep("const hemi=new THREE.HemisphereLight(0xa8c4e0,0x5b5347,0.55); scene.add(hemi);",
    "const hemi=new THREE.HemisphereLight(0xa8c4e0,0x4d463c,0.5); scene.add(hemi);")
rep("hemi.intensity=evening?0.28:0.55;","hemi.intensity=evening?0.26:0.5;")
rep("g.fillStyle='#2b2f34'; g.fillRect(0,0,s,s); noise(g,s,s,30000,.16); return T(c,208,208);",
    "g.fillStyle='#30343a'; g.fillRect(0,0,s,s); noise(g,s,s,26000,.09); return T(c,260,260);")
rep("M.cabPaint=std(0xdfe4e8,.4,.4); M.chrome=std(0xd8dde2,.2,1.0); M.fenderM=std(0x2f353c,.7,.2,{side:THREE.DoubleSide});",
    "M.cabPaint=std(0xdfe4e8,.4,.4); M.chrome=std(0xd8dde2,.2,1.0); M.fenderM=std(0x2f353c,.7,.2,{side:THREE.DoubleSide});\n"
    "/* материалы для людей, погрузчика, ворот и плёнки */\n"
    "M.boot=std(0x2b2a28,.75,.05); M.rubberSole=std(0x141517,.95,0); M.glove=std(0xd9b441,.85,0);\n"
    "M.helmet=std(0xf5c518,.32,.05,{envMapIntensity:1.1}); M.cloth=std(0x2d3746,.9,0); M.pants=std(0x28303c,.88,0);\n"
    "M.fkOrange=std(0xdc5a12,.5,.1,{envMapIntensity:0.8}); M.fkGrey=std(0x3a4047,.55,.35); M.fkMat=std(0x1b1d20,.95,0);\n"
    "M.doorPanel=std(0xe6e9ec,.42,.35); M.doorRib=std(0xc3c9cf,.5,.35); M.doorGlass=std(0x1f2d3b,.08,.6,{envMapIntensity:1.6});\n"
    "M.filmSheet=std(0xe4ecf2,.3,.02,{transparent:true,opacity:.45,side:THREE.DoubleSide});")

# ---------- 2. люди и погрузчик ----------
cut("function forklift(x,z,rot){","function palletJack(",part('forklift.js'))
cut("function person(x,z,rot,pose,role,p){","\n/* ============================== ЗДАНИЕ ОХРАНЫ",part('human.js').replace('/*__MOCAP__*/null',open(os.path.join(ROOT,'assets','mocap_v2.json'),encoding='utf-8').read()).replace('  /*__RPM_CORE__*/',part('rpm_core.js'))+'\n'+part('person2.js'))

# ---------- 3. ворота: вместо белых планок — секционные полотна ----------
rep("""    for(let i=0;i<4;i++)
      box(0.12,0.42,gw-0.1,M.white,xFix+inwardSign*0.24,GATE_H-0.28-i*0.46,cz,G.walls);
""","")
rep("wallSide(0,+1); wallSide(W,-1);","wallSide(0,+1); wallSide(W,-1);\n"+part('doors.js'))
rep("""  box(4.4,0.42,0.5,M.white,0,GATE_H+0.55,0,g);
  for(let j=0;j<10;j++) box(0.34,0.06,0.42,M.dark,-1.9+j*0.42,GATE_H+0.35,0,g);
  box(0.5,0.3,0.3,M.steelDark,2.4,GATE_H+0.55,0,g);""",
"""  box(4.4,0.42,0.5,M.white,0,GATE_H+1.35,0,g);                      // завеса выше направляющих ворот
  for(let j=0;j<10;j++) box(0.34,0.06,0.42,M.dark,-1.9+j*0.42,GATE_H+1.15,0,g);
  box(0.5,0.3,0.3,M.steelDark,2.4,GATE_H+1.35,0,g);""")

# ---------- 4. свет, спринклеры, лотки, пожарные шкафы ----------
rep("/* боковые стены x=0 и x=48 — с двумя воротами каждая */",part('infra.js')+"\n/* боковые стены x=0 и x=48 — с двумя воротами каждая */")

# ---------- 5. обмотчик: заменяем только его блок; запас поддонов и упаковщик — как в исходнике ----------
i=s.index("/* ---------- [4] юнитизация ---------- */"); j=s.index("{ const g=grp(14.4,0,12.3);",i)
s=s[:i]+part('wrapper.js')+s[j:]

# ---------- 6. ссылки на статичные объекты, которые фильм временно убирает ----------
rep("tag(forklift(27.5,28.6,-Math.PI/2),{","const FORK0=tag(forklift(27.5,28.6,-Math.PI/2),{")
rep("tag(flatTruck(-6.2,GATES[1].z,11,-1,false,Math.PI/2),","const TRK_L2=tag(flatTruck(-6.2,GATES[1].z,11,-1,false,Math.PI/2),")
rep("tag(flatTruck(-6.2,25.5,11,-1,false,Math.PI/2),","const TRK_Q=tag(flatTruck(-6.2,25.5,11,-1,false,Math.PI/2),")
rep("tag(tandem(51.8,GATES[1].z+4.5,-Math.PI/2),","const TRK_TANDEM=tag(tandem(51.8,GATES[1].z+4.5,-Math.PI/2),")
rep("tagEq(palletJack(45.9,15.6,-1.6,false),10,[45.9,1,15.6],10);\npalletJack(45.9,17.0,-1.6,false);",
    "const JACK_P2a=tagEq(palletJack(45.9,15.6,-1.6,false),10,[45.9,1,15.6],10);\nconst JACK_P2b=palletJack(45.9,17.0,-1.6,false);")
rep("person(43.0,11.2,-1.6,false,'ВОДИТЕЛЬ ПОГРУЗЧИКА');","const MAN_S=person(43.0,11.2,-1.6,false,'ВОДИТЕЛЬ ПОГРУЗЧИКА');")
rep("[[0,3,0],[1,2,1],[3,4,2],[5,2,3],[6,3,1],[8,2,4],[10,3,5],[11,2,6],[13,3,0],[14,2,2],\n [15,3,4],[17,2,3],[18,3,1],[20,2,5],[22,3,2],[24,2,0]]\n  .forEach(p=>{ const c=CELLS[p[0]]; if(c) cellStack(c,p[1],p[2]); });",
    "const CELLSPEC=[[0,3,0],[1,2,1],[3,4,2],[5,2,3],[6,3,1],[8,2,4],[10,3,5],[11,2,6],[12,2,2],[13,3,0],[15,3,4],[17,2,3],[18,3,1],[20,2,5],[22,3,2],[24,2,0]];   // ячейка, ярусов (≥3 — два), день приёмки\n"
    "CELLSPEC.forEach(p=>{ const c=CELLS[p[0]]; if(c) CELLSTACK[p[0]]=cellRack(c,p[1]>=3?2:1,p[2],p[0]); });   // в ячейках — стоечные поддоны, до двух ярусов")
rep("function cellStack(c,layers,day){","const CELLSTACK={};\nfunction cellStack(c,layers,day){")
rep("  dayTag(g,0,0.2+layers*0.40,0.44,day);","  const tg=dayTag(g,0,0.2+layers*0.40,c.row==='A'?-0.44:0.44,day); if(c.row==='A') tg.rotation.y=Math.PI;   // бирка лицом к своему проезду")
# экран DWS доступен фильму
rep("    sc.rotation.x=-0.16; sc.castShadow=false;","    sc.rotation.x=-0.16; sc.castShadow=false; g.userData.dwsScreen=sc;")

# ---------- 6b. стабильные ID редактора ----------
rep("pickables.forEach((o,i)=>{ const id='b'+i; o.userData.eid=id; edMap.set(id,o); });",
    "{ let bi=0; pickables.forEach(o=>{ const id=o.userData.eid||('b'+(bi++)); o.userData.eid=id; if(!o.userData.removed) edMap.set(id,o); });   // новые объекты имеют свой eid и не сдвигают нумерацию исходных\n"
    "  for(let i=pickables.length-1;i>=0;i--){ const o=pickables[i]; if(!o.userData.removed) continue; pickables.splice(i,1); if(o.parent) o.parent.remove(o); } }   // убранные (обмотчик, рольганги): номер занят, объекта нет")

# ---------- 7. цикл отрисовки и размер ----------
rep("function resize(){ const w=view.clientWidth,h=view.clientHeight;",
    "function resize(){ if(typeof FILM!=='undefined'&&FILM.on) return; const w=view.clientWidth,h=view.clientHeight;")
rep("  const dt=Math.min(Math.max((now-prev)/1000,0),0.05); prev=now;",
    "  const dt=Math.min(Math.max((now-prev)/1000,0),0.05); prev=now;\n"
    "  if(FILM.on){ FILM.tick(dt); requestAnimationFrame(loop); return; }\n"
    "  if(!reduceMotion&&G.people.visible){ const tt=now/1000; for(const H of PEOPLE){ if(H.root.parent&&H.root.visible) HUM.pose(H,Object.assign({t:tt},H.base)); } }")
for ev in ["canvas.addEventListener('pointerdown',e=>{","canvas.addEventListener('pointermove',e=>{"]:
    rep(ev, ev+"\n  if(FILM.on) return;")
rep("canvas.addEventListener('wheel',e=>{ e.preventDefault(); if(walk) return;","canvas.addEventListener('wheel',e=>{ e.preventDefault(); if(walk||FILM.on) return;")


# ---------- 10. кино-графика: HDR + постобработка ----------
rep("/* --------------------------------------------------------------- groups */",
    part('post.js')+"\nif(POST.P.on) renderer.toneMapping=THREE.NoToneMapping;   // тон ACES — в финальном проходе\ncamera.layers.enable(1);                                     // слой 1 — подписи поверх кадра\n\n/* --------------------------------------------------------------- groups */")
rep("  s.renderOrder=999; paintLabel(s); allLabels.push(s); return s;","  s.renderOrder=999; s.layers.set(1); paintLabel(s); allLabels.push(s); return s;")
rep("marker.visible=false; scene.add(marker);","marker.visible=false; marker.layers.set(1); scene.add(marker);")
rep("edSelBox.visible=false; scene.add(edSelBox);","edSelBox.visible=false; edSelBox.layers.set(1); scene.add(edSelBox);")
rep("""  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}""","""  POST.P.time=now/1000; POST.P.exposure=G.roof.visible?(walk?1.1:1.0):0.62;   // солнечный вид сверху — ниже экспозиция
  if(POST.P.on) POST.render(scene,camera); else renderer.render(scene,camera);
  requestAnimationFrame(loop);
}""")
rep("""mkBtn('Скачать кадр PNG',true,()=>{
  renderer.render(scene,camera);""","""mkBtn('Скачать кадр PNG',true,()=>{
  if(POST.P.on) POST.render(scene,camera); else renderer.render(scene,camera);""")
rep("const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();","""function setCine(on){                                         // кино-графика вкл/выкл (на слабых ПК — выкл)
  POST.P.on=on&&renderer.capabilities.isWebGL2;
  renderer.toneMapping=POST.P.on?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;
  scene.traverse(o=>{ if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true); });
  renderer.shadowMap.needsUpdate=true;
}
mkBtn('Кино-графика',true,b=>{ setCine(!POST.P.on); b.classList.toggle('on',POST.P.on); },POST.P.on);

const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();""")


# ---------- 11. фотореализм: текстуры, окружение, материалы ----------
i=s.index("/* --------------------------------------------------------- environment */"); j=s.index("{\n  const c=cnv(4,256),g=c.getContext('2d');",i)
s=s[:i]+part('look.js')+"\n"+part('env.js')+"\n"+s[j:]
rep("""  const f=mesh(new THREE.PlaneGeometry(W,D),new THREE.MeshStandardMaterial({
    map:T(concreteCanvas,W/6,D/6),bumpMap:T(concreteCanvas,W/6,D/6,false),bumpScale:.02,
    roughnessMap:T(concreteCanvas,W/6,D/6,false),roughness:1.0,metalness:.02,envMapIntensity:.6}),W/2,0,D/2,G.struct);""",
"""  const fm=new THREE.MeshStandardMaterial({color:new THREE.Color(0.74,0.745,0.75),
    map:LOOK.tex(LOOK.concDetail,W/2.5,D/2.5),bumpMap:LOOK.tex(LOOK.concDetail,W/2.5,D/2.5),bumpScale:.004,
    roughnessMap:LOOK.tex(LOOK.concDetail,W/2.5,D/2.5),roughness:1.25,metalness:0,envMapIntensity:1.0});
  const f=mesh(new THREE.PlaneGeometry(W,D),worldMacro(fm,{map:LOOK.floorMacro,box:[0,0,W,D],k:1,rough:.9}),W/2,0,D/2,G.struct);""")
rep("""  const yMat=new THREE.MeshStandardMaterial({map:asphaltMap,roughness:.95,metalness:0,envMapIntensity:.4});""",
"""  const yMat=worldMacro(new THREE.MeshStandardMaterial({color:new THREE.Color(.25,.255,.26),map:LOOK.tex(LOOK.asphDetail,800,800),
    roughnessMap:LOOK.tex(LOOK.asphDetail,800,800),bumpMap:LOOK.tex(LOOK.asphDetail,800,800),bumpScale:.01,roughness:1.6,metalness:0,envMapIntensity:.5}),
    {map:LOOK.asphMacro,box:LOOK.asphBox,k:1,rough:.5});""")
rep("function box(w,h,d,mat,x,y,z,p){ return mesh(bg(w,h,d),mat,x,y,z,p); }",
    "function box(w,h,d,mat,x,y,z,p){ if(mat===M.carton) mat=LOOK.cartons[(LOOK.R()*LOOK.cartons.length)|0];   // разные короба\n  return mesh(bg(w,h,d),mat,x,y,z,p); }")
rep("""  return new THREE.MeshStandardMaterial({color:PAL.wall, map:T(corrCanvas,len/0.32,1),
    bumpMap:T(corrCanvas,len/0.32,1,false), bumpScale:0.05, roughness:0.55, metalness:0.32, envMapIntensity:0.8});""",
"""  return worldMacro(new THREE.MeshStandardMaterial({color:PAL.wall, map:T(corrCanvas,len/0.32,1),
    bumpMap:T(corrCanvas,len/0.32,1,false), bumpScale:0.05, roughness:0.55, metalness:0.32, envMapIntensity:0.8}),{dirtY:2.2,dirtK:.32});""")
rep("  carton:new THREE.MeshStandardMaterial({map:cartonMap,roughness:.92,metalness:0,envMapIntensity:.5}),",
    "  carton:LOOK.cartons[0],")
rep("""  film:new THREE.MeshStandardMaterial({color:0xd9e6ee,roughness:.25,metalness:0,
    transparent:true,opacity:.34,envMapIntensity:1.2})""",
"""  film:new THREE.MeshStandardMaterial({color:0xe8eef2,roughness:.16,metalness:0,transparent:true,opacity:.26,depthWrite:false,
    envMapIntensity:.45,bumpMap:LOOK.filmBump,bumpScale:.0025})""")
rep("plinth:std(PAL.plinth,.9,.02), wood:std(0xa9834f,.88,0),","plinth:worldMacro(std(PAL.plinth,.9,.02),{dirtY:1.2,dirtK:.3}), wood:std(0xffffff,.86,0,{map:LOOK.wood}),")
rep("conc:std(0xdedcd4,.92,0),","conc:worldMacro(std(0xdedcd4,.92,0),{dirtY:1.6,dirtK:.28}),")
rep("M.woodDark=std(0x8a6a40,.9,0);","M.woodDark=std(0xb7a07c,.9,0,{map:LOOK.wood});")

rep("interior.position.set(24,40,21); scene.add(interior);","interior.position.set(24,40,21); scene.add(interior);\n"
  "const LIGHT={sun:2.6,hemi:.30,inRoof:.40,inOpen:.12};                // баланс под HDR-окружение цеха\n"
  "sun.intensity=LIGHT.sun; hemi.intensity=LIGHT.hemi; interior.intensity=LIGHT.inRoof;")
rep("    if(l[0]==='roof') interior.intensity=inp.checked?1.25:0.22;","    if(l[0]==='roof') interior.intensity=inp.checked?LIGHT.inRoof:LIGHT.inOpen;")
rep("  sun.intensity=evening?0.5:2.2;","  sun.intensity=evening?0.5:LIGHT.sun;")
rep("  hemi.intensity=evening?0.26:0.5;","  hemi.intensity=evening?0.16:LIGHT.hemi;")

# ---------- 12. машины и шины по реальным образцам ----------
i=s.index("function tire(g,x,y,z,r,w,axis){"); j=s.index("\n}\n",i)+3
s=s[:i]+part('trucks_base.js')+s[j:]
i=s.index("/* ============================================================== МАШИНЫ */"); j=s.index("const TRK_L2=tag(flatTruck(-6.2,GATES[1].z",i)
s=s[:i]+part('trucks.js')+"\n"+s[j:]
rep("/* ========================================================= ОБОРУДОВАНИЕ */",part('cargo.js')+"\n"+part('sku.js')+"\n"+part('rack.js')+"\n"+part('dws2.js')+"\n/* ========================================================= ОБОРУДОВАНИЕ */")

rep("  sky.position.set(24,0,20.87); scene.add(sky);\n}","  sky.position.set(24,0,20.87); scene.add(sky);\n}\n"+part('backdrop.js'))

# краска на полу — освещаемая (ложится в тень, ловит AO и блики), а не «наклейка»
rep("""function paintMat(c,o){ return new THREE.MeshBasicMaterial({color:c,transparent:true,
  opacity:o===undefined?1:o,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,toneMapped:false}); }""",
"""function paintMat(c,o){ return new THREE.MeshStandardMaterial({color:c,transparent:true,roughness:.62,metalness:0,envMapIntensity:.6,
  opacity:o===undefined?1:o,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}); }""")
rep("""  decal(w,w/4,new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-3,toneMapped:false}),x,z,0.019,rot||0);""",
"""  decal(w,w/4,new THREE.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,roughness:.62,metalness:0,envMapIntensity:.6,
    polygonOffset:true,polygonOffsetFactor:-3}),x,z,0.019,rot||0);""")

# ---------- 14. убрано по просьбе: паллетообмотчик, рольганги, гибкий конвейер ----------
rep("tagEq(roller(3.6,9.3,5.5,false),6,[3.6,1.4,9.3],13);","tagEq(roller(3.6,9.3,5.5,false),6,[3.6,1.4,9.3],13).userData.removed=true;          // рольганг в кармане Л2 — убран")
rep("tagEq(roller(38.5,15.0,6,false,0.85),6,[38.5,1.2,15.0],12);","tagEq(roller(38.5,15.0,6,false,0.85),6,[38.5,1.2,15.0],12).userData.removed=true;   // рольганг на магистрали — убран")
rep("const eqEl=document.getElementById('eqlist');","delete EQ[3]; delete EQ[6];                                  // обмотчик и рольганг исключены из состава\nconst eqEl=document.getElementById('eqlist');")
rep("const libItemsEl=document.getElementById('libitems'), libParamsEl=document.getElementById('libparams');",
    "delete LIB.flex; delete LIB.wrap; delete LIB.roll;              // гибкий конвейер, обмотчик и рольганг убраны из каталога\nconst libItemsEl=document.getElementById('libitems'), libParamsEl=document.getElementById('libparams');")

# ---------- 15. стоечные поддоны: зона, запас пустых, спецификация, каталог ----------
rep("{id:'4', s:'Юнитизация', n:'Юнитизация', c:PAL.orange,","{id:'4', s:'Стойки', n:'Стоечные поддоны: запас пустых', c:PAL.orange,")
rep("note:'Тяжёлое вниз, углозащита, обмотка от четырёх витков, паллета не выше 1,8 м. Выход прямо на магистраль.',\n   eq:'паллетообмотчик · запас поддонов · бандажные аппараты'},",
    "note:'Пустые стоечные поддоны стоят здесь в два яруса и по одному подаются к концу ленты. Короба собираются сразу в стойку: тяжёлое вниз, лёгкое наверх, плёнка не нужна. Выход прямо на магистраль.',\n   eq:'стоечные поддоны 1500 × 1500 × 1600 · запас пустых'},")
cut("{ const g=grp(14.4,0,12.3);\n  for(let i=0;i<9;i++) pallet(g,0,i*0.155,0);","person(12.2,9.2,-1.6,true,'ГРУЗЧИК-УПАКОВЩИК');",
    "{ const g=grp(14.4,0,12.3);                                // запас пустых стоечных поддонов — два штабеля по два яруса\n"
    "  for(const dx of [0,-1.85]) for(let i=0;i<2;i++) rackFrame(g,dx,i*RACK.PITCH,-0.4);\n"
    "  g.userData.nm='Запас пустых стоечных поддонов';\n"
    "  tagEq(g,20,[13.5,1.6,12.3],9);\n}\n")
rep("E(13,'Термопринтеры ×2 и 2D-сканеры ×4'","E(20,'Стоечные поддоны штабелируемые','40 шт · 1500 × 1500 × 1600 мм · до 1 т · до 4 ярусов','巧固架 / 堆垛架 可折叠','350 – 800 / шт (ориентир)','2 000 – 4 500',\n"
    "  'Заменяют паллету с обмоткой: короба собираются в стойку прямо у ленты, стойки несут верхний ярус, поэтому в ячейке два яруса вместо одного и груз не давится. Пустые складываются и штабелируются. Берутся вилами с двух сторон, клиренс 115 мм. Цены — ориентир по каталогам, уточнять у поставщика.');\nE(13,'Термопринтеры ×2 и 2D-сканеры ×4'")
rep("delete LIB.flex; delete LIB.wrap; delete LIB.roll;              // гибкий конвейер, обмотчик и рольганг убраны из каталога",
    "delete LIB.flex; delete LIB.wrap; delete LIB.roll;              // гибкий конвейер, обмотчик и рольганг убраны из каталога\n"
    "LIB.rack={n:'Стоечный поддон',s:'штабелируется в ярусы · загрузка настраивается',\n"
    "  d:{tiers:2,fill:1},\n"
    "  p:[['tiers','Ярусов',1,3,1,'шт'],['fill','Загрузка верхнего яруса',0,1,0.1,'%']],\n"
    "  make:o=>rackStack(null,Math.round(o.tiers),o.fill),\n"
    "  sum:g=>'1500 × 1500 × 1600 мм · шаг яруса 1530 мм · штабель '+(g.userData.tiers.length*1.53+0.07).toFixed(2)+' м',\n"
    "  info:EQ[20]};\n"
    "LIB.dws2={n:'DWS ленточный Goodscan GM220',s:'лента 900 мм · 3D-камера · световой занавес · вес до 100 кг',\n"
    "  d:{out:1}, p:[['out','Выходной рольганг',0,1,1,'']],\n"
    "  make:o=>goodscanDWS(o),\n"
    "  sum:g=>'длина '+g.userData.dws2.L.toFixed(2).replace('.',',')+' м · ширина 1,33 м · стол 750 мм · высота 1,82 м',\n"
    "  info:{t:'DWS ленточный Goodscan (异方科技) — замер мелких образцов',q:'GM220 · 10×3×3 … 150×88×88 см · до 100 кг · ±1 мм · ±10 г · 1–2 с на короб',\n"
    "    n:'Производитель — Shenzhen Yifang Technology (深圳市异方科技, бренд Goodscan). Короб кладут на весовой роликовый стол под 3D-камерой: за секунду — габарит и вес, штрихкод и фото; дальше лента проводит его через рамку светового занавеса (параллельный свет даёт точный габарит и на ходу) на выходной рольганг. Данные уходят в WMS и в план загрузки. В зоне DWS меряет мелкие образцы — классы A и B; крупные — на портальном DWS.',\n"
    "    k:'dynamic DWS dimensioning weighing scanning / ленточный DWS обмер, взвешивание, сканирование / 动态DWS 体积测量 称重 扫码'}};")


# ---------- 15a. здание охраны: восточный торец до колонны x 32,05 и проходная вдоль южной стены (14.10, по фото объекта) ----------
rep("  const GX0=1.2, GX1=30.0, GZ0=0.8, GZ1=6.6, H=2.3;",
    "  const GX0=1.2, GX1=31.55, GZ0=0.8, GZ1=6.6, H=2.3;           // 14.10: торец — у колонны x 32,05 (её опорная плита и кольцо — с x 31,6)")
rep("  box(L+0.3,0.12,Dd+0.3,std(0xb9bec4,.9,0),cx,0.06,cz,G0);                 // плита",
    "  { const ms=std(0xb9bec4,.9,0), xc=31.58;                             // плита; у колонны (x ≥ 31,6) без свеса на север — там опорная плита колонны\n"
    "    box(xc-GX0+0.15,0.12,Dd+0.3,ms,(GX0-0.15+xc)/2,0.06,cz,G0); box(GX1+0.15-xc,0.12,Dd+0.14,ms,(xc+GX1+0.15)/2,0.06,cz-0.08,G0); }")
rep("  /* кровля с парапетом */\n  box(L+0.3,0.16,Dd+0.3,M_roof,cx,0.12+H+0.08,cz,G0);",
    "  /* проходная (14.10, по фото объекта): небольшой блок за восточным торцом, вдоль южной стены; вход с севера, через неё — внутрь здания */\n"
    "  { const AX0=GX1, AX1=GX1+3.0, AZ1=3.6, AH=2.12, aw=AX1-AX0, ax=(AX0+AX1)/2, ad=AZ1-GZ0, az=(GZ0+AZ1)/2, top=0.12+AH, fr=0.06;\n"
    "    box(AX1-GX1,0.12,ad+0.3,std(0xb9bec4,.9,0),(GX1+0.15+AX1+0.15)/2,0.06,az,G0);                       // плита (западнее — плита основного здания)\n"
    "    box(aw,AH,0.12,M_pan,ax,0.12+AH/2,GZ0,G0); box(0.12,AH,ad,M_pan,AX1,0.12+AH/2,az,G0);                 // южная стена и восточный торец\n"
    "    box(aw,0.28,0.13,M_panDark,ax,0.26,GZ0-0.005,G0); box(0.13,0.28,ad,M_panDark,AX1+0.005,0.26,az,G0);\n"
    "    const dx=AX0+0.85, dw=1.05, dh=2.0, wx=AX1-0.75, ww=1.0, ws=1.05, wh=0.75;                            // дверь и окно на северной стене\n"
    "    const wall=(x0,x1)=>{ if(x1-x0<0.02) return; box(x1-x0,AH,0.12,M_pan,(x0+x1)/2,0.12+AH/2,AZ1,G0); box(x1-x0,0.28,0.13,M_panDark,(x0+x1)/2,0.26,AZ1+0.005,G0); };\n"
    "    wall(AX0,dx-dw/2); wall(dx+dw/2,wx-ww/2); wall(wx+ww/2,AX1);\n"
    "    box(dw,AH-dh,0.12,M_pan,dx,0.12+dh+(AH-dh)/2,AZ1,G0);                                                  // над дверью\n"
    "    box(ww,top-ws-wh,0.12,M_pan,wx,ws+wh+(top-ws-wh)/2,AZ1,G0); box(ww,ws-0.12,0.12,M_pan,wx,0.12+(ws-0.12)/2,AZ1,G0);   // над и под окном\n"
    "    box(ww+0.02,0.28,0.13,M_panDark,wx,0.26,AZ1+0.005,G0);\n"
    "    [[dx,dw,0.12,dh],[wx,ww,ws,wh]].forEach(([x,w,s0,h])=>{ box(w+0.1,fr,0.16,M_frame,x,s0+h+fr/2,AZ1,G0);\n"
    "      box(fr,h,0.16,M_frame,x-w/2+fr/2,s0+h/2,AZ1,G0); box(fr,h,0.16,M_frame,x+w/2-fr/2,s0+h/2,AZ1,G0); });\n"
    "    box(ww+0.1,fr,0.16,M_frame,wx,ws+fr/2,AZ1,G0);\n"
    "    box(dw-0.12,dh-0.08,0.05,M_door,dx,0.12+dh/2,AZ1,G0);                                                  // дверь\n"
    "    box(0.32,0.32,0.02,M_glassG,dx,0.12+dh-0.4,AZ1+0.035,G0).castShadow=false;\n"
    "    box(0.03,0.16,0.08,M_frame,dx+dw/2-0.18,0.12+1.05,AZ1+0.06,G0);\n"
    "    box(ww-0.12,wh-0.12,0.02,M_glassG,wx,ws+wh/2,AZ1,G0).castShadow=false; box(0.04,wh-0.12,0.1,M_frame,wx,ws+wh/2,AZ1,G0);\n"
    "    box(ww+0.16,0.05,0.22,M_frame,wx,ws-0.02,AZ1+0.06,G0);                                                 // отлив\n"
    "    box(dw+0.5,0.08,0.64,M_trim,dx,top-0.06,AZ1+0.38,G0);                                                  // козырёк под кровлей\n"
    "    mesh(new THREE.CylinderGeometry(0.06,0.06,0.05,12),M_lamp,dx,top-0.125,AZ1+0.5,G0).castShadow=false;\n"
    "    box(dw+0.5,0.12,0.45,std(0xa9adb2,.8,0),dx,0.06,AZ1+0.375,G0);                                          // ступенька у входа (до уровня плиты)\n"
    "    G0.add(signPlate('ПРОХОДНАЯ',ww+0.2,0.26,wx,2.02,AZ1+0.075,0,'#1d232b','#f2b705'));\n"
    "    box(AX1+0.15-AX0,0.16,ad+0.3,M_roof,(AX0+AX1+0.15)/2,top+0.08,az,G0);                                  // кровля — ниже свеса основной\n"
    "    box(AX1+0.2-(GX1+0.16),0.14,0.08,M_trim,(GX1+0.16+AX1+0.2)/2,top+0.2,AZ1+0.14,G0);\n"
    "    box(AX1+0.2-(GX1+0.16),0.14,0.08,M_trim,(GX1+0.16+AX1+0.2)/2,top+0.2,GZ0-0.14,G0);\n"
    "    box(0.08,0.14,ad+0.36,M_trim,AX1+0.14,top+0.2,az,G0);\n"
    "  }\n"
    "  /* кровля с парапетом */\n  box(L+0.3,0.16,Dd+0.3,M_roof,cx,0.12+H+0.08,cz,G0);")
rep("  label('[О] ЗДАНИЕ ОХРАНЫ · h ≈ 2,3 м · 29 × 5,8 м',cx,3.6,cz,'#ffffff',44,0.8);",
    "  label('[О] ЗДАНИЕ ОХРАНЫ · h ≈ 2,3 м · 30,4 × 5,8 м + проходная',cx,3.6,cz,'#ffffff',44,0.8);")
rep("q:'существующее · 28,8 × 5,8 м · высота ≈ 2,3 м',","q:'существующее · 30,4 × 5,8 м + проходная 3,0 × 2,8 м · высота ≈ 2,3 м',")
rep("n:'Низкое здание вдоль южной стены. У западного входа",
    "n:'Низкое здание вдоль южной стены, восточным торцом до колонны x 32,05; за торцом вдоль стены — небольшая проходная со входом с севера, через неё — внутрь здания. У западного входа")
rep("{id:'О', s:'Охрана', n:'Здание охраны и бытовой блок', c:0x7c8794, x0:1.2, x1:30.0, z0:0.8, z1:6.6, m2:167,",
    "{id:'О', s:'Охрана', n:'Здание охраны и бытовой блок', c:0x7c8794, x0:1.2, x1:31.55, z0:0.8, z1:6.6, m2:184,")

# ---------- 15b. зона DWS вместо брака, упаковочных материалов, зарядки АКБ и досок (14.10) ----------
cut("  {id:'6', s:'Брак', n:'Брак / карантин',","  {id:'S', s:'Стейджинг', n:'Стейджинг S1–S3 (по машинам)',",
    "  {id:'D', s:'DWS', n:'Зона DWS — замер образцов', c:0x2a7fb8, x0:34.9, x1:44.6, z0:0.9, z1:6.5, m2:54,\n"
    "   note:'Сюда погрузчик привозит поддон образцов после выгрузки машины: по одному коробу каждого размера от каждого клиента. Крупные (классы C и D) меряют на портальном DWS, мелкие (A и B) — на ленточном Goodscan; замеренный короб кладут на второй поддон, и он уходит в ячейку своего дня приёмки. Данные — габарит, вес, штрихкод, фото — сразу в WMS и в план загрузки SafeLoad. Брак, упаковочные материалы, зарядка АКБ и план-доски отсюда убраны: им нужно новое место (см. замечания по расстановке).',\n"
    "   eq:'портальный DWS 2 м (крупные) · ленточный DWS Goodscan GM220 (мелкие) · два места под поддоны образцов'},\n")
for t in ["  tag(g,{t:'Стеллаж расходных материалов',","  tag(g,{t:'Клетка брака и карантина',","  tag(g,{t:'Зарядка АКБ, вентиляция и огнетушители',",
          "  tag(g,{t:'План-доска ячеек — вся система управления складом',","  tag(g,{t:'Доска старения: что лежит дольше пяти суток',"]:
    rep(t,"  g.userData.removed=true;                                   // 14.10: на этом месте — зона DWS\n"+t)
rep("note:'Взвешивание каждого места, сверка с packing list, этикетка с номером отправки, АДРЕСОМ ЯЧЕЙКИ и ЦВЕТОМ ДНЯ.',",
    "note:'Сверка с packing list, этикетка с номером отправки, АДРЕСОМ ЯЧЕЙКИ и ЦВЕТОМ ДНЯ. Первый короб каждого размера каждого клиента — образец: контролёр кладёт его в отдельный поддон образцов рядом с местом выгрузки; когда машина выгружена, погрузчик везёт этот поддон в зону DWS.',")

# ---------- 16. проезды между секциями, казахский тандем на крытом посту, детали здания ----------
rep("const SEC = [[1.2,15.3],[16.85,31.25],[32.85,46.85]];      // разрывы под колонны x=16,05 и 32,05",
    "const SEC = [[1.2,15.3],[20.2,31.25],[36.2,46.85]];        // у линий колонн x=16,05 и 32,05 — проезды для погрузчика по 3,6 м")
rep("stencil('РЯД A · С ЮЖНОЙ МАГИСТРАЛИ · 2 ПАЛЛЕТЫ В ГЛУБИНУ',24,19.2,15,'rgba(207,224,242,.55)');",
    "stencil('РЯД A · С ЮЖНОЙ МАГИСТРАЛИ · СТОЙКИ В 2 ЯРУСА',25.7,20.45,9,'rgba(207,224,242,.55)');")
rep("stencil('РЯД B · С СЕВЕРНОЙ МАГИСТРАЛИ · 3 ПАЛЛЕТЫ В ГЛУБИНУ',24,23.75,15,'rgba(207,224,242,.55)');",
    "stencil('РЯД B · С СЕВЕРНОЙ МАГИСТРАЛИ · СТОЙКИ В 2 ЯРУСА',25.7,22.0,9,'rgba(207,224,242,.55)');")
rep("stencil('КРЫТЫЙ ПОСТ РАЗГРУЗКИ · Л1 → П1',24,33.2,14,'rgba(242,183,5,.9)');",
    "stencil('КРЫТЫЙ ПОСТ ПОГРУЗКИ · Л1 → П1',10,33.2,14,'rgba(242,183,5,.9)');\n"+part('details.js'))
rep("{id:'В', s:'Крытый пост', n:'Крытый пост разгрузки Л1 → П1',","{id:'В', s:'Крытый пост', n:'Крытый пост погрузки Л1 → П1',")
i=s.index("   note:'Сквозная полоса по проёму из SKP (z 32,05…35,55). Крана нет"); j=s.index("\n",i)
s=s[:i]+"   note:'Сквозная полоса по проёму из SKP (z 32,05…35,55). Казахстанский автопоезд-тандем 145 м³ заезжает через Л1 и встаёт вдоль границы; правый борт открыт в зал, под шторой — каркас с проёмом в середине каждого кузова. Погрузчик приходит с северной магистрали по проездам у линий колонн, подаёт стоечный поддон в проём и держит его поднятым, пока грузчики внутри разбирают стойку по одному коробу. Выезд — через П1. Зимой это погрузка не на морозе.',"+s[j:]
i=s.index("tag(flatTruck(24.05,GATES[0].z-0.4,12,1,false,0),"); j=s.index("const TRK_TANDEM=tag(tandem(51.8,GATES[1].z+4.5,-Math.PI/2),",i)
s=s[:i]+"""const TRK_IN=tag(tandem145(28.6,GATES[0].z-0.4,Math.PI,{open:1,tall:1,plate:'248 KZA 13',lanes1:[-4.75,-2.6],lanes2:[-4.75,-2.6]}),
  {t:'Казахстанский автопоезд-тандем 145 м³ на крытом посту',q:'грузовик + прицеп · 2 × 9,8 × 2,48 × 2,98 м · правый борт открыт, в середине каждого кузова — проём',
   n:'Стоит внутри здания на сквозной полосе Л1 → П1. Под шторой — металлический каркас борта: стойки и обрешётка. В середине правого борта каждого кузова оставлен проём: погрузчик подаёт в него стоечный поддон и держит его на поднятых вилах, грузчики внутри берут короба по одному и раскладывают по дорожкам — каждому типу своё место. Сначала грузится кузов грузовика, затем прицеп. Под колёсами — противооткатные упоры. Фото кузова до закрытия штор обязательно. Размеры кузова в модели условные, уточнять по паспорту машины.',
   k:'drawbar truck and centre-axle trailer 145 m3 / автопоезд тандем 145 кубов / 中置轴厢式列车 145方'});
[[32.55,1],[32.55,-1],[23.5,1],[23.5,-1]].forEach(c=>wheelChock(c[0]+c[1]*1.32,GATES[0].z-0.4-1.03,-c[1]));
{ const kzg=kzTruck({len:13.6,open:0.4,load:0.6,roof:1}); kzg.position.set(51.8,0,GATES[1].z-5.9); kzg.rotation.y=Math.PI/2; G.trucks.add(kzg); var KZ_SEMI=kzg; }
"""+s[j:]
cut("const TRK_TANDEM=tag(tandem(51.8,GATES[1].z+4.5,-Math.PI/2),","\n\n/* ========================================================= ПОТОК ГРУЗА */",
    "const TRK_TANDEM=tag(KZ_SEMI,\n"
    "  {t:'Казахская фура — шторный полуприцеп у ворот П2',q:'тягач + полуприцеп 13,6 м · снаружи, вдоль правой стены · борт к воротам приоткрыт',\n"
    "   n:'Стандартная еврофура на 33 европаллеты стоит снаружи у П2 и грузится с полос стейджинга 1–4 через ворота. Тяжёлое — над осями и в переднюю треть, каждое место сканируется, 100 % сверка с планом. Фото кузова до закрытия — самое важное фото процесса.',\n"
    "   k:'curtainsider semi trailer 13.6m / шторный полуприцеп еврофура / 侧帘半挂车'});")
rep("for(const dx of [0,-1.85]) for(let i=0;i<2;i++) rackFrame(g,dx,i*RACK.PITCH,-0.4);","for(const dz of [-4.0,-2.3]) for(let i=0;i<2;i++) rackFrame(g,0.05,i*RACK.PITCH,dz);")
rep("tagEq(g,20,[13.5,1.6,12.3],9);","tagEq(g,20,[14.4,1.6,9.2],9);")
rep("const JACK_P2b=palletJack(45.9,17.0,-1.6,false); palletJack(31.4,15.0,0,false);","const JACK_P2b=palletJack(45.9,17.0,-1.6,false); const JACK_Sa=palletJack(31.4,13.9,0,false);")
rep("palletJack(29.8,15.0,0,true);","const JACK_Sb=palletJack(29.8,13.9,0,true);")
rep("person(21.5,31.0,-1.2,true,'ГРУЗЧИК');","const MAN_N1=person(21.5,30.2,-1.2,true,'ГРУЗЧИК');")
rep("person(30.2,30.4,-1.9,false,'ВОДИТЕЛЬ ПОГРУЗЧИКА');","const MAN_N2=person(30.2,29.6,-1.9,false,'ВОДИТЕЛЬ ПОГРУЗЧИКА');")

rep("const JACK_P2a=tagEq(palletJack(45.9,15.6,-1.6,false),10,[45.9,1,15.6],10);\nconst JACK_P2b=palletJack(45.9,17.0,-1.6,false);",
    "const JACK_P2a=tagEq(palletJack(47.0,13.4,-1.6,false),10,[47.0,1,13.4],10);\nconst JACK_P2b=palletJack(47.0,12.2,-1.6,false);")   # тележки убраны с магистрали: там разворачивается погрузчик
rep("[[15.6,26.5],[32.5,26.5],[15.6,31.1],[32.5,31.1]].forEach((p,i)=>{","[[16.05,28.85],[32.05,28.85],[15.6,30.5],[45.6,30.8]].forEach((p,i)=>{")   # зеркала на стойках: с линии движения погрузчика и из-под борта машины — к колоннам и к стоп-линии
rep("if(i===0) tagEq(g,19,[15.6,2,26.5],12); else tag(g,EQ[19]);","if(i===0) tagEq(g,19,[16.05,2,28.85],12); else tag(g,EQ[19]);")
rep("person(3.9,7.9,0.2,false,'ОХРАННИК');","person(3.1,7.5,0.5,false,'ОХРАННИК');")   # охранник стоял вплотную к упаковщику
# ---------- 16b. зона DWS: разметка и табличка (вызов — в блоке правки, там уже есть DWSZ и signBoard); оба DWS переезжают в зону ----------
rep("  edStore.seed=4; edSave();\n}","  edStore.seed=4; edSave();\n}\n"
    "dwsZoneMarks();                                             // зона DWS: контуры, места поддонов, табличка (здесь уже есть и DWSZ, и signBoard)\n"
    "if(!(edStore.seed>=5)){                                     // 14.10: портальный DWS — в зону DWS (бывшие брак/АКБ/упаковка/доски), рядом второй — ленточный Goodscan\n"
    "  let d=edStore.a.find(r=>r.i==='dws-3'); if(!d){ d={i:'dws-3',k:'dws',o:{h:2.0,w:1.6,load:0}}; edStore.a.push(d); }\n"
    "  d.p=[DWSZ.big[0],0,DWSZ.big[1]]; d.r=DWSZ.big[2]; d.o=Object.assign({h:2.0,w:1.6},d.o||{},{load:0});\n"
    "  if(!edStore.a.some(r=>r.i==='dws-gs')) edStore.a.push({i:'dws-gs',k:'dws2',p:[DWSZ.gs[0],0,DWSZ.gs[1]],r:DWSZ.gs[2],o:{out:1}});\n"
    "  edStore.seed=5; edSave();\n}")

# ---------- 17. правка расстановки: новая версия хранилища, базовое положение объектов ----------
rep("const EDKEY='sklad4.edit.v1';","const EDKEY='sklad4.edit.v2';                     // расстановка изменилась (проезды, машины) — правка от прежних версий не применяется")
rep("/* восстановление сохранённой правки */","edMap.forEach(o=>{ o.userData.base=[o.position.x,o.position.y,o.position.z,o.rotation.y,o.visible]; });   // базовое положение: фильм идёт в базовой расстановке\n/* восстановление сохранённой правки */")

# ---------- 18. автопоезд внутри у П2 (заезд через П2), стейджинг убран, автосохранение в файл ----------
rep("const TRK_IN=tag(tandem145(28.6,GATES[0].z-0.4,Math.PI,{open:1,tall:1,plate:'248 KZA 13',lanes1:[-4.75,-2.6],lanes2:[-4.75,-2.6]}),",
    "const TRK_IN=tag(tandem145(36.0,GATES[1].z,0,{open:1,tall:1,plate:'248 KZA 13',lanes1:[-4.75,-2.6],lanes2:[-4.75,-2.6]}),")
cut("  {t:'Казахстанский автопоезд-тандем 145 м³ на крытом посту',","[[32.55,1],[32.55,-1],[23.5,1],[23.5,-1]].forEach(",
    "  {t:'Казахстанский автопоезд-тандем 145 м³ на посту погрузки П2',q:'грузовик + прицеп · 2 × 9,8 × 2,48 × 2,98 м · заезд через П2 · правый борт открыт в зал, в середине каждого кузова — проём',\n"
    "   n:'Заезжает передним ходом через ворота П2 и встаёт внутри здания вдоль южной магистрали. Под шторой — металлический каркас борта: стойки и обрешётка. В середине правого борта каждого кузова оставлен проём: погрузчик подаёт в него стоечный поддон и держит его на поднятых вилах, грузчики внутри берут короба по одному и раскладывают по дорожкам — каждому типу своё место. Ячейки ряда A стоят через магистраль от борта, плечо погрузчика — несколько метров. Сначала грузится кузов грузовика, затем прицеп. Под колёсами — противооткатные упоры. Фото кузова до закрытия штор обязательно. Выезд — задним ходом через П2. Размеры кузова в модели условные, уточнять по паспорту машины.',\n"
    "   k:'drawbar truck and centre-axle trailer 145 m3 / автопоезд тандем 145 кубов / 中置轴厢式列车 145方'});\n")
rep("[[32.55,1],[32.55,-1],[23.5,1],[23.5,-1]].forEach(c=>wheelChock(c[0]+c[1]*1.32,GATES[0].z-0.4-1.03,-c[1]));",
    "[[32.05,1],[32.05,-1],[41.1,1],[41.1,-1]].forEach(c=>wheelChock(c[0]+c[1]*1.32,GATES[1].z+1.03,c[1]));")
rep("kzg.position.set(51.8,0,GATES[1].z-5.9); kzg.rotation.y=Math.PI/2;","kzg.position.set(57.5,0,31.8); kzg.rotation.y=Math.PI/2;")
cut("  {t:'Казахская фура — шторный полуприцеп у ворот П2',","\n\n/* ========================================================= ПОТОК ГРУЗА */",
    "  {t:'Казахская фура — шторный полуприцеп на площадке',q:'тягач + полуприцеп 13,6 м · снаружи, ждёт очереди на пост П2',\n"
    "   n:'Стандартная еврофура на 33 европаллеты стоит на площадке в стороне от ворот: проезд к П2 свободен для автопоезда. Заезжает на пост П2 после него. Тяжёлое — над осями и в переднюю треть, каждое место сканируется, 100 % сверка с планом.',\n"
    "   k:'curtainsider semi trailer 13.6m / шторный полуприцеп еврофура / 侧帘半挂车'});")
# зоны: стейджинг и карман П2 → пост погрузки П2
cut("  {id:'S', s:'Стейджинг', n:'Стейджинг S1–S3 (по машинам)',","  {id:'A', s:'Ряд A',",
    "  {id:'L', s:'Пост П2', n:'Пост погрузки П2 — автопоезд внутри', c:0xb08b4f, x0:21.4, x1:47.3, z0:9.1, z1:12.1, m2:78,\n"
    "   note:'Автопоезд заезжает через П2 и встаёт вдоль южной магистрали правым бортом к ячейкам ряда A. Груз идёт из ячейки прямо в кузов: погрузчик подаёт стоечный поддон в проём борта и держит на вилах, грузчики раскладывают короба по дорожкам. Промежуточной выкладки на пол нет. 100 % сканирование против плана отправки и фото кузова до закрытия штор.',\n"
    "   eq:'погрузчик 3 т · стоечные поддоны · сканеры · противооткатные упоры'},\n")
cut("/* полосы стейджинга: вдоль x, смотрят на ворота П2 */","/* зелёные пешеходные дорожки */",
    "/* пост погрузки П2: полоса автопоезда внутри здания */\n"
    "paintRect(21.4,GATES[1].z-1.5,47.3,GATES[1].z+1.5,0xffffff,0.13,0.018);\n"
    "for(const zz of [GATES[1].z-1.5,GATES[1].z+1.5]) decal(25.9,0.12,paintMat(PAL.yellow),34.35,zz,0.0165);\n"
    "decal(0.3,3.0,paintMat(0xf2f2f2,.95),21.4,GATES[1].z,0.0172);\n"
    "stencil('ПОСТ ПОГРУЗКИ П2 · АВТОПОЕЗД',27.2,GATES[1].z-2.2,9,'rgba(242,183,5,.8)');\n"
    "const LANES=[];\n")
cut("/* ---------- [S] стейджинг: полоса = машина ---------- */","tagEq(roller(38.5,15.0,6,false,0.85),6,[38.5,1.2,15.0],12).userData.removed=true;","")
rep("stencil('П2 · ОТГРУЗКА',43,GATES[1].z-2.1,7,'rgba(242,183,5,.8)');","stencil('П2 · ЗАЕЗД АВТОПОЕЗДА',42.6,GATES[1].z-2.2,8,'rgba(242,183,5,.8)');")
rep("const JACK_P2a=tagEq(palletJack(47.0,13.4,-1.6,false),10,[47.0,1,13.4],10);\nconst JACK_P2b=palletJack(47.0,12.2,-1.6,false);",
    "const JACK_P2a=tagEq(palletJack(47.25,14.7,-1.6,false),10,[47.25,1,14.7],10);\nconst JACK_P2b=palletJack(47.25,16.1,-1.6,false);")
rep("const JACK_P2b=palletJack(47.25,16.1,-1.6,false); const JACK_Sa=palletJack(31.4,13.9,0,false);","const JACK_P2b=palletJack(47.25,16.1,-1.6,false); const JACK_Sa=palletJack(24.0,13.8,0,false);")
rep("const JACK_Sb=palletJack(29.8,13.9,0,true);","const JACK_Sb=palletJack(22.6,13.8,0,true);")
rep("const MAN_S=person(43.0,11.2,-1.6,false,'ВОДИТЕЛЬ ПОГРУЗЧИКА');","const MAN_S=person(44.4,7.7,0.3,false,'ВОДИТЕЛЬ ПОГРУЗЧИКА');")
rep("отсюда груз идёт прямо в полосу стейджинга.'}","отсюда груз идёт прямо в кузов автопоезда на посту П2.'}")
rep("'Плечо приёмка → стейджинг стало 30–40 м поперёк трёх пролётов.","'Плечо приёмка → пост погрузки П2 — 30–40 м поперёк трёх пролётов.")
cut("  ['5','Полоса стейджинга — очередь на погрузку, не хранение',","  ['6','Тяжёлое принимается только на поддоне',",
    "  ['5','Из ячейки — прямо в кузов, без выкладки на пол',\n"
    "   'Стейджинга нет: автопоезд стоит внутри у П2, стоечный поддон из ячейки подаётся прямо в проём кузова. Ячейка назначается под машину заранее и уходит целиком. Если груз пришлось поставить на пол у машины — это уже буфер без адреса, и он обязан вернуться в ячейку.'],\n")
rep("30 ячеек буфера · 4 полосы · без крана</div>","30 ячеек буфера · пост погрузки П2 · без крана</div>")
# северная сквозная полоса — свободна
rep("stencil('КРЫТЫЙ ПОСТ ПОГРУЗКИ · Л1 → П1',10,33.2,14,'rgba(242,183,5,.9)');","stencil('СКВОЗНАЯ ПОЛОСА · Л1 → П1 · РЕЗЕРВ',10,33.2,14,'rgba(242,183,5,.9)');")
cut("  {id:'В', s:'Крытый пост', n:'Крытый пост погрузки Л1 → П1',","   eq:'погрузчик 3 т · удлинители вил'},",
    "  {id:'В', s:'Полоса Л1–П1', n:'Сквозная полоса Л1 → П1 — резерв', c:0xc9a227, x0:0.6, x1:47.4, z0:31.5, z1:34.9, m2:163,\n"
    "   note:'Сквозная полоса по проёму из SKP (z 32,05…35,55). Сейчас свободна: погрузка автопоезда перенесена на пост П2. Резерв под вторую машину или негабарит; погрузчик попадает сюда по проездам у линий колонн.',\n")
rep("  ['Крытый пост Л1',    {t:[24,2.5,31], r:24, phi:1.02, th:1.4}],","  ['Пост погрузки П2',  {t:[34,2.5,12], r:26, phi:1.02, th:-0.5}],")

# ---------- 19. версия планировки, правка из файла, автосохранение в файл ----------
rep("const EDKEY='sklad4.edit.v2';                     // расстановка изменилась (проезды, машины) — правка от прежних версий не применяется",
    "const LAYOUT_VER='v3';                            // версия штатной планировки: правка от другой версии не применяется\nconst EDKEY='sklad4.edit.'+LAYOUT_VER;")
rep("try{ const raw=localStorage.getItem(EDKEY); if(raw) edStore=Object.assign({m:{},c:[],h:[],a:[],seed:0},JSON.parse(raw)); }catch(err){}",
    "try{ const raw=localStorage.getItem(EDKEY); if(raw) edStore=Object.assign({m:{},c:[],h:[],a:[],seed:0},JSON.parse(raw)); }catch(err){}\n"
    "let FILE_TS=0;                                           // правка, записанная в сам файл: берётся, если она свежее той, что в браузере\n"
    "try{ const el=document.getElementById('sklad4-saved'), j=el?JSON.parse(el.textContent||'{}'):null;\n"
    "  if(j&&j.ver===LAYOUT_VER&&j.store){ FILE_TS=j.store.ts||0; if(FILE_TS>(edStore.ts||0)) edStore=Object.assign({m:{},c:[],h:[],a:[],seed:0},j.store); } }catch(err){}")
rep("const edSave=()=>{ try{ localStorage.setItem(EDKEY,JSON.stringify(edStore)); }catch(err){} };",
    "const edSave=()=>{ edStore.ts=Date.now(); try{ localStorage.setItem(EDKEY,JSON.stringify(edStore)); }catch(err){} if(FS_READY) fsQueue(); };")
rep("  try{ localStorage.removeItem(EDKEY); }catch(err){} location.reload();\n};",
    "  edStore={m:{},c:[],h:[],a:[],seed:0}; edSave();                 // пустая правка со свежей отметкой времени — чтобы запись из файла её не вернула\n"
    "  clearTimeout(FS.t); (FS.on?fsWrite():Promise.resolve()).then(()=>location.reload());\n};")
# базовое положение: до применения правки; запад ниже на 1 м — и в базе тоже
rep("    o.position.y-=1.0;\n  });\n});","    o.position.y-=1.0;\n  });\n});\n"
    "edMap.forEach(o=>{ const b=o.userData.base; if(b&&b[0]<-0.35&&b[1]>-0.5) b[1]-=1.0; });           // штатное положение — тоже на уровне площадки\n"+part('autosave.js')+part('batch.js'))
rep('      <button class="edo" id="edreset" title="Вернуть исходную расстановку">Сброс</button>',
    '      <button class="edo" id="edreset" title="Вернуть исходную расстановку">Сброс</button>\n'
    '      <span class="sep edo"></span>\n'
    '      <button class="edo" id="edfile">Автосохранение в файл</button>\n'
    '      <button class="edo" id="eddl" title="Скачать копию этого файла с вашей расстановкой">Скачать</button>\n'
    '      <span id="edsaved" class="edo" style="font:500 11px/1 \'IBM Plex Mono\',monospace;opacity:.75;white-space:nowrap"></span>')

# ---------- 8. модуль фильма — после восстановления правки, до запуска цикла ----------
rep("edUI(); libPanel();\n\nresize();",film()+"\nedUI(); libPanel();\n\nresize();")

# ---------- 9. стили фильма ----------
rep("  @media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}\n</style>",
"""  #app.film #panel{display:none}
  #app.film .bar,#app.film #edit,#app.film #hover,#app.film #pad,#app.film #toggle{display:none!important}
  #app.film #view{background:#000}
  #app.film #view canvas{position:absolute;inset:0;margin:auto;width:auto;height:auto;max-width:100%;max-height:100%;cursor:default}
  #filmov{display:none;pointer-events:none}
  #app.film #filmov{display:block;z-index:3}
  #filmbar{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:9;display:none;gap:8px;align-items:center;
    background:rgba(12,16,21,.86);border:1px solid #2f3742;border-radius:6px;padding:7px 10px;backdrop-filter:blur(6px);
    width:min(760px,calc(100% - 28px))}
  #filmbar.on{display:flex}
  #filmbar button{background:#1d232b;color:#e9ecef;border:1px solid #2f3742;border-radius:4px;padding:7px 11px;font:600 13px var(--disp);
    letter-spacing:.05em;text-transform:uppercase;cursor:pointer;white-space:nowrap}
  #filmbar button:hover,#filmbar button.on{border-color:#f5c518;color:#f5c518}
  #filmbar input{flex:1;min-width:60px;accent-color:#f5c518}
  #filmbar .tc{font:500 12px var(--mono);color:#aab2ba;min-width:44px}
  @media (max-width:640px){ #filmbar button{padding:6px 8px;font-size:11px} #filmbar [data-a=rec]{display:none} }
  @media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>""")


# ---------- 13. загрузчик glTF, клонирование скелетов и модель человека (встроены — работает офлайн) ----------
import base64
_gl=open(os.path.join(ROOT,'vendor','GLTFLoader.js'),encoding='utf-8').read()          # three r128, examples/js
_su=open(os.path.join(ROOT,'vendor','SkeletonUtils.js'),encoding='utf-8').read()
_rpm=base64.b64encode(open(os.path.join(ROOT,'assets','readyplayer.me.glb'),'rb').read()).decode()
_three=open(os.path.join(ROOT,'vendor','three.min.js'),encoding='utf-8').read()        # three r128 встроен: модель открывается без интернета
assert '</script' not in _three
rep('<script src="https://unpkg.com/three@0.128.0/build/three.min.js"></script>',
    '<script>/* three.js r128 (MIT) — встроен в файл */\n'+_three+'</script>\n<script>'+_gl+'</script>\n<script>'+_su+'</script>\n'
    '<script>/* модель человека: Ready Player Me (glb, скелет Mixamo) */\nconst RPM_GLB="'+_rpm+'";</script>')

# ---------- 19b. поток груза убран; уклон конвейера; обход; живой процесс ----------
cut("const g2=GATES[1].z;\n[\n  {mat:M.carton,size:[0.56,0.42,0.46]","/* ================================================================= UI */",
    "/* схематичный «поток груза» (летящие короба по кривым) убран по замечанию заказчика: процесс показывают фильм и живой режим */\n\n/* ================================================================= UI */")
rep("  ['dims','Размеры и оси',false],\n  ['flow','Поток груза A / C / D',!reduceMotion]\n];","  ['dims','Размеры и оси',false]\n];\nG.flow.visible=false;")
# телескопический конвейер: голова (в кузове) выше основания — лента идёт с подъёмом к машине
rep("  if(!t) edStore.a.push({i:'t-l2',k:'tele',p:[0.02,0,10.9],r:Math.PI,o:{lift:0.10,tilt:-5,ext:0.48}});",
    "  if(!t) edStore.a.push({i:'t-l2',k:'tele',p:[0.02,0,10.9],r:Math.PI,o:{lift:0.0,tilt:3,ext:0.48,dir:-1}});")
rep("    d:{lift:0.70,tilt:-2,ext:0.55,dir:1},","    d:{lift:0.0,tilt:3,ext:0.55,dir:-1},")
# обход: скорость не зависит от частоты кадров, разрешение ниже — плавнее
rep("  const dt=Math.min(Math.max((now-prev)/1000,0),0.05); prev=now;\n  if(FILM.on){ FILM.tick(dt); requestAnimationFrame(loop); return; }",
    "  const dtRaw=Math.max((now-prev)/1000,0), dt=Math.min(dtRaw,0.05); prev=now;\n  if(FILM.on){ FILM.tick(dt); requestAnimationFrame(loop); return; }\n  if(typeof SIM!=='undefined'&&SIM.on){ SIM.tick(Math.min(dtRaw,0.25)); if((frame&7)===0&&SIM.ui) SIM.ui(); }")
rep("  if(walk){ walkStep(dt); }","  if(walk){ walkStep(Math.min(dtRaw,0.25)); }")
rep("  const run=keys.ShiftLeft||keys.ShiftRight, sp=(run?5.5:2.1)*dt;","  const run=keys.ShiftLeft||keys.ShiftRight, sp=(run?5.0:1.9)*dt;        // шаг 1,9 м/с, бег 5 м/с; dt — реальное время кадра")
rep("    if(canvas.requestPointerLock) canvas.requestPointerLock();\n  } else {",
    "    if(canvas.requestPointerLock) canvas.requestPointerLock();\n    saved_pr=renderer.getPixelRatio(); renderer.setPixelRatio(Math.min(saved_pr,1)); resize();   // в обходе — без удвоенного разрешения: плавнее на слабых ПК\n    if(typeof SIM!=='undefined'&&!SIM.on&&!FILM.on) SIM.enter();   // обход — по работающему складу: живой процесс включается сам\n    walkLbl=[G.labels.visible,G.addr.visible]; G.labels.visible=false; G.addr.visible=false;   // глазами человека: без висящих в воздухе подписей\n  } else {\n    if(saved_pr){ renderer.setPixelRatio(saved_pr); saved_pr=0; resize(); }\n    if(walkLbl){ G.labels.visible=walkLbl[0]; G.addr.visible=walkLbl[1]; walkLbl=null; }")
rep("let walk=false, wYaw=0, wPitch=0;","let walk=false, wYaw=0, wPitch=0, saved_pr=0, walkLbl=null;")
rep("    tipEl.innerHTML='<b>W A S D</b> идти · <b>мышь</b> смотреть<br><b>Shift</b> бегом · <b>Esc</b> выход';",
    "    tipEl.innerHTML='<b>W A S D</b> идти · <b>мышь</b> смотреть<br><b>Shift</b> бегом · <b>Esc</b> выход<br>склад работает: живой процесс идёт';")
rep("  if(!reduceMotion&&G.people.visible){ const tt=now/1000; for(const H of PEOPLE){ if(H.root.parent&&H.root.visible) HUM.pose(H,Object.assign({t:tt},H.base)); } }",
    "  if(!reduceMotion&&G.people.visible){ const tt=now/1000; for(const H of PEOPLE){ if(H.root.parent&&H.root.visible&&!(typeof SIM!=='undefined'&&SIM.owns&&SIM.owns(H))) HUM.pose(H,Object.assign({t:tt},H.base)); } }")


# ---------- 21. зал как на фото: потолок, фонари с проёмами, остекление, сетка, занавес; свет «как в цеху» ----------
rep("/* ============================================================== КАРКАС */",part('hall.js')+"\n/* ============================================================== КАРКАС */")
rep("""  const panel=(x0,x1)=>{
    const y0=roofY(x0),y1=roofY(x1),L=Math.hypot(x1-x0,y1-y0);
    const m=box(L,0.14,D+1.0,std(PAL.roof,.6,.5),(x0+x1)/2,(y0+y1)/2+0.06,D/2,G.roof);
    m.rotation.z=Math.atan2(y1-y0,x1-x0);
  };
  panel(-0.5,W/2); panel(W/2,W+0.5);""",
"""  const panel=(x0,x1,z0,z1)=>{                                 // кусок ската; z0…z1 — по длине зала
    const y0=roofY(x0),y1=roofY(x1),L=Math.hypot(x1-x0,y1-y0);
    const m=box(L,0.14,z1-z0,HALL.roofM,(x0+x1)/2,(y0+y1)/2+0.06,(z0+z1)/2,G.roof);
    m.rotation.z=Math.atan2(y1-y0,x1-x0);
  };
  /* под световыми фонарями (x 8, 20, 28, 40 ± 1 м; z 4 … D−4) в кровле проём: дневной свет и солнце идут в зал */
  { const SK=[8,20,28,40], Z0=-0.5, Z1=D+0.5, cuts=[];
    [[-0.5,W/2],[W/2,W+0.5]].forEach(([a,b])=>{ let x=a; SK.filter(k=>k>a&&k<b).forEach(k=>{ cuts.push([x,k-1]); x=k+1; }); cuts.push([x,b]); });
    cuts.forEach(([a,b])=>panel(a,b,Z0,Z1));
    SK.forEach(k=>{ panel(k-1,k+1,Z0,4.0); panel(k-1,k+1,D-4.0,Z1); }); }""")
rep("const skyM=std(0xdfeaf5,.3,0,{emissive:0xcfe0f0,emissiveIntensity:.35,transparent:true,opacity:.85});","const skyM=HALL.skyM;")
rep("const lampM=std(0xfff8e8,.35,0,{emissive:0xfff2d4,emissiveIntensity:1.5});","const lampM=std(0xfff8e8,.35,0,{emissive:0xfff2d4,emissiveIntensity:4.0});   // светодиодные колокола: ярче, дают свечение")
rep("const gl=box(0.12,EAVE-WALL_H-0.1,d,M.glass,","const gl=box(0.12,EAVE-WALL_H-0.1,d,HALL.glassM,")
rep("box(0.12,EAVE-WALL_H-0.1,gw+0.4,M.glass,","box(0.12,EAVE-WALL_H-0.1,gw+0.4,HALL.glassM,")
rep("box(step,0.7,0.12,M.glass,xm,WALL_H+0.4,z,g)","box(step,0.7,0.12,HALL.glassM,xm,WALL_H+0.4,z,g)")
rep("/* боковые стены x=0 и x=48 — с двумя воротами каждая */","HALL.curtain();\n/* боковые стены x=0 и x=48 — с двумя воротами каждая */")
rep("const LIGHT={sun:2.6,hemi:.30,inRoof:.40,inOpen:.12};                // баланс под HDR-окружение цеха",
    "const LIGHT={sun:2.6,hemi:.30,inRoof:.40,inOpen:.12};                // баланс под HDR-окружение цеха\n"
    "hemi.color.set(0xc6d5e4); hemi.groundColor.set(0x8a8780);            // снизу — отражённый от светлого бетона свет (он и освещает потолок)\n"
    "LIGHT.sun=3.4; sun.intensity=LIGHT.sun;                              // прямое солнце сильнее рассеянного в разы: пятна от фонарей и ворот читаются")
rep("bumpMap:T(corrCanvas,len/0.32,1,false), bumpScale:0.05, roughness:0.55, metalness:0.32, envMapIntensity:0.8}),{dirtY:2.2,dirtK:.32});",
    "bumpMap:T(corrCanvas,len/0.32,1,false), bumpScale:0.05, roughness:0.6, metalness:0.12, envMapIntensity:1.0}),{dirtY:2.2,dirtK:.32});")   # профлист стен — окрашенный, светлый (как на фото), а не голый металл
rep("POST.P.time=now/1000; POST.P.exposure=G.roof.visible?(walk?1.1:1.0):0.62;","POST.P.time=now/1000; WIND.value=POST.P.time; iblUpdate(); POST.P.exposure=EXPO.at(camera,walk);")

# ---------- 21b. телескопический конвейер с подвижными секциями (выдвигается на ходу: userData.tele.setExt) ----------
cut("function telescopicConveyor(x,z,rotY,lift,tilt,ext,dir){","/* штатный конвейер у Л2 ставится через каталог",part('tele.js')+"\n")

# ---------- 22. детализация моделей: рохли и электротележки, вентиляторы ----------
cut("function palletJack(x,z,rot,electric){","function trolleyCart(x,z,rot){",part('models.js')+"\n")

# ---------- 23. обход с физикой тела: столкновения, гравитация, лестницы у платформ, прыжок, присед ----------
cut("function tryMove(mx,mz){","mkBtn('Скачать кадр PNG',true,()=>{",part('walk_phys.js')+"\n")
rep("walkLbl=[G.labels.visible,G.addr.visible]; G.labels.visible=false; G.addr.visible=false;   // глазами человека: без висящих в воздухе подписей",
    "walkLbl=[G.labels.visible,G.addr.visible]; G.labels.visible=false; G.addr.visible=false;   // глазами человека: без висящих в воздухе подписей\n"
    "    walkRoof=[G.roof.visible,interior.intensity]; G.roof.visible=true; interior.intensity=LIGHT.inRoof; renderer.shadowMap.needsUpdate=true;   // внутри зала — под кровлей\n"
    "    WALKP.enter();")
rep("    if(walkLbl){ G.labels.visible=walkLbl[0]; G.addr.visible=walkLbl[1]; walkLbl=null; }",
    "    if(walkLbl){ G.labels.visible=walkLbl[0]; G.addr.visible=walkLbl[1]; walkLbl=null; }\n"
    "    if(walkRoof){ G.roof.visible=walkRoof[0]; interior.intensity=walkRoof[1]; walkRoof=null; renderer.shadowMap.needsUpdate=true; }\n"
    "    WALKP.exit();")
rep("let walk=false, wYaw=0, wPitch=0, saved_pr=0, walkLbl=null;","let walk=false, wYaw=0, wPitch=0, saved_pr=0, walkLbl=null, walkRoof=null;")
rep("tipEl.innerHTML='<b>W A S D</b> идти · <b>мышь</b> смотреть<br><b>Shift</b> бегом · <b>Esc</b> выход<br>склад работает: живой процесс идёт';",
    "tipEl.innerHTML='<b>W A S D</b> идти · <b>мышь</b> смотреть<br><b>Shift</b> бегом · <b>Пробел</b> прыжок · <b>C</b> присесть · <b>V</b> вид от 3-го лица · <b>F</b>/ЛКМ удар · <b>Esc</b> выход<br>склад работает: живой процесс идёт · сквозь стойки и технику не пройти';")
rep('<button data-k="ShiftLeft" class="run">БЕГ</button>','<button data-k="ShiftLeft" class="run">БЕГ</button><button data-k="Space" class="jump">ПРЫЖОК</button><button data-k="KeyC" class="crouch">ПРИСЕСТЬ</button>')
rep('<button data-k="KeyC" class="crouch">ПРИСЕСТЬ</button>','<button data-k="KeyC" class="crouch">ПРИСЕСТЬ</button><button data-k="KeyF" class="hit">УДАР</button><button data-k="KeyV" class="view">ВИД</button>')
rep("  #pad button.exit{grid-column:1;grid-row:1;font-size:16px}",
    "  #pad button.exit{grid-column:1;grid-row:1;font-size:16px}\n"
    "  #pad{grid-template-rows:repeat(4,52px)}\n"
    "  #pad button.hit{grid-column:1/span 2;grid-row:4;font-size:12px;letter-spacing:.1em}\n"
    "  #pad button.view{grid-column:3;grid-row:4;font-size:11px;letter-spacing:.06em}\n"
    "  #pad button.jump{grid-column:1/span 2;grid-row:3;font-size:12px;letter-spacing:.1em}\n"
    "  #pad button.crouch{grid-column:3;grid-row:3;font-size:11px;letter-spacing:.06em}")

# ---------- 19c. правая панель сворачивается кнопкой; подсказки управления и экранные кнопки обхода убраны (14.10, по просьбе) ----------
rep('<div id="app">',
    '<style>\n'
    '  /* кнопка «Меню» — внутри сцены (#view), в её правом верхнем углу: открытая панель сужает сцену, и кнопка встаёт у её левого края, а не под ней */\n'
    '  #toggle{display:flex!important;align-items:center;gap:7px;position:absolute;right:12px;top:12px;z-index:12;padding:8px 12px;\n'
    '    background:rgba(15,19,24,.86);backdrop-filter:blur(6px);border-color:#3b434e}\n'
    '  #toggle:hover{border-color:var(--yellow);color:var(--yellow)}\n'
    '  #toggle .ic{font-size:16px;line-height:1}\n'
    '  @media (min-width:881px){ #panel{transition:margin-right .25s ease} #app.max #panel{margin-right:-341px} }   /* на узком экране — как было: высота 0 */\n'
    '  #tip{display:none!important}\n'
    '  #pad,#pad.on{display:none!important} #app.touch #pad.on{display:grid!important}   /* экранные кнопки обхода — только на сенсорных экранах без мыши (класс touch ставится ниже) */\n'
    '</style>\n<div id="app">')
rep("""tgl.onclick=()=>{ const app=document.getElementById('app');
  app.classList.toggle('max');
  tgl.textContent=app.classList.contains('max')?'Панель':'Развернуть';
  requestAnimationFrame(resize); };""",
"""const tglSet=(closed,tmp)=>{ const app=document.getElementById('app'); app.classList.toggle('max',closed);
  tgl.innerHTML=closed?'<span class="ic">☰</span>Меню':'<span class="ic">✕</span>Скрыть меню'; tgl.title=closed?'Открыть панель настроек':'Свернуть панель настроек';
  if(!tmp) try{ localStorage.setItem('sklad4.panel',closed?'0':'1'); }catch(err){}   // tmp — свёрнута на время обхода: выбор пользователя не трогаем
  requestAnimationFrame(resize); };
if(window.ResizeObserver) new ResizeObserver(()=>resize()).observe(view); else document.getElementById('panel').addEventListener('transitionend',resize);   // кадр — по размеру сцены, пока панель выезжает и уезжает
if(!matchMedia('(any-pointer:fine)').matches&&(navigator.maxTouchPoints>0||'ontouchstart' in window)) document.getElementById('app').classList.add('touch');   // телефон, планшет: кнопки обхода нужны
tgl.onclick=()=>tglSet(!document.getElementById('app').classList.contains('max'));
{ let open=null; try{ open=localStorage.getItem('sklad4.panel'); }catch(err){} tglSet(open!=='1'); }   // по умолчанию панель свёрнута; дальше — как оставил пользователь""")
rep("const walkBtn=mkBtn('Режим обхода · WASD',true,()=>toggleWalk());",
    "const walkBtn=mkBtn('Режим обхода · WASD',true,()=>toggleWalk());\n"
    "walkBtn.title='W A S D — идти · Shift — бегом · Пробел — прыжок · C — присесть · V — вид от 3-го лица · F или ЛКМ — удар · Esc — выход';   // подсказки на экране убраны — клавиши в подсказке кнопки")

# обход: мышь захвачена (pointer lock), панель не убрать — она прячется сама при входе и возвращается при выходе (Esc), 14.10
rep("let walk=false, wYaw=0, wPitch=0, saved_pr=0, walkLbl=null, walkRoof=null;","let walk=false, wYaw=0, wPitch=0, saved_pr=0, walkLbl=null, walkRoof=null, walkPanel=false;")
rep("    walkLbl=[G.labels.visible,G.addr.visible]; G.labels.visible=false; G.addr.visible=false;   // глазами человека: без висящих в воздухе подписей\n",
    "    walkLbl=[G.labels.visible,G.addr.visible]; G.labels.visible=false; G.addr.visible=false;   // глазами человека: без висящих в воздухе подписей\n"
    "    walkPanel=!document.getElementById('app').classList.contains('max'); if(walkPanel) tglSet(true,true);   // мышь захвачена — панель прячется сама\n")
rep("    if(walkLbl){ G.labels.visible=walkLbl[0]; G.addr.visible=walkLbl[1]; walkLbl=null; }",
    "    if(walkLbl){ G.labels.visible=walkLbl[0]; G.addr.visible=walkLbl[1]; walkLbl=null; }\n    if(walkPanel){ walkPanel=false; tglSet(false,true); }   // выход из обхода (Esc) — панель как была")

# люди на своих местах не стоят истуканом: занятие, поворот на месте и взгляд — по расписанию HUM.idle (14.10)
rep("HUM.pose(H,Object.assign({t:tt},H.base)); } }","HUM.pose(H,HUM.idle(H,tt)); } }")

# ---------- 24. зал по SketchUp (15.10): шаг колонн 7,0, карниз 8,6 / конёк 11,66, ворота П 6,0 × 5,5, здание охраны 32 × 7 × 4 и проходная 3,5 × 3,5 ----------
rep("""const WALL_H = 8.0, EAVE = 8.8, RIDGE = 10.0;     // панель стены 8,0 · верх колонн 8,8 · конёк 10,0
const COLX = [16.05, 32.05];
const PITCH = 7.05;                               // шаг колонн по длине из SKP
const FR = Array.from({length:10},(_,i)=>+(PITCH*(i+1)).toFixed(2));   // 7.05 … 70.5
const COLZ = FR.filter(z=>z<OUR+0.3);             // 7.05 14.1 21.15 28.2 35.25 — в нашей части""",
"""const WALL_H = 7.8, EAVE = 8.6, RIDGE = 11.66;    // 15.10 по SKP: карниз 8,6 · конёк 11,66; панель стены до 7,8, выше — световая лента
const COLX = [16.05, 32.05];
const PITCH = 7.0;                                // 15.10 по SKP: первая ось 7,05 от торца, дальше шаг 7,0
const FR = Array.from({length:10},(_,i)=>+(7.05+PITCH*i).toFixed(2));   // 7.05 14.05 … 70.05
const COLZ = FR.filter(z=>z<OUR+0.3);             // 7.05 14.05 21.05 28.05 35.05 — в нашей части""")
rep("const GATES = [{z:32.80, w:3.5}, {z:10.58, w:3.5}];",
    "const GATES = [{z:32.80, w:3.5}, {z:10.58, w:3.5}];   // ворота Л (запад) 3,5 × 4,0\n"
    "const GATE_HP = 5.5, GATES_P = [{z:31.55, w:6.0}, {z:10.55, w:6.0}];   // ворота П (восток) 6,0 × 5,5 по SKP: проёмы 28,55…34,55 и 7,55…13,55 — между пилястрами")
rep("const roofY = x => EAVE + (RIDGE-EAVE)*(1 - Math.abs(x - W/2)/(W/2));   // карниз 8,8 → конёк 10,0 по оси x=24,05",
    "const roofY = x => EAVE + (RIDGE-EAVE)*(1 - Math.abs(x - W/2)/(W/2));   // карниз 8,6 → конёк 11,66 по оси x=24,05")
rep("  const inGate = GATES.some(gt=>Math.abs(z-gt.z)<gt.w/2+0.4);","  const inGate = (x?GATES_P:GATES).some(gt=>Math.abs(z-gt.z)<gt.w/2+0.4);")
# стены: у каждой стороны свои ворота и своя высота проёма (параметр GATE_H внутри функции); резиновые отбойники — только у Л (там машины встают к платформе)
rep("function wallSide(xFix, inwardSign){\n  const cuts=GATES.map(","function wallSide(xFix, inwardSign, GL, GATE_H){\n  const cuts=GL.map(")
rep("      box(0.5,0.45,0.5,M.rubber,xFix+inwardSign*0.35,1.15,cz+s*(gw/2+0.5),G.walls);",
    "      if(inwardSign>0) box(0.5,0.45,0.5,M.rubber,xFix+inwardSign*0.35,1.15,cz+s*(gw/2+0.5),G.walls);")
rep("wallSide(0,+1); wallSide(W,-1);","wallSide(0,+1,GATES,GATE_H); wallSide(W,-1,GATES_P,GATE_HP);")
rep("label('П1', W-1.7, 6.3, GATES[0].z-2.6, '#f2b705', 42, 1.0);","label('П1', W-1.7, 7.6, GATES_P[0].z-2.6, '#f2b705', 42, 1.0);")
rep("label('П2', W-1.7, 6.3, GATES[1].z-2.9, '#f2b705', 42, 1.0);","label('П2', W-1.7, 7.6, GATES_P[1].z-2.9, '#f2b705', 42, 1.0);")
rep("""[[0.55,GATES[0].z],[0.55,GATES[1].z],[W-0.55,GATES[0].z],[W-0.55,GATES[1].z]].forEach((p,i)=>{
  const g=grp(p[0],0,p[1],G.walls); g.rotation.y=Math.PI/2;
  box(4.4,0.42,0.5,M.white,0,GATE_H+1.35,0,g);                      // завеса выше направляющих ворот
  for(let j=0;j<10;j++) box(0.34,0.06,0.42,M.dark,-1.9+j*0.42,GATE_H+1.15,0,g);
  box(0.5,0.3,0.3,M.steelDark,2.4,GATE_H+1.35,0,g);""",
"""[[0.55,GATES[0].z,GATES[0].w,GATE_H+1.35],[0.55,GATES[1].z,GATES[1].w,GATE_H+1.35],[W-0.55,GATES_P[0].z,GATES_P[0].w,GATE_HP+1.1],[W-0.55,GATES_P[1].z,GATES_P[1].w,GATE_HP+1.1]].forEach((p,i)=>{
  const g=grp(p[0],0,p[1],G.walls), L=p[2]+0.9, n=Math.round((L-0.4)/0.42), y=p[3]; g.rotation.y=Math.PI/2;   // по ширине проёма; выше направляющих и вала ворот
  box(L,0.42,0.5,M.white,0,y,0,g);
  for(let j=0;j<n;j++) box(0.34,0.06,0.42,M.dark,(j-(n-1)/2)*0.42,y-0.2,0,g);
  box(0.5,0.3,0.3,M.steelDark,L/2+0.2,y,0,g);""")
rep("paintRect(W-1.2,GATES[1].z-1.75,W,GATES[1].z+1.75,PAL.yellow,0.14,0.015);","paintRect(W-1.2,GATES_P[1].z-3.0,W,GATES_P[1].z+3.0,PAL.yellow,0.14,0.015);")
rep("dim(-4.2,COLZ[0],-4.2,COLZ[1],'шаг 7,05 м');","dim(-4.2,COLZ[0],-4.2,COLZ[1],'шаг 7,0 м');")
rep("колонны 16,05 / 32,05, шаг 7,05<br>\n        Карниз 8,8 · конёк 10,0 ·","колонны 16,05 / 32,05, шаг 7,0<br>\n        Карниз 8,6 · конёк 11,66 · ворота П 6,0 × 5,5, Л 3,5 × 4,0 ·")
# здание охраны по SKP: 32 × 7 м по осям, высота 4,0; стены — у пилястр торца и западной стены и у колонн оси z 7,05 (без проникновений)
rep("  const GX0=1.2, GX1=31.55, GZ0=0.8, GZ1=6.6, H=2.3;",
    "  const GX0=0.36, GX1=31.55, GZ0=0.45, GZ1=6.57, H=3.75;        // 15.10 по SKP: 32 × 7 м по осям, верх кровли ≈ 4,0; стены — у пилястр (0,25) и колонн оси 7,05 (отбойники с 6,69)")
rep("{x:15.4,w:1.6,h:1.15,win:1}","{x:14.9,w:1.6,h:1.15,win:1}")          # окно — не напротив колонны x 16,05
rep("  { const AX0=GX1, AX1=GX1+3.0, AZ1=3.6, AH=2.12,","  { const AX0=GX1, AX1=35.55, AZ1=3.55, AH=H-0.18,")   # проходная по SKP 3,5 × 3,5: x 32,05…35,55
rep("  label('[О] ЗДАНИЕ ОХРАНЫ · h ≈ 2,3 м · 30,4 × 5,8 м + проходная',cx,3.6,cz,'#ffffff',44,0.8);",
    "  label('[О] ЗДАНИЕ ОХРАНЫ · h ≈ 4,0 м · 32 × 7 м по осям + проходная 3,5 × 3,5',cx,5.2,cz,'#ffffff',44,0.8);")
rep("q:'существующее · 30,4 × 5,8 м + проходная 3,0 × 2,8 м · высота ≈ 2,3 м',",
    "q:'существующее · по SKP 32 × 7 м по осям (стены — у пилястр и колонн: 31,3 × 6,2 м) + проходная 3,5 × 3,5 м · высота ≈ 4,0 м',")
rep("{id:'О', s:'Охрана', n:'Здание охраны и бытовой блок', c:0x7c8794, x0:1.2, x1:31.55, z0:0.8, z1:6.6, m2:184,",
    "{id:'О', s:'Охрана', n:'Здание охраны и бытовой блок', c:0x7c8794, x0:0.36, x1:31.55, z0:0.45, z1:6.57, m2:203,")
rep("const SOLIDS=[{x0:1.2,x1:30.0,z0:0.8,z1:6.6}];","const SOLIDS=[{x0:0.36,x1:31.55,z0:0.45,z1:6.57},{x0:31.55,x1:35.55,z0:0.45,z1:3.55}];")
rep("c:0x2a7fb8, x0:34.9, x1:44.6, z0:0.9, z1:6.5, m2:54,","c:0x2a7fb8, x0:35.9, x1:45.6, z0:0.9, z1:6.5, m2:54,")

# ---------- 25. автопоезд 145 м³ по таблице заказчика (15.10): тягач 6×4 + две тентованные секции B-double ----------
rep("const TRK_IN=tag(tandem145(36.0,GATES[1].z,0,{open:1,tall:1,plate:'248 KZA 13',lanes1:[-4.75,-2.6],lanes2:[-4.75,-2.6]}),",
    "const TRK_IN=tag(tandem145(36.0,GATES[1].z,0,{open:1,tall:1,plate:'248 KZA 13',lanes1:[-3.64,-2.6],lanes2:[-4.7,-2.6]}),")
rep("  {t:'Казахстанский автопоезд-тандем 145 м³ на посту погрузки П2',q:'грузовик + прицеп · 2 × 9,8 × 2,48 × 2,98 м · заезд через П2 · правый борт открыт в зал, в середине каждого кузова — проём',",
    "  {t:'Казахстанский автопоезд 145 м³ (B-double) на посту погрузки П2',q:'тягач 6×4 + две тентованные секции · внутри 7,57 × 2,61 × 3,13 и 9,70 × 2,64 × 3,28 м · 29–29,9 т · заезд через П2 · правый борт открыт в зал, в середине каждой секции — проём',")
rep("Сначала грузится кузов грузовика, затем прицеп.","Сначала грузится секция 1 (на седле тягача), затем секция 2 (на сцепке B-link за секцией 1).")
rep("Выезд — задним ходом через П2. Размеры кузова в модели условные, уточнять по паспорту машины.',",
    "Выезд — задним ходом через П2. Размеры — по паспорту заказчика: объём 145 м³ (реально 125–130), грузоподъёмность 29–29,9 т, снаряжённая масса 16–18 т, полная 45–47 т; загрузка сбоку (тент открывается), сзади (двустворчатые опломбируемые двери) и сверху краном (сдвижная тентовая крыша); вентиляция. Высота 4,3 м — проходит в ворота П2 (5,5 м).',")
rep("   k:'drawbar truck and centre-axle trailer 145 m3 / автопоезд тандем 145 кубов / 中置轴厢式列车 145方'});\n",
    "   k:'B-double curtainsider 145 m3 / автопоезд B-double 145 кубов / 双节篷布半挂列车 145方'});\n")
# противооткатные упоры: у ведущих осей тягача и у тележки секции 2
rep("[[32.05,1],[32.05,-1],[41.1,1],[41.1,-1]].forEach(c=>wheelChock(c[0]+c[1]*1.32,GATES[1].z+1.03,c[1]));",
    "[[27.075,1,1.37],[27.075,-1,1.37],[41.08,1,2.0],[41.08,-1,2.0]].forEach(c=>wheelChock(c[0]+c[1]*c[2],GATES[1].z+1.03,c[1]));   // ведущие оси тягача и тележка секции 2")

# ---------- 26. китайская машина по данным заказчика (15.10): тягач 6×4 + полуприцеп-платформа 17,5 × 3,0 м с решёткой 2,0 м ----------
rep("""const TRK_L2=tag(flatTruck(-6.2,GATES[1].z,11,-1,false,Math.PI/2),
  {t:'Китайская машина у ворот Л2 · классы A, B, D',q:'приёмный пост, стоит вдоль левой стены',
   n:'Разгрузка сбоку с земли: класс A на рольганг, класс B погрузчиком через мобильную рампу, класс D — с удлинителями вил на консольный стеллаж.',
   k:'flatbed lattice truck / бортовая машина с решётчатыми бортами / 栏板货车'});""",
"""const TRK_L2=tag(cnSemi(-6.2,GATES[1].z,-1,Math.PI/2,{gap:[-1.25,1.25]}),
  {t:'Китайская машина у ворот Л2: тягач + полуприцеп-платформа с решёткой',q:'17,5 × 3,0 м, решётка 2,0 м · внутри 17,45 × 2,95 × 3,0 м (≈ 140 м³, реально 135) · 29–29,9 т · стоит вдоль западной стены',
   n:'Тягач 6×4 и одна секция: пол — стальной лист Q345 3–5 мм на поперечинах из швеллера, лонжероны — двутавр; борта — съёмные секции стальной решётки 2,0 м на каркасе, сверху — водонепроницаемый опломбируемый тент на съёмных дугах (сейчас скатан к переднему борту). Снаряжённая масса 7,5–9,5 т, полная 40–45 т. Две секции борта со стороны ворот сняты: через проём в кузов заходит телескопический конвейер, грузчик в кузове кладёт короба на ленту. Можно грузить и сзади (распашные решётчатые ворота), и сверху краном.',
   k:'open platform semi-trailer with fence / полуприцеп-платформа с решётчатыми бортами / 仓栅式半挂车'});""")
rep("""const TRK_Q=tag(flatTruck(-6.2,25.5,11,-1,false,Math.PI/2),
  {t:'Китайская машина в очереди на Л1',q:'ожидает въезда под кран',
   n:'Машина с местом тяжелее 1 т ждёт освобождения сквозной полосы. Цель: от заезда до начала выгрузки ≤ 15 минут.',""",
"""const TRK_Q=tag(cnSemi(-13.0,13.5,-1,Math.PI/2,{tarp:'closed'}),
  {t:'Китайская машина в очереди',q:'тягач + полуприцеп-платформа 17,5 × 3,0 м · тент закрыт и опломбирован',
   n:'Ждёт, пока освободится пост у Л2 (или полоса Л1–П1). Пломбу и таможенный трос снимают только на посту выгрузки. Цель: от заезда до начала выгрузки ≤ 15 минут.',""")
rep("   k:'flatbed lattice truck / бортовая машина / 栏板货车'});","   k:'open platform semi-trailer with fence / полуприцеп-платформа с решёткой / 仓栅式半挂车'});")
rep("kzg.position.set(57.5,0,31.8); kzg.rotation.y=Math.PI/2;","kzg.position.set(58.5,0,50.0); kzg.rotation.y=Math.PI/2;")   # 15.10: не на полосе заезда к П1 — китайский полуприцеп заходит туда задним ходом

# мобильная рампа и столб LPR стояли на полосе, где теперь стоит 21,5-метровая китайская машина (столб LPR был на её оси) — в сторону
rep("  const g=grp(-7.6,0,GATES[1].z+6.2); g.rotation.y=Math.PI/2;","  const g=grp(-19.0,0,8.0); g.rotation.y=0;")
rep("  tagEq(g,2,[-7,1.5,GATES[1].z+6.2],14);","  tagEq(g,2,[-19.0,1.5,8.0],14);")
rep("[[-6.2,GATES[1].z-5.2,0],[W+6.2,GATES[1].z+8.5,Math.PI]].forEach((p,i)=>{","[[-9.0,GATES[1].z-12.0,0],[W+6.2,GATES[1].z+8.5,Math.PI]].forEach((p,i)=>{")
rep("  if(i===0) tagEq(g,14,[-6.2,2.5,GATES[1].z-5.2],14); else tag(g,EQ[14]);","  if(i===0) tagEq(g,14,[-9.0,2.5,GATES[1].z-12.0],14); else tag(g,EQ[14]);")

# ---------- 27. варианты хранения A/B/C по концепции Buraq 2026 (15.10): только в сборке python3 build.py --abc ----------
if ABC:
    AD=os.path.join(ROOT,'abc')
    abc_js=''.join(open(f,encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(AD,'*.js'))) if not f.endswith('capture.js'))
    rep("\nbatchStatic();\n","\n"+open(os.path.join(AD,'capture.js'),encoding='utf-8').read()+"\nbatchStatic();\n")   # текущая планировка — в свои группы до слияния
    rep("\nedUI(); libPanel();\n\nresize();","\n"+abc_js+"\nedUI(); libPanel();\n\nresize();")
    rep("if((frame&7)===0&&SIM.ui) SIM.ui(); }","if((frame&7)===0&&SIM.ui) SIM.ui(); }\n  if(typeof ABC!=='undefined') ABC.tick(Math.min(dtRaw,0.25));")
    rep("const EDKEY='sklad4.edit.'+LAYOUT_VER;","const EDKEY='sklad4abc.edit.'+LAYOUT_VER;")   # своя правка: не смешивается с основной моделью
    rep("<title>Buraq Logistics · Склад №4 блок 4-1 · Yuzhe Park Хоргос · 3D (реалистичный рендер)</title>","<title>Buraq · Склад №4 · варианты хранения A/B/C</title>")

# ---------- 20. блок правки в файле и исходный текст файла для кнопки «Скачать» ----------
i=s.index("<script>/* модель человека: Ready Player Me")
s=s[:i]+'<script id="sklad4-saved" type="application/json">{}</script>\n'+s[i:]
rep("</script>\n<script>\n/* ==========================================================================\n   СКЛАД №4, БЛОК 4-1",
    "</script>\n<script>\nwindow.__SKLAD_SRC='<!DOCTYPE html>\\n'+document.documentElement.outerHTML;   // исходный текст файла — для кнопки «Скачать»\n/* ==========================================================================\n   СКЛАД №4, БЛОК 4-1")

open(OUT,'w',encoding='utf-8').write(s)
print('собрано', OUT, len(s), 'байт')
