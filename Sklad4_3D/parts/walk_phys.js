/* ===================== ОБХОД С ФИЗИКОЙ ТЕЛА =====================
   Человек в режиме обхода — тело радиусом 0,32 м и ростом 1,8 м (глаза на 1,66 м), а не летающая камера:
   · не проходит сквозь колонны, стойки, ограждения, ленту, DWS, стены и машины — скользит вдоль них;
   · движущийся погрузчик, машины, стойки на вилах и люди расталкивают его, рядом с едущим погрузчиком — предупреждение;
   · гравитация: с платформы у Л2 (перепад 1 м) можно спрыгнуть, обратно — по лестнице; ступени до 0,36 м перешагивает;
   · разгон и торможение (инерция), прыжок (пробел), присед (C), покачивание головы в такт шагу, «просадка» при приземлении;
   · наезд едущего погрузчика сбивает с ног: отбрасывает, человек падает на бок на пол, лежит ~2 с и поднимается (через колено);
   · вид от третьего лица (V): аватар — та же модель человека, идёт и бежит по мокапу, камера за правым плечом, не заходит в стены;
   · удар (F или левая кнопка мыши): ближайший человек перед вами отшатывается, падает на спину, лежит и встаёт.
   Неподвижное окружение растеризуется один раз при входе в обход в сетку 10 см с полосами высоты по 25 см (что в клетке
   и на какой высоте); подвижное (погрузчики, машины, стойки, створки ворот, лента, люди) проверяется каждый кадр по
   ориентированным коробкам. */
