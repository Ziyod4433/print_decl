/* ==========================================================================
   ЛЮДИ · скелет Mixamo и реальная механика движения (mocap: покой, шаг, бег)
   + рабочие позы поверх (несёт короб, толкает рохлю, сканирует, наклон к ленте, сидит).
   Спецодежда: каска, сигнальный жилет со световозвращающими полосами,
   куртка с длинным рукавом, рабочие брюки с наколенниками, перчатки, ботинки.
   ========================================================================== */
const MOCAP=/*__MOCAP__*/null;
const HUM=(()=>{
  const clips=MOCAP.clips, BN=MOCAP.B.map(b=>b[0]);
  const qa=new THREE.Quaternion(), qb=new THREE.Quaternion(), qt=new THREE.Quaternion(), qp=new THREE.Quaternion(), qi=new THREE.Quaternion();
  const vA=new THREE.Vector3(), vB=new THREE.Vector3(), X=new THREE.Vector3(1,0,0), Y=new THREE.Vector3(0,1,0), Zv=new THREE.Vector3(0,0,1);
  const fab=(c,r)=>std(c,r===undefined?.88:r,0,{envMapIntensity:.35});
  const MT={
    skin:[0xc8977a,0xb58262,0xd6a888,0x9c6b4d].map(c=>std(c,.58,0,{envMapIntensity:.4})),
    hair:fab(0x1e1a17,.7), brow:fab(0x2a221c,.8),
    eye:std(0x151515,.25,0), lip:std(0x9a5a50,.6,0),
    shirt:[fab(0x2f3a4c),fab(0x3b4250),fab(0x27313f),fab(0x46423c)],
    pants:[fab(0x2b3038),fab(0x333a44),fab(0x252a31)],
    pad:fab(0x16181b,.7), glove:[fab(0x6b6f74,.8),fab(0xc7a646,.85),fab(0x3c4046,.8)],
    boot:std(0x2a2521,.6,0), sole:std(0x121314,.9,0),
    vestO:std(0xff6b1a,.78,0,{emissive:0xff5a00,emissiveIntensity:.12,envMapIntensity:.3}),
    vestY:std(0xd8f21e,.78,0,{emissive:0xb6e000,emissiveIntensity:.10,envMapIntensity:.3}),
    vestB:fab(0x1f3d7a,.8), guard:fab(0x1c2126,.8),
    refl:std(0xc9cdd1,.28,.55,{envMapIntensity:1.6}),
    hatY:std(0xf2c21b,.35,0,{envMapIntensity:.9}), hatW:std(0xeeeeea,.35,0,{envMapIntensity:.9}),
    hatO:std(0xf0661c,.35,0,{envMapIntensity:.9}), hatB:std(0x1d58b8,.35,0,{envMapIntensity:.9}),
    strap:fab(0x222222,.8), scanner:std(0x2b2f35,.5,.2), scanLED:std(0xff2a2a,.3,0,{emissive:0xff1010,emissiveIntensity:3})
  };
  HUM_MT=MT;
  /* профили по ролям */
  const ROLE={
    'ГРУЗЧИК':{vest:'vestO',hat:'hatY'}, 'ГРУЗЧИК-УПАКОВЩИК':{vest:'vestO',hat:'hatY'},
    'КЛАДОВЩИК':{vest:'vestY',hat:'hatW'}, 'ОПЕРАТОР':{vest:'vestY',hat:'hatY'}, 'КОНТРОЛЁР':{vest:'vestY',hat:'hatW'},
    'ВОДИТЕЛЬ':{vest:'vestO',hat:null}, 'ВОДИТЕЛЬ ПОГРУЗЧИКА':{vest:'vestY',hat:'hatO'},
    'БРИГАДИР':{vest:'vestB',hat:'hatW'}, 'СТАРШИЙ СМЕНЫ':{vest:'vestB',hat:'hatW'},
    'ОХРАННИК':{vest:null,hat:null,guard:true}
  };
  const bakeCyl=(r1,r2,a,b,seg)=>{ const L=a.distanceTo(b); const g=new THREE.CylinderGeometry(r2,r1,L,seg||14,1,true);
    const q=new THREE.Quaternion().setFromUnitVectors(Y,vA.copy(b).sub(a).normalize()); g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); return g; };
  const lathe=(prof,sz,seg)=>{ const g=new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),seg||22); g.scale(1,1,sz); return g; };
  const ell=(rx,ry,rz,ws,hs)=>{ const g=new THREE.SphereGeometry(1,ws||16,hs||12); g.scale(rx,ry,rz); return g; };

  function build(opt){
    opt=opt||{}; const R=opt.rnd||Math.random;
    const role=ROLE[opt.role]||ROLE['ГРУЗЧИК'];
    const root=new THREE.Group(); root.userData.isHuman=true;
    const rig=new THREE.Group(); rig.rotation.y=Math.PI; root.add(rig);      // скелет Mixamo смотрит в −Z, человек — в +Z
    const ch=new THREE.Group(); ch.quaternion.set(-0.70710678,0,0,0.70710678); ch.scale.setScalar(0.01); rig.add(ch);
    const B={};
    MOCAP.B.forEach(([n,p,pos,q])=>{ const b=new THREE.Object3D(); b.name=n; b.position.fromArray(pos); b.quaternion.fromArray(q);
      b.userData.q0=b.quaternion.clone(); B[n]=b; (p?B[p]:ch).add(b); });
    const hips0=B.Hips.position.clone();
    root.updateMatrixWorld(true);
    const J={}; const riw=new THREE.Matrix4().copy(rig.matrixWorld).invert();
    BN.forEach(n=>{ J[n]=new THREE.Vector3().setFromMatrixPosition(B[n].matrixWorld).applyMatrix4(riw); });
    const add=(bn,geo,mat,pos,cast)=>{ const m=new THREE.Mesh(geo,mat); if(pos) m.position.copy(pos); m.castShadow=cast!==false; m.receiveShadow=true;
      rig.add(m); m.updateMatrixWorld(true); B[bn].attach(m); return m; };
    const mid=(a,b,k)=>new THREE.Vector3().lerpVectors(a,b,k===undefined?.5:k);
    const skin=MT.skin[(R()*MT.skin.length)|0], shirt=role.guard?MT.guard:MT.shirt[(R()*MT.shirt.length)|0];
    const pants=role.guard?MT.guard:MT.pants[(R()*MT.pants.length)|0], glove=MT.glove[(R()*MT.glove.length)|0];
    const vest=role.vest?MT[role.vest]:null;
    /* тело, одежда и лицо — реалистичная модель (RPM), см. rpmAttach; здесь только скелет-драйвер */
    /* контактная тень */
    const sh=new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.7),aoMat); sh.rotation.x=-Math.PI/2; sh.position.y=0.022; root.add(sh); root.userData.ao=sh;
    /* сканер в правой руке (по умолчанию скрыт) */
    const sc=new THREE.Group(); {                          // сканер в правой руке (по умолчанию скрыт)
      const b=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.12,0.06),MT.scanner); b.position.set(0,-0.05,0); sc.add(b);
      const hd2=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.05,0.13),MT.scanner); hd2.position.set(0,0.02,-0.04); sc.add(hd2);
      const led=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,0.005),MT.scanLED); led.position.set(0,0.02,-0.107); sc.add(led);
      sc.visible=false; root.add(sc); }
    ch.userData.noExport=true;                               // скелет-драйвер в экспорт не идёт
    const H={root,rig,B,J,hips0,scanner:sc,st:{},seed:R()*10,role:opt.role||'ГРУЗЧИК',prof:role,var:{skin:R(),jacket:R(),pants:R(),beard:R(),vest:R(),h:R()}};
    if(!opt.temp){ ALL.push(H); if(RP.ready) rpmAttach(H); }
    root.traverse(o=>{ if(o.isMesh) o.userData.hum=H; });
    root.userData.H=H;
    pose(H,{t:R()*2});
    return H;
  }

  /*__RPM_CORE__*/
  /* ---- выборка клипа ---- */
  function sampleInto(H,clip,t,w){
    const c=clips[clip], n=c.n, f=(((t/c.d)%1)+1)%1*(n-1), i=Math.floor(f), a=f-i, i2=Math.min(i+1,n-1);
    for(const bn in c.q){ const b=H.B[bn]; if(!b) continue; const q=c.q[bn];
      qa.set(q[i*4],q[i*4+1],q[i*4+2],q[i*4+3]); qb.set(q[i2*4],q[i2*4+1],q[i2*4+2],q[i2*4+3]); qa.slerp(qb,a);
      if(w>=0.999) b.quaternion.copy(qa); else b.quaternion.slerp(qa,w); }
    const hp=c.hp; const hz=hp[i*3+2]+(hp[i2*3+2]-hp[i*3+2])*a;
    return hz;
  }
  /* поворот кости вокруг оси в пространстве персонажа (смотрит −Z; X — поперечная ось) */
  const rq=new THREE.Quaternion(), rigInv=new THREE.Quaternion(), pw=new THREE.Quaternion();
  function rot(H,bn,axis,ang){ if(!ang) return; const b=H.B[bn];
    b.parent.updateWorldMatrix(true,false); H.rig.getWorldQuaternion(rigInv); rigInv.invert();
    b.parent.getWorldQuaternion(pw); pw.premultiply(rigInv);
    rq.setFromAxisAngle(axis,ang); qt.copy(pw).invert().multiply(rq).multiply(pw); b.quaternion.premultiply(qt); }
  /* ---- нейтральная стойка от T-позы: руки вдоль тела, дыхание, перенос веса ---- */
  function neutral(H,t){
    for(const n of BN) H.B[n].quaternion.copy(H.B[n].userData.q0);
    const sd=H.seed, br=Math.sin(t*1.7+sd), sw=Math.sin(t*0.33+sd*2);
    rot(H,'LeftArm',Zv,1.30+0.02*br); rot(H,'RightArm',Zv,-1.30-0.02*br);
    rot(H,'LeftArm',X,0.06); rot(H,'RightArm',X,0.06);
    rot(H,'LeftForeArm',X,0.2); rot(H,'RightForeArm',X,0.22);
    rot(H,'LeftHand',Zv,-0.1); rot(H,'RightHand',Zv,0.1);
    rot(H,'Hips',Zv,0.025*sw); rot(H,'Spine',Zv,-0.03*sw); rot(H,'Spine2',X,0.012*br);
    const kL=0.05+0.05*Math.max(0,sw), kR=0.05+0.05*Math.max(0,-sw);
    rot(H,'LeftUpLeg',X,kL*0.5); rot(H,'LeftLeg',X,-kL); rot(H,'RightUpLeg',X,kR*0.5); rot(H,'RightLeg',X,-kR);
    rot(H,'LeftUpLeg',Zv,-0.03); rot(H,'RightUpLeg',Zv,0.03);
    rot(H,'Head',Y,0.18*Math.sin(t*0.27+sd*3)); rot(H,'Neck',X,0.03);
    H.B.Hips.position.set(H.hips0.x,H.hips0.y,H.hips0.z-0.8-0.4*Math.abs(sw));
    return H.B.Hips.position.z;
  }
  /* рука в заданную позу от T-позы: fwd — вперёд, abd — в сторону, elb — сгиб локтя; k — вес */
  const sA=new THREE.Quaternion(), sF=new THREE.Quaternion(), sH=new THREE.Quaternion();
  function arm(H,L,fwd,abd,elb,k){
    if(k<=0) return; const A=H.B[L+'Arm'], F=H.B[L+'ForeArm'], Hd=H.B[L+'Hand'], sg=L==='Left'?1:-1;
    sA.copy(A.quaternion); sF.copy(F.quaternion); sH.copy(Hd.quaternion);
    A.quaternion.copy(A.userData.q0); F.quaternion.copy(F.userData.q0); Hd.quaternion.copy(Hd.userData.q0);
    rot(H,L+'Arm',Zv,sg*(1.30-abd)); rot(H,L+'Arm',X,fwd); rot(H,L+'ForeArm',X,elb); rot(H,L+'Hand',X,0.15);
    A.quaternion.copy(sA.slerp(A.quaternion,k)); F.quaternion.copy(sF.slerp(F.quaternion,k)); Hd.quaternion.copy(sH.slerp(Hd.quaternion,k));
  }
  /* ---- поза: p = {t, walk, run, phase, carry, push, scan, bend, reach, sit, drive, look} ---- */
  function pose(H,p){
    if(H.knock) p=knockPose(H,p);                             // сбит с ног (удар в обходе): поза падения поверх сценария
    const t=p.t||0, walk=p.walk||0, run=p.run||0;
    let hz=neutral(H,t);
    if(walk>0){ const hw=sampleInto(H,'Walk',p.phase!==undefined?warpPhase(CYC.walk,p.phase)*clips.Walk.d:t,walk); hz=hz+(hw-hz)*walk; }
    if(run>0){ const hr=sampleInto(H,'Run',p.phase!==undefined?warpPhase(CYC.run,p.phase)*clips.Run.d:t,run); hz=hz+(hr-hz)*run; }
    H.B.Hips.position.set(H.hips0.x,H.hips0.y,hz);
    const bend=p.bend||0, carry=p.carry||0, push=p.push||0, scan=p.scan||0, reach=p.reach||0, sit=p.sit||0, drive=p.drive||0;
    if(sit>0){
      H.B.Hips.position.z=H.hips0.z-46*sit;
      for(const L of ['Left','Right']){ rot(H,L+'UpLeg',X,1.5*sit); rot(H,L+'Leg',X,-1.45*sit); rot(H,L+'Foot',X,0.05*sit); }
      rot(H,'Spine',X,-0.04*sit);
    }
    if(bend>0){                                             // наклон: спина + колени
      rot(H,'Spine',X,-0.42*bend); rot(H,'Spine1',X,-0.28*bend); rot(H,'Spine2',X,-0.12*bend);
      for(const L of ['Left','Right']){ rot(H,L+'UpLeg',X,0.5*bend); rot(H,L+'Leg',X,-0.9*bend); rot(H,L+'Foot',X,0.38*bend); }
      H.B.Hips.position.z-=13*bend;
      rot(H,'Neck',X,0.3*bend); rot(H,'Head',X,0.2*bend);
    }
    const squat=p.squat||0, twist=p.twist||0;
    if(squat>0){                                            // присед: колени, таз вниз, спина почти прямая
      for(const L of ['Left','Right']){ rot(H,L+'UpLeg',X,1.25*squat); rot(H,L+'Leg',X,-2.1*squat); rot(H,L+'Foot',X,0.85*squat); }
      rot(H,'Spine',X,-0.22*squat); H.B.Hips.position.z-=40*squat; }
    if(twist){ rot(H,'Spine',Y,twist*0.3); rot(H,'Spine1',Y,twist*0.3); rot(H,'Spine2',Y,twist*0.25); rot(H,'Neck',Y,twist*0.12); }
    const heavy=p.heavy||0;                                  // тяжёлый короб: корпус отклонён назад, колени подсогнуты
    if(heavy>0){ rot(H,'Spine',X,0.10*heavy); rot(H,'Spine1',X,0.06*heavy);
      for(const L of ['Left','Right']){ rot(H,L+'UpLeg',X,0.16*heavy); rot(H,L+'Leg',X,-0.3*heavy); rot(H,L+'Foot',X,0.14*heavy); }
      H.B.Hips.position.z-=3.5*heavy; }
    const cw=Math.max(0,(p.cw||0.4)-0.4);                    // ширина короба — руки шире
    for(const L of ['Left','Right']){
      arm(H,L,0.30-0.10*heavy,0.22+cw*1.1,1.28-cw*0.8-0.22*heavy,carry);   // несёт короб перед собой (тяжёлый — ниже, на выпрямленных руках)
      arm(H,L,0.55,0.04,0.55,push);                         // держит ручку рохли
      arm(H,L,1.0,0.06,0.22,reach);                        // тянется к коробу
      arm(H,L,0.75,0.05,1.0,drive);                        // руль погрузчика
    }
    if(scan>0) arm(H,'Right',1.05,-0.1,1.05,scan);
    if(p.look){ rot(H,'Neck',Y,p.look*0.5); rot(H,'Head',Y,p.look*0.5); }
    gestures(H,p,t);
    H.scanner.visible=!!p.scanner;
    H.st=p;
    if(H.post) H.post(H,p);                                   // донастройка позы (ИК: руки на руле, ноги на педалях)
    if(H.knock) knockRoot(H);
    if(H.rb) rpmSync(H);
  }
  /* ---- удар или толчок (режим обхода): человек отшатывается, падает на спину, лежит и поднимается; на это время сценарий
     его не ведёт (стоит там, где упал), потом за полсекунды возвращается на свой маршрут. Время — реальное, не процесса. ---- */
  const _kq=new THREE.Quaternion(), _kv=new THREE.Vector3(), c01k=v=>Math.max(0,Math.min(1,v)), ezk=u=>{ u=c01k(u); return u*u*u*(u*(u*6-15)+10); };
  const wrapK=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const KF=0.5, KL=1.7, KR=1.3, KB=0.45;                       // падает, лежит, встаёт, возвращается на маршрут (с)
  function knock(H,dx,dz){ if(H.knock) return false; const r=H.root; _kv.set(dx,0,dz);
    if(r.parent){ r.parent.getWorldQuaternion(_kq); _kv.applyQuaternion(_kq.invert()); }                 // направление толчка — в системе родителя (человек может стоять в кузове)
    H.knock={t0:API.now(),dx:_kv.x,dz:_kv.z,p:[r.position.x,r.position.z,r.rotation.y],y0:r.position.y}; return true; }
  function knockPose(H,p){ const K=H.knock, u=API.now()-K.t0; if(u>=KF+KL+KR+KB){ H.knock=null; H.root.rotation.x=0; H.root.position.y=K.y0; return p; }
    const e=u<KF?ezk(u/KF):u<KF+KL?1:1-ezk((u-KF-KL)/KR); K.e=e; K.u=u;
    return Object.assign({},p,{walk:(p.walk||0)*(1-e),run:0,bend:Math.max(p.bend||0,0.3*e),squat:Math.max(p.squat||0,0.5*e),reach:(p.reach||0)*(1-e),scan:0,lookAt:null,talk:0,phone:0,tablet:0}); }
  function knockRoot(H){ const K=H.knock; if(!K||K.e===undefined) return; const r=H.root, u=K.u, e=K.e, bl=u<KF+KL+KR?0:ezk((u-KF-KL-KR)/KB);
    const push=0.6*ezk(c01k(u/0.45)), x=K.p[0]+K.dx*push, z=K.p[1]+K.dz*push;
    r.position.x+=(x-r.position.x)*(1-bl); r.position.z+=(z-r.position.z)*(1-bl); r.rotation.y+=wrapK(K.p[2]-r.rotation.y)*(1-bl);
    r.rotation.x=-1.42*e; r.position.y=K.y0+0.10*e; }
  /* ---- жесты и занятия в покое (ИК рук по точкам относительно тела): руки на поясе, скрещены, за спиной, разговор с жестами,
     планшет в руках, телефон у уха; голова поворачивается к цели (едущий погрузчик рядом). Вес 0…1 — плавный переход. ---- */
  const _g={o:new THREE.Vector3(),f:new THREE.Vector3(),l:new THREE.Vector3(),u:new THREE.Vector3(0,1,0),hp:new THREE.Vector3(),sp:new THREE.Vector3(),
    hd:new THREE.Vector3(),cur:new THREE.Vector3(),T:new THREE.Vector3(),P:new THREE.Vector3(),q:new THREE.Quaternion(),tmp:new THREE.Vector3()};
  const API={attn:null,lookSign:1,now:()=>performance.now()/1000};   // HUM ещё не определён, пока строится модуль: свои ссылки; now — часы для ударов (в проверках подменяются)
  const PROP={tab:std(0x1b1e22,.4,.3), scr:std(0x9fd2ff,.2,0,{emissive:0x3d7fc0,emissiveIntensity:1.2}), ph:std(0x16181b,.3,.4)};
  function propOf(H,k){ H.props=H.props||{}; if(H.props[k]) return H.props[k]; const g=new THREE.Group();
    if(k==='tab'){ g.add(new THREE.Mesh(new THREE.BoxGeometry(0.26,0.012,0.18),PROP.tab)); const sc=new THREE.Mesh(new THREE.BoxGeometry(0.235,0.002,0.155),PROP.scr); sc.position.y=0.007; g.add(sc); }
    else { const m=new THREE.Mesh(new THREE.BoxGeometry(0.075,0.15,0.012),PROP.ph); g.add(m); }
    g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); H.root.add(g); H.props[k]=g; return g; }
  function armTo(H,L,k,tx,pole){ if(k<=0.001) return; const hand=H.B[L+'Hand']; hand.getWorldPosition(_g.cur);
    _g.T.copy(_g.cur).lerp(tx,Math.min(1,k)); ik2(H,L+'Arm',L+'ForeArm',L+'Hand',_g.T,pole); }
  function gestures(H,p,t){
    const ak=p.akimbo||0, cr=p.cross||0, bh=p.behind||0, tk=p.talk||0, tb=p.tablet||0, ph=p.phone||0, pn=p.punch||0;
    const anyArm=ak+cr+bh+tk+tb+ph+pn>0.001;
    let lookW=null;
    if(!anyArm&&!p.lookAt&&!API.attn){ if(H.props) for(const k in H.props) H.props[k].visible=false; return; }
    H.root.updateMatrixWorld(true); H.B.Hips.updateWorldMatrix(true,true);
    H.root.getWorldQuaternion(_g.q); _g.f.set(0,0,1).applyQuaternion(_g.q); _g.l.set(1,0,0).applyQuaternion(_g.q);   // вперёд и влево (человек смотрит в +Z)
    H.B.Hips.getWorldPosition(_g.hp); H.B.Spine2.getWorldPosition(_g.sp); H.B.Head.getWorldPosition(_g.hd);
    const at=(base,dl,du,df,out)=>(out||_g.P).copy(base).addScaledVector(_g.l,dl).addScaledVector(_g.u,du).addScaledVector(_g.f,df);
    const sd={Left:1,Right:-1};
    if(ak>0) for(const L of ['Left','Right']){ const s=sd[L]; armTo(H,L,ak,at(_g.hp,0.19*s,0.07,0.01,_g.tmp).clone(),at(_g.hp,0.6*s,0.3,-0.3)); }
    if(bh>0) for(const L of ['Left','Right']){ const s=sd[L]; armTo(H,L,bh,at(_g.hp,0.07*s,0.03,-0.2,_g.tmp).clone(),at(_g.hp,0.45*s,0.15,-0.45)); }
    if(cr>0) for(const L of ['Left','Right']){ const s=sd[L];                   // руки сцеплены спереди (ждёт)
      armTo(H,L,cr,at(_g.hp,0.035*s,0.1,0.17,_g.tmp).clone(),at(_g.hp,0.5*s,0.35,-0.15)); }
    if(tk>0){ const a=Math.sin(t*1.9+H.seed), b=Math.sin(t*2.7+H.seed*2), c=Math.sin(t*1.3+H.seed*3);
      armTo(H,'Right',tk,at(_g.sp,-0.16+0.07*a,-0.2+0.07*b,0.33+0.05*c,_g.tmp).clone(),at(_g.sp,-0.6,-0.45,0.0));
      armTo(H,'Left',tk*0.55,at(_g.sp,0.17,-0.3+0.04*c,0.27,_g.tmp).clone(),at(_g.sp,0.6,-0.45,0.0));
      rot(H,'Neck',X,0.05*Math.sin(t*2.2+H.seed)*tk); rot(H,'Head',Y,0.12*Math.sin(t*0.7+H.seed)*tk); }
    if(tb>0){ for(const L of ['Left','Right']){ const s=sd[L]; armTo(H,L,tb,at(_g.sp,0.12*s,-0.12,0.29,_g.tmp).clone(),at(_g.sp,0.55*s,-0.5,0.0)); }
      rot(H,'Neck',X,-0.3*tb); rot(H,'Head',X,-0.16*tb); }                     // смотрит в планшет
    if(ph>0){ armTo(H,'Right',ph,at(_g.hd,-0.085,0.07,0.03,_g.tmp).clone(),at(_g.sp,-0.5,-0.4,-0.1)); rot(H,'Head',Zv,0.12*ph); }
    if(pn>0){ armTo(H,'Right',pn,at(_g.sp,-0.12,0.06,0.66,_g.tmp).clone(),at(_g.sp,-0.55,-0.1,0.2)); rot(H,'Spine2',Y,-0.35*pn); rot(H,'Spine1',Y,-0.15*pn); }   // удар правой (обход от третьего лица)
    /* реквизит: планшет между ладонями, телефон в правой руке */
    const tab=tb>0.5?propOf(H,'tab'):(H.props&&H.props.tab), phn=ph>0.5?propOf(H,'ph'):(H.props&&H.props.ph);
    if(tab){ tab.visible=tb>0.5; if(tab.visible){ H.B.LeftHand.getWorldPosition(_g.T); H.B.RightHand.getWorldPosition(_g.cur); _g.T.add(_g.cur).multiplyScalar(0.5).addScaledVector(_g.f,0.04).addScaledVector(_g.u,0.03);
      tab.position.copy(H.root.worldToLocal(_g.T)); tab.rotation.set(0.75,0,0); } }
    if(phn){ phn.visible=ph>0.5; if(phn.visible){ H.B.RightHand.getWorldPosition(_g.T); _g.T.addScaledVector(_g.u,0.06).addScaledVector(_g.l,0.02); phn.position.copy(H.root.worldToLocal(_g.T)); phn.rotation.set(0,0.3,0.2); } }
    /* взгляд: явная цель или «внимание» (едущий погрузчик рядом) — голова и шея поворачиваются, не больше ±70° */
    const L=p.lookAt||(API.attn&&!(p.walk>0.3)&&!p.carry&&!p.sit&&!p.drive?API.attn(H):null);
    if(L){ _g.tmp.copy(L).sub(_g.hd); const lx=_g.tmp.dot(_g.l), lz=_g.tmp.dot(_g.f), ly=_g.tmp.y, hz=Math.hypot(lx,lz);
      if(hz>0.3){ const yaw=Math.max(-1.2,Math.min(1.2,Math.atan2(lx,lz))), pit=Math.max(-0.4,Math.min(0.3,Math.atan2(ly,hz)));
        const w=p.lookW!==undefined?p.lookW:1; rot(H,'Neck',Y,API.lookSign*yaw*0.45*w); rot(H,'Head',Y,API.lookSign*yaw*0.45*w); rot(H,'Head',X,pit*0.6*w); if(Math.abs(yaw)>0.8) rot(H,'Spine2',Y,API.lookSign*(Math.abs(yaw)-0.8)*Math.sign(yaw)*0.6*w); } }
  }

  /* двухзвенная ИК в мировых координатах: A→B→C (плечо–локоть–кисть, бедро–колено–стопа).
     T — куда поставить C; pole — точка, в сторону которой сгибается средний сустав; endQ — мировой поворот C (необязательно) */
  const _ia=new THREE.Vector3(), _ib=new THREE.Vector3(), _ic=new THREE.Vector3(), _iu=new THREE.Vector3(), _iw=new THREE.Vector3(), _ix=new THREE.Vector3(),
        _ip=new THREE.Vector3(), _ipq=new THREE.Quaternion(), _irq=new THREE.Quaternion(), _iwq=new THREE.Quaternion();
  function rotW(b,axis,ang){ if(!ang||!isFinite(ang)) return; b.parent.getWorldQuaternion(_ipq); _irq.setFromAxisAngle(axis,ang);
    b.getWorldQuaternion(_iwq); _iwq.premultiply(_irq); b.quaternion.copy(_ipq.invert().multiply(_iwq)); b.updateMatrixWorld(true); }
  function ik2(H,A,B,C,T,pole,endQ){
    const a=H.B[A], b=H.B[B], c=H.B[C]; if(!a||!b||!c) return 0; a.updateWorldMatrix(true,true);
    a.getWorldPosition(_ia); b.getWorldPosition(_ib); c.getWorldPosition(_ic);
    const L1=_ia.distanceTo(_ib), L2=_ib.distanceTo(_ic), d0=_ia.distanceTo(T), d=Math.min(L1+L2-1e-4,Math.max(Math.abs(L1-L2)+1e-4,d0));
    const th=Math.acos(Math.max(-1,Math.min(1,(L1*L1+L2*L2-d*d)/(2*L1*L2))));
    _iu.subVectors(_ia,_ib); _iw.subVectors(_ic,_ib); _ix.crossVectors(_iu,_iw);
    if(_ix.lengthSq()<1e-12&&pole){ _ip.subVectors(pole,_ia); _ix.crossVectors(_iw,_ip); }
    if(_ix.lengthSq()>1e-12){ _ix.normalize(); rotW(b,_ix,th-_iu.angleTo(_iw)); }
    c.getWorldPosition(_ic); _iu.subVectors(_ic,_ia); _iw.subVectors(T,_ia); _ix.crossVectors(_iu,_iw);
    if(_ix.lengthSq()>1e-12){ _ix.normalize(); rotW(a,_ix,_iu.angleTo(_iw)); }
    if(pole){ const ax=_iw.normalize(); b.getWorldPosition(_ib); _iu.subVectors(_ib,_ia); _iu.addScaledVector(ax,-_iu.dot(ax));
      _ip.subVectors(pole,_ia); _ip.addScaledVector(ax,-_ip.dot(ax));
      if(_iu.lengthSq()>1e-8&&_ip.lengthSq()>1e-8){ _ix.crossVectors(_iu,_ip); rotW(a,ax,Math.atan2(_ix.dot(ax),_iu.dot(_ip))); } }
    if(endQ){ c.parent.getWorldQuaternion(_ipq); c.quaternion.copy(_ipq.invert().multiply(endQ)); c.updateMatrixWorld(true); }
    return d0/(L1+L2);                                         // >1 — цель вне досягаемости
  }
  /* длина цикла шага и «развёртка» фазы по ходу опорной стопы: в клипе таз движется вперёд неравномерно (в клипе это вырезано),
     поэтому при равномерном ходе стопа скользила бы. Фаза берётся так, чтобы опорная стопа отходила назад ровно со скоростью тела —
     стопа стоит на полу. */
  function cycleLen(clip){
    const H=build({rnd:()=>0.5,temp:true}); const c=clips[clip], n=120;
    const f=new THREE.Vector3(), pts=[];
    for(let i=0;i<=n;i++){ const t=i/n*c.d; H.B.Hips.position.set(H.hips0.x,H.hips0.y,sampleInto(H,clip,t,1)); H.root.updateMatrixWorld(true);
      const r=[]; for(const L of ['Left','Right']){ H.B[L+'Foot'].getWorldPosition(f); r.push([f.y,f.z]); } pts.push(r); }
    const ymin=[0,1].map(k=>Math.min(...pts.map(p=>p[k][0])));
    const on=(i,k)=>pts[i][k][0]<ymin[k]+0.022;
    const s=[0]; let fall=0;
    for(let i=1;i<=n;i++){ let d=0,m=0; for(const k of [0,1]) if(on(i,k)&&on(i-1,k)){ d+=Math.abs(pts[i][k][1]-pts[i-1][k][1]); m++; }
      if(!m){ fall++; d=null; } else d/=m; s.push(d); }
    const avg=s.slice(1).filter(v=>v!==null).reduce((a,b)=>a+b,0)/Math.max(1,s.slice(1).filter(v=>v!==null).length);
    const cum=[0]; for(let i=1;i<=n;i++) cum.push(cum[i-1]+(s[i]===null?avg:s[i]));
    const S=cum[n]; const warp=cum.map(v=>v/S);                    // доля пройденного шага → доля цикла (монотонно)
    return {speed:S/c.d,len:S,warp,n,flight:fall};
  }
  function warpPhase(cyc,ph){ const u=((ph%1)+1)%1, w=cyc.warp; if(!w) return u; let lo=0,hi=w.length-1;
    while(hi-lo>1){ const m=(lo+hi)>>1; if(w[m]<=u) lo=m; else hi=m; } const a=w[lo],b=w[hi]; return (lo+(b>a?(u-a)/(b-a):0))/(w.length-1); }
  /* «Пружинящий» шаг клипа Mixamo: таз проседает на 8–9 см, колено опорной ноги согнуто до ~48°, человек идёт как на
     полусогнутых. Поправка один раз при загрузке: таз поднимается (просадка уменьшается вдвое), а ноги заново решаются
     двухзвенной ИК так, что стопы остаются ровно там же, где были в клипе (опора и перенос не меняются, стопа не скользит),
     колено сохраняет свою плоскость, ориентация стопы в мире — прежняя. */
  function fixGait(clip,k){
    const c=clips[clip]; if(!c||c.fixed) return null; const n=c.n, hp=c.hp;
    const H=build({rnd:()=>0.5,temp:true}); const legs=['Left','Right'].map(L=>({A:H.B[L+'UpLeg'],B:H.B[L+'Leg'],C:H.B[L+'Foot']}));
    if(legs.some(g=>!c.q[g.A.name]||!c.q[g.B.name]||!c.q[g.C.name])) return null;
    const P=new THREE.Vector3(), Q=new THREE.Quaternion(), wp=b=>b.getWorldPosition(new THREE.Vector3());
    const setF=i=>{ for(const bn in c.q){ const b=H.B[bn]; if(!b) continue; const q=c.q[bn]; b.quaternion.set(q[i*4],q[i*4+1],q[i*4+2],q[i*4+3]); } };
    const sc=new THREE.Vector3(); const cm=(()=>{ H.root.updateMatrixWorld(true); H.B.Hips.parent.getWorldScale(sc); return sc.x; })();  // 1 см клипа в метрах
    const zs=[]; for(let i=0;i<n;i++) zs.push(hp[i*3+2]); const zmax=Math.max(...zs);
    /* исходные стопы (цели) и допустимый подъём таза в каждом кадре */
    const tgt=[], rmax=[];
    for(let i=0;i<n;i++){ setF(i); H.B.Hips.position.set(H.hips0.x,H.hips0.y,zs[i]); H.root.updateMatrixWorld(true);
      const f=legs.map(g=>({a:wp(g.A),b:wp(g.B),c:wp(g.C),q:g.C.getWorldQuaternion(new THREE.Quaternion())})); tgt.push(f);
      let rm=Infinity; for(const x of f){ const L1=x.a.distanceTo(x.b), L2=x.b.distanceTo(x.c), reach=Math.sqrt(L1*L1+L2*L2+2*L1*L2*Math.cos(0.17));
        const dx=x.c.x-x.a.x, dz=x.c.z-x.a.z, dy=x.c.y-x.a.y, h2=reach*reach-dx*dx-dz*dz; const up=h2>0?(-dy-Math.sqrt(h2)):0;   // a.y+up−c.y ≤ √h2
        rm=Math.min(rm,Math.max(0,-up)/cm); }
      rmax.push(rm); }
    let r=zs.map((z,i)=>Math.min(k*(zmax-z),rmax[i]));
    for(let it=0;it<3;it++){ r=r.map((v,i)=>Math.min(rmax[i],(r[(i-1+n)%n]+2*v+r[(i+1)%n])/4)); }        // сглаживание по кругу
    const ax=new THREE.Vector3(), u=new THREE.Vector3(), v=new THREE.Vector3(), pq=new THREE.Quaternion();
    const rotWorld=(b,axis,ang)=>{ if(!ang||!isFinite(ang)) return; b.parent.getWorldQuaternion(pq); Q.setFromAxisAngle(axis,ang);
      b.getWorldQuaternion(qt); qt.premultiply(Q); b.quaternion.copy(pq.invert().multiply(qt)); b.updateMatrixWorld(true); };
    for(let i=0;i<n;i++){ setF(i); H.B.Hips.position.set(H.hips0.x,H.hips0.y,zs[i]+r[i]); H.root.updateMatrixWorld(true);
      legs.forEach((g,li)=>{ const T=tgt[i][li];
        const a=wp(g.A), b=wp(g.B), cc=wp(g.C), L1=a.distanceTo(b), L2=b.distanceTo(cc);
        const d=Math.min(L1+L2-1e-4,Math.max(Math.abs(L1-L2)+1e-4,a.distanceTo(T.c)));
        const th=Math.acos(Math.max(-1,Math.min(1,(L1*L1+L2*L2-d*d)/(2*L1*L2))));
        u.copy(a).sub(b); v.copy(cc).sub(b); const phi=u.angleTo(v); ax.crossVectors(u,v);
        if(ax.lengthSq()>1e-12){ ax.normalize(); rotWorld(g.B,ax,th-phi); }
        const c2=wp(g.C); u.copy(c2).sub(a); v.copy(T.c).sub(a); ax.crossVectors(u,v);
        if(ax.lengthSq()>1e-12){ ax.normalize(); rotWorld(g.A,ax,u.angleTo(v)); }
        g.C.parent.getWorldQuaternion(pq); g.C.quaternion.copy(pq.invert().multiply(T.q)); g.C.updateMatrixWorld(true);
        for(const bb of [g.A,g.B,g.C]){ const q=c.q[bb.name]; q[i*4]=bb.quaternion.x; q[i*4+1]=bb.quaternion.y; q[i*4+2]=bb.quaternion.z; q[i*4+3]=bb.quaternion.w; }
      });
      hp[i*3+2]=zs[i]+r[i]; }
    c.fixed=true;
    return {zmax,raise:[Math.min(...r),Math.max(...r)].map(x=>+x.toFixed(1))};
  }
  let GAIT=null; try{ GAIT=fixGait('Walk',0.55); }catch(e){ GAIT={err:e.message}; }
  const CYC={walk:{speed:1.35,len:1.4},run:{speed:3.2,len:2.2},gait:GAIT};
  try{ CYC.walk=cycleLen('Walk'); CYC.run=cycleLen('Run'); CYC.gait=GAIT; }catch(e){}
  return Object.assign(API,{build,pose,rot,ik2,rotW,knock,sync:H=>{ if(H.rb) rpmSync(H); },MT,CYC,ROLE,ALL,RP,onReady:f=>{ if(RP.ready) f(); else RP.cb.push(f); }});
})();
var HUM_MT;
