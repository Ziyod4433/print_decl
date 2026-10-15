/* ---------------------------------------------------------------- модели оборудования F01–F20
   Повторяющиеся детали (стойки, балки, рельсы, ролики, паллеты, грузы) — экземплярами (InstancedMesh) одного единичного
   куба или цилиндра: стеллажи на тысячи мест не множат вызовы отрисовки. У каждого стеллажа в userData.slots — места паллет
   (в осях объекта): x, y, z, грань (face — куда смотрит фронт), уровень; userData.loads.set(i,…) показывает/прячет груз. */
const UB=new THREE.BoxGeometry(1,1,1), UC=new THREE.CylinderGeometry(1,1,1,12), _d=new THREE.Object3D(), _c=new THREE.Color();
const MAT={
  up:std(0x1d4f94,.42,.55), beam:std(0xe1561b,.42,.35), deck:std(0x9aa3ab,.45,.7), galv:M.galv,
  rail:std(0x6b737b,.38,.8), yel:std(0xf2b705,.5,.2), blk:std(0x1d2025,.6,.3), pal:std(0xb48b57,.9,0), palD:std(0x8a6a42,.9,0),
  toy:std(0xe0571c,.42,.3), toyD:std(0x2b2f35,.55,.4), toyG:std(0x5a6068,.5,.5), seat:std(0x17181a,.85,0),
  mec:std(0xf2c300,.42,.25), crane:std(0xe0571c,.4,.35), craneG:std(0x8c949b,.45,.6), amr:std(0xe8592a,.4,.25),
  foam:std(0x18191b,.95,0), lip:std(0x7b8187,.5,.65), glassD:std(0x223040,.15,.4,{envMapIntensity:1.4}),
  led:std(0x2a7bff,.3,0,{emissive:0x2a7bff,emissiveIntensity:1.3}), ledG:std(0x2bd14f,.3,0,{emissive:0x2bd14f,emissiveIntensity:1.0}),
  scr:std(0x0e141a,.25,.2,{emissive:0x3a86c8,emissiveIntensity:.8}), paper:std(0xf4f4f0,.8,0), pipe:std(0x9aa1a8,.35,.85), prof:std(0x7d858c,.4,.8)
};
const loadTex=(()=>{ const c=cnv(512,512), g=c.getContext('2d');
  g.fillStyle='#c79a63'; g.fillRect(0,0,512,512);
  for(let i=0;i<9000;i++){ const v=150+Math.random()*60|0; g.fillStyle=`rgba(${v},${v*0.78|0},${v*0.5|0},.18)`; g.fillRect(Math.random()*512,Math.random()*512,2,2); }
  g.strokeStyle='rgba(70,45,20,.55)'; g.lineWidth=4;
  for(let i=1;i<3;i++){ g.beginPath(); g.moveTo(i*512/3,0); g.lineTo(i*512/3,512); g.stroke(); }
  for(let j=1;j<3;j++){ g.beginPath(); g.moveTo(0,j*512/3); g.lineTo(512,j*512/3); g.stroke(); }
  g.fillStyle='rgba(222,190,120,.8)'; for(let j=0;j<3;j++) g.fillRect(0,j*512/3+60,512,18);   // скотч
  g.fillStyle='#f3f1ea'; for(let i=0;i<3;i++) for(let j=0;j<3;j++){ g.fillRect(i*512/3+22,j*512/3+96,64,40); g.fillStyle='#222'; g.fillRect(i*512/3+28,j*512/3+104,52,4); g.fillRect(i*512/3+28,j*512/3+116,40,3); g.fillStyle='#f3f1ea'; }
  const gr=g.createLinearGradient(0,0,512,512); gr.addColorStop(0,'rgba(255,255,255,.18)'); gr.addColorStop(.5,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(255,255,255,.12)');
  g.fillStyle=gr; g.fillRect(0,0,512,512);                                                         // стретч-плёнка
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=ANISO; return t; })();
MAT.load=new THREE.MeshStandardMaterial({map:loadTex,roughness:.6,metalness:0,envMapIntensity:.6});
const OWNC=[0xffffff,0xe8dcc8,0xd8e4ff,0xffe0d0,0xd8f0dc,0xf6e6b8,0xe6d8f2];   // оттенки груза по владельцу (instanceColor)
function IM(geo,mat,list,p,noShadow){                     // list: [x,y,z, sx,sy,sz, ry, rx, rz]
  const n=list.length, im=new THREE.InstancedMesh(geo,mat,Math.max(n,1));
  for(let i=0;i<n;i++){ const e=list[i]; _d.position.set(e[0],e[1],e[2]); _d.rotation.set(e[7]||0,e[6]||0,e[8]||0); _d.scale.set(e[3],e[4],e[5]); _d.updateMatrix(); im.setMatrixAt(i,_d.matrix); }
  im.count=n; im.castShadow=!noShadow; im.receiveShadow=true; im.frustumCulled=false; p.add(im); return im; }
/* EUR-поддон одной геометрией (доски и шашки), начало — центр низа, 1,2 вдоль x, 0,8 вдоль z */
const PALGEO=(()=>{ const parts=[];
  [[-0.3275,0.145],[-0.15,0.1],[0,0.145],[0.15,0.1],[0.3275,0.145]].forEach(b=>parts.push([1.2,0.022,b[1],0,0.133,b[0]]));
  for(let i=-1;i<=1;i++){ parts.push([0.145,0.022,0.8,i*0.5275,0.111,0]); for(let j=-1;j<=1;j++) parts.push([0.145,0.078,0.1,i*0.5275,0.061,j*0.35]); }
  [[-0.35,0.1],[0,0.145],[0.35,0.1]].forEach(b=>parts.push([1.2,0.022,b[1],0,0.011,b[0]]));
  return mergeBoxes(parts); })();
function mergeBoxes(parts){ const P=[],N=[],U=[],I=[]; let o=0;
  for(const [w,h,d,x,y,z] of parts){ const b=new THREE.BoxGeometry(w,h,d); b.translate(x,y,z);
    P.push(...b.attributes.position.array); N.push(...b.attributes.normal.array); U.push(...b.attributes.uv.array); for(const k of b.index.array) I.push(k+o); o+=b.attributes.position.count; b.dispose(); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(I); g.computeBoundingSphere(); return g; }
/* грузы на местах: поддон + штабель (единичный куб, тон — instanceColor); set(i,on,h,col) */
function loadsFor(g,slots,rotY){
  const n=slots.length, pal=new THREE.InstancedMesh(PALGEO,MAT.pal,Math.max(n,1)), ld=new THREE.InstancedMesh(UB,MAT.load,Math.max(n,1));
  pal.castShadow=ld.castShadow=true; pal.receiveShadow=ld.receiveShadow=true; pal.frustumCulled=ld.frustumCulled=false; pal.count=ld.count=n;
  pal.userData.walkDyn=true; ld.userData.walkDyn=true;                     // груз в обходе — не неподвижное препятствие (внутри стеллажа и так стойки)
  const st=new Uint8Array(n), hs=new Float32Array(n);
  const put=(i,on,h,col)=>{ const s=slots[i], r=(s.ry!==undefined?s.ry:rotY||0);
    _d.rotation.set(0,r,0); _d.position.set(s.x,s.y,s.z); _d.scale.setScalar(on?1:0); _d.updateMatrix(); pal.setMatrixAt(i,_d.matrix);
    _d.position.set(s.x,s.y+0.144+h/2,s.z); _d.scale.set(on?1.16:0,on?h:0,on?0.78:0); _d.updateMatrix(); ld.setMatrixAt(i,_d.matrix);
    ld.setColorAt(i,_c.setHex(col===undefined?0xffffff:col)); st[i]=on?1:0; hs[i]=h; pal.instanceMatrix.needsUpdate=ld.instanceMatrix.needsUpdate=true; if(ld.instanceColor) ld.instanceColor.needsUpdate=true; };
  for(let i=0;i<n;i++) put(i,false,1.1);
  g.add(pal,ld); g.userData.loads={pal,ld,set:put,st,hs,n};
  return g.userData.loads; }
function fillStatic(L,fill,seed){ let q=seed||7; const r=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; };
  for(let i=0;i<L.n;i++) L.set(i,r()<fill,0.95+r()*0.3,OWNC[(r()*OWNC.length)|0]); }
function sign(g,text,x,y,z,ry,w,col){ const t=signTex([text],col||'#14161a','#ffffff',512,128,{px:[86]}); const s=signBoard(w||0.9,(w||0.9)*0.25,t,x,y,z,ry||0,g); s.traverse(o=>o.castShadow=false); return s; }

/* ===== F01 фронтальный паллетный стеллаж: ряд вдоль z, фронт в +x (двойной — фронты в ±x) =====
   o.n пролётов по 3 паллеты 1200×800 (800 вдоль балки), o.lev уровней (пол + балки), шаг o.pt; глубина рамы 1,05, флю o.fl */
function f01(o){
  const g=new THREE.Group(), n=Math.round(o.n), lev=Math.round(o.lev), pt=o.pt, d=1.05, P=o.bw+0.1, L=n*P+0.1, dbl=o.dbl>0.5, fl=o.fl;
  const H=Math.max(2.0,(lev-1)*pt+1.05), posts=[], br=[], bm=[], pl=[], yel=[], slots=[];
  const sides=dbl?[1,-1]:[1];
  for(const s of sides){ const xc=dbl?s*(fl/2+d/2):0, xf=xc+s*(d/2-0.045), xb=xc-s*(d/2-0.045);
    for(let k=0;k<=n;k++){ const z=-L/2+0.05+k*P;
      for(const x of [xf,xb]){ posts.push([x,H/2,z,0.09,H,0.1]); pl.push([x,0.006,z,0.17,0.012,0.17]); }
      for(let y=0.35;y<H-0.6;y+=1.05){ const dy=1.05, len=Math.hypot(d-0.09,dy), a=Math.atan2(dy,d-0.09)*(((y/1.05)|0)%2?1:-1);
        br.push([xc,y+dy/2,z,len,0.028,0.028,0,0,a]); }
      br.push([xc,0.18,z,d-0.09,0.03,0.03]); br.push([xc,H-0.08,z,d-0.09,0.03,0.03]);
      if(k===0||k===n){ yel.push([xf+s*0.06,0.2,z+(k===0?-0.18:0.18),0.14,0.4,0.36]); } }        // защита стоек у прохода
    for(let b=0;b<n;b++){ const zc=-L/2+0.05+(b+0.5)*P;
      for(let l=1;l<lev;l++) for(const x of [xf,xb]) bm.push([x,l*pt-0.06,zc,0.05,0.12,P-0.1]);
      for(let l=0;l<lev;l++) for(let k=0;k<3;k++) slots.push({x:xc,y:l*pt,z:-L/2+0.1+b*P+(k+0.5)*((P-0.1)/3),face:s,lev:l,bay:b,ry:0}); } }
  if(dbl) for(let k=0;k<=n;k++) for(const y of [1.2,H-0.3]) br.push([0,y,-L/2+0.05+k*P,fl+0.1,0.05,0.05]);   // распорки флю
  IM(UB,MAT.up,posts,g); IM(UB,MAT.up,br,g); IM(UB,MAT.beam,bm,g); IM(UB,MAT.galv,pl,g,true); IM(UB,MAT.yel,yel,g);
  g.userData.slots=slots; g.userData.rk={kind:'F01',L,W:dbl?2*d+fl:d,H,lev,pt,dbl}; loadsFor(g,slots,0);
  if(o.fill>0) fillStatic(g.userData.loads,o.fill,Math.round(o.n*7+o.lev));
  return g; }

/* ===== F02 паллетный шаттл со стеллажами: каналы вдоль z, поперёк x; паллета 1200 поперёк канала =====
   o.nc каналов (шаг 1,4), o.nd мест в глубину (шаг 0,85), o.lev уровней; вход с −z (и с +z при o.fifo) */
function f02(o){
  const g=new THREE.Group(), nc=Math.round(o.nc), nd=Math.round(o.nd), lev=Math.round(o.lev), pt=o.pt, cw=1.4, dp=0.85, W=nc*cw, L=nd*dp+0.3;
  const H=Math.max(2.0,(lev-1)*pt+1.0), posts=[], rails=[], ties=[], guide=[], slots=[];
  const nz=Math.max(2,Math.round(L/2.55)+1);
  for(let i=0;i<=nc;i++){ const x=-W/2+i*cw; for(let k=0;k<nz;k++){ const z=-L/2+k*(L/(nz-1)); posts.push([x,H/2,z,0.1,H,0.09]); } }
  for(let i=0;i<nc;i++){ const xc=-W/2+(i+0.5)*cw;
    for(let l=0;l<lev;l++){ const y=l*pt+(l?0:0.04);
      for(const s of [-1,1]) rails.push([xc+s*0.52,y+0.04,0,0.07,0.08,L]);
      for(const e of (o.fifo>0.5?[-1,1]:[-1])) for(const s of [-1,1]) guide.push([xc+s*0.6,y+0.12,e*(L/2-0.1),0.04,0.1,0.2]);   // направляющие входа
      for(let j=0;j<nd;j++) slots.push({x:xc,y:y+0.08,z:-L/2+0.15+(j+0.5)*dp,face:0,lev:l,ch:i,dep:j,ry:0}); } }
  for(let k=0;k<nz;k++) ties.push([0,H-0.05,-L/2+k*(L/(nz-1)),W,0.08,0.08]);
  IM(UB,MAT.up,posts,g); IM(UB,MAT.rail,rails,g); IM(UB,MAT.up,ties,g); IM(UB,MAT.yel,guide,g);
  g.userData.slots=slots; g.userData.rk={kind:'F02',L,W,H,lev,pt,nc,nd,cw,dp,fifo:o.fifo>0.5};
  loadsFor(g,slots,0); if(o.fill>0) fillStatic(g.userData.loads,o.fill,nc*13+nd);
  g.userData.shuttles=[]; for(let i=0;i<Math.round(o.sh||0);i++){ const s=shuttleMesh(); s.position.set(-W/2+(i+0.5)*cw,0.12,-L/2+0.45); g.add(s); g.userData.shuttles.push(s); }
  return g; }
function shuttleMesh(){ const s=new THREE.Group();
  box(1.02,0.17,1.05,MAT.mec,0,0.085,0,s); box(1.04,0.06,0.07,MAT.blk,0,0.07,0.55,s); box(1.04,0.06,0.07,MAT.blk,0,0.07,-0.55,s);
  box(0.36,0.012,0.22,MAT.blk,0.25,0.176,0.3,s); for(let i=0;i<6;i++) box(0.05,0.01,0.05,i%2?MAT.ledG:MAT.led,0.12+(i%3)*0.11,0.184,0.24+((i/3)|0)*0.1,s);
  box(0.9,0.02,0.85,MAT.toyD,0,0.18,0,s); for(const x of [-0.46,0.46]) for(const z of [-0.38,0.38]) cyl(0.05,0.04,MAT.blk,x,0.05,z,s,10).rotation.z=PI/2;
  s.userData.nm='Шаттл'; return s; }

/* ===== F03 кран-штабелёр AS/RS: проход вдоль z, стеллажи по обе стороны, кран на рельсе, P&D у торца −z ===== */
function f03(o){
  const g=new THREE.Group(), nb=Math.round(o.nb), lev=Math.round(o.lev), pt=o.pt, wa=1.5, dd=o.dd>1.5?2:1, D=dd===2?2.45:1.05, P=2.8, L=nb*P+0.1;
  const H=Math.max(3,(lev-1)*pt+1.3), posts=[], bm=[], br=[], slots=[];
  const xs=dd===2?[wa/2+0.04,wa/2+1.22,wa/2+1.26,wa/2+D-0.04]:[wa/2+0.04,wa/2+D-0.04];
  for(const s of [-1,1]){ for(let k=0;k<=nb;k++){ const z=-L/2+0.05+k*P;
      for(const x of xs) posts.push([s*x,H/2,z,0.09,H,0.1]);
      for(let y=0.4;y<H-0.6;y+=1.1) br.push([s*(wa/2+D/2),y+0.55,z,D-0.1,0.026,0.026,0,0,(((y/1.1)|0)%2?1:-1)*Math.atan2(1.1,D-0.1)]); }
    for(let b=0;b<nb;b++){ const zc=-L/2+0.05+(b+0.5)*P;
      for(let l=1;l<lev;l++) for(const x of xs) bm.push([s*x,l*pt-0.06,zc,0.05,0.12,P-0.1]);
      for(let l=0;l<lev;l++) for(let k=0;k<3;k++) for(let e=0;e<dd;e++)
        slots.push({x:s*(wa/2+0.6+e*1.3),y:l*pt+(l?0:0.12),z:-L/2+0.1+b*P+(k+0.5)*((P-0.1)/3),face:-s,lev:l,side:s,deep:e,bay:b,ry:0}); } }
  for(let k=0;k<=nb;k++) br.push([0,H+0.05,-L/2+0.05+k*P,wa+2*D,0.1,0.12]);                          // верхние связи и подкрановый путь
  if(dd===2) for(const s of [-1,1]) for(let b=0;b<nb;b++) for(let l=0;l<lev;l++) bm.push([s*(wa/2+1.24),l*pt+0.02,-L/2+0.05+(b+0.5)*P,0.06,0.04,P-0.1]);
  IM(UB,MAT.up,posts,g); IM(UB,MAT.beam,bm,g); IM(UB,MAT.up,br,g);
  const Lr=L+2.8, zr=-L/2-2.2+Lr/2;
  box(0.14,0.13,Lr,MAT.rail,0,0.065,zr,g); box(0.1,0.12,Lr,MAT.rail,0,H+0.2,zr,g);
  /* P&D: вход (+x) и выход (−x) на роликовых столах перед торцом (от 0,4 до 2,3 м перед стеллажом — до главного конвейера) */
  const pdz=-L/2-1.0;
  for(const s of [-1,1]){ const c=f08({len:1.9,w:1.3,h:0.5,typ:0}); c.position.set(s*(wa/2+0.6),0,-L/2-1.35); g.add(c); }
  slots.push({x:wa/2+0.6,y:0.56,z:pdz,face:-1,lev:0,pd:'in',ry:0},{x:-(wa/2+0.6),y:0.56,z:pdz,face:1,lev:0,pd:'out',ry:0});
  /* кран */
  const cr=new THREE.Group(); g.add(cr); cr.position.set(0,0,pdz);
  box(0.62,0.42,2.3,MAT.crane,0,0.36,0,cr); for(const z of [-0.9,0.9]) cyl(0.17,0.14,MAT.blk,0,0.2,z,cr,14).rotation.z=PI/2;
  box(0.38,H+0.15,0.5,MAT.crane,0,(H+0.15)/2+0.55,0.55,cr); box(0.42,0.3,1.0,MAT.crane,0,H+0.48,0.3,cr);
  box(0.6,1.7,0.45,MAT.craneG,0.15,1.4,-0.75,cr); box(0.02,0.25,0.18,MAT.scr,0.46,1.75,-0.75,cr);
  for(let y=0.9;y<H;y+=0.3) box(0.34,0.025,0.025,MAT.galv,0,y,0.85,cr).castShadow=false;           // лестница
  const lift=new THREE.Group(); cr.add(lift); lift.position.set(0,0.75,0);
  box(1.15,0.14,1.25,MAT.craneG,0,0,0,lift); box(0.12,0.7,1.25,MAT.crane,0,0.35,0.62,lift);
  const tele=new THREE.Group(); lift.add(tele); for(const z of [-0.32,0.32]) box(1.1,0.05,0.14,MAT.toyD,0,0.1,z,tele);
  cr.userData={lift,tele,H,pdz,L,D}; g.userData.crane=cr;
  g.userData.slots=slots; g.userData.rk={kind:'F03',L,W:wa+2*D,H,lev,pt,dd,wa};
  loadsFor(g,slots,0); if(o.fill>0){ fillStatic(g.userData.loads,o.fill,nb*11+lev); const Ld=g.userData.loads; Ld.set(slots.length-1,false,1); Ld.set(slots.length-2,false,1); }
  return g; }

/* ===== F04 полочные стеллажи для отбора коробов (M7) ===== */
function f04(o){
  const g=new THREE.Group(), n=Math.round(o.n), lev=Math.round(o.lev), h=o.h, d=0.6, bw=1.8, P=bw+0.07, L=n*P+0.07, dbl=o.dbl>0.5;
  const posts=[], bm=[], sh=[], bx=[]; let q=n*31+lev;
  const r=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; };
  for(const s of (dbl?[1,-1]:[1])){ const xc=dbl?s*(d/2+0.05):0;
    for(let k=0;k<=n;k++){ const z=-L/2+0.035+k*P; for(const x of [xc-d/2+0.03,xc+d/2-0.03]) posts.push([x,h/2,z,0.06,h,0.05]); }
    for(let b=0;b<n;b++){ const zc=-L/2+0.035+(b+0.5)*P;
      for(let l=0;l<lev;l++){ const y=0.12+l*(h-0.25)/(lev-1); for(const x of [xc-d/2+0.03,xc+d/2-0.03]) bm.push([x,y-0.04,zc,0.04,0.08,P-0.07]); sh.push([xc,y+0.005,zc,d-0.02,0.018,P-0.07]);
        if(l<lev-1||r()<0.6){ let zz=zc-bw/2+0.05; while(zz<zc+bw/2-0.3){ const bl=0.28+r()*0.32, bh=0.18+r()*0.3; if(zz+bl>zc+bw/2-0.03) break; if(r()<0.85) bx.push([xc+(r()-0.5)*0.05,y+0.014+bh/2,zz+bl/2,d-0.12,bh,bl]); zz+=bl+0.03; } } } } }
  IM(UB,MAT.up,posts,g); IM(UB,MAT.beam,bm,g); IM(UB,MAT.galv,sh,g); IM(UB,M.carton,bx,g);
  g.userData.rk={kind:'F04',L,W:dbl?2*d+0.1:d,H:h,lev}; return g; }