const STAIRS=[];                                                // лестницы у разгрузочных платформ: {x0,x1,z0,top,n,rise,run}
const WALKP=(()=>{
  const R=0.32, STEP=0.36, GRAV=9.81, BODY=1.85, BODYC=1.2, EYE=1.66, EYEC=1.02;
  const CS=0.1, X0=-32, Z0=-32, NX=1140, NZ=1180, Y0=-1.25, BH=0.25, NB=31;
  const S={feet:0,vy:0,vx:0,vz:0,grounded:true,crouch:0,bob:0,bobA:0,dip:0,dipV:0,jumpHeld:false,warn:0,ms:0,cells:0,units:0,down:null,immune:0,hits:0,view:1,punches:0,punchHits:0};
  const FALL=0.42, LIE=1.9, RISE=1.3;                         // падение, лежит, встаёт (с)
  const c01=v=>Math.max(0,Math.min(1,v)), ez=u=>{u=c01(u); return u*u*u*(u*(u*6-15)+10);};   // свои: помощники фильма живут внутри его модуля
  let grid=null, units=[], unitT=0, lastFk=new Map(), hud=null;
  const disc=[]; for(let i=-4;i<=4;i++) for(let j=-4;j<=4;j++) if(Math.hypot(i,j)*CS<=R+0.02) disc.push([i,j]);

  /* ---------- высота земли под ногами: пол зала, двор, платформы у Л1/Л2, лестницы ---------- */
  const PADS=GATES.map(g=>({x0:-3.4,x1:0,z0:g.z-(g.w+5.2)/2,z1:g.z+(g.w+5.2)/2}));
  function ground(x,z){
    if(x>=-0.3) return x>W+0.2?-0.06:0;
    for(const p of PADS) if(x>=p.x0&&x<=p.x1&&z>=p.z0&&z<=p.z1) return 0;
    for(const s of STAIRS) if(x>=s.x0&&x<=s.x1&&z<=s.z0&&z>=s.z0-s.n*s.run){ const k=Math.min(s.n,Math.ceil((s.z0-z)/s.run-1e-6)); return s.top-k*s.rise; }
    return -1.06;
  }

  /* ---------- сетка неподвижного окружения ---------- */
  const dynRoot=o=>{ const u=o.userData; return u.isHuman||u.rig||u.rack||u.truck||u.teleExt||u.carton||u.walkDyn; };
  function build(){
    const t0=performance.now(); grid=new Uint32Array(NX*NZ); let cells=0;
    const skip=new Set([G.people,G.labels,G.addr,G.roles,G.dims,G.flow,G.floorgfx,G.roof].filter(Boolean));
    if(typeof DOORS!=='undefined') DOORS.forEach(d=>d.panels.forEach(p=>skip.add(p)));
    const va=new THREE.Vector3(), vb=new THREE.Vector3(), vc=new THREE.Vector3(), mi=new THREE.Matrix4(), mw=new THREE.Matrix4();
    const mark=(cx,cz,m)=>{ if(cx<0||cz<0||cx>=NX||cz>=NZ) return; const k=cz*NX+cx; if(!grid[k]) cells++; grid[k]|=m; };
    const line=(ax,az,bx,bz,m)=>{ const L=Math.hypot(bx-ax,bz-az), n=Math.max(1,Math.ceil(Math.min(L,400)/(CS*0.5)));
      for(let i=0;i<=n;i++){ const u=i/n; mark(Math.floor((ax+(bx-ax)*u-X0)/CS),Math.floor((az+(bz-az)*u-Z0)/CS),m); } };
    const tri=(a,b,c)=>{
      const ymin=Math.min(a.y,b.y,c.y), ymax=Math.max(a.y,b.y,c.y), cx=(a.x+b.x+c.x)/3, cz=(a.z+b.z+c.z)/3;
      if(ymax<=ground(cx,cz)+0.12||ymin>Y0+NB*BH||ymax<Y0) return;
      const b0=Math.max(0,Math.floor((ymin-Y0)/BH)), b1=Math.min(NB-1,Math.ceil((ymax-Y0)/BH)-1); if(b1<b0) return;
      const m=(b1>=31?0xffffffff:((1<<(b1+1))-1))&~((1<<b0)-1);
      line(a.x,a.z,b.x,b.z,m); line(b.x,b.z,c.x,c.z,m); line(c.x,c.z,a.x,a.z,m);
      const area=Math.abs((b.x-a.x)*(c.z-a.z)-(c.x-a.x)*(b.z-a.z))/2; if(area<CS*CS) return;
      const i0=Math.max(0,Math.floor((Math.min(a.x,b.x,c.x)-X0)/CS)), i1=Math.min(NX-1,Math.floor((Math.max(a.x,b.x,c.x)-X0)/CS));
      const j0=Math.max(0,Math.floor((Math.min(a.z,b.z,c.z)-Z0)/CS)), j1=Math.min(NZ-1,Math.floor((Math.max(a.z,b.z,c.z)-Z0)/CS));
      const d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z); if(Math.abs(d)<1e-9) return;
      for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const px=X0+(i+.5)*CS, pz=Z0+(j+.5)*CS;
        const l1=((b.z-c.z)*(px-c.x)+(c.x-b.x)*(pz-c.z))/d, l2=((c.z-a.z)*(px-c.x)+(a.x-c.x)*(pz-c.z))/d;
        if(l1>=-0.02&&l2>=-0.02&&l1+l2<=1.02) mark(i,j,m); } };
    const meshTris=(o,M)=>{ const g=o.geometry; if(!g||!g.attributes||!g.attributes.position) return; const P=g.attributes.position, I=g.index;
      if(!g.boundingSphere) g.computeBoundingSphere(); if(g.boundingSphere.radius>400) return;   // небо, двор — не препятствия
      const n=I?I.count:P.count; for(let k=0;k+2<n;k+=3){ const ia=I?I.getX(k):k, ib=I?I.getX(k+1):k+1, ic=I?I.getX(k+2):k+2;
        va.fromBufferAttribute(P,ia).applyMatrix4(M); vb.fromBufferAttribute(P,ib).applyMatrix4(M); vc.fromBufferAttribute(P,ic).applyMatrix4(M); tri(va,vb,vc); } };
    scene.updateMatrixWorld(true);
    (function walkO(o){ if(!o.visible||skip.has(o)||dynRoot(o)) return;
      if(o.isMesh&&!o.isSkinnedMesh){ const ms=Array.isArray(o.material)?o.material:[o.material];
        if(!ms.every(m=>m&&m.visible!==false&&(!m.transparent||m.opacity>0.2||m.alphaMap))) {} else
        if(o.isInstancedMesh){ for(let i=0;i<o.count;i++){ o.getMatrixAt(i,mi); mw.multiplyMatrices(o.matrixWorld,mi); meshTris(o,mw); } }
        else meshTris(o,o.matrixWorld); }
      for(const c of o.children) walkO(c); })(scene);
    S.ms=Math.round(performance.now()-t0); S.cells=cells;
  }
  const bandMask=(y0,y1)=>{ const b0=Math.max(0,Math.floor((y0-Y0)/BH)), b1=Math.min(NB-1,Math.floor((y1-Y0)/BH)); if(b1<b0) return 0;
    return (b1>=31?0xffffffff:((1<<(b1+1))-1))&~((1<<b0)-1); };
  function hitCount(x,z,feet,top){ if(!grid) return 0; const m=bandMask(feet+STEP-0.02,top); if(!m) return 0;
    const ci=Math.floor((x-X0)/CS), cj=Math.floor((z-Z0)/CS); let n=0;
    for(const [i,j] of disc){ const a=ci+i, b=cj+j; if(a<0||b<0||a>=NX||b>=NZ) continue; if(grid[b*NX+a]&m) n++; }
    return n; }
  const hitStatic=(x,z,feet,top)=>hitCount(x,z,feet,top)>0;

  /* ---------- подвижные препятствия ---------- */
  const _inv=new THREE.Matrix4(), _p=new THREE.Vector3(), _c=new THREE.Vector3(), _s=new THREE.Vector3(), _q=new THREE.Vector3();
  function collectUnits(){
    const list=[], seen=new Set(units.map(u=>u.o));
    const add=(o,kind)=>{ let u=units.find(v=>v.o===o); if(!u){ u={o,kind,bb:null}; } list.push(u); };
    /* сидящие (водители) и свой аватар — не препятствие */
    scene.traverse(o=>{ const d=o.userData; if(d.isHuman){ if(!d.walkMe&&!(d.H&&d.H.st&&d.H.st.sit)) add(o,'h'); } else if(d.rig) add(o,'fk'); else if(d.truck) add(o,'tr'); else if(d.rack) add(o,'rk'); else if(d.teleExt) add(o,'tl'); });
    if(typeof DOORS!=='undefined') DOORS.forEach(d=>d.panels.forEach(p=>add(p,'dr')));
    for(const u of list) if(u.kind==='tl'&&u.ext!==u.o.userData.teleExt){ u.bb=null; u.ext=u.o.userData.teleExt; }   // конвейер выдвинулся или сложился — габарит заново
    for(const u of list) if(!u.bb&&u.kind!=='h'){ u.bb=new THREE.Box3(); u.o.updateMatrixWorld(true); _inv.copy(u.o.matrixWorld).invert();
      u.o.traverse(m=>{ if(!m.isMesh||!m.geometry||m.userData.isAO) return; if(!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b=m.geometry.boundingBox.clone();
        b.applyMatrix4(new THREE.Matrix4().multiplyMatrices(_inv,m.matrixWorld)); if(b.max.y-b.min.y<0.03&&b.max.y<0.1) return; u.bb.union(b); });
      if(u.bb.isEmpty()) u.bb=null; else u.rad=u.bb.getSize(_s).length()/2; }
    units=list; S.units=list.length;
  }
  const visChain=o=>{ for(let q=o;q;q=q.parent){ if(!q.visible) return false; if(q===scene) return true; } return false; };
  function pushDynamic(x,z,feet,top,out){
    let px=x, pz=z;
    for(const u of units){ const o=u.o; if(!visChain(o)) continue;
      if(u.kind==='h'){ o.getWorldPosition(_c); if(_c.y>top||_c.y+1.8<feet+STEP) continue; const dx=px-_c.x, dz=pz-_c.z, d=Math.hypot(dx,dz), rr=R+0.25;
        if(d<rr&&d>1e-4){ px=_c.x+dx/d*rr; pz=_c.z+dz/d*rr; } continue; }
      if(!u.bb) continue;
      _c.copy(u.bb.min).add(u.bb.max).multiplyScalar(0.5).applyMatrix4(o.matrixWorld);
      if(Math.hypot(px-_c.x,pz-_c.z)>u.rad+R+0.5) continue;
      /* по высоте: восемь углов коробки в мировых координатах */
      let ymin=1e9, ymax=-1e9; for(let k=0;k<8;k++){ _q.set(k&1?u.bb.max.x:u.bb.min.x,k&2?u.bb.max.y:u.bb.min.y,k&4?u.bb.max.z:u.bb.min.z).applyMatrix4(o.matrixWorld); ymin=Math.min(ymin,_q.y); ymax=Math.max(ymax,_q.y); }
      if(ymax<feet+STEP||ymin>top) continue;
      _inv.copy(o.matrixWorld).invert(); _p.set(px,(Math.max(ymin,feet)+Math.min(ymax,top))/2,pz).applyMatrix4(_inv);
      o.matrixWorld.decompose(_q,_qq,_s); const sx=Math.abs(_s.x)||1, sz=Math.abs(_s.z)||1;
      const b=u.bb, rx=R/sx, rz=R/sz;
      const qx=Math.max(b.min.x,Math.min(b.max.x,_p.x)), qz=Math.max(b.min.z,Math.min(b.max.z,_p.z));
      let lx=_p.x-qx, lz=_p.z-qz, nx=_p.x, nz=_p.z;
      if(lx===0&&lz===0){                                         // внутри коробки: к ближайшей грани
        const e=[[_p.x-b.min.x,-1,0],[b.max.x-_p.x,1,0],[_p.z-b.min.z,0,-1],[b.max.z-_p.z,0,1]].map(v=>[v[0]*(v[1]?sx:sz),v[1],v[2],v[0]]).sort((a,c)=>a[0]-c[0])[0];
        if(e[1]) nx=(e[1]<0?b.min.x-rx:b.max.x+rx); else nz=(e[2]<0?b.min.z-rz:b.max.z+rz);
      } else { const dw=Math.hypot(lx*sx,lz*sz); if(dw>=R) continue; const k=R/dw; nx=qx+lx*k; nz=qz+lz*k; }
      _p.x=nx; _p.z=nz; _p.applyMatrix4(o.matrixWorld);
      if(u.kind==='fk') out.fk=true;
      if(u.kind==='fk'||u.kind==='rk'||u.kind==='tr'){ const dx=_p.x-px, dz=_p.z-pz, dl=Math.hypot(dx,dz); if(dl>0.004&&(!out.hit||dl>out.hit.d)) out.hit={d:dl,nx:dx/dl,nz:dz/dl,u}; }
      px=_p.x; pz=_p.z;
    }
    return [px,pz];
  }
  const _qq=new THREE.Quaternion();

  /* ---------- шаг ---------- */
  /* шаг разрешён, если там свободно или если он выводит из касания (например, после прыжка с платформы вплотную к её борту) */
  let cur=0;
  function free(x,z,feet,top){ if(ground(x,z)-feet>STEP) return false; const n=hitCount(x,z,feet,top); return n===0||n<cur; }
  function move(dx,dz){
    const top=S.feet+(S.crouch>0.5?BODYC:BODY), L=Math.hypot(dx,dz), n=Math.max(1,Math.ceil(L/0.05));
    let bx=false, bz=false;
    for(let i=0;i<n;i++){ const sx=dx/n, sz=dz/n; cur=hitCount(wPos.x,wPos.z,S.feet,top);
      if(free(wPos.x+sx,wPos.z+sz,S.feet,top)){ wPos.x+=sx; wPos.z+=sz; continue; }
      if(sx&&free(wPos.x+sx,wPos.z,S.feet,top)) wPos.x+=sx; else bx=true;
      if(sz&&free(wPos.x,wPos.z+sz,S.feet,top)) wPos.z+=sz; else bz=true; }
    wPos.x=clamp(wPos.x,-70,W+70); wPos.z=clamp(wPos.z,-70,D+70);
    return [bx,bz];
  }
  function unstick(){                                          // вошли в обход внутри препятствия — ближайшее свободное место
    const top=S.feet+BODY; if(free(wPos.x,wPos.z,S.feet,top)) return;
    for(let r=0.1;r<6;r+=0.1) for(let a=0;a<6.283;a+=0.3){ const x=wPos.x+Math.cos(a)*r, z=wPos.z+Math.sin(a)*r, f=ground(x,z);
      if(!hitStatic(x,z,f,f+BODY)){ wPos.x=x; wPos.z=z; S.feet=f; return; } }
  }
  function step(dtAll){
    if(!grid) build();
    unitT-=dtAll; if(unitT<=0){ collectUnits(); unitT=1.0; }
    /* скорость всего, что ездит: погрузчик, стойка на вилах, машины */
    for(const u of units){ if(u.kind==='h'||u.kind==='dr') continue; u.o.getWorldPosition(_c); if(u.prev&&dtAll>0){ u.vx=(_c.x-u.prev.x)/dtAll; u.vz=(_c.z-u.prev.z)/dtAll; } else { u.vx=u.vz=0; } u.prev=(u.prev||new THREE.Vector3()).copy(_c); }
    if(S.immune>0) S.immune-=dtAll;
    if(S.down){ S.down.t+=dtAll; if(S.down.t>=FALL+LIE+RISE){ S.down=null; S.immune=2.0; } }
    const downNow=!!S.down;
    const fx=-Math.sin(wYaw), fz=-Math.cos(wYaw), rx=Math.cos(wYaw), rz=-Math.sin(wYaw);
    let mx=0, mz=0;
    if(keys.KeyW||keys.ArrowUp){ mx+=fx; mz+=fz; }   if(keys.KeyS||keys.ArrowDown){ mx-=fx; mz-=fz; }
    if(keys.KeyD||keys.ArrowRight){ mx+=rx; mz+=rz; } if(keys.KeyA||keys.ArrowLeft){ mx-=rx; mz-=rz; }
    if(downNow){ mx=mz=0; }                                     // сбит с ног: ноги не слушаются, пока не встал
    if(keys.KeyV&&!vHeld) setView(S.view===3?1:3); vHeld=!!keys.KeyV;
    if(keys.KeyF&&!fHeld) punch(); fHeld=!!keys.KeyF;
    const run=(keys.ShiftLeft||keys.ShiftRight)&&S.crouch<0.5, Lm=Math.hypot(mx,mz);
    const crouchK=!!keys.KeyC&&!downNow;
    let n=Math.max(1,Math.ceil(dtAll/(1/90))), dt=dtAll/n, out={fk:false};
    for(let it=0;it<n;it++){
      /* присед: встать можно, только если над головой свободно */
      const wantC=crouchK?1:(hitStatic(wPos.x,wPos.z,S.feet,S.feet+BODY)&&S.crouch>0.5?1:0);
      S.crouch+=(wantC-S.crouch)*Math.min(1,dt*9);
      const vmax=S.crouch>0.5?0.9:(run?5.0:1.9);              // шаг 1,9 м/с, бег 5 м/с, вприсядку 0,9 м/с
      const tx=Lm?mx/Lm*vmax:0, tz=Lm?mz/Lm*vmax:0, acc=downNow?(S.down.t<FALL?1.5:4.5):S.grounded?(Lm?7.5:10):1.2;   // сбитого протаскивает по полу
      const ddx=tx-S.vx, ddz=tz-S.vz, dl=Math.hypot(ddx,ddz), st=Math.min(dl,acc*dt);
      if(dl>1e-6){ S.vx+=ddx/dl*st; S.vz+=ddz/dl*st; }
      const [bx,bz]=move(S.vx*dt,S.vz*dt); if(bx) S.vx*=0.2; if(bz) S.vz*=0.2;
      /* толчки от подвижного: погрузчик, машины, стойки, люди */
      const top=S.feet+(S.crouch>0.5?BODYC:BODY);
      for(let k=0;k<2;k++){ const [px,pz]=pushDynamic(wPos.x,wPos.z,S.feet,top,out); if(!hitStatic(px,pz,S.feet,top)){ wPos.x=px; wPos.z=pz; } }
      /* наезд: погрузчик едет на человека быстрее 0,5 м/с — сбивает с ног и отбрасывает по направлению удара */
      if(out.hit&&!S.down&&S.immune<=0){ const h=out.hit, v=Math.hypot(h.u.vx||0,h.u.vz||0), into=(h.u.vx||0)*h.nx+(h.u.vz||0)*h.nz;
        if(v>0.5&&into>0.3){ const kb=1.4+0.9*v; S.vx=h.nx*kb; S.vz=h.nz*kb; S.vy=Math.min(1.6,0.4+0.5*v); S.grounded=false;
          const side=Math.sign(h.nx*rx+h.nz*rz)||1; S.down={t:0,side,eye0:EYE+(EYEC-EYE)*S.crouch,v,yaw:wYaw}; S.hits++; S.crouch=0; } }
      out.hit=null;
      /* вертикаль: земля, ступени, падение, прыжок */
      const gy=ground(wPos.x,wPos.z);
      if(keys.Space&&!S.jumpHeld&&S.grounded&&S.crouch<0.5&&!downNow){ S.vy=3.1; S.grounded=false; }
      S.jumpHeld=!!keys.Space;
      if(S.grounded){
        if(gy<S.feet-0.04){ S.grounded=false; S.vy=0; }
        else { const d=gy-S.feet; S.feet+=d*Math.min(1,dt*16); if(d>0.05) S.dipV-=d*2.2*dt*16; } }
      if(!S.grounded){ S.vy-=GRAV*dt; S.feet+=S.vy*dt;
        if(S.feet<=gy){ const imp=-S.vy; S.feet=gy; S.vy=0; S.grounded=true; if(!S.down) S.dipV-=Math.min(imp*0.55,2.6); } }
      /* «колени»: пружина просадки при приземлении и на ступенях */
      S.dipV+=(-90*S.dip-15*S.dipV)*dt; S.dip+=S.dipV*dt; S.dip=Math.max(-0.35,Math.min(0.08,S.dip));
      /* покачивание головы: два толчка на цикл шага */
      const sp=Math.hypot(S.vx,S.vz);
      S.bobA+=((S.grounded&&sp>0.15?1:0)-S.bobA)*Math.min(1,dt*6);
      S.bob+=dt*Math.PI*(1.1+0.42*sp);
    }
    const sp=Math.hypot(S.vx,S.vz), A=(0.018+0.008*Math.min(sp,5))*S.bobA*(1-0.5*S.crouch);
    const eye=EYE+(EYEC-EYE)*S.crouch;
    wPos.y=S.feet+eye+S.dip-A*(1-Math.cos(2*S.bob))*0.5;
    const lat=0.012*S.bobA*Math.sin(S.bob)*Math.min(1,sp/1.9);
    camera.position.set(wPos.x+rx*lat,wPos.y,wPos.z+rz*lat);
    let pitch=wPitch, roll=0.006*S.bobA*Math.sin(S.bob)*Math.min(1,sp/1.9);
    if(S.down){ /* падение: голова уходит вниз и вбок (на ту сторону, куда толкнуло), удар о пол с отскоком, лежит, встаёт через колено */
      const D=S.down, t=D.t, side=D.side, LY=0.23; let ey, rl, pa;
      if(t<FALL){ const u=t/FALL, e=u*u; ey=D.eye0+(LY-D.eye0)*e; rl=1.32*e; pa=0.42*e; }
      else if(t<FALL+LIE){ const u=t-FALL, b=Math.exp(-u*6)*Math.sin(u*24); ey=LY+0.035*Math.abs(b)+0.006*Math.sin(u*2.1); rl=1.32+0.06*b; pa=0.42+0.04*Math.sin(u*0.9); }
      else { const u=c01((t-FALL-LIE)/RISE); ey=u<0.55?LY+(0.95-LY)*ez(u/0.55):0.95+(D.eye0-0.95)*ez((u-0.55)/0.45); rl=1.32*(1-ez(Math.min(1,u*1.7))); pa=0.42*(1-ez(u)); }
      camera.position.set(wPos.x,S.feet+ey,wPos.z); wPos.y=camera.position.y; pitch=wPitch+pa; roll=-side*rl; }
    wDir.set(-Math.sin(wYaw)*Math.cos(pitch), Math.sin(pitch), -Math.cos(wYaw)*Math.cos(pitch));
    camera.lookAt(camera.position.x+wDir.x, camera.position.y+wDir.y, camera.position.z+wDir.z);
    camera.rotateZ(roll);
    if(S.view===3) thirdPerson(dtAll,roll); else if(me) me.root.visible=false;
    hitFx(); warnFk(dtAll); armFx(dtAll);
  }
  /* ---------- вид от третьего лица: аватар и камера за правым плечом ---------- */
  let me=null, ph=0, punchT=-1, punchCd=0, fHeld=false, vHeld=false, arm=null, msgEl=null, msgT=0;
  const _d=new THREE.Vector3(), _pv=new THREE.Vector3(), _cp=new THREE.Vector3();
  function avatar(){ if(me) return me; let q=20261012; const rnd=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; };
    me=HUM.build({role:'КЛАДОВЩИК',rnd}); me.root.userData.walkMe=true; me.root.visible=false; scene.add(me.root); return me; }
  function setView(v){ S.view=v===3?3:1; if(S.view===3) avatar(); if(me) me.root.visible=S.view===3&&walk; }
  function thirdPerson(dt,roll){ const H=avatar(); H.root.visible=true;
    const sp=Math.hypot(S.vx,S.vz), mv=S.grounded&&sp>0.1, run=c01((sp-2.2)/1.8), wk=mv?c01(sp/1.5)*(1-run):0;
    if(mv) ph+=sp*dt/(run>0.5?HUM.CYC.run.len:HUM.CYC.walk.len);
    const D=S.down; let e=0, side=1; if(D){ side=D.side; const t=D.t; e=t<FALL?ez(t/FALL):t<FALL+LIE?1:1-ez((t-FALL-LIE)/RISE); }
    H.root.position.set(wPos.x,S.feet+0.1*e,wPos.z); H.root.rotation.set(0,wYaw+Math.PI,side*1.5*e);       // падает на тот же бок, куда уходит камера
    const pn=punchT>=0?Math.sin(Math.PI*c01(punchT/0.5)):0;
    HUM.pose(H,{t:performance.now()/1000,walk:wk,run:mv?run:0,phase:ph,squat:Math.max(S.crouch*0.85,D?0.45*e:0,!S.grounded&&!D?0.25:0),bend:D?0.3*e:(!S.grounded?0.1:0),punch:pn,lookAt:null});
    /* камера: за спиной и чуть справа, не ближе 0,6 м; если позади стена — подъезжает к человеку */
    _pv.set(wPos.x,S.feet+1.5+S.dip*0.5-0.9*e-0.4*S.crouch,wPos.z);
    _d.set(-Math.sin(wYaw)*Math.cos(wPitch),Math.sin(wPitch),-Math.cos(wYaw)*Math.cos(wPitch));
    const rx=Math.cos(wYaw), rz=-Math.sin(wYaw), lat=0.42; let k=2.8;
    for(;k>0.6;k-=0.1){ const l=lat*Math.min(1,k/1.5); _cp.copy(_pv).addScaledVector(_d,-k); _cp.x+=rx*l; _cp.z+=rz*l;
      if(_cp.y>ground(_cp.x,_cp.z)+0.25&&!hitStatic(_cp.x,_cp.z,_cp.y-0.55,_cp.y+0.25)) break; }
    camera.position.copy(_cp); camera.lookAt(_pv.x+_d.x*1.5+rx*lat*0.6,_pv.y+_d.y*1.5,_pv.z+_d.z*1.5+rz*lat*0.6); camera.rotateZ(roll*0.5); }
  /* ---------- удар: F или левая кнопка мыши ---------- */
  function punch(){ if(!walk||S.down||punchCd>0) return; punchCd=0.7; punchT=0; S.punches++;
    const fx=-Math.sin(wYaw), fz=-Math.cos(wYaw); let best=null, bd=1.45;
    for(const u of units){ if(u.kind!=='h'||!visChain(u.o)) continue; const H=u.o.userData.H; if(!H||H===me||(H.st&&(H.st.sit||H.st.drive))) continue;
      u.o.getWorldPosition(_c); const dx=_c.x-wPos.x, dz=_c.z-wPos.z, d=Math.hypot(dx,dz); if(d>bd||Math.abs(_c.y-S.feet)>1.6) continue;
      if((dx*fx+dz*fz)/Math.max(d,1e-3)<0.64) continue; best=u; bd=d; }
    if(best){ const H=best.o.userData.H; best.o.getWorldPosition(_c); const dx=_c.x-wPos.x, dz=_c.z-wPos.z, d=Math.hypot(dx,dz)||1;
      if(HUM.knock(H,dx/d,dz/d)){ S.punchHits++; msg('Вы ударили: '+(H.role||'человек').toLowerCase()+' · упал · в жизни это драка на складе: увольнение и полиция'); } } }
  function msg(t){ if(!msgEl){ msgEl=document.createElement('div'); msgEl.id='walkmsg';
      msgEl.style.cssText='position:absolute;left:50%;top:58px;transform:translateX(-50%);z-index:7;display:none;padding:7px 12px;border-radius:6px;background:rgba(20,24,30,.85);color:#ffd27a;font:600 13px/1.3 "IBM Plex Sans",sans-serif;pointer-events:none;white-space:nowrap';
      view.appendChild(msgEl); } msgEl.textContent=t; msgEl.style.display='block'; msgT=3.0; }
  /* кулак от первого лица: предплечье и перчатка в углу кадра на время удара */
  function armFx(dt){ if(punchT>=0){ punchT+=dt; if(punchT>0.5) punchT=-1; } punchCd=Math.max(0,punchCd-dt);
    if(msgEl&&msgT>0){ msgT-=dt; if(msgT<=0) msgEl.style.display='none'; else msgEl.style.opacity=Math.min(1,msgT/0.6).toFixed(2); }
    if(S.view===3||punchT<0||!walk){ if(arm) arm.visible=false; return; }
    if(!arm){ arm=new THREE.Group(); const gl=HUM.MT.glove[0], sl=HUM.MT.shirt[0];
      const fa=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.055,0.30,12),sl); fa.rotation.x=Math.PI/2; fa.position.z=-0.15; arm.add(fa);
      const cuff=new THREE.Mesh(new THREE.CylinderGeometry(0.058,0.058,0.05,12),gl); cuff.rotation.x=Math.PI/2; cuff.position.z=-0.27; arm.add(cuff);
      const fi=new THREE.Mesh(new THREE.SphereGeometry(0.062,14,10),gl); fi.scale.set(1,0.85,1.1); fi.position.z=-0.33; arm.add(fi);
      arm.traverse(o=>{ if(o.isMesh){ o.castShadow=false; o.receiveShadow=false; } }); if(camera.parent!==scene) scene.add(camera); camera.add(arm); }
    const k=Math.sin(Math.PI*c01(punchT/0.5)); arm.visible=true; arm.position.set(0.22-0.10*k,-0.22+0.05*k,-0.30-0.42*k); arm.rotation.set(0.15-0.1*k,-0.25+0.3*k,0.2); }
  document.addEventListener('mousedown',e=>{ if(walk&&e.button===0&&document.pointerLockElement===canvas) punch(); });
  /* ---------- сбит погрузчиком: красная вспышка по краям кадра и надпись ---------- */
  let fx=null;
  function hitFx(){
    if(!fx){ fx=document.createElement('div'); fx.id='walkhit';
      fx.style.cssText='position:absolute;inset:0;z-index:7;pointer-events:none;display:none;align-items:center;justify-content:center;flex-direction:column;'+
        'background:radial-gradient(ellipse at center,rgba(150,0,0,0) 35%,rgba(150,0,0,.75) 100%);color:#fff;font:700 26px/1.25 "IBM Plex Sans",sans-serif;text-shadow:0 2px 8px #000;text-align:center';
      view.appendChild(fx); }
    const D=S.down; if(!D||!walk){ fx.style.display='none'; return; }
    const t=D.t, a=t<0.15?t/0.15:Math.max(0,1-(t-0.15)/(FALL+LIE+RISE-0.3));
    fx.style.display='flex'; fx.style.opacity=a.toFixed(3);
    if(!fx.dataset.n||+fx.dataset.n!==S.hits){ fx.dataset.n=S.hits;
      fx.innerHTML='Вас сбил погрузчик<div style="font:500 15px/1.4 \'IBM Plex Sans\',sans-serif;margin-top:6px">скорость '+D.v.toFixed(1).replace('.',',')+' м/с · в жизни это травма · держитесь пешеходных дорожек, не ближе 3 м к едущему погрузчику</div>'; }
  }
  /* ---------- предупреждение: едущий погрузчик ближе 4 м ---------- */
  function warnFk(dt){
    let best=1e9;
    for(const u of units){ if(u.kind!=='fk'||!visChain(u.o)) continue; u.o.getWorldPosition(_c);
      const prev=lastFk.get(u.o); lastFk.set(u.o,_c.clone()); if(!prev) continue;
      const v=prev.distanceTo(_c)/Math.max(dt,1e-3); const d=Math.hypot(_c.x-wPos.x,_c.z-wPos.z);
      if(v>0.25&&d<best) best=d; }
    S.warn=best<4.0?1:0;
    if(!hud){ hud=document.createElement('div'); hud.id='walkwarn';
      hud.style.cssText='position:absolute;left:50%;top:18px;transform:translateX(-50%);z-index:7;display:none;padding:8px 14px;border-radius:6px;'+
        'background:rgba(190,30,25,.88);color:#fff;font:600 14px/1.2 "IBM Plex Sans",sans-serif;letter-spacing:.03em;pointer-events:none;box-shadow:0 2px 12px rgba(0,0,0,.35)';
      view.appendChild(hud); }
    hud.style.display=S.warn&&walk?'block':'none';
    if(S.warn) hud.textContent='⚠ Погрузчик рядом — '+best.toFixed(1).replace('.',',')+' м · уступите дорогу';
  }
  let nearSaved=0;
  function enter(){ grid=null; build(); units=[]; collectUnits(); unitT=1.0; lastFk.clear(); punchT=-1; punchCd=0; if(me) me.root.visible=S.view===3;
    S.feet=ground(wPos.x,wPos.z); S.vx=S.vz=S.vy=0; S.grounded=true; S.dip=S.dipV=0; S.crouch=0; S.down=null; S.immune=0; unstick();
    nearSaved=camera.near; camera.near=0.12; camera.updateProjectionMatrix(); }
  function exit(){ if(hud) hud.style.display='none'; S.down=null; if(fx) fx.style.display='none'; if(me) me.root.visible=false; if(arm) arm.visible=false; if(msgEl) msgEl.style.display='none'; if(nearSaved){ camera.near=nearSaved; camera.updateProjectionMatrix(); nearSaved=0; } }
  return {S,ground,build,enter,exit,step,move,hitStatic,setView,punch,avatar:()=>me,units:()=>units,info:()=>({ms:S.ms,cells:S.cells,units:S.units})};
})();
function tryMove(mx,mz){ WALKP.move(mx,mz); }
function walkStep(dt){ WALKP.step(dt); }

