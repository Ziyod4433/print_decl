/* ============================================================== ЭЛЕКТРОПОГРУЗЧИК 3 т (Li-ion), по образцу современных
   противовесных машин: литой скруглённый противовес, капот АКБ с сиденьем на подвеске, приборная стойка между передними
   колёсами, крыша из профильной трубы с продольными планками, двухсекционная мачта (швеллеры, два боковых и центральный
   цилиндр подъёма, цепи на звёздочках), каретка ISO с вилами переменного сечения. Управление: руль с «лентяйкой» (левая рука),
   джойстики гидравлики на правом подлокотнике, педали хода и тормоза. Водитель сидит на сиденье (а не в капоте): руки и ноги
   ставятся двухзвенной ИК на органы управления, при движении назад он поворачивается и смотрит через правое плечо.
   API для фильма не меняется: fkSet(fk,lift,roll,steer,tilt), rig {wheels, steer, carriage, inner, mast, blueF, blueB, driver, lift, cb, ib}. */
function forklift(x,z,rot,opt){
  opt=opt||{};
  const g=grp(x,0,z); g.rotation.y=rot||0; g.userData.nm='Электропогрузчик 3 т';
  const OR=M.fkOrange, GR=M.fkGrey, BK=M.dark;
  const FKM=forklift.mat||(forklift.mat={
    cw:std(0x30353b,.5,.45,{envMapIntensity:.9}), tube:std(0x1c1f23,.45,.35,{envMapIntensity:.8}), seat:std(0x161719,.82,0),
    seam:std(0x0d0e10,.9,0), chrome:std(0xdfe4e8,.12,1,{envMapIntensity:1.4}), rail:std(0x5b636b,.42,.75), fork:std(0x2b2e32,.5,.6),
    lens:std(0xf4f6f8,.08,.1,{emissive:0xfff3d6,emissiveIntensity:.9,envMapIntensity:1.5}), tail:std(0xc8261d,.2,.1,{emissive:0x9a0e0e,emissiveIntensity:.6}),
    rev:std(0xe8eaec,.15,.1,{envMapIntensity:1.2}), screen:std(0x0e141a,.25,.2,{emissive:0x3a86c8,emissiveIntensity:.7}),
    grip:std(0x101112,.95,0), knob:std(0xcfd3d6,.3,.1), led:std(0x2a6bff,.3,0,{emissive:0x2a6bff,emissiveIntensity:1.4}) });
  const R={wheels:[],steer:[],lift:0,drv:{back:0}};
  g.userData.rig=R;
  ao(1.7,3.3,0,0.15,g);
  const V3=(a,b,c)=>new THREE.Vector3(a,b,c);
  const rod=(a,b,r,mat,par,seg)=>{ const d=b.clone().sub(a),L=d.length();
    const m=mesh(new THREE.CylinderGeometry(r,r,L,seg||12),mat,0,0,0,par||g);
    m.position.copy(a).addScaledVector(d,0.5); m.quaternion.setFromUnitVectors(V3(0,1,0),d.normalize()); return m; };
  /* профиль в плоскости (z,y), выдавленный поперёк машины на ширину w с центром в x */
  const inset=(sh,d)=>{ const raw=sh.getPoints(10), pts=[]; raw.forEach(p=>{ if(!pts.length||pts[pts.length-1].distanceTo(p)>1e-4) pts.push(p); });
    if(pts.length>2&&pts[0].distanceTo(pts[pts.length-1])<1e-4) pts.pop();
    const cw=THREE.ShapeUtils.isClockWise(pts), n=pts.length, out=[], e0=new THREE.Vector2(), e1=new THREE.Vector2(), m=new THREE.Vector2();
    for(let i=0;i<n;i++){ const a=pts[(i-1+n)%n], p=pts[i], b=pts[(i+1)%n];
      e0.set(p.x-a.x,p.y-a.y).normalize(); e1.set(b.x-p.x,b.y-p.y).normalize();
      const n0x=cw?e0.y:-e0.y, n0y=cw?-e0.x:e0.x, n1x=cw?e1.y:-e1.y, n1y=cw?-e1.x:e1.x;
      m.set(n0x+n1x,n0y+n1y); const l=m.length(); if(l<1e-6) m.set(n0x,n0y); else m.divideScalar(l);
      const cs=Math.max(0.4,m.x*n0x+m.y*n0y); out.push(new THREE.Vector2(p.x+m.x*d/cs,p.y+m.y*d/cs)); }
    return new THREE.Shape(out); };
  const side=(sh,w,mat,x0,par,bev)=>{ bev=bev||0; if(bev>0) sh=inset(sh,bev);
    const geo=new THREE.ExtrudeGeometry(sh,{depth:w-2*bev,bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:3,curveSegments:14});
    geo.rotateY(-Math.PI/2); geo.translate((w-2*bev)/2,0,0); return mesh(geo,mat,x0||0,0,0,par||g); };
  /* профильная труба со скруглёнными углами от a до b */
  const tube=(a,b,w,d,mat,par)=>{ const dv=b.clone().sub(a), L=dv.length();
    const geo=new THREE.ExtrudeGeometry(rrect(w,d,Math.min(w,d)*0.32),{depth:L,bevelEnabled:false,curveSegments:3});
    const m=mesh(geo,mat,a.x,a.y,a.z,par||g); m.quaternion.setFromUnitVectors(V3(0,0,1),dv.normalize()); return m; };
  /* швеллер стойки мачты: стенка снаружи (dir), полки спереди и сзади */
  const chan=(w,d,t,h,dir,mat,x0,y0,z0,par)=>{ const s=new THREE.Shape(), hw=w/2, hd=d/2, k=dir;
    s.moveTo(k*hw,-hd); s.lineTo(k*hw,hd); s.lineTo(-k*hw,hd); s.lineTo(-k*hw,hd-t); s.lineTo(k*(hw-t),hd-t); s.lineTo(k*(hw-t),-hd+t); s.lineTo(-k*hw,-hd+t); s.lineTo(-k*hw,-hd); s.closePath();
    const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false}); geo.rotateX(-Math.PI/2);
    return mesh(geo,mat,x0,y0,z0,par||g); };

  /* ---------- кузов: противовес (литьё, тёмно-серый) и корпус с капотом АКБ (оранжевый) ---------- */
  const AC=[-0.92,0.27], AR=0.335;                                       // арка заднего (управляемого) колеса
  const aB=Math.atan2(0.14-AC[1],Math.sqrt(AR*AR-(0.14-AC[1])**2)), aJ=Math.atan2(Math.sqrt(AR*AR-(-0.80-AC[0])**2),-0.80-AC[0]);
  { const s=new THREE.Shape(); s.moveTo(-0.80,AC[1]+AR*Math.sin(aJ)); s.absarc(AC[0],AC[1],AR,aJ,Math.PI-aB,false);
    s.lineTo(-1.37,0.14); s.quadraticCurveTo(-1.445,0.14,-1.452,0.27); s.quadraticCurveTo(-1.478,0.62,-1.442,0.90);
    s.quadraticCurveTo(-1.41,1.075,-1.25,1.082); s.lineTo(-1.02,1.082); s.quadraticCurveTo(-0.90,1.08,-0.865,0.99); s.lineTo(-0.80,0.925); s.closePath();
    side(s,1.17,FKM.cw,0,g,0.035); }
  { const s=new THREE.Shape(); s.moveTo(0.13,0.14); s.lineTo(AC[0]+AR*Math.cos(aB),0.14); s.absarc(AC[0],AC[1],AR,aB,aJ,false);
    s.lineTo(-0.80,0.925); s.quadraticCurveTo(-0.40,0.947,0.02,0.927); s.quadraticCurveTo(0.13,0.925,0.137,0.80); s.closePath();
    side(s,1.16,OR,0,g,0.03); }
  /* передняя рама между колёсами и приборная стойка */
  { const s=new THREE.Shape(); s.moveTo(0.10,0.15); s.lineTo(0.95,0.15); s.lineTo(0.962,0.50); s.quadraticCurveTo(0.962,0.60,0.895,0.62);
    s.lineTo(0.86,0.96); s.quadraticCurveTo(0.845,1.062,0.73,1.066); s.lineTo(0.66,1.062); s.quadraticCurveTo(0.60,1.055,0.592,0.985);
    s.lineTo(0.548,0.62); s.lineTo(0.10,0.60); s.closePath(); side(s,0.84,OR,0,g,0.025); }
  box(0.80,0.012,0.40,M.fkMat,0,0.596,0.335,g).castShadow=false;                     // резиновый коврик пола
  /* швы капота и сервисных лючков, решётка вентиляции */
  for(const sd of [-1,1]){ box(0.004,0.012,0.92,FKM.seam,sd*0.582,0.80,-0.35,g).castShadow=false;
    box(0.004,0.30,0.012,FKM.seam,sd*0.582,0.64,-0.79,g).castShadow=false;
    for(let i=0;i<5;i++) box(0.004,0.012,0.16,FKM.seam,sd*0.5885,0.36+i*0.035,-1.18,g).castShadow=false; }
  box(1.0,0.006,0.012,FKM.seam,0,0.93,0.04,g).castShadow=false;
  /* мост ведущих колёс */
  rod(V3(-0.50,0.38,0.62),V3(0.50,0.38,0.62),0.11,M.steelDark);
  for(const sd of [-1,1]) cyl(0.16,0.10,M.steelDark,sd*0.38,0.38,0.62,g,16).rotation.z=Math.PI/2;
  /* крылья передних колёс с подножкой */
  for(const sd of [-1,1]){
    const s=new THREE.Shape(), rO=0.455, rI=0.44, a0=0.38, a1=2.62; s.absarc(0.62,0.38,rO,a0,a1,false); s.absarc(0.62,0.38,rI,a1,a0,true); s.closePath();
    side(s,0.27,BK,sd*0.585,g);
    const st=box(0.17,0.025,0.11,M.galv,sd*0.505,0.385,0.19,g); for(let i=0;i<3;i++) box(0.16,0.006,0.012,BK,sd*0.505,0.4,0.15+i*0.04,g).castShadow=false; }
  /* педали: ход (справа), тормоз */
  { const p1=box(0.09,0.02,0.20,BK,-0.13,0.635,0.42,g); p1.rotation.x=-0.42; const p2=box(0.11,0.02,0.09,BK,0.04,0.66,0.44,g); p2.rotation.x=-0.3; }
  /* сзади: фонари в нишах противовеса, номер, буксирное окно, шильдик, светоотражатели */
  for(const sd of [-1,1]){ rbox(0.20,0.13,0.05,0.02,FKM.seam,sd*0.41,0.90,-1.432,g);
    box(0.12,0.08,0.02,FKM.tail,sd*0.43,0.91,-1.455,g).castShadow=false; box(0.05,0.08,0.02,M.amber,sd*0.335,0.91,-1.455,g).castShadow=false;
    box(0.13,0.018,0.012,M.reflect,sd*0.41,0.83,-1.452,g).castShadow=false; }
  box(0.08,0.06,0.02,FKM.rev,0,0.91,-1.455,g).castShadow=false;
  rbox(0.26,0.16,0.08,0.03,FKM.seam,0,0.40,-1.43,g); cyl(0.04,0.15,M.steelDark,0,0.40,-1.40,g,12);
  box(0.95,0.09,0.012,M.hazard,0,0.62,-1.462,g).castShadow=false;
  box(0.18,0.06,0.006,M.white,0.30,0.73,-1.461,g).castShadow=false;
  /* ---------- сиденье на подвеске, подлокотник с джойстиками, руль на наклонной колонке, дисплей ---------- */
  const SZ=-0.30;
  rbox(0.40,0.04,0.36,0.015,FKM.seam,0,0.945,SZ,g);
  for(let i=0;i<3;i++) rbox(0.42,0.012,0.38,0.006,FKM.seat,0,0.932+i*0.012,SZ,g).castShadow=false;     // гофр подвески
  rbox(0.48,0.075,0.46,0.035,FKM.seat,0,1.005,SZ,g);                                                     // подушка (верх 1,045)
  for(const sd of [-1,1]){ const b=rbox(0.07,0.09,0.40,0.03,FKM.seat,sd*0.225,1.04,SZ+0.01,g); b.rotation.z=-sd*0.25; }
  { const bk=grp(0,1.04,-0.505,g); bk.rotation.x=-0.13;
    rbox(0.47,0.58,0.09,0.07,FKM.seat,0,0.29,0,bk); for(const sd of [-1,1]){ const w=rbox(0.08,0.42,0.12,0.03,FKM.seat,sd*0.225,0.24,0.02,bk); w.rotation.y=sd*0.35; }
    rbox(0.28,0.12,0.08,0.04,FKM.seat,0,0.65,-0.01,bk); for(const sd of [-1,1]) rod(V3(sd*0.08,0.56,-0.01),V3(sd*0.08,0.60,-0.01),0.008,FKM.chrome,bk,6);
    box(0.012,0.30,0.035,M.fkOrange,0.17,0.25,0.05,bk).castShadow=false; }                               // ремень безопасности
  /* правый подлокотник (джойстики гидравлики под пальцами) */
  { const AX=-0.30; rod(V3(AX,0.96,SZ-0.10),V3(AX,1.15,SZ-0.10),0.018,FKM.tube);
    rbox(0.085,0.055,0.34,0.025,FKM.seat,AX,1.175,SZ-0.06,g);
    rbox(0.11,0.06,0.13,0.02,FKM.tube,AX,1.19,SZ+0.17,g);
    for(let i=0;i<4;i++){ const lx=AX+0.035-i*0.023; rod(V3(lx,1.22,SZ+0.18),V3(lx,1.255,SZ+0.19),0.005,FKM.chrome,g,6);
      mesh(new THREE.SphereGeometry(0.011,8,6),i===0?M.red:FKM.grip,lx,1.258,SZ+0.192,g); } }
  /* колонка, руль с «лентяйкой», ступица с гудком */
  const SWC=V3(0,1.36,0.10), COLB=V3(0,0.90,0.555), cdir=SWC.clone().sub(COLB).normalize();
  rod(COLB,SWC.clone().addScaledVector(cdir,-0.03),0.034,FKM.tube); rod(COLB,COLB.clone().addScaledVector(cdir,0.16),0.055,FKM.seat,g,14);   // кожух с гофром
  const SWG=grp(SWC.x,SWC.y,SWC.z,g); SWG.quaternion.setFromUnitVectors(V3(0,0,1),cdir);
  const SWS=grp(0,0,0,SWG); R.swSpin=SWS;
  mesh(new THREE.TorusGeometry(0.15,0.017,10,40),FKM.grip,0,0,0,SWS);
  for(let i=0;i<3;i++){ const a=-Math.PI/2+i*2*Math.PI/3, sp=box(0.13,0.018,0.012,FKM.tube,Math.cos(a)*0.075,Math.sin(a)*0.075,-0.012,SWS); sp.rotation.z=a; }
  cyl(0.045,0.04,FKM.tube,0,0,-0.005,SWS,18).rotation.x=Math.PI/2;
  { const ka=-Math.PI/6, kx=Math.cos(ka)*0.15, ky=Math.sin(ka)*0.15;                  // «лентяйка» на 10 часов (взгляд водителя)
    const kb=cyl(0.012,0.05,FKM.chrome,kx,ky,0.025,SWS,8); kb.rotation.x=Math.PI/2;
    const kn=mesh(new THREE.SphereGeometry(0.024,12,10),FKM.knob,kx,ky,0.055,SWS); kn.scale.set(1,1,1.3); R.knob=kn; }
  { const d=box(0.26,0.15,0.03,FKM.tube,0,1.085,0.63,g); d.rotation.x=0.75; const s=box(0.22,0.11,0.006,FKM.screen,0,1.093,0.614,g); s.rotation.x=0.75; s.castShadow=false; }
  cyl(0.018,0.03,M.galv,0.20,1.06,0.62,g,10);                                            // ключ
  /* ---------- защитная крыша: трубы 60×80, продольные планки ---------- */
  const TU=FKM.tube, YR=2.17;
  for(const sd of [-1,1]){ const X=sd*0.475;
    tube(V3(X,0.80,0.70),V3(X,2.06,0.49),0.065,0.08,TU); tube(V3(X,2.06,0.49),V3(X,YR,0.43),0.065,0.08,TU);      // передняя стойка с загибом
    tube(V3(X,1.06,-0.99),V3(X,2.08,-0.86),0.065,0.08,TU); tube(V3(X,2.08,-0.86),V3(X,YR,-0.80),0.065,0.08,TU);   // задняя стойка
    tube(V3(X,YR,0.44),V3(X,YR,-0.81),0.065,0.07,TU);                                                              // продольная балка
    const gs=box(0.012,0.12,0.12,TU,sd*0.44,YR-0.06,0.40,g); gs.rotation.x=0.6; }
  tube(V3(-0.51,YR,0.44),V3(0.51,YR,0.44),0.06,0.07,TU); tube(V3(-0.51,YR,-0.81),V3(0.51,YR,-0.81),0.06,0.07,TU);
  for(let i=0;i<6;i++){ const xx=-0.36+i*0.144; tube(V3(xx,YR+0.012,0.42),V3(xx,YR+0.012,-0.79),0.045,0.012,TU); }
  /* фары рабочие (LED), задняя фара, маячок, синий проектор, зеркала, поручни */
  for(const sd of [-1,1]){ const L=grp(sd*0.475,1.98,0.56,g);
    rbox(0.11,0.09,0.07,0.02,TU,0,0,0.02,L); const ln=box(0.09,0.07,0.006,FKM.lens,0,0,0.057,L); ln.castShadow=false;
    rod(V3(sd*0.475,1.92,0.53),V3(sd*0.475,1.955,0.55),0.01,TU); }
  { const L=grp(0.30,YR+0.07,-0.83,g); rbox(0.12,0.08,0.06,0.02,TU,0,0,0,L); box(0.10,0.06,0.006,FKM.lens,0,0,-0.032,L).castShadow=false; }
  cyl(0.055,0.03,TU,-0.32,YR+0.05,-0.80,g,14); mesh(new THREE.SphereGeometry(0.052,16,10,0,Math.PI*2,0,Math.PI/2),M.amber,-0.32,YR+0.065,-0.80,g);
  box(0.06,0.05,0.07,FKM.led,0,YR-0.05,0.45,g).castShadow=false; box(0.06,0.05,0.07,FKM.led,0,YR-0.05,-0.83,g).castShadow=false;
  for(const sd of [-1,1]){ rod(V3(sd*0.50,1.80,0.535),V3(sd*0.64,1.86,0.575),0.012,TU); rbox(0.13,0.18,0.045,0.02,TU,sd*0.66,1.86,0.58,g);
    box(0.11,0.15,0.006,M.glass,sd*0.66,1.86,0.556,g).castShadow=false; }
  rod(V3(0.405,1.15,0.625),V3(0.405,1.62,0.545),0.017,FKM.grip);                         // поручень входа на левой стойке
  { rod(V3(-0.475,1.55,-0.925),V3(-0.40,1.55,-0.80),0.014,TU); rod(V3(-0.40,1.43,-0.80),V3(-0.40,1.66,-0.80),0.019,FKM.grip);   // задний поручень справа
    mesh(new THREE.SphereGeometry(0.021,10,8),M.red,-0.40,1.672,-0.80,g); R.grip=V3(-0.40,1.53,-0.80); }   // кнопка гудка; хват — рука при движении назад
  /* огнетушитель на задней стойке */
  cyl(0.05,0.28,M.red,0.44,1.28,-0.98,g,14); cyl(0.02,0.07,BK,0.44,1.45,-0.98,g,8); box(0.02,0.1,0.13,M.steelDark,0.49,1.28,-0.98,g).castShadow=false;
  /* таблички: грузоподъёмность на капоте, бортовой номер на противовесе и сзади */
  { const mk=(lines,bg,fg,w,h,px)=>{ const c=cnv(w,h), q=c.getContext('2d'); q.fillStyle=bg; q.fillRect(0,0,w,h); q.fillStyle=fg; q.textAlign='center'; q.textBaseline='middle';
      lines.forEach((t,i)=>{ q.font=`700 ${px[i]}px "Barlow Condensed","Roboto Condensed",sans-serif`; q.fillText(t,w/2,h*(i+0.5)/lines.length+2); });
      const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=ANISO; return new THREE.MeshStandardMaterial({map:t,roughness:.5,metalness:.05}); };
    const FKD=forklift.dec||(forklift.dec={cap:mk(['3,0 т','ELECTRIC · Li-ion'],'#1d2126','#f2f2f2',256,128,[66,26]),num:mk(['03'],'#f2f2f2','#1d2126',128,128,[96])});
    for(const sd of [-1,1]){ const a=new THREE.Mesh(new THREE.PlaneGeometry(0.36,0.18),FKD.cap); a.position.set(sd*0.5815,0.64,-0.36); a.rotation.y=sd*Math.PI/2; g.add(a);
      const b=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.2),FKD.num); b.position.set(sd*0.588,0.80,-1.14); b.rotation.y=sd*Math.PI/2; g.add(b); }
    const c2=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.2),FKD.num); c2.position.set(-0.30,0.73,-1.4615); c2.rotation.y=Math.PI; g.add(c2); }

  /* ---------- мачта: всё на шарнире наклона ---------- */
  const n0=g.children.length;
  for(const s of [-1,1]){
    chan(0.10,0.14,0.018,2.16,s,FKM.rail,s*0.36,0.10,1.02,g);                            // наружная стойка
    rod(V3(s*0.445,0.70,0.60),V3(s*0.445,0.86,0.80),0.042,M.steelDark);                  // цилиндр наклона: корпус
    rod(V3(s*0.445,0.84,0.78),V3(s*0.43,0.98,0.97),0.022,FKM.chrome);                    //   шток
    cyl(0.05,0.05,M.steelDark,s*0.43,0.98,0.97,g,12).rotation.z=Math.PI/2;
    cyl(0.046,1.50,M.steelDark,s*0.36,0.98,0.875,g,14);                                  // боковой цилиндр подъёма (корпус)
    cyl(0.052,0.05,M.steelDark,s*0.36,1.735,0.875,g,14); }
  box(0.82,0.10,0.13,M.steel,0,2.21,1.02,g); box(0.82,0.12,0.13,M.steel,0,0.20,1.02,g);
  for(const yy of [0.80,1.55]) box(0.62,0.06,0.04,M.steel,0,yy,0.965,g);                 // поперечины
  cyl(0.055,1.45,M.steelDark,0,0.95,0.965,g,14);                                         // центральный цилиндр свободного подъёма
  for(const sd of [-1,1]){                                                               // рукава гидравлики
    const pts=[V3(sd*0.2,0.5,0.9),V3(sd*0.21,1.2,0.93),V3(sd*0.2,2.05,0.94),V3(sd*0.17,2.2,1.0),V3(sd*0.15,2.05,1.05),V3(sd*0.15,1.4,1.06)];
    const tb=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),24,0.014,6),M.rubber); tb.castShadow=true; g.add(tb); }
  /* внутренняя секция */
  const I=grp(0,0,0,g); R.inner=I;
  for(const s of [-1,1]){ chan(0.08,0.10,0.016,2.12,-s,FKM.rail,s*0.27,0.16,1.075,I);
    rod(V3(s*0.36,0.45,0.875),V3(s*0.36,2.24,0.875),0.026,FKM.chrome,I);                 // шток бокового цилиндра
    box(0.12,0.05,0.24,M.steelDark,s*0.33,2.26,0.98,I); }
  box(0.62,0.09,0.11,M.steel,0,2.24,1.075,I);
  rod(V3(0,1.62,0.965),V3(0,2.18,0.965),0.03,FKM.chrome,I);                              // шток центрального цилиндра
  for(const sd of [-1,1]){ box(0.026,1.75,0.012,M.steelDark,sd*0.14,1.38,1.125,I).castShadow=false;      // цепи
    for(let k=0;k<22;k++) box(0.034,0.02,0.016,BK,sd*0.14,0.55+k*0.08,1.125,I).castShadow=false;
    const sp=cyl(0.065,0.045,M.steelDark,sd*0.14,2.30,1.10,I,18); sp.rotation.z=Math.PI/2; }
  /* каретка ISO: верхняя и нижняя плиты, решётка, вилы переменного сечения */
  const C=grp(0,0,0,g); R.carriage=C;
  rbox(1.0,0.12,0.07,0.015,M.steelDark,0,0.56,1.145,C); rbox(1.0,0.09,0.07,0.015,M.steelDark,0,0.19,1.145,C);
  for(const s of [-1,1]) box(0.10,0.48,0.06,M.steelDark,s*0.33,0.38,1.12,C);
  for(let i=0;i<9;i++) box(0.03,0.04,0.012,BK,-0.44+i*0.11,0.623,1.181,C).castShadow=false;  // насечки фиксации вил
  for(let i=0;i<5;i++) tube(V3(-0.44+i*0.22,0.62,1.165),V3(-0.44+i*0.22,1.40,1.165),0.035,0.035,M.steelDark,C);
  for(const y of [0.88,1.14,1.40]) tube(V3(-0.47,y,1.165),V3(0.47,y,1.165),0.035,0.035,M.steelDark,C);
  for(const s of [-1,1]){
    const fs=new THREE.Shape();                                                          // вила: вертикаль, закруглённая пятка, клин к носку
    fs.moveTo(1.178,0.635); fs.lineTo(1.178,0.11); fs.quadraticCurveTo(1.178,0.063,1.23,0.063); fs.lineTo(2.03,0.063); fs.lineTo(2.285,0.094);
    fs.quadraticCurveTo(2.295,0.1075,2.27,0.1075); fs.lineTo(1.275,0.1075); fs.quadraticCurveTo(1.224,0.1075,1.224,0.16); fs.lineTo(1.224,0.585);
    fs.lineTo(1.205,0.62); fs.lineTo(1.205,0.635); fs.closePath();
    side(fs,0.12,FKM.fork,s*0.30,C);
    box(0.12,0.05,0.06,FKM.fork,s*0.30,0.645,1.175,C);                                   // крюк на верхней плите
    box(0.012,0.03,0.05,M.hazard,s*0.30,0.28,1.229,C).castShadow=false;
    for(let j=0;j<2;j++) cyl(0.035,0.07,M.dark,s*0.47,0.30+j*0.28,1.12,C,12).rotation.z=Math.PI/2; }
  { const MG=grp(0,0.30,1.02,g); R.mast=MG; const mv=g.children.slice(n0).filter(o=>o!==MG);
    mv.forEach(o=>{ g.remove(o); o.position.sub(MG.position); MG.add(o); });
    R.cb=C.position.clone(); R.ib=I.position.clone(); }
  /* ---------- колёса ---------- */
  const wheel=(wx,wy,wz,r,w,par)=>{ const pv=grp(wx,wy,wz,par||g); tire(pv,0,0,0,r,w,'x'); pv.userData.r=r; R.wheels.push(pv); return pv; };
  for(const s of [-1,1]){
    wheel(s*0.57,0.38,0.62,0.38,0.27);
    const st=grp(s*0.44,0.27,-0.92,g); R.steer.push(st);
    wheel(0,0,0,0.27,0.2,st);
  }
  /* синее пятно безопасности на полу */
  const bm=new THREE.MeshBasicMaterial({color:0x2a6bff,transparent:true,opacity:.7,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,toneMapped:false});
  const bF=new THREE.Mesh(new THREE.CircleGeometry(0.22,20),bm); bF.rotation.x=-Math.PI/2; bF.position.set(0,0.02,3.4); bF.visible=false; g.add(bF);
  const bB=bF.clone(); bB.position.z=-3.3; g.add(bB); R.blueF=bF; R.blueB=bB;
  /* ---------- водитель: таз на подушке, ИК рук и ног ---------- */
  if(opt.driver!==false){ const d=person(0,0,0,false,null,g); const H=d.userData.H;
    if(H){ H.root.updateMatrixWorld(true); const rq=H.root.getWorldQuaternion(new THREE.Quaternion()).invert();
      H.fq0=['Left','Right'].map(L=>rq.clone().multiply(H.B[L+'Foot'].getWorldQuaternion(new THREE.Quaternion())));
      H.fk=g; H.post=fkDriverPost; }
    d.position.set(0,0.52,-0.31); rigSit(d); R.driver=d; }
  return g;
}
/* поза водителя поверх «сидя»: оборот корпуса и головы назад (движение задним ходом), ноги — на пол и педаль хода,
   левая рука — на «лентяйке» руля (идёт за поворотом руля), правая — на джойстиках подлокотника или на заднем поручне */