/* ===== F05 консольный стеллаж для длинномеров ===== */
function f05(o){
  const g=new THREE.Group(), n=Math.round(o.n), lev=Math.round(o.lev), h=o.h, arm=o.arm, P=1.5, L=(n-1)*P, dbl=o.dbl>0.5;
  const col=[], armL=[], base=[], pipes=[];
  for(let k=0;k<n;k++){ const z=-L/2+k*P; col.push([0,h/2,z,0.16,h,0.2]); col.push([0,h/2,z,0.03,h,0.3]);
    for(const s of (dbl?[1,-1]:[1])){ base.push([s*(arm/2+0.05),0.09,z,arm+0.1,0.18,0.18]);
      for(let l=1;l<=lev;l++){ const y=0.3+l*(h-0.5)/lev; armL.push([s*(arm/2+0.08),y,z,arm,0.1,0.09,0,0,s*0.04]); } } }
  for(const s of (dbl?[1,-1]:[1])) for(let l=1;l<=lev;l++){ const y=0.3+l*(h-0.5)/lev; const m=(l%2)?5:7;
    for(let i=0;i<m;i++) pipes.push([s*(0.22+i*(arm-0.25)/m),y+0.1,0,0.06,L+1.4,0.06,0,PI/2]); }
  IM(UB,MAT.up,col,g); IM(UB,MAT.beam,armL,g); IM(UB,MAT.up,base,g); IM(UC,MAT.pipe,pipes,g);
  g.userData.rk={kind:'F05',L:L+1.4,W:dbl?2*arm+0.3:arm+0.2,H:h}; return g; }