/* ---------- лестницы с платформ Л1 и Л2 во двор (перепад 1,06 м: 4 ступени по 0,212 м и земля) ---------- */
GATES.forEach((gt,i)=>{
  const z0=gt.z-(gt.w+5.2)/2, x0=-1.6, x1=-0.36, n=4, rise=0.212, run=0.3, top=0;
  STAIRS.push({x0,x1,z0,top,n,rise,run});
  const g=grp(0,0,0,G.struct), cx=(x0+x1)/2, wd=x1-x0;
  const grate=std(0x8d959c,.55,.7), stringer=M.yellow;
  for(let k=1;k<=n;k++){ const y=top-k*rise, zc=z0-(k-0.5)*run;
    box(wd,0.04,run-0.01,grate,cx,y-0.02,zc,g);                               // просечно-вытяжная ступень
    box(wd,0.05,0.03,M.steelDark,cx,y-0.045,zc-run/2+0.02,g).castShadow=false; }  // носок ступени
  const L=Math.hypot(n*run+0.25,n*rise+0.06), a=Math.atan2(n*rise,n*run);
  for(const sx of [x0-0.03,x1+0.03]){ const s=box(0.03,0.22,L,stringer,sx,top-n*rise/2-0.12,z0-n*run/2,g); s.rotation.x=-a; }   // косоуры
  /* поручень с внешней стороны: стойки и наклонная труба, вверху — горизонтальный участок вдоль платформы */
  const hx=x0-0.06;
  for(let k=0;k<=n;k+=2){ const y=top-k*rise, z=z0-k*run; cyl(0.022,0.95,stringer,hx,y+0.475,z,g,10); }
  const rl=cyl(0.024,L,stringer,hx,top-n*rise/2+0.95,z0-n*run/2,g,10); rl.rotation.x=Math.PI/2-a;
  const rl2=cyl(0.024,L*0.98,stringer,hx,top-n*rise/2+0.5,z0-n*run/2,g,10); rl2.rotation.x=Math.PI/2-a;
  cyl(0.022,0.95,stringer,hx,0.475,z0+1.0,g,10); const h=cyl(0.024,1.0,stringer,hx,0.95,z0+0.5,g,10); h.rotation.x=Math.PI/2;
  g.userData.nm='Лестница с платформы '+(i?'Л2':'Л1');
});