const _fkv={a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3(),p:new THREE.Vector3(),q:new THREE.Quaternion(),q2:new THREE.Quaternion(),
  Y:new THREE.Vector3(0,1,0),X:new THREE.Vector3(1,0,0)};
function fkDriverPost(H,p){
  const fk=H.fk, R=fk&&fk.userData.rig; if(!R||!R.knob||!R.grip||!p.sit) return; const V=_fkv, back=Math.max(0,Math.min(1,(R.drv&&R.drv.back)||0));
  const rot=HUM.rot;
  if(back>0){ rot(H,'Spine',V.Y,-0.22*back); rot(H,'Spine1',V.Y,-0.2*back); rot(H,'Spine2',V.Y,-0.16*back); rot(H,'Neck',V.Y,-0.42*back); rot(H,'Head',V.Y,-0.5*back); rot(H,'Head',V.X,0.06*back); }
  fk.updateMatrixWorld(true);
  const W=(x,y,z,out)=>fk.localToWorld((out||V.a).set(x,y,z));
  /* ноги: стопы ровно, левая на полу, правая на педали хода (носок вверх по наклону педали) */
  H.root.getWorldQuaternion(V.q);
  [['Left',0.13,0.685,0.27,0],['Right',-0.13,0.715,0.33,-0.42]].forEach(([L,x,y,z,tilt],i)=>{
    const T=W(x,y,z,V.a).clone(), P=W(x,y+0.6,z+0.55,V.b).clone();
    V.q2.copy(V.q).multiply(H.fq0[i]); if(tilt) V.q2.premultiply(new THREE.Quaternion().setFromAxisAngle(fk.localToWorld(V.c.set(1,0,0)).sub(fk.getWorldPosition(V.p)).normalize(),tilt));
    HUM.ik2(H,L+'UpLeg',L+'Leg',L+'Foot',T,P,V.q2); });
  /* левая рука на «лентяйке»: запястье чуть позади и ниже шара; если не достаёт — корпус подаётся вперёд и к рулю */
  const kp=R.knob.getWorldPosition(new THREE.Vector3());
  const sh=H.B.LeftArm.getWorldPosition(new THREE.Vector3()), wt=kp.clone().addScaledVector(sh.clone().sub(kp).normalize(),0.075); wt.y-=0.015;
  let k=HUM.ik2(H,'LeftArm','LeftForeArm','LeftHand',wt,W(0.55,1.0,-0.45,V.b).clone());
  for(let it=0;it<2&&k>0.97;it++){ const lean=Math.min(0.25,(k-0.95)*1.6); rot(H,'Spine',V.X,-lean*0.6); rot(H,'Spine1',V.X,-lean*0.4); rot(H,'Spine',V.Y,0.25*lean*(Math.sign(fk.worldToLocal(kp.clone()).x)||1));
    const sh2=H.B.LeftArm.getWorldPosition(new THREE.Vector3()); wt.copy(kp).addScaledVector(sh2.sub(kp).normalize(),0.075); wt.y-=0.015;
    k=HUM.ik2(H,'LeftArm','LeftForeArm','LeftHand',wt,W(0.55,1.0,-0.45,V.b).clone()); }
  /* правая рука: джойстики → задний поручень при движении назад */
  const rc=W(-0.30,1.285,-0.15,V.a).clone(), rh=fk.localToWorld(R.grip.clone()); rh.x+=0; 
  const u=back<0.35?0:Math.min(1,(back-0.35)/0.5), tr=rc.lerp(rh,u*u*(3-2*u));
  HUM.ik2(H,'RightArm','RightForeArm','RightHand',tr,W(-0.6,0.95,-0.4,V.b).clone());
}
function fkSet(fk,lift,roll,steer,tilt){                   // подъём каретки, поворот колёс, руление, наклон мачты (+ вперёд)
  const R=fk.userData.rig; if(!R) return;
  R.lift=lift; R.carriage.position.y=R.cb.y+lift;
  R.inner.position.y=R.ib.y+Math.max(0,Math.min(1.25,(lift-0.3)*0.52));
  if(R.mast) R.mast.rotation.x=tilt||0;
  for(const w of R.wheels) w.rotation.x=(roll||0)/w.userData.r;
  for(const s of R.steer) s.rotation.y=steer||0;
  if(R.swSpin) R.swSpin.rotation.z=-(steer||0)*3.0;       // руль: ~3 рад руля на 1 рад колёс
}