/* ===== F06 гравитационный паллетный стеллаж: роликовые дорожки с уклоном 4 % к выходу (+z) ===== */
function f06(o){
  const g=new THREE.Group(), nl=Math.round(o.nl), nd=Math.round(o.nd), lev=Math.round(o.lev), pt=o.pt, cw=1.4, dp=0.85, W=nl*cw, L=nd*dp+0.6, sl=0.04;
  const H=Math.max(2,(lev-1)*pt+1.0), posts=[], rails=[], rol=[], brk=[], slots=[];
  const nz=Math.max(2,Math.round(L/2.5)+1);
  for(let i=0;i<=nl;i++){ const x=-W/2+i*cw; for(let k=0;k<nz;k++) posts.push([x,H/2,-L/2+k*(L/(nz-1)),0.1,H,0.09]); }
  for(let i=0;i<nl;i++){ const xc=-W/2+(i+0.5)*cw;
    for(let l=0;l<lev;l++){ const y0=l*pt+0.25+sl*L/2;
      for(const s of [-1,1]){ rails.push([xc+s*0.42,y0-sl*L/2-0.03,0,0.05,0.07,L+0.02,0,-Math.atan(sl)]);
        for(let zz=-L/2+0.06;zz<L/2;zz+=0.11){ rol.push([xc+s*0.42,y0-sl*(zz+L/2)+0.0,zz,0.024,0.12,0.024,0,0,PI/2]); }
        for(let zz=-L/2+1.0;zz<L/2-0.3;zz+=1.2) brk.push([xc+s*0.42,y0-sl*(zz+L/2)+0.005,zz,0.035,0.13,0.035,0,0,PI/2]); }
      for(let j=0;j<nd;j++){ const z=-L/2+0.3+(j+0.5)*dp; slots.push({x:xc,y:y0-sl*(z+L/2)+0.03,z,face:0,lev:l,ch:i,dep:j,ry:0}); } } }
  IM(UB,MAT.up,posts,g); IM(UB,MAT.rail,rails,g); IM(UC,MAT.galv,rol,g,true); IM(UC,MAT.beam,brk,g,true);
  g.userData.slots=slots; g.userData.rk={kind:'F06',L,W,H,lev,pt,nl,nd}; loadsFor(g,slots,0); if(o.fill>0) fillStatic(g.userData.loads,o.fill,nl*17+nd);
  return g; }

