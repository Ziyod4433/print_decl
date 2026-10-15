/* ---------------------------------------------------------------- симуляция потоков паллет по варианту
   Счёт шагом 0,1 с (ускорение ×1…×120, «прогон» — без привязки к кадрам). Исходные данные — стр. 7 концепции (ползунки):
   приход и отбор паллет в час, партии по SKU, начальное заполнение. Что моделируется:
   · машины: китайская у Л2 (приход), автопоезд на посту П2 или полуприцеп у Л1 в B (отгрузка) — заезд, выгрузка/погрузка, отъезд;
   · техника из сцены варианта (F11 ричтраки, F12 погрузчики): задания WMS, путь по сетке (A*), блокировка узких проходов,
     уступание дороги; подъём/выдвижение вил, сканирование груза и ячейки (терминалы F16);
   · B — каналы F02: шаттл уводит паллету в глубину (FIFO — выход с другой стороны), уплотняет канал, переносится ричтраком;
   · C — краны F03 (двойные циклы, перестановки при двойной глубине), паллетный конвейер F08 с накоплением, входной контроль;
   · обмотка F18 перед погрузкой. Показатели: выполнено, задания в час, циклы, загрузка техники, очереди и буферы, время «док — ячейка». */
const SIMX=(()=>{
const P={inRate:30,outRate:30,batch:6,skus:60,fill0:0.55,wrapT:60,scanT:3,rej:0.03,hours:4};
const S={on:false,t:0,speed:20,fast:false,until:0,v:null,onDone:null};
const Hs=0.1, TRP=0.30;                                         // шаг счёта; верх вил при перевозке
let W=null;
const wrapA=a=>{ while(a>PI) a-=2*PI; while(a<=-PI) a+=2*PI; return a; };
const KIND={
  F12:{n:'Погрузчик F12',vE:1.9,vL:1.5,vA:1.1,vIn:0.55,w:0.9,acc:0.7,up:0.45,upL:0.33,dn:0.5,D:1.82,FT:0.1075,maxLift:3.3,circ:[[-0.85,0.66],[0.25,0.66]],fk:[1.82,0.55,0.75]},   /* корпус 1,2 × 2,65 м — два круга r 0,66 */
  F11:{n:'Ричтрак F11',vE:2.2,vL:1.8,vA:1.4,vIn:0.5,w:0.9,acc:0.7,up:0.35,upL:0.3,dn:0.5,D:1.80,FT:0.1125,maxLift:7.6,circ:[[-0.6,0.68],[0.45,0.68]],fk:[null,0.42,0.72],reach:1},
  F10:{n:'AMR F10',vE:1.5,vL:1.2,vA:1.0,vIn:0.4,w:1.2,acc:0.6,circ:[[0,0.85]]},
  F13:{n:'Электроперевозчик F13',vE:1.6,vL:1.3,vA:1.0,vIn:0.45,w:1.0,acc:0.6,up:0.1,upL:0.08,dn:0.15,D:0.5,FT:0.085,maxLift:0.3,circ:[[-0.3,0.55],[0.45,0.5]],fk:[0.5,0.42,0.7]},
  F14:{n:'Комплектовщик F14',vE:1.4,vL:1.2,vA:1.0,vIn:0.4,w:0.8,acc:0.6,circ:[[-0.4,0.75],[0.55,0.65]]},
  F15:{n:'Штабелёр F15',vE:1.4,vL:1.1,vA:1.0,vIn:0.4,w:0.8,acc:0.6,circ:[[-0.5,0.6],[0.55,0.55]]}
};
/* ---------- паллеты: запись + видимая модель там, где нет мест-экземпляров (пол, вилы, конвейер, кран, шаттл, обмотчик) ---------- */
const LM=OWNC.map(c=>{ const m=MAT.load.clone(); m.color.setHex(c); return m; });
const FILMM=std(0xe4ecf2,.32,.02,{transparent:true,opacity:.42});
let pool=[];
function pmGet(p){ if(p.pm) return p.pm; let g=pool.pop();
  if(!g){ g=new THREE.Group(); const a=new THREE.Mesh(PALGEO,MAT.pal), b=new THREE.Mesh(UB,LM[0]); a.castShadow=b.castShadow=true; a.receiveShadow=b.receiveShadow=true;
    const f=new THREE.Mesh(new THREE.CylinderGeometry(0.73,0.73,1,20,1,true),FILMM); f.castShadow=false; g.add(a,b,f); g.userData={ld:b,film:f}; }
  g.userData.ld.material=LM[p.col%LM.length]; g.userData.ld.scale.set(1.16,p.h,0.78); g.userData.ld.position.y=0.144+p.h/2;
  g.userData.film.visible=!!p.wr; g.userData.film.scale.set(1,p.h+0.1,1); g.userData.film.position.y=0.12+(p.h+0.1)/2; g.userData.film.scale.x=g.userData.film.scale.z=0.82;
  p.pm=g; return g; }
function pmAt(p,par,x,y,z,ry){ const g=pmGet(p); if(g.parent!==par) par.add(g); g.position.set(x,y,z); g.rotation.set(0,ry||0,0); g.visible=true; return g; }
function pmHide(p){ if(!p||!p.pm) return; const g=p.pm; if(g.parent) g.parent.remove(g); pool.push(g); p.pm=null; }
const OWNN=OWNC.length;
function newPal(sku){ const p={id:W.pid++,sku,h:0.95+W.rnd()*0.4,col:(sku*3)%OWNN,tIn:W.t,wr:false}; return p; }
/* ---------- места: пол, ячейки стеллажей, кузова, концы конвейеров, обмотчик ---------- */
const V=new THREE.Vector3();
function worldOf(g,x,y,z){ V.set(x,y,z); g.localToWorld(V); return {x:V.x,y:V.y,z:V.z}; }
function dirOf(g,dx,dz){ const r=g.rotation.y; return {x:dx*Math.cos(r)+dz*Math.sin(r),z:-dx*Math.sin(r)+dz*Math.cos(r)}; }
const yawOf=d=>Math.atan2(d.x,d.z);
function apFloor(k,x,z,yaw,yb){ const d={x:Math.sin(yaw),z:Math.cos(yaw)}, D=k==='F11'?0.97:k==='F13'?KIND.F13.D:KIND.F12.D;
  return {px:x-d.x*D,pz:z-d.z*D,h:yaw,stage:1.0,yb:yb||0,reach:0.25}; }
function mkSpot(sp){ const L={kind:'spot',x:sp.x,z:sp.z,yb:0,ry:sp.ry,yaw:sp.yaw,alt:sp.alt,pal:null,res:null,role:sp.kind,
    ap:k=>{ if(k==='F11'&&sp.alt!==undefined){ const A=apFloor(k,sp.x,sp.z,sp.alt,0), d={x:Math.sin(A.h),z:Math.cos(A.h)};
        if(NAV.D(A.px,A.pz)>=0.6&&NAV.D(A.px-d.x*A.stage,A.pz-d.z*A.stage)>=0.6) return A; }
      return apFloor(k,sp.x,sp.z,sp.yaw,0); },
    put(p){ this.pal=p; pmAt(p,W.root,this.x,0,this.z,this.ry); }, take(){ const p=this.pal; this.pal=null; return p; }};
  return L; }
function mkRackSlot(g,i,face){ const s=g.userData.slots[i], w=worldOf(g,s.x,s.y,s.z), fw=face?dirOf(g,face.x,face.z):null;
  const L={kind:'slot',g,i,s,x:w.x,z:w.z,yb:w.y,ry:g.rotation.y+(s.ry||0),pal:null,res:null,bad:0,lev:s.lev,
    put(p){ g.userData.loads.set(i,true,p.h,OWNC[p.col%OWNN]); this.pal=p; pmHide(p); },
    take(){ g.userData.loads.set(i,false,1); const p=this.pal; this.pal=null; return p; }};
  if(fw){ L.fw=fw; L.ap=k=>{ if(k==='F11') return {px:L.x+fw.x*1.80,pz:L.z+fw.z*1.80,h:yawOf({x:-fw.x,z:-fw.z}),stage:L.face?1.0:0,yb:L.yb,reach:1.08};
      return {px:L.x+fw.x*KIND.F12.D,pz:L.z+fw.z*KIND.F12.D,h:yawOf({x:-fw.x,z:-fw.z}),stage:1.0,yb:L.yb,reach:0}; }; }
  return L; }
function mkTruckSlot(T,body,i,s,mode,push){         // mode 'dock' (с торца, с площадки) или 'side' (с борта, вилами с севера)
  const L={kind:'truck',T,body,i,s,pal:null,res:null,push:push||0,
    get x(){ return worldOf(body,s.x,s.y,s.z).x; }, get z(){ return worldOf(body,s.x,s.y,s.z).z; }, get yb(){ return worldOf(body,s.x,s.y,s.z).y; }, ry:PI/2,
    ap(k){ const w=worldOf(body,s.x,s.y,s.z);
      if(mode==='dock') return {px:w.x+KIND.F12.D,pz:w.z,h:-PI/2,stage:Math.max(0.5,1.7-(w.x+KIND.F12.D)),yb:w.y,dock:1};
      return {px:w.x,pz:L.nearZ+KIND.F12.D,h:PI,stage:1.0,yb:w.y,push:L.push}; },
    put(p){ body.userData.loads.set(i,true,p.h,OWNC[p.col%OWNN]); this.pal=p; pmHide(p); },
    take(){ body.userData.loads.set(i,false,1); const p=this.pal; this.pal=null; return p; }};
  return L; }
const groundDock=x=>x>=-0.9?0:x>=-3.4?0.28*(-0.9-x)/2.5:0.28;
/* ---------- построение мира прогона ---------- */
function build(v){
  W={v,t:0,pid:1,root:new THREE.Group(),agents:[],spots:{inb:[],qua:[],exp:[]},slots:[],lanes:[],shut:[],cranes:[],cv:null,wr:null,
    orders:[],locks:new Map(),K:null,rnd:null,nextOrd:0,dock:null,out:null,stock:new Map(),need:new Set(),log:[],samp:0,disp:0};
  let q=20261015+(S.seed||0); W.rnd=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; };
  scene.add(W.root); W.root.name='abc-sim';
  W.K={put:0,ret:0,unl:0,load:0,wrap:0,shx:0,reloc:0,rej:0,cyc:{},d2s:[0,0],lead:[0,0],trIn:0,trOut:0,trWait:[0,0],stall:0,blockS:0,
    bufIn:[0,0,0],bufOut:[0,0,0],backlog:[0,0,0],conv:[0,0],nostock:0,
    busy:new Map(),moved:new Map()};
  const F=fixG.userData, sz=southZones(v);
  for(const k of ['inb','qua','exp']) W.spots[k]=sz[k].map(mkSpot);
  /* хранение */
  const objs=spawned.filter(g=>g.parent&&g.visible!==false);
  objs.forEach(g=>{ const k=g.userData.libKind, sl=g.userData.slots; if(!sl||!g.userData.loads) return;
    for(let i=0;i<g.userData.loads.n;i++) g.userData.loads.set(i,false,1);
    if(k==='F01'){ sl.forEach((s,i)=>{ const L=mkRackSlot(g,i,{x:s.face,z:0}); L.type='F01'; W.slots.push(L); }); }
    if(k==='F02'){ const rk=g.userData.rk, nd=rk.nd, lanes=new Map();
      sl.forEach((s,i)=>{ const key=s.ch+'/'+s.lev; if(!lanes.has(key)) lanes.set(key,{g,ch:s.ch,lev:s.lev,nd,idx:[],pos:new Array(nd).fill(null),sku:null,sh:null,job:null,res:null,resOut:null,fifo:rk.fifo});
        lanes.get(key).idx[s.dep]=i; });
      lanes.forEach(Ln=>{ const e=mkRackSlot(g,Ln.idx[0],{x:0,z:-1}), x=mkRackSlot(g,Ln.idx[nd-1],{x:0,z:Ln.fifo?1:-1}); e.face=1; x.face=1; e.lane=Ln; x.lane=Ln; e.kind='lane'; x.kind='lane';
        Ln.entry=e; Ln.exit=Ln.fifo?x:e;
        Ln.exit.take=function(){ const j=Ln.fifo?Ln.nd-1:0, p=Ln.pos[j]; Ln.pos[j]=null; Ln.g.userData.loads.set(Ln.idx[j],false,1); this.pal=null;
          if(!laneCount(Ln)){ stockDel(Ln.sku,Ln); Ln.sku=null; } return p; };
        W.lanes.push(Ln); });
      (g.userData.shuttles||[]).forEach((m,j)=>{ const Ln=[...lanes.values()].filter(l=>l.lev===0)[j*Math.max(1,Math.floor(rk.nc/Math.max(1,g.userData.shuttles.length)))%rk.nc]||[...lanes.values()][0];
        const sh={o:m,g,lane:null,dep:0,lift:0,pal:null,steps:[],busy:0,lane0:Ln}; W.shut.push(sh); shPark(sh,Ln); }); }
    if(k==='F03'){ const cr=g.userData.crane, c={g,cr,lift:cr.userData.lift,tele:cr.userData.tele,pdz:cr.userData.pdz,z:cr.userData.pdz,ly:0.75,tx:0,vz:0,pal:null,steps:[],busy:0,slots:[],q:[],id:W.cranes.length};
      cr.position.z=c.z; c.lift.position.y=c.ly; c.tele.position.x=0;
      sl.forEach((s,i)=>{ if(s.pd) return; const L=mkRackSlot(g,i,null); L.type='F03'; L.crane=c; c.slots.push(L); W.slots.push(L); });
      c.slots.forEach(L=>{ if(L.s.deep===1) L.front=c.slots.find(F=>F.s.deep===0&&F.s.side===L.s.side&&F.s.bay===L.s.bay&&F.s.lev===L.s.lev&&Math.abs(F.s.z-L.s.z)<0.05)||null; });
      c.slots.forEach(L=>{ if(L.s.deep===0) L.back=c.slots.find(B=>B.front===L)||null; });
      W.cranes.push(c); } });
  /* техника */
  objs.forEach(g=>{ const k=g.userData.libKind; if(!MOBILE[k]) return; const K=KIND[k]; if(!K) return;
    const a={id:W.agents.length,k,K,o:g,x:g.position.x,z:g.position.z,h:g.rotation.y,y:0,v:0,lift:0,reach:0.25,roll:0,pal:null,palRy:0,palPush:0,steps:[],task:null,roles:[],
      home:{x:g.position.x,z:g.position.z,h:g.rotation.y},idle:0,busy:0,blkBy:null,blkT:0,locks:new Set(),yieldFrom:null,nm:K.n,last:''};
    g.userData.abcMob=true; if(!g.userData.rig) g.userData.truck={kind:'abc'};
    W.agents.push(a); W.K.busy.set(a,0); W.K.moved.set(a,0); });
  W.park=[]; { const hs=W.agents.filter(a=>a.k==='F11').map(a=>a.home); if(hs.length&&hs.every(h=>Math.abs(h.z-33.95)<0.1)) for(let x=46.0;x>=28;x-=3.5) W.park.push({x,z:33.95,h:0}); }
  const F12s=W.agents.filter(a=>a.k==='F12'), F11s=W.agents.filter(a=>a.k==='F11'), F13s=W.agents.filter(a=>a.k==='F13');
  F12s.forEach((a,i)=>{ a.roles=v==='C'?(i===0?['rej','unl','feed']:i===1?['load']:['feed','unl','load'])
    :(i===0?['unl']:i===1?['load','wrap']:['unl','load','wrap']);
    if(!F11s.length&&v!=='C') a.roles=a.roles.concat(['put','ret']);
    if(F12s.length===1) a.roles=v==='C'?['rej','load','wrap','unl','feed']:['load','wrap','unl','put','ret']; });
  F11s.forEach(a=>{ a.roles=v==='B'?['shx','ret','put']:['ret','put']; });
  /* машины */
  const cn=F.cn; W.dock={T:cn,gate:'L2',state:'docked',slots:[],x0:cn.position.x,next:0,queue:0,qT:[],anim:0};
  { const sl=cn.userData.slots; for(let k=0;k<sl.length;k++){ const L=mkTruckSlot(W.dock,cn,k,sl[k],'dock'); W.dock.slots.push(L); } }
  if(F.cnOut){ const co=F.cnOut; W.out={T:co,kind:'cn',state:'docked',slots:[],x0:co.position.x,anim:0,t0:0};
    const sl=co.userData.slots; for(let k=sl.length-1;k>=0;k--) W.out.slots.push(mkTruckSlot(W.out,co,k,sl[k],'dock')); }
  else if(F.kz){ const kz=F.kz; W.out={T:kz,kind:'kz',state:'docked',slots:[],anim:0,t0:0};
    const list=[]; [kz.userData.b1,kz.userData.b2].forEach(b=>{ b.userData.slots.forEach((s,i)=>{ const w=worldOf(b,s.x,s.y,s.z); list.push({b,i,s,wx:w.x,wz:w.z}); }); });
    const nearZ=Math.max(...list.map(e=>e.wz));
    list.sort((p,q)=>(p.wx-q.wx)||(p.wz-q.wz));
    list.forEach(e=>{ const far=e.wz<nearZ-0.3, L=mkTruckSlot(W.out,e.b,e.i,e.s,'side',far?nearZ-e.wz:0); L.nearZ=nearZ; W.out.slots.push(L); }); }
  /* обмотчик */
  const wr=objs.find(g=>g.userData.libKind==='F18');
  if(wr){ const tt=wr.userData.wrap.tt, sp=spinAnim.find(s=>s.o===tt);
    const L={kind:'wrap',g:wr,tt,sp,x:wr.position.x,z:wr.position.z,yb:0.15,ry:PI/2,pal:null,res:null,state:'idle',t:0,
      ap(k){ for(const [dx,dz] of (k==='F13'?[[0,-1],[1,0],[0,1]]:[[1,0],[0,1],[0,-1]])){   /* рохля — с юга (из экспедиции), погрузчик — с востока (к машине) */ const d=dirOf(wr,dx,dz), D=k==='F11'?0.97:k==='F13'?KIND.F13.D:KIND.F12.D, px=L.x+d.x*D, pz=L.z+d.z*D;
          if((k==='F13'||NAV.D(px,pz)>=0.6)&&NAV.D(px+d.x*(k==='F13'?1.6:1),pz+d.z*(k==='F13'?1.6:1))>=0.6) return {px,pz,h:yawOf({x:-d.x,z:-d.z}),stage:k==='F13'?1.6:1.0,yb:0.15}; } return null; },   // рохля заезжает на пандус стола
      put(p){ this.pal=p; const r=wr.rotation.y; pmAt(p,tt,0,0.05,0,PI/2-r); this.state='wrap'; this.t=0; },
      take(){ const p=this.pal; this.pal=null; this.state='idle'; return p; }};
    if(sp) sp.sp=0; W.wr=L; L.inline=v==='C'&&Math.hypot(L.x-CZ.outX,L.z-14.05)<1.2; }   // C: стол обмотки в конце выходного конвейера
  if(W.wr&&W.wr.inline) F12s.forEach(a=>{ a.roles=a.roles.filter(r=>r!=='wrap'); });
  if(W.wr&&F13s.length){ F13s.forEach(a=>{ a.roles=['wrap']; }); F12s.forEach(a=>{ a.roles=a.roles.filter(r=>r!=='wrap'); }); }   // обмотку обслуживает электроперевозчик (пандус под рохлю), погрузчик — погрузку
  /* C: конвейер и краны */
  if(W.cranes.length) buildConv();
  /* сетка проходов: стеллажи, конвейеры, кузова — сплошным габаритом; техника — не препятствие; узкие проходы — с блокировкой */
  const solid=new Set(objs.filter(g=>g.userData.rk||g.userData.conv)); [F.cn,F.kz,F.cnOut].forEach(t=>t&&solid.add(t));
  const soft=W.spots.inb.concat(W.spots.qua,W.spots.exp).map(L=>[L.x-0.42,L.z-0.62,L.x+0.42,L.z+0.62]);
  if(W.out&&W.out.kind==='kz') soft.push([24.5,12.0,44.5,14.7]);                          // полоса погрузки автопоезда: транзит идёт севернее
  const ai=[]; if(v!=='C') aislesOf(v).forEach(a=>ai.push({x0:a.x-a.w/2+0.05,x1:a.x+a.w/2-0.05,z0:a.z0,z1:a.z1}));
  const lanesN=v==='C'?[{x0:21.5,x1:47.5,z0:CZ.corr[0],z1:CZ.fence,mid:(CZ.corr[0]+CZ.fence)/2}]
    :[{x0:0.5,x1:47.5,z0:CROSS.z0-0.6,z1:CROSS.z1,mid:(CROSS.z0+CROSS.z1)/2},{x0:0.5,x1:47.5,z0:REAR.z0,z1:32.9,mid:31.75}];
  lanesN.push({x0:0.5,x1:21.4,z0:8.65,z1:12.65,mid:10.65});
  NAV.build({solid,soft,aisles:ai,lanes:lanesN,skip:new Set(W.agents.map(a=>a.o))});
  /* начальный запас; порядок ячеек A для размещения — от приёмки (ближние и нижние раньше) */
  initStock();
  W.f01=W.slots.filter(L=>L.type==='F01').map(L=>({L,c:Math.abs(L.x-8)+Math.abs(L.z-11)+L.lev*4+W.rnd()*3})).sort((a,b)=>a.c-b.c).map(e=>e.L);
  /* первая машина у Л2 — полная */
  truckFill(W.dock); W.dock.next=W.t+3600*W.dock.Q/Math.max(1,P.inRate);
  if(W.out){ W.out.slots.forEach(L=>{ if(L.pal) L.take(); }); }
  W.nextOrd=5;
}
function shPark(sh,Ln){ if(sh.lane) sh.lane.sh=null; sh.lane=Ln; if(Ln){ Ln.sh=sh; sh.dep=0; } shPose(sh); }
function shPose(sh){ const Ln=sh.lane; if(!Ln) return; const g=Ln.g, s0=g.userData.slots[Ln.idx[0]], s1=g.userData.slots[Ln.idx[Ln.nd-1]];
  const z=s0.z+(s1.z-s0.z)*(sh.dep/Math.max(1,Ln.nd-1)); sh.o.position.set(s0.x,s0.y-0.22+sh.lift,z); if(sh.o.parent!==g) g.add(sh.o); sh.o.visible=true;
  if(sh.pal) pmAt(sh.pal,g,s0.x,s0.y+0.03*(sh.lift>0.01?1:0),z,s0.ry||0); }
/* ---------- C: конвейер (полосы с накоплением) ---------- */
function buildConv(){
  const cv={lanes:{},spd:0.3,pitch:1.45}; W.cv=cv;
  const L=(id,x0,z0,dx,dz,len,ry)=>{ cv.lanes[id]={id,x0,z0,dx,dz,len,ry,list:[]}; return cv.lanes[id]; };
  const MX0=3.0, MX1=46.45;
  L('in',CZ.inX,14.2,0,1,CZ.conv-14.2,PI/2); L('main',MX0,CZ.conv,1,0,MX1-MX0,0); L('out',CZ.outX,CZ.conv,0,-1,CZ.conv-(W.wr&&W.wr.inline?W.wr.z:14.2),PI/2);   /* с обмотчиком на линии — до центра его стола */
  W.cranes.forEach(c=>{ const pin=worldOf(c.g,1.35,0,c.pdz), pout=worldOf(c.g,-1.35,0,c.pdz);
    c.pin=L('pi'+c.id,pin.x,CZ.conv,0,1,pin.z-CZ.conv,0); c.pout=L('po'+c.id,pout.x,pout.z,0,-1,pout.z-CZ.conv,0);
    c.sIn=pin.x-MX0; c.sOut=pout.x-MX0; c.ok=c.sOut>=-0.05&&c.sIn<=MX1-MX0+0.05; });
  cv.sInJ=CZ.inX-MX0; cv.sOutJ=CZ.outX-MX0;
  const yb=0.5;
  cv.inLoc={kind:'conv',x:CZ.inX,z:14.2,yb,ry:PI/2,pal:null,res:null,
    ap:k=>({px:CZ.inX,pz:14.2-KIND.F12.D,h:0,stage:1.0,yb}),
    put(p){ cv.lanes.in.list.push({p,s:0,t:0,chk:P.rej>0?4:0}); this.pal=p; },
    take(){ const ln=cv.lanes.in, e=ln.list.find(e=>e.p===this.pal); ln.list=ln.list.filter(x=>x!==e); const p=this.pal; this.pal=null; return p; }};
  cv.outLoc={kind:'conv',x:CZ.outX,z:14.2,yb,ry:PI/2,pal:null,res:null,
    ap:k=>({px:CZ.outX,pz:14.2-KIND.F12.D,h:0,stage:1.0,yb}),
    put(){}, take(){ const ln=cv.lanes.out, e=ln.list.find(e=>e.p===this.pal); ln.list=ln.list.filter(x=>x!==e); const p=this.pal; this.pal=null; return p; }};
}
function convStep(h){ const cv=W.cv; if(!cv) return; const sp=cv.spd*h, pt=cv.pitch;
  const pos=(ln,s)=>({x:ln.x0+ln.dx*s,z:ln.z0+ln.dz*s});
  const free=(ln,s0,s1)=>!ln.list.some(e=>e.s>s0&&e.s<s1);
  const lanes=cv.lanes;
  /* выходные полосы и P&D — по порядку от потребителя к источнику */
  const step=(ln,stopAt,onEnd)=>{ ln.list.sort((a,b)=>b.s-a.s);
    for(let i=0;i<ln.list.length;i++){ const e=ln.list[i]; if(e.x>0){ e.x-=h; continue; }
      if(e.chk>0){ e.chk-=h; if(e.chk<=0){ if(W.rnd()<P.rej){ e.rej=true; e.p.rej=true; W.K.rej++; } else e.rej=false; } continue; }
      if(e.rej) continue;
      const lim=Math.min(i?ln.list[i-1].s-pt:ln.len,stopAt?stopAt(e):ln.len); const ns=Math.min(lim,e.s+sp); if(ns>e.s) e.s=ns;
      if(e.s>=ln.len-1e-6&&onEnd) onEnd(e,ln); } };
  step(lanes.out,null,(e,ln)=>{ const WR=W.wr;
    if(WR&&WR.inline){ if(!WR.pal&&!WR.res&&WR.state==='idle'){ ln.list=ln.list.filter(x=>x!==e); WR.put(e.p); } return; }   // на стол обмотки
    if(!cv.outLoc.pal){ cv.outLoc.pal=e.p; } });
  W.cranes.forEach(c=>{ step(c.pin,null,null);
    step(c.pout,null,(e,ln)=>{ const m=lanes.main; if(!e.wait) e.wait=0; e.wait+=h;
      if(free(m,c.sOut-pt-0.4,c.sOut+pt)&&!m.list.some(q=>Math.abs(q.s-c.sOut)<pt)){ ln.list=ln.list.filter(x=>x!==e); m.list.push({p:e.p,s:c.sOut,dest:'out',x:1.5,rf:0,rt:0}); } }); });
  /* главная линия: съезд на P&D своего крана или на выход */
  const m=lanes.main; m.list.sort((a,b)=>b.s-a.s);
  for(let i=0;i<m.list.length;i++){ const e=m.list[i];
    if(e.x>0){ e.x-=h; continue; }                                       // поворотный перегрузчик (сход/заход)
    const ex=e.dest==='out'?cv.sOutJ:e.dest.sIn, lim=Math.min(i?m.list[i-1].s-pt:m.len,ex);
    e.s=Math.min(lim,e.s+sp);
    if(e.s>=ex-1e-6){ const tgt=e.dest==='out'?lanes.out:e.dest.pin;
      if(free(tgt,-1,pt)){ m.list.splice(i,1); i--; tgt.list.push({p:e.p,s:0,x:1.5,rf:0,rt:tgt.ry}); } } }
  /* вход: контроль → назначение ячейки → на главную линию */
  const ln=lanes.in; step(ln,null,(e)=>{ if(!e.dest){ const L=pickCSlot(e.p); if(!L) return; e.dest=L.crane; e.slot=L; L.res=e.p; e.p.slot=L; }
    if(free(m,cv.sInJ-pt-0.4,cv.sInJ+pt)&&!m.list.some(q=>Math.abs(q.s-cv.sInJ)<pt)){ ln.list=ln.list.filter(x=>x!==e); if(cv.inLoc.pal===e.p) cv.inLoc.pal=null;
      m.list.push({p:e.p,s:cv.sInJ,dest:e.dest,x:1.5}); } });
  /* видимые паллеты */
  let n=0;
  for(const id in lanes){ const L2=lanes[id]; for(const e of L2.list){ const q=pos(L2,e.s); let ry=L2.ry; if(e.x>0&&id==='main') ry=0; pmAt(e.p,W.root,q.x,0.5,q.z,ry); n++; } }
  W.K.conv[0]+=n*h; W.K.conv[1]+=h; }
function pickCSlot(p){                                                   // WCS: ячейка для паллеты — кран с меньшей очередью, глубокое место раньше переднего
  let best=null, bs=1e9;
  W.cranes.forEach(c=>{ if(!c.ok) return; const load=c.q.length+c.pin.list.length*1.5+(c.busy?1:0);
    c.slots.forEach(L=>{ if(L.pal||L.res) return; if(L.s.deep===0&&L.back&&!L.back.pal&&!L.back.res) return;   // переднее — только если глубокое уже занято
      if(L.s.deep===1&&L.front&&(L.front.pal||L.front.res)) return;
      const sc=load*6+Math.abs(L.s.z-c.pdz)*0.25+L.s.lev*0.8+W.rnd()*0.5; if(sc<bs){ bs=sc; best=L; } }); });
  return best; }
/* ---------- C: краны ---------- */
function craneStep(c,h){
  if(!c.steps.length){ craneDispatch(c); if(!c.steps.length){ c.busy=0; return; } }
  c.busy=1; W.K.busy.set(c,(W.K.busy.get(c)||0)+h);
  const s=c.steps[0];
  if(s.t==='mv'){ const dz=s.z-c.z, dy=s.y-c.ly; const vz=Math.min(3.0,Math.sqrt(2*1.0*Math.abs(dz))+0.05), vy=Math.min(0.8,Math.sqrt(2*0.8*Math.abs(dy))+0.03);
    c.z+=Math.sign(dz)*Math.min(Math.abs(dz),vz*h); c.ly+=Math.sign(dy)*Math.min(Math.abs(dy),vy*h);
    if(Math.abs(s.z-c.z)<1e-4&&Math.abs(s.y-c.ly)<1e-4) c.steps.shift(); }
  else if(s.t==='tele'){ const d=s.x-c.tx; c.tx+=Math.sign(d)*Math.min(Math.abs(d),0.6*h); if(Math.abs(s.x-c.tx)<1e-4) c.steps.shift(); }
  else if(s.t==='act'){ c.steps.shift(); s.fn(); }
  else if(s.t==='wait'){ s.s-=h; if(s.s<=0) c.steps.shift(); }
  c.cr.position.z=c.z; c.lift.position.y=c.ly; c.tele.position.x=c.tx;
  if(c.pal) pmAt(c.pal,c.tele,0,0.025,0,0); }
function craneDispatch(c){
  const pin=c.pin.list.find(e=>e.s>=c.pin.len-1e-3), ret=c.q[0];
  const pdy=0.5, Yi=yb=>yb-0.035, Yu=yb=>yb+0.055, Yp=yb=>yb-0.025;
  const pick=(z,x,yb,from)=>[{t:'mv',z,y:Yi(yb)},{t:'tele',x},{t:'mv',z,y:Yp(yb)},{t:'act',fn:()=>{ c.pal=from(); }},{t:'mv',z,y:Yu(yb)},{t:'tele',x:0}];
  const drop=(z,x,yb,to)=>[{t:'mv',z,y:Yu(yb)},{t:'tele',x},{t:'mv',z,y:Yp(yb)},{t:'act',fn:()=>{ const p=c.pal; c.pal=null; to(p); }},{t:'mv',z,y:Yi(yb)-0.02},{t:'tele',x:0}];
  const steps=[];
  if(pin){ const e=pin, L=e.p.slot;
    steps.push(...pick(c.pdz,1.35,pdy,()=>{ c.pin.list=c.pin.list.filter(x=>x!==e); return e.p; }));
    steps.push(...drop(L.s.z,L.s.x,L.s.y,p=>{ L.res=null; L.put(p); p.tSt=W.t; W.K.put++; W.K.d2s[0]+=W.t-p.tIn; W.K.d2s[1]++; stockAdd(p.sku,L); p.slot=null; })); }
  const outQ=W.cv.lanes.main.list.filter(e=>e.dest==='out').length+W.cv.lanes.out.list.length+W.cranes.reduce((s,q)=>s+q.pout.list.length,0);   // WCS: выход занят — краны не выдают
  if(ret&&outQ<3&&!c.pout.list.some(e=>e.s<W.cv.pitch)){ const L=ret.L;
    if(L.s.deep===1&&L.front&&L.front.pal){ const F=L.front; if(F.res&&F.res!==1){ c.q.push(c.q.shift()); c.steps=steps; return; }
      const T=c.slots.filter(Q=>!Q.pal&&!Q.res&&Q!==F&&Q!==L&&(Q.s.deep===0?(Q.back?(Q.back.pal||Q.back.res):true):!(Q.front&&(Q.front.pal||Q.front.res))))
        .sort((a,b)=>Math.abs(a.s.z-F.s.z)+Math.abs(a.s.y-F.s.y)-Math.abs(b.s.z-F.s.z)-Math.abs(b.s.y-F.s.y))[0];
      if(!T){ c.q.push(c.q.shift()); c.steps=steps; return; }
      T.res=1; F.res=1; steps.push(...pick(F.s.z,F.s.x,F.s.y,()=>{ const p=F.take(); F.res=null; stockDel(p.sku,F); return p; }));
      steps.push(...drop(T.s.z,T.s.x,T.s.y,p=>{ T.res=null; T.put(p); stockAdd(p.sku,T); W.K.reloc++; })); }
    c.q.shift();
    steps.push(...pick(L.s.z,L.s.x,L.s.y,()=>{ const p=L.take(); L.res=null; stockDel(p.sku,L); return p; }));
    steps.push(...drop(c.pdz,-1.35,pdy,p=>{ c.pout.list.push({p,s:0}); p.tOrd=ret.o.t; W.K.ret++; })); }
  else if(ret&&!steps.length) return;
  c.steps=steps; }
/* ---------- запас по SKU ---------- */
function stockAdd(sku,L){ let s=W.stock.get(sku); if(!s){ s=new Set(); W.stock.set(sku,s); } s.add(L); }
function stockDel(sku,L){ const s=W.stock.get(sku); if(s) s.delete(L); }
function initStock(){
  const f=P.fill0, n=P.skus;
  if(W.lanes.length){ W.lanes.forEach(Ln=>{ if(W.rnd()>f*1.15) return; const sku=(W.rnd()*n)|0, c=1+((W.rnd()*(Ln.nd-1))|0); Ln.sku=sku;
      for(let j=Ln.nd-c;j<Ln.nd;j++){ const p=newPal(sku); p.tIn=-3600*W.rnd(); Ln.pos[j]=p; Ln.g.userData.loads.set(Ln.idx[j],true,p.h,OWNC[p.col%OWNN]); } stockAddLane(Ln); }); }
  const sl=W.slots.filter(L=>L.type==='F01'||L.type==='F03');
  sl.forEach(L=>{ if(L.type==='F03'&&L.s.deep===0) return; if(W.rnd()<f){ const p=newPal((W.rnd()*n)|0); p.tIn=-3600*W.rnd(); L.put(p); stockAdd(p.sku,L); } });
  sl.forEach(L=>{ if(L.type!=='F03'||L.s.deep!==0) return; if(L.back&&L.back.pal&&W.rnd()<f*0.8){ const p=newPal((W.rnd()*n)|0); p.tIn=-3600*W.rnd(); L.put(p); stockAdd(p.sku,L); } }); }
function stockAddLane(Ln){ if(Ln.sku===null) return; let s=W.stock.get(Ln.sku); if(!s){ s=new Set(); W.stock.set(Ln.sku,s); } s.add(Ln); }
function laneCount(Ln){ let c=0; for(const p of Ln.pos) if(p) c++; return c; }
/* ---------- машины ---------- */
function truckFill(D){ const Q=Math.max(6,Math.min(D.slots.length,Math.round(P.inRate))); D.Q=Q; let k=0;
  D.slots.forEach(L=>{ if(L.pal){ L.take(); } });
  while(k<Q){ const sku=(W.rnd()*P.skus)|0, b=1+((W.rnd()*(2*P.batch-1))|0); for(let j=0;j<b&&k<Q;j++,k++){ const p=newPal(sku); p.small=b<=2; D.slots[k].put(p); p.tIn=null; } }
  D.state='docked'; D.t0=W.t; rdoorSet(D.T,1); }
function trucks(h){ const D=W.dock;
  if(W.t>=D.next){ D.queue++; D.qT.push(W.t); D.next=W.t+3600*D.Q/Math.max(1,P.inRate); }
  if(D.state==='docked'&&!D.slots.some(L=>L.pal||L.res)){ D.state='leave'; D.anim=0; rdoorSet(D.T,0); W.K.trIn++; }
  if(D.state==='leave'){ D.anim+=h; D.T.position.x=D.x0-Math.min(1,D.anim/25)*32; if(D.anim>=25){ D.state='away'; } }
  if(D.state==='away'&&D.queue>0){ D.queue--; const t0=D.qT.shift(); W.K.trWait[0]+=W.t-t0; W.K.trWait[1]++; D.state='arrive'; D.anim=0; truckFill(D); D.state='arrive'; rdoorSet(D.T,0); }
  if(D.state==='arrive'){ D.anim+=h; D.T.position.x=D.x0-(1-Math.min(1,D.anim/25))*32; if(D.anim>=25){ D.T.position.x=D.x0; D.state='docked'; rdoorSet(D.T,1); D.t0=W.t; } }
  const O=W.out; if(!O) return;
  if(O.state==='docked'&&O.slots.every(L=>L.pal)){ O.state='close'; O.anim=0; W.K.trOut++; }
  if(O.state==='close'){ O.anim+=h; if(O.anim>=120){ O.state='leave'; O.anim=0; if(O.kind==='cn') rdoorSet(O.T,0); } }
  if(O.state==='leave'){ O.anim+=h; if(O.kind==='cn') O.T.position.x=O.x0-Math.min(1,O.anim/25)*32; else O.T.visible=O.anim<2;
    if(O.anim>=25){ O.slots.forEach(L=>{ if(L.pal) L.take(); }); O.state='gap'; O.anim=0; } }
  if(O.state==='gap'){ O.anim+=h; if(O.anim>=600){ O.state='arrive'; O.anim=0; O.T.visible=true; } }
  if(O.state==='arrive'){ O.anim+=h; if(O.kind==='cn') O.T.position.x=O.x0-(1-Math.min(1,O.anim/25))*32; if(O.anim>=25){ if(O.kind==='cn'){ O.T.position.x=O.x0; rdoorSet(O.T,1); } O.state='docked'; } } }
/* ---------- заказы на отбор ---------- */
function orders(h){ if(W.t<W.nextOrd) return; W.nextOrd=W.t+(-Math.log(1-W.rnd()*0.999)*3600/Math.max(1,P.outRate));
  let tot=0; const cand=[]; W.stock.forEach((s,sku)=>{ let c=0; s.forEach(L=>{ c+=L.pos?laneCount(L):(L.pal?1:0); }); if(c>0){ cand.push([sku,c]); tot+=c; } });
  if(!tot){ W.K.nostock++; return; }
  let r=W.rnd()*tot; for(const [sku,c] of cand){ r-=c; if(r<=0){ W.orders.push({sku,t:W.t}); break; } }
  if(W.cranes.length) assignC(); }
function assignC(){                                                      // C: заказ → паллета (самая ранняя по SKU) → очередь её крана
  for(let i=0;i<W.orders.length;i++){ const o=W.orders[i], s=W.stock.get(o.sku); if(!s) continue; let best=null;
    s.forEach(L=>{ if(!L.pal||L.res||!L.crane||!L.crane.ok) return; if(!best||L.pal.tIn<best.pal.tIn) best=L; });
    if(!best) continue; best.res=o; best.crane.q.push({L:best,o}); W.orders.splice(i,1); i--; o.tA=W.t; } }
/* ---------- задания технике ---------- */
const near=(a,L)=>Math.hypot(a.x-L.x,a.z-L.z);
const sideOf=(k,L)=>k==='F11'&&L.alt!==undefined?'alt':'def';
const spotBusy=(L,list,side)=>list.some(M=>M!==L&&M.res&&Math.abs(M.z-L.z)<1&&(Math.abs(M.x-L.x)<1.6||(!side||!M.side||M.side===side)&&Math.abs(M.x-L.x)<(side==='alt'||M.side==='alt'?3.5:2.4)));   /* соседнее место — занято с любой стороны (паллеты на вилах задевают) */   // в ряду рядом и с той же стороны уже работает машина — её зона
function freeSpot(list,from,pref,k){ const all=W.spots.inb.concat(W.spots.exp,W.spots.qua);
  let best=null, bd=1e9; list.forEach(L=>{ if(L.pal||L.res||L.bad>W.t) return; if(spotBusy(L,all,k?sideOf(k,L):null)) return; const d=Math.hypot(L.x-from.x,L.z-from.z)+(pref&&L.alt===undefined?20:0); if(d<bd){ bd=d; best=L; } }); return best; }
function mkTask(a,kind,from,to,extra){ const T=Object.assign({kind,a,from,to,t0:W.t},extra||{}); from.res=T; to.res=T; a.task=T; from.side=sideOf(a.k,from); to.side=sideOf(a.k,to);
  a.steps=moveSteps(a,from,to,T); a.last=kind; return T; }
function canLift(a,L){ return (L.yb||0)+0.25<=(a.K.maxLift||0)+0.05; }
const ROLE={
  unl(a){ const D=W.dock; if(D.state!=='docked'||D.slots.some(L=>L.res)) return null; const L=D.slots.find(L=>L.pal); if(!L) return null;
    const cv=W.cv; if(cv&&!cv.inLoc.pal&&!cv.inLoc.res&&!cv.lanes.in.list.length&&!W.spots.inb.some(S=>S.pal&&!S.res))   // C: прямо на входной конвейер, если он свободен и буфер пуст
      return mkTask(a,'unl',L,cv.inLoc,{onPick:p=>{ p.tIn=W.t; }});
    let to=W.cv?null:freeSpot(W.spots.inb.filter(S=>S.alt!==undefined),{x:6,z:GZ_L2},false,a.k);   // A/B: в ближний к проезду ряд (ричтрак берёт оттуда); дальний — если ждём > 5 мин
    if(!to&&(W.cv||W.t-(D.lastUnl||D.t0||0)>300)) to=freeSpot(W.spots.inb,{x:6,z:GZ_L2},!W.cv,a.k); if(!to) return null; D.lastUnl=W.t; return mkTask(a,'unl',L,to,{onPick:p=>{ p.tIn=W.t; }}); },
  put(a){ if(W.cranes.length) return null; const all=W.spots.inb.concat(W.spots.exp,W.spots.qua);
    let cands=W.spots.inb.filter(L=>L.pal&&!L.res&&!spotBusy(L,all,sideOf(a.k,L))).sort((p,q)=>p.pal.tIn-q.pal.tIn);
    if(a.k==='F11'&&!cands.some(L=>L.alt===undefined&&W.t-L.pal.tIn>600)) cands=cands.filter(L=>L.alt!==undefined);   // ричтрак — с ближнего к проезду ряда; дальний (коридор погрузчика) — если паллета ждёт > 10 мин   // ричтрак — с ближнего к проезду ряда (не в коридоре погрузчика), дальний — если паллета ждёт > 3 мин
    for(const L of cands.slice(0,6)){ const to=storeFor(a,L.pal,L); if(to) return mkTask(a,'put',L,to,{onDrop:(p,T)=>{ p.tSt=W.t; W.K.d2s[0]+=W.t-p.tIn; W.K.d2s[1]++; }}); }
    return null; },
  ret(a){ if(W.cranes.length) return null; for(let i=0;i<Math.min(W.orders.length,6);i++){ const o=W.orders[i], L=pickFor(a,o.sku); if(!L) continue;
      const to=freeSpot(a.k==='F11'?W.spots.exp.filter(S=>S.alt!==undefined||!W.spots.exp.some(Q=>Q.alt!==undefined)):W.spots.exp,L,true,a.k); if(!to) return null; W.orders.splice(i,1);
      return mkTask(a,'ret',L,to,{o,onPick:p=>{ p.tOrd=o.t; }}); }
    return null; },
  feed(a){ const cv=W.cv; if(!cv||cv.inLoc.pal||cv.inLoc.res||cv.lanes.in.list.length) return null;
    const L=W.spots.inb.filter(L=>L.pal&&!L.res).sort((p,q)=>p.pal.tIn-q.pal.tIn)[0]; if(!L) return null;
    return mkTask(a,'feed',L,cv.inLoc,{}); },
  rej(a){ const cv=W.cv; if(!cv) return null; const e=cv.lanes.in.list.find(e=>e.rej); if(!e||cv.inLoc.res) return null; cv.inLoc.pal=e.p;
    const to=freeSpot(W.spots.qua,cv.inLoc); if(!to) return null; return mkTask(a,'rej',cv.inLoc,to,{onDrop:p=>{ p.tq=W.t; }}); },
  wrap(a){ const WR=W.wr; if(!WR||WR.pal||WR.res) return null; if(W.agents.some(b=>b!==a&&Math.hypot(b.x-WR.x,b.z-WR.z)<4.5)) return null;   /* у стола ещё работает погрузчик */ const src=outSrc(); if(!src) return null; return mkTask(a,'wrap',src,WR,{}); },
  load(a){ const O=W.out; if(!O||O.state!=='docked') return null; const to=O.slots.find(L=>!L.pal&&!L.res); if(!to) return null;
    if(O.kind==='cn'&&O.slots.some(L=>L.res)) return null;
    let src=null; if(W.wr){ if(W.wr.state==='done'&&!W.wr.res) src=W.wr; } else src=outSrc(); if(!src) return null;
    return mkTask(a,'load',src,to,{onDrop:p=>{ W.K.lead[0]+=W.t-(p.tOrd||W.t); W.K.lead[1]++; }}); },
  shx(a){ if(!W.need.size) return null; const tgt=[...W.need][0]; W.need.delete(tgt); if(tgt.sh||tgt.pos[0]||tgt.res) return null;
    const src=W.shut.filter(sh=>!sh.steps.length&&!sh.pal&&sh.lane&&sh.lane!==tgt&&!sh.lane.res&&!sh.lane.entry.res&&!sh.lane.pend&&!sh.lane.pos[0]&&!laneNeedsCompact(sh.lane)&&!W.need.has(sh.lane))
      .sort((p,q)=>Math.hypot(p.lane.entry.x-tgt.entry.x,p.lane.entry.z-tgt.entry.z)-Math.hypot(q.lane.entry.x-tgt.entry.x,q.lane.entry.z-tgt.entry.z))[0];
    if(!src) return null; const SL=src.lane;
    const from={kind:'shut',x:SL.entry.x,z:SL.entry.z,yb:SL.entry.yb,ry:0,res:null,pal:null,ap:k=>SL.entry.ap(k),
      take(){ const sh=src; SL.sh=null; sh.lane=null; sh.o.visible=false; return {shuttle:sh,h:0.17,col:0,sku:-1}; }};
    const to={kind:'shut',x:tgt.entry.x,z:tgt.entry.z,yb:tgt.entry.yb,ry:0,res:null,pal:null,ap:k=>tgt.entry.ap(k),
      put(p){ shPark(p.shuttle,tgt); W.K.shx++; }};
    SL.res='shx'; tgt.res='shx';
    const T=mkTask(a,'shx',from,to,{onEnd:()=>{ SL.res=null; tgt.res=null; }}); return T; }
};
function outSrc(){ if(W.cv){ if(W.wr&&W.wr.inline) return null; const L=W.cv.outLoc; return L.pal&&!L.res?L:null; }
  const all=W.spots.inb.concat(W.spots.exp,W.spots.qua); return W.spots.exp.filter(L=>L.pal&&!L.res&&!spotBusy(L,all,'def')).sort((p,q)=>(p.pal.tOrd||0)-(q.pal.tOrd||0))[0]||null; }
function storeFor(a,p,from){
  if(W.lanes.length&&!p.small){ const ln=W.lanes.filter(Ln=>!Ln.res&&!Ln.entry.res&&!Ln.pend&&!Ln.pos[0]&&laneCount(Ln)<Ln.nd&&(Ln.sku===p.sku||Ln.sku===null)&&canLift(a,Ln.entry)&&!(Ln.entry.bad>W.t));
    const ready=ln.filter(Ln=>Ln.sh&&!Ln.sh.steps.length).sort((p1,q)=>(q.sku===p.sku)-(p1.sku===p.sku)||Math.hypot(p1.entry.x-from.x,p1.entry.z-from.z)-Math.hypot(q.entry.x-from.x,q.entry.z-from.z));
    if(ready.length){ const Ln=ready[0]; Ln.sku=p.sku; return Ln.entry; }
    const want=ln.filter(Ln=>!Ln.sh).sort((p1,q)=>(q.sku===p.sku)-(p1.sku===p.sku)||Math.hypot(p1.entry.x-from.x,p1.entry.z-from.z)-Math.hypot(q.entry.x-from.x,q.entry.z-from.z))[0];
    if(want&&W.need.size<3) W.need.add(want);
    if((W.t-(p.tIn||W.t))<240) return null; }
  for(const L of W.f01){ if(L.pal||L.res||L.bad>W.t||!canLift(a,L)) continue; if(a.k!=='F11'&&L.ap(a.k).stage===0) continue; return L; }
  return null; }
function pickFor(a,sku){ const s=W.stock.get(sku); if(!s) return null; let best=null;
  s.forEach(L=>{ if(L.pos){ const Ln=L, ex=Ln.exit, p=Ln.pos[Ln.fifo?Ln.nd-1:0]; if(!p||ex.res||Ln.res||(Ln.job&&Ln.sh&&Ln.sh.pal)||!canLift(a,ex)||ex.bad>W.t) return; if(!best||p.tIn<best.pal.tIn){ ex.pal=p; best=ex; } return; }
    if(!L.pal||L.res||L.type!=='F01'||L.bad>W.t||!canLift(a,L)) return; if(!best||L.pal.tIn<best.pal.tIn) best=L; });
  return best; }
function laneNeedsCompact(Ln){ if(!Ln.fifo) return false; let seen=false; for(let j=Ln.nd-1;j>=0;j--){ if(!Ln.pos[j]){ seen=true; } else if(seen) return true; } return false; }
/* ---------- шаги подъезда, взятия, установки ---------- */
function moveSteps(a,from,to,T){ return approach(a,from,T,'pick').concat(approach(a,to,T,'drop')); }
function approach(a,L,T,mode){ const K=a.K, ap=L.ap(a.k); if(!ap) return [{t:'act',fn:()=>abortTask(a,'нет подъезда')}];
  const d={x:Math.sin(ap.h),z:Math.cos(ap.h)}, st={x:ap.px-d.x*ap.stage,z:ap.pz-d.z*ap.stage};
  const gy=ap.dock?groundDock(ap.px):0, yb=ap.yb-gy, ft=K.FT, rIn=ap.reach||0.25;
  const S=[];
  S.push({t:'go',x:st.x,z:st.z,h:ap.h,L,mode}); S.push({t:'rot',h:ap.h});
  const lin=(x,z,rev)=>({t:'line',x,z,rev,dock:ap.dock});
  const forkTo=(top,reach)=>({t:'fork',lift:Math.max(0,top-ft),reach});
  if(mode==='pick'){
    S.push(forkTo(yb+0.09,0.25)); S.push({t:'wait',s:P.scanT,lbl:'скан ID'});
    if(ap.stage>0) S.push(lin(ap.px,ap.pz));
    if(K.reach) S.push(forkTo(yb+0.09,rIn));
    S.push(forkTo(yb+0.10,K.reach?rIn:undefined));
    S.push({t:'act',fn:()=>{ const p=L.take(); if(!p){ abortTask(a,'нет груза'); return; } a.pal=p; a.palRy=wrapA((L.ry||0)-a.h); a.palPush=ap.push||0;
      if(L.kind==='spot'||L.kind==='wrap'||L.kind==='conv') pmGet(p); if(T.onPick) T.onPick(p,T); if(L.res===T) L.res=null; }});
    if(ap.push) S.push({t:'push',d:0});
    S.push(forkTo(yb+0.18,K.reach?rIn:undefined));
    if(K.reach) S.push(forkTo(yb+0.18,0.25));
    if(ap.stage>0) S.push(lin(st.x,st.z,true));
    S.push(forkTo(TRP,0.25)); }
  else {
    S.push(forkTo(yb+0.18,0.25));
    if(ap.stage>0) S.push(lin(ap.px,ap.pz));
    if(K.reach) S.push(forkTo(yb+0.18,rIn));
    if(ap.push) S.push({t:'push',d:ap.push});
    S.push({t:'wait',s:P.scanT,lbl:'скан ячейки'});
    S.push(forkTo(yb+0.10,K.reach?rIn:undefined));
    S.push({t:'act',fn:()=>{ const p=a.pal; a.pal=null; a.palPush=0; if(L.res===T) L.res=null; dropTo(a,L,p,T); }});
    S.push(forkTo(yb+0.05,K.reach?rIn:undefined));
    if(K.reach) S.push(forkTo(yb+0.05,0.25));
    if(ap.stage>0) S.push(lin(st.x,st.z,true));
    S.push(forkTo(TRP-0.15,0.25));
    S.push({t:'act',fn:()=>finishTask(a)}); }
  return S; }
function dropTo(a,L,p,T){
  if(L.kind==='lane'){ const Ln=L.lane; Ln.pos[0]=p; Ln.sku=p.sku; Ln.g.userData.loads.set(Ln.idx[0],true,p.h,OWNC[p.col%OWNN]); pmHide(p); stockAddLane(Ln); W.K.put++;
    if(T.onDrop) T.onDrop(p,T); shStore(Ln); return; }
  L.put(p);
  if(L.kind==='slot'){ stockAdd(p.sku,L); W.K.put++; }
  if(T.kind==='ret') W.K.ret++;
  if(T.kind==='unl') W.K.unl++;
  if(T.kind==='load') W.K.load++;
  if(T.onDrop) T.onDrop(p,T); }
function finishTask(a){ const T=a.task; if(!T) return; const c=W.K.cyc[T.kind]||(W.K.cyc[T.kind]=[0,0]); c[0]+=W.t-T.t0; c[1]++;
  if(T.onEnd) T.onEnd(T); if(T.from&&T.from.res===T) T.from.res=null; if(T.to&&T.to.res===T) T.to.res=null; a.task=null; }
function abortTask(a,why){ const T=a.task; a.steps=[]; if(!T) return;
  if(T.from&&T.from.res===T) T.from.res=null; if(T.to&&T.to.res===T) T.to.res=null; if(T.onEnd) T.onEnd(T);
  if(T.o&&!a.pal) W.orders.unshift(T.o);
  if(a.pal){ const sp=freeSpot(W.spots.qua.concat(W.spots.inb),a); if(sp){ a.task={kind:'rescue',a,from:sp,to:sp,t0:W.t}; sp.res=a.task; a.steps=approach(a,sp,a.task,'drop'); } }
  else a.task=null;
  W.log.push(Math.round(W.t)+' с: '+a.nm+' — '+why); if(W.log.length>30) W.log.shift(); }
/* ---------- B: шаттл в канале ---------- */
function shStore(Ln){ const sh=Ln.sh; if(!sh) return; if(sh.steps.length){ Ln.pend=true; return; } Ln.pend=false;
  let m=Ln.nd; for(let j=1;j<Ln.nd;j++) if(Ln.pos[j]){ m=j; break; } const tgt=Ln.fifo?m-1:0; if(tgt<=0||!Ln.pos[0]) return;   // FIFO: вплотную за ранее поставленными
  Ln.job='store'; const p=Ln.pos[0];
  sh.steps=[{t:'mv',d:0},{t:'up',fn:()=>{ Ln.pos[0]=null; Ln.g.userData.loads.set(Ln.idx[0],false,1); sh.pal=p; }},{t:'mv',d:tgt},{t:'dn',fn:()=>{ Ln.pos[tgt]=p; sh.pal=null; pmHide(p); Ln.g.userData.loads.set(Ln.idx[tgt],true,p.h,OWNC[p.col%OWNN]); }},{t:'mv',d:0},{t:'end'}]; }
function shCompact(Ln){ const sh=Ln.sh; if(!sh||sh.steps.length||!laneNeedsCompact(Ln)||Ln.res||Ln.exit.res) return;
  let j=-1; for(let i=Ln.nd-2;i>=0;i--){ if(Ln.pos[i]&&!Ln.pos[i+1]){ j=i; break; } } if(j<0) return;
  let t=j+1; while(t+1<Ln.nd&&!Ln.pos[t+1]) t++; const p=Ln.pos[j]; Ln.job='compact';
  sh.steps=[{t:'mv',d:j},{t:'up',fn:()=>{ Ln.pos[j]=null; Ln.g.userData.loads.set(Ln.idx[j],false,1); sh.pal=p; }},{t:'mv',d:t},{t:'dn',fn:()=>{ Ln.pos[t]=p; sh.pal=null; pmHide(p); Ln.g.userData.loads.set(Ln.idx[t],true,p.h,OWNC[p.col%OWNN]); }},{t:'mv',d:0},{t:'end'}]; }
function shStep(sh,h){ const Ln=sh.lane; if(!Ln) return;
  if(!sh.steps.length){ if(laneNeedsCompact(Ln)) shCompact(Ln); if(!sh.steps.length) return; }
  W.K.busy.set(sh,(W.K.busy.get(sh)||0)+h);
  const s=sh.steps[0], v=1.0/0.85;
  if(s.t==='mv'){ const d=s.d-sh.dep; sh.dep+=Math.sign(d)*Math.min(Math.abs(d),v*h); if(Math.abs(s.d-sh.dep)<1e-4) sh.steps.shift(); }
  else if(s.t==='up'){ if(s.k===undefined){ s.k=0; s.fn(); } s.k+=h; sh.lift=Math.min(0.03,s.k*0.03); if(s.k>=1) sh.steps.shift(); }
  else if(s.t==='dn'){ if(s.k===undefined){ s.k=0; } s.k+=h; sh.lift=Math.max(0,0.03-s.k*0.03); if(s.k>=1){ s.fn(); sh.steps.shift(); } }
  else if(s.t==='end'){ sh.steps.shift(); Ln.job=null; if(Ln.pend) shStore(Ln); }
  shPose(sh); }
/* ---------- движение техники: путь, поворот, прямой участок, вилы; расстояние между машинами ---------- */
function circles(a,x,z,h,out){ const K=a.K, sx=Math.sin(h), sz=Math.cos(h); out.length=0;
  for(const [d,r] of K.circ) out.push(x+sx*d,z+sz*d,r);
  if(K.fk){ const d=K.fk[0]!==null?K.fk[0]:a.reach+K.fk[2]; out.push(x+sx*(d+a.palPush*0.5),z+sz*(d+a.palPush*0.5),a.pal?K.fk[2]:K.fk[1]); }
  return out; }
const CA=[], CB=[], CC=[];
function sepBlock(a,nx,nz,nh){ circles(a,nx,nz,nh,CA); circles(a,a.x,a.z,a.h,CC); const mvx=nx-a.x, mvz=nz-a.z, mv=Math.hypot(mvx,mvz)>1e-4;
  if(a.ghost>W.t) return null;
  for(const b of W.agents){ if(b===a||b.ghost>W.t) continue; if(Math.abs(b.x-a.x)>8||Math.abs(b.z-a.z)>8) continue; circles(b,b.x,b.z,b.h,CB);
    let m1=1e9, m0=1e9;                                                   // наименьший зазор после шага и сейчас: нельзя только сближаться внахлёст
    for(let i=0;i<CA.length;i+=3) for(let j=0;j<CB.length;j+=3){ const R=CA[i+2]+CB[j+2]+0.08;
      m1=Math.min(m1,Math.hypot(CA[i]-CB[j],CA[i+1]-CB[j+1])-R); m0=Math.min(m0,Math.hypot(CC[i]-CB[j],CC[i+1]-CB[j+1])-R); }
    const dl=Math.hypot(b.x-a.x,b.z-a.z)||1, toward=mv&&(mvx*(b.x-a.x)+mvz*(b.z-a.z))/(dl*Math.hypot(mvx,mvz))>0.7, mg=toward?0.5:0;   // едем к соседу — встаём за полметра: остаётся место для поворота и объезда
    if(m1<mg&&m1<m0-1e-5) return b; }
  return null; }
function lockAhead(a,pts,pi){ let dist=0, px=a.x, pz=a.z;                    // узкий проход впереди (до 3,5 м): свободен — занять, занят — ждать
  const want=new Set(); const k0=NAV.aisleAt(a.x,a.z); if(k0>=0) want.add(k0);
  for(let i=pi;i<pts.length&&dist<3.5;i++){ const q=pts[i], L=Math.hypot(q.x-px,q.z-pz), n=Math.max(1,Math.ceil(L/0.3));
    for(let s=1;s<=n&&dist<3.5;s++){ const x=px+(q.x-px)*s/n, z=pz+(q.z-pz)*s/n; dist+=L/n; const k=NAV.aisleAt(x,z); if(k>=0) want.add(k); }
    px=q.x; pz=q.z; }
  for(const k of want){ const hd=W.locks.get(k); if(hd&&hd!==a) return hd; }
  for(const k of want){ W.locks.set(k,a); a.locks.add(k); }
  for(const k of [...a.locks]) if(!want.has(k)){ a.locks.delete(k); if(W.locks.get(k)===a) W.locks.delete(k); }
  return null; }
function releaseLocks(a){ const k0=NAV.aisleAt(a.x,a.z); for(const k of [...a.locks]) if(k!==k0){ a.locks.delete(k); if(W.locks.get(k)===a) W.locks.delete(k); } }
function blocked(a,b,h,s){ a.blkBy=b; a.blkT+=h; W.K.blockS+=h; a.v=0;
  if(a.blkT>8&&(b.blkBy===a||b.blkT>8||(!s&&a.blkT>20))){ a.ghost=W.t+5; a.blkT=0; W.K.ghost=(W.K.ghost||0)+1;
    (W.gh||(W.gh=[])).push([Math.round(W.t),a.k+a.id,(a.steps[0]||{}).t,(a.task||{}).kind,+a.x.toFixed(1),+a.z.toFixed(1),b.k+b.id,(b.steps[0]||{}).t,(b.task||{}).kind,+b.x.toFixed(1),+b.z.toFixed(1)]); return; }   // тупик не разошёлся: разъезд впритирку (считается в показателях)
  if(a.blkT>1.2&&!b.steps.length&&!b.task) b.yieldFrom=a;                                  // стоящая без дела машина отъезжает
  if(a.blkT>1.2&&s&&s.t==='go'){
    if(!b.steps.length&&!b.task){ b.yieldFrom=a; }
    else if(b.blkBy!==a&&b.v<0.05&&(!s.rp||W.t-s.rp>3)){ s.rp=W.t; const blk=[]; circles(b,b.x,b.z,b.h,CB); for(let j=0;j<CB.length;j+=3) blk.push({x:CB[j],z:CB[j+1],r:CB[j+2]+0.9});
      const pth=NAV.plan(a.x,a.z,s.x,s.z,{blk}); if(pth){ s.path=pth; s.pi=1; } }
    else if(b.blkBy===a){ const lose=(a.pal?1:0)<(b.pal?1:0)||((a.pal?1:0)===(b.pal?1:0)&&a.id>b.id)||(b.steps[0]&&b.steps[0].t!=='go');
      if(lose&&(!s.rp||W.t-s.rp>2)){ s.rp=W.t; if(!yieldTo(a,b)){ const blk=[]; circles(b,b.x,b.z,b.h,CB); for(let j=0;j<CB.length;j+=3) blk.push({x:CB[j],z:CB[j+1],r:CB[j+2]+0.9});
          const pth=NAV.plan(a.x,a.z,s.x,s.z,{blk}); if(pth){ s.path=pth; s.pi=1; } } } } }
  if(a.blkT>14){ W.K.stall++; a.blkT=0; if(s&&s.t==='go') yieldTo(a,b,true); } }
/* путь в обход стоящей техники (на стоянке, у ячейки); если так не выходит — без неё */
function planAround(a,x,z){ const blk=[], cor=[];
  for(const b of W.agents){ if(b===a) continue; const s=b.steps.find(q=>q.t==='go'&&q.path); if(!s) continue; let d=0; const P=[[b.x,b.z]];   // коридоры, которые уже заняли другие (ближайшие 15 м их пути)
    for(let i=Math.max(1,s.pi||1);i<s.path.length&&d<15;i++){ P.push([s.path[i].x,s.path[i].z]); d+=Math.hypot(s.path[i].x-s.path[i-1].x,s.path[i].z-s.path[i-1].z); } cor.push(P); }
  for(const b of W.agents){ if(b===a) continue; const s=b.steps[0], still=!s||s.t==='wait'||s.t==='fork'||s.t==='act'||s.t==='push'; if(!still||b.v>0.05) continue;
    if(Math.hypot(b.x-x,b.z-z)<2.2) continue;                                             // стоит у самой цели — ждать, а не объезжать
    const parked=!s&&!b.task; circles(b,b.x,b.z,b.h,CB); for(let j=0;j<CB.length;j+=3) blk.push({x:CB[j],z:CB[j+1],r:CB[j+2]+(parked?0.95:0.75)}); }
  return (blk.length&&NAV.plan(a.x,a.z,x,z,{blk,cor}))||NAV.plan(a.x,a.z,x,z,{cor}); }
function yieldTo(a,b,force){ const pts=[]; circles(b,b.x,b.z,b.h,CB); for(let j=0;j<CB.length;j+=3) pts.push([CB[j],CB[j+1]]);
  const bs=b.steps.find(s=>s.t==='go'&&s.path); if(bs){ let d=0; for(let i=Math.max(1,bs.pi||1);i<bs.path.length&&d<14;i++){ const p0=bs.path[i-1], p1=bs.path[i], L=Math.hypot(p1.x-p0.x,p1.z-p0.z); for(let k=0;k<=Math.ceil(L/0.5);k++){ const u=k/Math.max(1,Math.ceil(L/0.5)); pts.push([p0.x+(p1.x-p0.x)*u,p0.z+(p1.z-p0.z)*u]); } d+=L; } }
  if(b.steps[0]&&b.steps[0].t==='go'&&!b.steps[0].path) pts.push([b.steps[0].x,b.steps[0].z]);
  W.agents.forEach(c=>{ if(c!==a&&c!==b) pts.push([c.x,c.z]); });
  const q=NAV.freeNear(a.x,a.z,force?12:10,(x,z)=>pts.every(([px,pz])=>Math.hypot(px-x,pz-z)>2.5),undefined,k=>{ const hd=W.locks.get(k); return !hd||hd===a; });   // в т. ч. в начало свободного прохода между стеллажами
  if(!q) return false;
  const cur=a.steps[0]; if(cur&&cur.t==='go'){ cur.path=null; cur.started=false; }
  a.steps.unshift({t:'go',x:q.x,z:q.z,yld:1},{t:'wait',s:2.5,lbl:'уступает'}); a.blkT=0; return true; }
/* стоянка ричтраков у зарядки: свободное место ближе к машине (не своё «закреплённое») — меньше встречных манёвров */
function parkSlot(a){ if(a.k!=='F11'||!W.park.length) return true;
  const busy=s=>W.agents.some(b=>b!==a&&b.k==='F11'&&Math.hypot(b.home.x-s.x,b.home.z-s.z)<0.3);
  const f=W.park.filter(s=>!busy(s)).sort((p,q)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(q.x-a.x,q.z-a.z))[0]; if(!f) return false;
  a.home={x:f.x,z:f.z,h:f.h}; return true; }
function stepAgent(a,h){
  if(!a.steps.length){ releaseLocks(a); a.idle+=h; a.v=0;
    if(a.yieldFrom){ const b=a.yieldFrom; a.yieldFrom=null; yieldTo(a,b); }
    else if(a.idle>60&&Math.hypot(a.x-a.home.x,a.z-a.home.z)>0.6&&parkSlot(a)){ const H=a.home, d={x:Math.sin(H.h),z:Math.cos(H.h)}, sx=H.x-d.x*1.8, sz=H.z-d.z*1.8;   // на стоянку — ближайшее свободное место, прямо с подъезда перед ним
      if(NAV.D(sx,sz)>=0.6) a.steps.push({t:'go',x:sx,z:sz,home:1},{t:'rot',h:H.h},{t:'line',x:H.x,z:H.z}); else a.steps.push({t:'go',x:H.x,z:H.z,home:1},{t:'rot',h:H.h}); }
    if(!a.steps.length) return; }
  a.idle=0; if(a.task) { a.busy+=h; W.K.busy.set(a,(W.K.busy.get(a)||0)+h); }
  const s=a.steps[0];
  if(s.t==='go'){
    if(!s.started){ s.started=true; s.path=planAround(a,s.x,s.z); s.pi=1; s.fails=s.fails||0; }
    if(!s.path){ s.fails++; s.wait=(s.wait||0)+h; if(s.wait<1) return; s.wait=0; s.path=planAround(a,s.x,s.z)||NAV.plan(a.x,a.z,s.x,s.z,{snapA:2.5,snapB:1.2}); s.pi=1;
      if(!s.path&&s.fails>40){ a.steps.shift(); if(s.L){ s.L.bad=W.t+600; } if(a.task&&!s.home&&!s.yld) abortTask(a,'нет пути'); } return; }
    const pts=s.path, n=pts.length; if(s.pi>=n) s.pi=n-1; if(s.pi<1) s.pi=1;
    /* проекция на текущий отрезок; переход к следующему, когда отрезок пройден или следующий ближе */
    const proj=(i)=>{ const A=pts[i-1], B=pts[i], dx=B.x-A.x, dz=B.z-A.z, L2=dx*dx+dz*dz||1e-9; let t=((a.x-A.x)*dx+(a.z-A.z)*dz)/L2; t=Math.max(0,Math.min(1,t));
      const qx=A.x+dx*t, qz=A.z+dz*t; return {t,qx,qz,d:Math.hypot(a.x-qx,a.z-qz)}; };
    let pr=proj(s.pi);
    while(s.pi<n-1){ const nx2=proj(s.pi+1); if(pr.t>=0.999||Math.hypot(pts[s.pi].x-a.x,pts[s.pi].z-a.z)<0.45||nx2.d<pr.d-0.05){ s.pi++; pr=nx2; } else break; }
    const end=pts[n-1], rem=Math.hypot(end.x-a.x,end.z-a.z);
    if(rem<0.06||(s.pi===n-1&&pr.t>=0.999&&rem<0.3)){ a.x=end.x; a.z=end.z; a.v=0; a.steps.shift(); a.blkT=0; a.blkBy=null; return; }
    const hl=lockAhead(a,pts,s.pi); if(hl){ blocked(a,hl,h,s); return; }
    /* точка слежения: 1,1 м вперёд по пути от проекции (у конца пути — сам конец) */
    let tx=end.x, tz=end.z, remP=0;
    { let need=1.1, px=pr.qx, pz=pr.qz, got=false;
      for(let i=s.pi;i<n;i++){ const L=Math.hypot(pts[i].x-px,pts[i].z-pz); remP+=L; if(!got&&L>=need){ tx=px+(pts[i].x-px)*need/L; tz=pz+(pts[i].z-pz)*need/L; got=true; } else if(!got) need-=L; px=pts[i].x; pz=pts[i].z; }
      remP+=pr.d; if(Math.hypot(tx-a.x,tz-a.z)<0.3){ tx=end.x; tz=end.z; } }
    const hd=Math.atan2(tx-a.x,tz-a.z), err=wrapA(hd-a.h), K=a.K;
    let vmax=a.pal?K.vL:K.vE; if(NAV.aisleAt(a.x,a.z)>=0) vmax=Math.min(vmax,K.vA); if(remP<3) vmax=Math.min(vmax,0.5+remP*0.35);
    let nh=a.h, nv=a.v, dir=1;
    const back=Math.abs(err)>2.3&&(s.yld||(s.revD||0)<5)||(s.rev&&Math.abs(err)>1.6);   // цель позади — задним ходом (выезд со стоянки, от ячейки, уступить)
    if(back){ s.rev=1; dir=-1; const eb=wrapA(hd-a.h-PI), vt=Math.min(0.9,vmax)*Math.max(0.15,1-Math.abs(eb)/0.9);
      nv=a.v<vt?Math.min(vt,a.v+K.acc*h):Math.max(vt,a.v-K.acc*2*h); nv=Math.min(nv,Math.sqrt(2*K.acc*remP)+0.05,remP/h);
      nh=a.h+Math.sign(eb)*Math.min(Math.abs(eb),K.w*h*(0.6+nv)); s.revD=(s.revD||0)+nv*h; }
    else if(Math.abs(err)>0.75){ s.rev=0; nv=Math.max(0,a.v-K.acc*2*h); if(nv<0.05){ nv=0; nh=a.h+Math.sign(err)*Math.min(Math.abs(err),K.w*h); } }
    else { s.rev=0; const vt=vmax*Math.max(0.15,1-Math.abs(err)/0.9); nv=a.v<vt?Math.min(vt,a.v+K.acc*h):Math.max(vt,a.v-K.acc*2*h); nv=Math.min(nv,Math.sqrt(2*K.acc*remP)+0.05,remP/h);
      nh=a.h+Math.sign(err)*Math.min(Math.abs(err),K.w*h*(0.6+nv)); }
    const nx=a.x+dir*Math.sin(nh)*nv*h, nz=a.z+dir*Math.cos(nh)*nv*h;
    const b=sepBlock(a,nx,nz,nh); if(b){ blocked(a,b,h,s); return; }
    a.blkT=Math.max(0,a.blkT-h*2); a.blkBy=null; W.K.moved.set(a,(W.K.moved.get(a)||0)+Math.hypot(nx-a.x,nz-a.z)); a.roll+=dir*nv*h; a.x=nx; a.z=nz; a.h=wrapA(nh); a.v=nv; return; }
  if(s.t==='rot'){ const err=wrapA(s.h-a.h); if(Math.abs(err)<0.004){ a.h=s.h; a.steps.shift(); return; }
    const nh=a.h+Math.sign(err)*Math.min(Math.abs(err),a.K.w*0.8*h); const b=sepBlock(a,a.x,a.z,nh); if(b){ blocked(a,b,h,null); return; } a.blkBy=null; a.h=nh; return; }
  if(s.t==='line'){ const dx=s.x-a.x, dz=s.z-a.z, L=Math.hypot(dx,dz); if(L<0.004){ a.x=s.x; a.z=s.z; a.v=0; a.steps.shift(); return; }
    const v=Math.min(a.K.vIn*(s.dock?1.6:1),Math.sqrt(2*0.6*L)+0.05), st=Math.min(L,v*h), nx=a.x+dx/L*st, nz=a.z+dz/L*st;
    const b=sepBlock(a,nx,nz,a.h); if(b){ blocked(a,b,h,null); return; } a.blkBy=null; a.roll+=(s.rev?-1:1)*st; a.x=nx; a.z=nz; a.v=v; if(s.dock) a.y=groundDock(a.x); else a.y=0; return; }
  if(s.t==='fork'){ const K=a.K; let done=true;
    if(s.lift!==undefined){ const tl=Math.min(s.lift,K.maxLift||0), d=tl-a.lift, sp=d>0?(a.pal?K.upL:K.up):K.dn; if(Math.abs(d)>1e-4){ a.lift+=Math.sign(d)*Math.min(Math.abs(d),(sp||0.4)*h); done=false; } }
    if(s.reach!==undefined&&K.reach){ const d=s.reach-a.reach; if(Math.abs(d)>1e-4){ a.reach+=Math.sign(d)*Math.min(Math.abs(d),0.25*h); done=false; } }
    if(done) a.steps.shift(); return; }
  if(s.t==='push'){ const d=s.d-a.palPush; if(Math.abs(d)<1e-4){ a.palPush=s.d; a.steps.shift(); return; } a.palPush+=Math.sign(d)*Math.min(Math.abs(d),0.5*h); return; }
  if(s.t==='wait'){ s.s-=h; if(s.s<=0) a.steps.shift(); return; }
  if(s.t==='act'){ a.steps.shift(); s.fn(); return; } }
function poseAgent(a){ const o=a.o; o.position.set(a.x,a.y,a.z); o.rotation.y=a.h;
  if(a.k==='F12') fkSet(o,a.lift,a.roll,0,0); else if(a.k==='F11') rtSet(o,a.lift,a.reach,a.roll/0.12);
  if(a.pal){ const K=a.K, d=K.reach?a.reach+K.fk[2]:K.D;
    if(a.pal.shuttle){ const m=a.pal.shuttle.o; if(m.parent!==o) o.add(m); m.visible=true; m.position.set(0,K.FT+a.lift-0.02,d); m.rotation.set(0,a.palRy,0); }
    else pmAt(a.pal,o,0,K.FT+a.lift-0.10,d+a.palPush,a.palRy); } }
/* ---------- обмотчик ---------- */
function wrapStep(h){ const L=W.wr; if(!L) return; if(L.state==='wrap'){ L.t+=h; if(L.sp) L.sp.sp=1.7; const p=L.pal;
    if(L.t>=P.wrapT){ L.state='done'; p.wr=true; pmGet(p); if(L.sp) L.sp.sp=0; L.tt.rotation.y=Math.round(L.tt.rotation.y/PI)*PI; W.K.wrap++; } }
  else if(L.sp) L.sp.sp=0; }
/* ---------- шаг счёта ---------- */
function step(h){ W.t+=h; trucks(h); orders(h); if(W.cv){ convStep(h); W.cranes.forEach(c=>craneStep(c,h)); }
  W.shut.forEach(sh=>shStep(sh,h)); wrapStep(h);
  W.disp+=h; if(W.disp>=0.5){ W.disp=0; dispatch(); }
  W.agents.forEach(a=>stepAgent(a,h));
  W.samp+=h; if(W.samp>=10){ W.samp=0; sample(); } }
function dispatch(){ if(W.cranes.length&&W.orders.length) assignC();
  for(const a of W.agents){ if(W.t<a.id*12) continue;   /* на старте — по очереди, не все разом со стоянки */ if(a.task||a.steps.length&&!a.steps[0].home&&!a.steps[0].yld) continue; if(!a.roles.length) continue;
    if(a.steps.length&&a.steps[0].yld) continue;
    for(const r of a.roles){ const f=ROLE[r]; if(!f) continue; const T=f(a); if(T){ break; } } } }
function sample(){ const K=W.K, occ=l=>l.filter(L=>L.pal).length;
  K.bufIn[0]+=occ(W.spots.inb); K.bufIn[1]++; K.bufIn[2]=Math.max(K.bufIn[2],occ(W.spots.inb));
  const ox=W.cv?W.cv.lanes.out.list.length+W.cv.lanes.main.list.filter(e=>e.dest==='out').length:occ(W.spots.exp);
  K.bufOut[0]+=ox; K.bufOut[1]++; K.bufOut[2]=Math.max(K.bufOut[2],ox);
  const bl=W.orders.length+W.cranes.reduce((s,c)=>s+c.q.length,0); K.backlog[0]+=bl; K.backlog[1]++; K.backlog[2]=Math.max(K.backlog[2],bl);
  W.spots.qua.forEach(L=>{ if(L.pal&&!L.res&&W.t-(L.pal.tq||W.t)>1800){ const p=L.take(); pmHide(p); } });          // карантин: разбор и возврат поставщику через 30 мин
  W.lanes.forEach(Ln=>{ if(!Ln.sh&&laneNeedsCompact(Ln)&&W.need.size<4) W.need.add(Ln); }); }
/* ---------- управление ---------- */
function start(v,o){ stop(true); o=o||{}; if(!['A','B','C'].includes(v)) return false; S.seed=o.seed||0;
  if(ED.on) edSetMode(false); build(v); S.on=true; S.v=v; S.t=0; S.fast=!!o.fast; S.until=o.until||0; S.onDone=o.onDone||null;
  W.agents.forEach(poseAgent); UIX.sync(); return true; }
function stop(silent){ if(!W){ S.on=false; return; }
  const res=W&&W.t>60?summary():null;
  W.agents.forEach(a=>{ const o=a.o; delete o.userData.abcMob; if(o.userData.truck&&o.userData.truck.kind==='abc') delete o.userData.truck;
    o.position.set(a.home.x,0,a.home.z); o.rotation.y=a.home.h; if(a.k==='F12') fkSet(o,0,0,0,0); else if(a.k==='F11') rtSet(o,0,0.25,0); if(a.pal) pmHide(a.pal); });
  W.shut.forEach(sh=>{ if(sh.pal) pmHide(sh.pal); sh.pal=null; sh.lift=0; sh.steps=[]; shPark(sh,sh.lane0); });   // шаттл с вил — обратно в канал
  if(W.wr&&W.wr.sp) W.wr.sp.sp=0.55;
  if(W.dock){ W.dock.T.position.x=W.dock.x0; rdoorSet(W.dock.T,1); }
  if(W.out){ W.out.T.visible=true; if(W.out.kind==='cn'){ W.out.T.position.x=W.out.x0; rdoorSet(W.out.T,1); } }
  W.cranes.forEach(c=>{ c.cr.position.z=c.pdz; c.lift.position.y=0.75; c.tele.position.x=0; if(c.pal) pmHide(c.pal); });
  /* грузы на местах — как до прогона (пустые; вариант собирается заново при следующем запуске) */
  spawned.forEach(g=>{ const L=g.userData.loads; if(L) for(let i=0;i<L.n;i++) L.set(i,false,1); });
  [fixG&&fixG.userData.cn,fixG&&fixG.userData.cnOut].forEach(t=>{ const L=t&&t.userData.loads; if(L) for(let i=0;i<L.n;i++) L.set(i,i>=8&&t===fixG.userData.cn,1.1,OWNC[i%OWNN]); });
  if(fixG&&fixG.userData.kz) [fixG.userData.kz.userData.b1,fixG.userData.kz.userData.b2].forEach(b=>{ const L=b.userData.loads; if(L) for(let i=0;i<L.n;i++) L.set(i,false,1); });
  W.root.traverse(o=>{}); scene.remove(W.root); pool=[];
  if(res&&S.v){ const st=ST(); st.res=st.res||{}; st.res[S.v]=res; edSave(); }
  W=null; S.on=false; S.fast=false; if(!silent) UIX.sync(); }
let lastFrame=0;
function tick(dt){ if(!S.on||!W) return;
  if(S.fast){ const t0=performance.now(); while(performance.now()-t0<28){ for(let i=0;i<20;i++) step(Hs); if(S.until&&W.t>=S.until) break; } }
  else { let left=Math.min(dt,0.25)*S.speed; while(left>1e-9){ const h=Math.min(Hs,left); step(h); left-=h; } }
  W.agents.forEach(poseAgent);
  if(S.until&&W.t>=S.until){ const cb=S.onDone; S.until=0; S.fast=false; if(cb) cb(summary()); }
  renderer.shadowMap.needsUpdate=true; }
function summary(){ if(!W) return null; const K=W.K, T=Math.max(1,W.t), hr=T/3600, cyc={};
  for(const k in K.cyc) cyc[k]=K.cyc[k][1]?K.cyc[k][0]/K.cyc[k][1]:0;
  const ag=W.agents.map(a=>({n:a.nm,k:a.k,u:(K.busy.get(a)||0)/T,km:(K.moved.get(a)||0)/1000,roles:a.roles.join(',')}));
  const cr=W.cranes.map(c=>({n:'Кран '+(c.id+1),u:(K.busy.get(c)||0)/T}));
  const sh=W.shut.map((s,i)=>({n:'Шаттл '+(i+1),u:(K.busy.get(s)||0)/T}));
  let cap=0, used=0; W.slots.forEach(L=>{ if(L.type){ cap++; if(L.pal) used++; } }); W.lanes.forEach(Ln=>{ cap+=Ln.nd; used+=laneCount(Ln); });
  let lanesUsed=0, lanePos=0; W.lanes.forEach(Ln=>{ if(Ln.sku!==null&&laneCount(Ln)>0){ lanesUsed++; lanePos+=Ln.nd; } });
  return {v:W.v,T,put:K.put,ret:K.ret,unl:K.unl,load:K.load,wrap:K.wrap,shx:K.shx,reloc:K.reloc,rej:K.rej,tph:(K.put+K.ret)/hr,
    cyc,d2s:K.d2s[1]?K.d2s[0]/K.d2s[1]:0,lead:K.lead[1]?K.lead[0]/K.lead[1]:0,trIn:K.trIn,trOut:K.trOut,trWait:K.trWait[1]?K.trWait[0]/K.trWait[1]:0,
    bufIn:[K.bufIn[1]?K.bufIn[0]/K.bufIn[1]:0,K.bufIn[2],W.spots.inb.length],bufOut:[K.bufOut[1]?K.bufOut[0]/K.bufOut[1]:0,K.bufOut[2],W.cv?2:W.spots.exp.length],
    backlog:[K.backlog[1]?K.backlog[0]/K.backlog[1]:0,K.backlog[2]],stall:K.stall,ghost:K.ghost||0,blockS:K.blockS,conv:K.conv[1]?K.conv[0]/K.conv[1]:0,
    ag,cr,sh,cap,used,lanesUsed,lanePos,lanes:W.lanes.length,orders:W.orders.length,P:Object.assign({},P),log:W.log.slice(-6),
    trucks:{dock:W.dock.state,q:W.dock.queue,out:W.out?W.out.state:'',outN:W.out?W.out.slots.filter(L=>L.pal).length:0,outCap:W.out?W.out.slots.length:0,inLeft:W.dock.slots.filter(L=>L.pal).length}}; }
return {P,S,start,stop,tick,summary,get on(){ return S.on; },get W(){ return W; },KIND,
  fast(hours,cb){ if(!W) return; S.fast=true; S.until=W.t+hours*3600; S.onDone=cb||null; },
  setSpeed(x){ S.speed=x; S.fast=false; S.until=0; }};
})();