/* ===== F07 набивной стеллаж Drive-in: въезд погрузчика в канал, паллеты на консольных профилях ===== */
function f07(o){
  const g=new THREE.Group(), nl=Math.round(o.nl), nd=Math.round(o.nd), lev=Math.round(o.lev), pt=o.pt, cw=1.55, dp=0.85, W=nl*cw, L=nd*dp+0.3;
  const H=Math.max(2.2,(lev-1)*pt+1.4), posts=[], rails=[], ties=[], slots=[];
  const nz=Math.max(2,Math.round(L/1.3)+1);
  for(let i=0;i<=nl;i++){ const x=-W/2+i*cw; for(let k=0;k<nz;k++) posts.push([x,H/2,-L/2+k*(L/(nz-1)),0.1,H,0.09]); }
  for(let i=0;i<nl;i++){ const xc=-W/2+(i+0.5)*cw;
    for(let l=1;l<lev;l++) for(const s of [-1,1]) rails.push([xc+s*(cw/2-0.1),l*pt-0.04,0,0.12,0.06,L]);
    for(let l=0;l<lev;l++) for(let j=0;j<nd;j++) slots.push({x:xc,y:l*pt,z:-L/2+0.15+(j+0.5)*dp,face:0,lev:l,ch:i,dep:j,ry:0}); }
  for(let k=0;k<nz;k++) ties.push([0,H-0.05,-L/2+k*(L/(nz-1)),W,0.1,0.08]);
  IM(UB,MAT.up,posts,g); IM(UB,MAT.rail,rails,g); IM(UB,MAT.beam,ties,g);
  g.userData.slots=slots; g.userData.rk={kind:'F07',L,W,H,lev,pt,nl,nd}; loadsFor(g,slots,0); if(o.fill>0) fillStatic(g.userData.loads,o.fill,nl*19+nd);
  return g; }

/* ===== F08 паллетный конвейер (роликовый или цепной) вдоль z; верх роликов — h ===== */
function f08(o){
  const g=new THREE.Group(), L=o.len, w=o.w||1.3, h=o.h||0.5, legs=[], fr=[], rol=[];
  for(const s of [-1,1]) fr.push([s*w/2,h-0.09,0,0.08,0.18,L]);
  for(let z=-L/2+0.25;z<=L/2-0.2;z+=1.4) for(const s of [-1,1]) legs.push([s*(w/2-0.05),(h-0.18)/2,z,0.08,h-0.18,0.08]);
  if(o.typ>0.5){ for(const x of [-0.42,0,0.42]) rol.push([x,h-0.02,0,0.06,0.05,L-0.1]); IM(UB,MAT.toyD,rol,g); }
  else { for(let z=-L/2+0.08;z<L/2-0.05;z+=0.16) rol.push([0,h-0.04,z,0.04,w-0.12,0.04,0,0,PI/2]); IM(UC,MAT.galv,rol,g); }
  IM(UB,MAT.toyG,fr,g); IM(UB,MAT.toyG,legs,g);
  box(0.3,0.3,0.35,MAT.toyD,w/2+0.18,h-0.25,0,g);                                                  // мотор-редуктор
  for(const z of [-L/2+0.1,L/2-0.1]) for(const s of [-1,1]) box(0.03,0.3,0.03,MAT.yel,s*(w/2+0.06),h+0.12,z,g);   // фотодатчики
  g.userData.conv={L,w,h}; return g; }
/* ===== F09 конвейер для коробок (приводные ролики) ===== */
function f09(o){
  const g=new THREE.Group(), L=o.len, w=o.w||0.6, h=o.h||0.75, rol=[], fr=[], legs=[];
  for(const s of [-1,1]){ fr.push([s*w/2,h-0.06,0,0.05,0.12,L]); fr.push([s*(w/2+0.02),h+0.07,0,0.02,0.06,L]); }
  for(let z=-L/2+0.3;z<=L/2-0.2;z+=1.5) for(const s of [-1,1]) legs.push([s*(w/2-0.04),(h-0.12)/2,z,0.05,h-0.12,0.05]);
  for(let z=-L/2+0.04;z<L/2-0.02;z+=0.075) rol.push([0,h-0.025,z,0.025,w-0.06,0.025,0,0,PI/2]);
  IM(UB,MAT.toyG,fr,g); IM(UB,MAT.toyG,legs,g); IM(UC,MAT.galv,rol,g,true);
  g.userData.conv={L,w,h}; return g; }

/* ===== F10 мобильный робот AMR с подъёмной платформой ===== */
function f10(){
  const g=new THREE.Group(), R={lift:0}; g.userData.rig2=R; g.userData.nm='Мобильный робот AMR';
  ao(1.1,1.5,0,0,g);
  rbox(1.0,0.28,1.45,0.08,MAT.amr,0,0.17,0,g); box(1.02,0.05,1.47,MAT.blk,0,0.05,0,g);
  box(1.03,0.02,1.48,MAT.led,0,0.12,0,g).castShadow=false;
  box(0.16,0.06,0.08,MAT.blk,0,0.26,0.73,g); cyl(0.05,0.06,MAT.blk,0,0.33,0.62,g,14);              // лидар
  const top=new THREE.Group(); g.add(top); top.position.y=0.32; R.top=top;
  box(0.9,0.04,1.3,MAT.toyD,0,0.02,0,top);
  for(const x of [-0.32,0.32]) for(const z of [-0.5,0.5]) cyl(0.07,0.05,MAT.blk,x,0.06,z,g,12).rotation.z=PI/2;
  return g; }
function amrSet(g,lift){ const R=g.userData.rig2; R.lift=lift; R.top.position.y=0.32+lift*0.06; }

/* ===== F11 ричтрак (выдвижная мачта между опорными лапами) ===== */
function f11(){
  const g=new THREE.Group(), R={lift:0,reach:0.25,wheels:[]}; g.userData.rig2=R; g.userData.nm='Ричтрак';
  ao(1.4,2.7,0,0.2,g);
  rbox(1.27,1.0,1.15,0.1,MAT.toy,0,0.58,-0.55,g); box(1.27,0.12,1.17,MAT.toyD,0,0.07,-0.55,g);       // корпус и АКБ
  box(0.5,0.08,0.5,MAT.seat,-0.15,1.12,-0.75,g); box(0.08,0.5,0.45,MAT.seat,-0.42,1.38,-0.75,g);      // сиденье боком
  box(0.25,0.7,0.06,MAT.toyD,0.35,1.25,-0.1,g); box(0.2,0.14,0.02,MAT.scr,0.35,1.55,-0.075,g);        // стойка с дисплеем
  for(const x of [-0.6,0.6]) for(const z of [-1.08,-0.02]) box(0.06,1.2,0.06,MAT.toyD,x,1.68,z,g);    // защитная крыша
  box(1.27,0.06,1.12,MAT.toyD,0,2.3,-0.55,g); for(let i=0;i<6;i++) box(1.2,0.025,0.04,MAT.toyD,0,2.34,-1.0+i*0.18,g);
  for(const s of [-1,1]){ box(0.17,0.2,1.25,MAT.toyD,s*0.5,0.13,0.6,g); const w=cyl(0.12,0.1,MAT.blk,s*0.5,0.12,1.12,g,14); w.rotation.z=PI/2; R.wheels.push(w); }
  { const w=cyl(0.17,0.16,MAT.blk,0.32,0.17,-0.8,g,16); w.rotation.z=PI/2; R.wheels.push(w); }
  const mast=new THREE.Group(); g.add(mast); R.mast=mast; mast.position.z=0.25;
  for(const s of [-1,1]) box(0.09,2.45,0.16,MAT.toyD,s*0.42,1.33,0,mast);
  box(0.92,0.1,0.16,MAT.toyD,0,2.55,0,mast); box(0.92,0.12,0.16,MAT.toyD,0,0.18,0,mast);
  const inner=new THREE.Group(); mast.add(inner); R.inner=inner;
  for(const s of [-1,1]) box(0.07,2.35,0.12,MAT.toyG,s*0.33,1.33,0.03,inner);
  const car=new THREE.Group(); mast.add(car); R.car=car;
  box(0.95,0.5,0.06,MAT.toyD,0,0.35,0.13,car); for(let i=0;i<4;i++) box(0.03,0.75,0.03,MAT.toyD,-0.36+i*0.24,0.95,0.13,car);   // упор груза
  for(const s of [-1,1]){ box(0.12,0.045,1.15,MAT.toyD,s*0.28,0.03,0.72,car); box(0.12,0.45,0.05,MAT.toyD,s*0.28,0.25,0.16,car); }
  return g; }
function rtSet(g,lift,reach,roll){ const R=g.userData.rig2; R.lift=lift; R.reach=reach;
  R.mast.position.z=reach; R.car.position.y=0.06+lift; R.inner.position.y=Math.max(0,lift-1.6)*0.55; R.inner.scale.y=1;
  for(const w of R.wheels) w.rotation.x=roll||0; }

/* ===== F14 высотный комплектовщик: кабина-платформа поднимается вместе с вилами ===== */
function f14(){
  const g=new THREE.Group(), R={lift:0}; g.userData.rig2=R; g.userData.nm='Комплектовщик';
  ao(1.3,2.4,0,0,g);
  rbox(1.1,1.0,0.9,0.08,MAT.toy,0,0.55,-0.75,g);
  for(const s of [-1,1]){ box(0.16,0.18,1.2,MAT.toyD,s*0.42,0.12,0.4,g); box(0.09,2.6,0.16,MAT.toyD,s*0.36,1.35,-0.2,g); }
  const pl=new THREE.Group(); g.add(pl); R.pl=pl;
  box(0.95,0.1,0.85,MAT.toyD,0,0.2,0.2,pl); for(const s of [-1,1]) box(0.04,1.0,0.8,MAT.toy,s*0.46,0.75,0.2,pl);
  box(0.95,0.05,0.85,MAT.toyD,0,2.3,0.2,pl); for(const s of [-1,1]) for(const z of [-0.18,0.58]) box(0.04,1.1,0.04,MAT.toyD,s*0.45,1.8,z,pl);
  box(0.5,0.12,0.25,MAT.toyD,0,1.1,0.55,pl);
  for(const s of [-1,1]) box(0.1,0.04,1.0,MAT.toyD,s*0.2,0.1,1.0,pl);
  const H=HUM.build({role:'КЛАДОВЩИК'}); H.root.position.set(0,0.25,0.15); H.root.rotation.y=0; pl.add(H.root); H.base={tablet:0}; HUM.pose(H,{t:0}); R.H=H;
  return g; }
function opSet(g,lift){ const R=g.userData.rig2; R.lift=lift; R.pl.position.y=lift; }

/* ===== F15 электрический штабелёр (сопровождаемый) ===== */
function f15(){
  const g=new THREE.Group(), R={lift:0}; g.userData.rig2=R; g.userData.nm='Штабелёр';
  ao(0.9,2.0,0,0,g);
  rbox(0.8,1.0,0.7,0.08,MAT.toy,0,0.55,-0.55,g); box(0.06,0.06,0.8,MAT.toyD,0,1.15,-1.1,g).rotation.x=0.7;   // дышло
  box(0.4,0.07,0.12,MAT.blk,0,1.42,-1.42,g);
  for(const s of [-1,1]){ box(0.12,0.12,1.2,MAT.toyD,s*0.36,0.08,0.45,g); box(0.08,2.1,0.14,MAT.toyD,s*0.32,1.1,-0.12,g); }
  const car=new THREE.Group(); g.add(car); R.car=car;
  box(0.7,0.4,0.05,MAT.toyD,0,0.3,-0.02,car); for(const s of [-1,1]) box(0.11,0.045,1.1,MAT.toyD,s*0.22,0.04,0.55,car);
  return g; }
function stSet(g,lift){ const R=g.userData.rig2; R.lift=lift; R.car.position.y=0.06+lift; }

/* ===== F16 станция терминалов сбора данных (зарядка) ===== */
function f16(o){
  const g=new THREE.Group(), n=Math.round(o.n||4);
  rbox(1.2,0.06,0.6,0.02,MAT.toyG,0,0.75,0,g); for(const x of [-0.55,0.55]) box(0.05,0.72,0.55,MAT.toyG,x,0.37,0,g);
  for(let i=0;i<n;i++){ const x=-0.45+i*(0.9/(Math.max(1,n-1)));
    box(0.12,0.06,0.12,MAT.blk,x,0.81,0,g); const t=box(0.075,0.16,0.02,MAT.blk,x,0.9,0,g); t.rotation.x=-0.2;
    box(0.06,0.11,0.005,MAT.scr,x,0.91,0.012,g).rotation.x=-0.2; box(0.005,0.08,0.015,MAT.yel,x+0.04,0.9,0,g); }
  sign(g,'ТСД · ТЕРМИНАЛЫ',0,1.25,-0.25,0,0.8,'#1d232b');
  g.userData.rk={kind:'F16',n}; return g; }
/* ===== F17 промышленный принтер этикеток на рабочем месте приёмки ===== */
function f17(){
  const g=new THREE.Group();
  rbox(1.4,0.06,0.7,0.02,MAT.toyG,0,0.8,0,g); for(const x of [-0.65,0.65]) box(0.05,0.77,0.65,MAT.toyG,x,0.39,0,g);
  rbox(0.27,0.32,0.48,0.03,std(0x7c8287,.45,.4),-0.3,0.99,0,g); box(0.02,0.08,0.06,MAT.scr,-0.16,1.06,0.12,g);
  box(0.11,0.002,0.09,MAT.paper,-0.3,1.155,0.27,g); cyl(0.07,0.11,MAT.paper,-0.3,1.0,-0.05,g,16).rotation.z=PI/2;
  box(0.5,0.32,0.03,MAT.blk,0.3,1.2,-0.15,g); box(0.46,0.28,0.01,MAT.scr,0.3,1.2,-0.133,g); box(0.06,0.18,0.06,MAT.blk,0.3,0.92,-0.18,g);
  box(0.4,0.02,0.14,MAT.blk,0.3,0.84,0.1,g);
  sign(g,'ПЕЧАТЬ ID ПАЛЛЕТ',0,1.55,-0.3,0,0.8,'#1d232b');
  return g; }
/* ===== F19 уравнительная платформа дока: настил с аппарелью, +z — к машине ===== */
function f19(o){
  const g=new THREE.Group(), w=o.w||2.0, l=o.l||2.5, dh=o.dh||0, a=Math.atan2(dh,l);
  box(w+0.16,0.04,l+0.1,MAT.toyD,0,-0.02,l/2,g);
  const deck=new THREE.Group(); g.add(deck); deck.rotation.x=-a;
  box(w,0.06,l,MAT.lip,0,0.0,l/2,deck); for(let i=0;i<12;i++) box(w-0.1,0.004,0.02,MAT.toyG,0,0.033,0.15+i*l/12,deck).castShadow=false;
  const lip=new THREE.Group(); deck.add(lip); lip.position.set(0,0,l); lip.rotation.x=a+0.12;
  box(w,0.03,0.42,MAT.lip,0,0.0,0.21,lip);
  for(const s of [-1,1]){ const sk=box(0.02,0.25,l,MAT.yel,s*w/2,-0.12,l/2,deck); sk.castShadow=false;
    for(let i=0;i<5;i++) box(0.022,0.25,0.18,MAT.blk,s*w/2,-0.12,0.2+i*l/5,deck).castShadow=false; }
  box(0.25,0.35,0.15,MAT.toyG,w/2+0.4,1.3,-0.1,g); box(0.05,0.05,0.02,MAT.ledG,w/2+0.4,1.38,-0.02,g);
  return g; }
/* ===== F20 герметизатор (уплотнитель) проёма дока: подушки и шторы на раме, +z — к машине ===== */
function f20(o){
  const g=new THREE.Group(), w=o.w||3.4, h=o.h||3.8, d=o.d||0.8;
  for(const s of [-1,1]){ box(0.1,h+0.5,0.1,MAT.toyG,s*(w/2+0.45),(h+0.5)/2,0.05,g); box(0.42,h,d,MAT.foam,s*(w/2+0.2),h/2,d/2,g);
    for(let y=0.4;y<h;y+=0.8) box(0.43,0.12,0.02,MAT.yel,s*(w/2+0.2),y,d+0.005,g).castShadow=false; }
  box(w+1.0,0.1,0.1,MAT.toyG,0,h+0.5,0.05,g); box(w+0.84,0.7,d,MAT.foam,0,h+0.15,d/2,g);
  for(let x=-w/2;x<w/2;x+=0.6) box(0.3,0.1,0.02,MAT.yel,x+0.3,h-0.1,d+0.005,g).castShadow=false;
  return g; }
