/* ============================================================== МАШИНЫ
   По реальным образцам: китайский бортовой грузовик 8×4 с решётчатыми бортами (栏板/仓栅)
   и кабиной типа Shacman X3000/FAW J6 — жёлтый номер крупнотоннажного «新F», световозвращающая
   красно-белая лента по борту, воздухозаборник за кабиной; казахстанский автопоезд-тандем
   (тягач европейского типа + прицеп, шторные кузова с ремнями и пряжками), номер KZ.
   Шины 315/80 R22,5 с дисками, гайками и протектором. */
function wheel(g,x,z,r,dual){
  const mk=zz=>tire(g,x,r,zz,r,0.315,'z');
  mk(z-(dual?0.74:0.92)); mk(z+(dual?0.74:0.92));
  if(dual){ mk(z-1.08); mk(z+1.08); }
}
function fender(g,x,z,r,w){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r+0.10,r+0.10,w||0.78,20,1,true,Math.PI/2,Math.PI),M.blackPl);
  m.material.side=THREE.DoubleSide;
  m.rotation.x=Math.PI/2; m.position.set(x,r,z); m.castShadow=m.receiveShadow=true; g.add(m); return m; }

/* ---------- кабина: локально смотрит в −x; o.style 'cn' | 'eu' ---------- */
function cabin(g,cx,dir,o){
  o=o||{}; const c=grp(cx,0,0,g); if(dir>0) c.rotation.y=Math.PI;
  const P=o.paint||TRK.paints.white, eu=o.style==='eu', hi=!!o.high;
  const W2=1.245, y0=1.02, top=hi?3.78:3.12;
  /* корпус: боковой профиль, выдавленный по ширине со скруглением */
  const sh=new THREE.Shape(), bv=0.10;                        // контур с учётом фаски: фаска добавит 7 см наружу
  sh.moveTo(-1.14+bv,y0+bv); sh.lineTo(-1.17+bv,1.96); sh.lineTo(-1.13+bv,2.03); sh.lineTo(-0.97+bv,2.96-bv*0.5);
  if(hi){ sh.quadraticCurveTo(-0.9+bv,3.1,-0.72+bv,3.22-bv*0.3); sh.quadraticCurveTo(-0.5,top-0.05-bv,-0.2,top-bv); } else sh.quadraticCurveTo(-0.92+bv,top-bv,-0.78+bv,top-bv);
  sh.lineTo(1.12-bv,top-bv); sh.lineTo(1.14-bv,y0+bv); sh.lineTo(-1.14+bv,y0+bv);
  const bev=bv, geo=new THREE.ExtrudeGeometry(sh,{depth:W2*2-2*bev,bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:5,curveSegments:10});
  geo.translate(0,0,-(W2*2-2*bev)/2); mesh(geo,P,0,0,0,c);
  /* лобовое стекло с рамкой, дворники, козырёк */
  const ws=box(0.03,0.93,2.16,M.cabGlass,-1.085,2.49,0,c); ws.rotation.z=-0.17; ws.castShadow=false;
  const wf=box(0.02,1.02,2.3,M.blackPl,-1.07,2.49,0,c); wf.rotation.z=-0.17; wf.castShadow=false;
  for(const s of [-0.5,0.45]){ const wp=box(0.02,0.03,0.85,M.blackPl,-1.13,2.13,s,c); wp.rotation.x=0.18; wp.castShadow=false; }
  const vis=box(0.34,0.05,2.36,eu?P:M.blackPl,-1.02,hi?3.26:3.05,0,c); vis.rotation.z=0.22;
  /* решётка радиатора, фары, бампер — по образцу седельных тягачей: решётка-трапеция с ламелями, фары-блоки в углах бампера
     (линзы ближнего/дальнего, светодиодная «бровь» ДХО, поворотник на изгибе), бампер из двух частей: верх в цвет кабины,
     низ — тёмный пластик с воздухозаборником, противотуманками и защитой */
  const ext=(sh,depth,mat,x0,par)=>{ const gg=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:false,curveSegments:6}); gg.rotateY(Math.PI/2); return mesh(gg,mat,x0,0,0,par||c); };
  const trap=(zb,zt,yb,yt,r)=>{ const q=new THREE.Shape(); q.moveTo(-zb+r,yb); q.lineTo(zb-r,yb); q.quadraticCurveTo(zb,yb,zb+(zt-zb)*r/(yt-yb),yb+r);
    q.lineTo(zt-(zt-zb)*r/(yt-yb),yt-r); q.quadraticCurveTo(zt,yt,zt-r,yt); q.lineTo(-zt+r,yt); q.quadraticCurveTo(-zt,yt,-zt+(zt-zb)*r/(yt-yb)*-1,yt-r);
    q.lineTo(-zb-(zt-zb)*r/(yt-yb),yb+r); q.quadraticCurveTo(-zb,yb,-zb+r,yb); return q; };
  /* ExtrudeGeometry после rotateY(+π/2): контур (x,y) → (z=−x, y); выдавливание по +z → по +x. Контур симметричен по z — знак не важен */
  if(eu){
    ext(trap(0.80,0.88,1.27,2.0,0.06),0.05,M.blackPl,-1.205);                       // поле решётки
    for(let i=0;i<7;i++){ const yy=1.33+i*0.098, hw=0.80+0.08*(yy-1.27)/0.73-0.05;
      const sl=rbox(0.035,0.052,hw*2,0.015,i===3?M.chrome:P,-1.215,yy,0,c); }
    ext(trap(0.83,0.91,1.24,2.03,0.07),0.012,M.chrome,-1.212);                       // хромированная окантовка (за полем, видна по краю)
    box(0.02,0.04,0.5,M.chrome,-1.24,1.62,0,c);                                        // планка без эмблемы
  } else {
    ext(trap(0.74,0.80,1.24,1.98,0.05),0.05,M.blackPl,-1.205);
    for(let i=-6;i<=6;i++){ const v=box(0.035,0.66,0.035,M.chrome,-1.215,1.61,i*0.115,c); }
    for(let i=0;i<3;i++) box(0.04,0.05,1.52,M.chrome,-1.225,1.36+i*0.25,0,c);
    ext(trap(0.78,0.84,1.21,2.01,0.06),0.012,M.chrome,-1.212);
    const em=cyl(0.10,0.025,M.chrome,-1.245,1.85,0,c,24); em.rotation.z=Math.PI/2; const em2=cyl(0.075,0.03,M.blackPl,-1.25,1.85,0,c,24); em2.rotation.z=Math.PI/2;
  }
  /* бампер: верх в цвет, низ тёмный */
  rbox(0.30,0.30,2.44,0.07,P,-1.12,1.07,0,c);
  rbox(0.34,0.44,2.46,0.07,M.greyPl,-1.12,0.70,0,c);
  for(const sd of [-1,1]){ const ig=box(0.03,0.16,0.42,M.blackPl,-1.29,0.70,sd*0.52,c); for(let i=0;i<3;i++) box(0.035,0.018,0.40,M.greyPl,-1.30,0.64+i*0.06,sd*0.52,c).castShadow=false;
    rbox(0.05,0.14,0.20,0.04,M.blackPl,-1.285,0.70,sd*0.97,c); const fg=cyl(0.05,0.03,M.headLight,-1.31,0.70,sd*0.97,c,16); fg.rotation.z=Math.PI/2; fg.castShadow=false; }
  box(0.04,0.06,2.2,M.blackPl,-1.27,0.50,0,c);                                       // нижняя защитная губа
  box(0.36,0.05,0.62,M.blackPl,-1.12,0.47,0,c);                                      // ступенька для мойки стекла
  for(let i=0;i<4;i++) box(0.012,0.008,0.58,M.greyPl,-1.12+(-0.12+i*0.08),0.497,0,c).castShadow=false;
  /* фары-блоки в углах */
  for(const sd of [-1,1]){ const HL=grp(-1.255,1.11,sd*0.89,c); HL.rotation.y=-sd*0.18;
    rbox(0.08,0.20,0.50,0.04,M.blackPl,0,0,0,HL);
    for(const k of [-0.13,0.03]){ const ch=cyl(0.068,0.02,M.chrome,-0.036,-0.018,sd*k,HL,20); ch.rotation.z=Math.PI/2; ch.castShadow=false;
      const L=cyl(0.045,0.024,M.headLight,-0.042,-0.018,sd*k,HL,20); L.rotation.z=Math.PI/2; L.castShadow=false; }
    box(0.016,0.022,0.44,M.ledW,-0.042,0.072,0,HL).castShadow=false;                   // ДХО
    box(0.016,0.10,0.07,M.lensAmber,-0.042,-0.01,sd*0.19,HL).castShadow=false;        // поворотник
  }
  /* габариты на крыше кабины и боковые повторители */
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.44,0.14),plateMat(o.plate||'新F·3K218',o.plateKind)); pl.position.set(-1.292,0.70,0); pl.rotation.y=-Math.PI/2; c.add(pl);
  /* двери, окна, ручки, зеркала, дефлекторы, подножки */
  for(const s of [-1,1]){
    const win=box(0.84,0.74,0.02,M.cabGlass,-0.5,2.47,s*(W2+0.005),c); win.castShadow=false;
    box(0.9,0.8,0.012,M.blackPl,-0.5,2.47,s*(W2+0.001),c).castShadow=false;
    box(0.02,1.85,0.012,M.blackPl,0.3,1.98,s*(W2+0.004),c).castShadow=false;      // шов двери
    box(0.02,1.1,0.012,M.blackPl,-1.02,1.62,s*(W2+0.004),c).castShadow=false;
    box(1.3,0.02,0.012,M.blackPl,-0.36,1.06,s*(W2+0.004),c).castShadow=false;
    box(0.18,0.04,0.03,M.blackPl,0.13,1.96,s*(W2+0.02),c);                         // ручка
    const df=box(0.5,1.9,0.05,P,-0.86,2.02,s*(W2+0.06),c); df.rotation.y=s*0.35;    // угловой дефлектор
    /* зеркала на кронштейнах */
    box(0.05,0.05,0.34,M.blackPl,-0.98,2.86,s*(W2+0.17),c);
    box(0.04,0.6,0.04,M.blackPl,-1.0,2.56,s*(W2+0.33),c);
    rbox(0.11,0.44,0.24,0.03,M.blackPl,-1.02,2.48,s*(W2+0.33),c);
    rbox(0.1,0.2,0.2,0.03,M.blackPl,-1.02,2.12,s*(W2+0.31),c);
    box(0.012,0.38,0.19,M.cabGlass,-0.965,2.48,s*(W2+0.33),c).castShadow=false;
    /* подножки и боковая юбка */
    box(0.62,0.9,0.05,M.greyPl,-0.55,0.62,s*(W2-0.08),c);
    for(let i=0;i<2;i++) box(0.5,0.045,0.26,M.chrome,-0.55,0.42+i*0.36,s*(W2-0.18),c);
    /* грязевик переднего колеса (на раме, кабина над ним качается отдельно) */
    fender(c,0.15,s*1.02,0.54,0.4).userData.chassis=true;
  }
  /* крыша: огни, сигналы, воздухозаборник или выхлоп */
  if(!eu) for(let i=-2;i<=2;i++) box(0.06,0.06,0.12,M.lensAmber,-0.9,top+0.02,i*0.36,c).castShadow=false;
  else for(const s of [-1,1]) box(0.08,0.05,0.14,M.lensAmber,-0.3,top+0.02,s*1.0,c).castShadow=false;
  for(const s of [-1,1]){ const hr=cyl(0.045,0.5,M.chrome,0.2,top+0.07,s*0.3,c,10); hr.rotation.z=Math.PI/2; }
  if(!eu){ cyl(0.16,1.7,P,1.3,2.45,-0.92,c,18); cyl(0.19,0.18,M.blackPl,1.3,3.38,-0.92,c,18);
    const snk=cyl(0.12,0.4,P,1.25,1.72,-0.92,c,14); snk.rotation.z=0.5; }
  else { cyl(0.065,2.1,M.chrome,1.25,2.1,1.0,c,12); }
  /* кабина на подвеске: всё, что построено выше (кроме грязевиков), — на шарнире у переднего нижнего края;
     в фильме при торможении кабина клюёт вперёд относительно рамы и раскачивается после остановки */
  { const P=new THREE.Group(); P.position.set(-1.0,1.0,0); P.name='cabPivot';
    c.children.slice().forEach(o=>{ if(o.userData.chassis) return; c.remove(o); o.position.sub(P.position); P.add(o); });
    c.add(P); c.userData.cab=P; }
  /* топливный бак, АКБ, воздушные ресиверы за кабиной */
  const tank=rbox(1.1,0.55,0.55,0.12,M.alu,1.9,0.78,-1.0,g===c?c:c); tank.position.set(1.95,0.78,-0.98);
  box(0.6,0.5,0.45,M.greyPl,1.85,0.8,1.0,c);
  for(const s of [-1,1]){ const at=cyl(0.12,0.7,M.chassis,2.6,0.72,s*0.92,c,12); at.rotation.z=Math.PI/2; }
  return c;
}
function cab(g,cx,dir,sleeper){ return cabin(g,cx,dir,{high:sleeper,paint:TRK.cur&&TRK.cur.paint,style:TRK.cur&&TRK.cur.style,plate:TRK.cur&&TRK.cur.plate,plateKind:TRK.cur&&TRK.cur.plateKind}); }

/* ---------- китайский бортовой 8×4 с решётчатыми бортами ---------- */
function flatTruck(x,z,len,dir,heavy,rotY,load){
  dir=dir||-1; load=load===undefined?1:load;
  const V=[{paint:'white',body:'green',plate:'新F·3K218'},{paint:'blue',body:'blue',plate:'新F·7A635'},{paint:'red',body:'green',plate:'新F·5C902'}][TRK.n++%3];
  TRK.cur={paint:TRK.paints[V.paint],style:'cn',plate:V.plate,plateKind:'cn'};
  const BP=TRK.bodyPaint[V.body];
  const g=grp(x,0,z,G.trucks); g.rotation.y=rotY||0; g.userData.truck={len,dir,kind:'cn'};
  const FY=1.28, HW=1.25, SH=heavy?0.6:1.1;                               // пол кузова, полуширина, высота бортов
  /* рама: лонжероны и поперечины */
  for(const s of [-1,1]) box(len+2.4,0.28,0.09,M.chassis,dir*0.9,0.95,s*0.45,g);
  for(let i=0;i<Math.floor(len/1.1);i++) box(0.08,0.2,0.9,M.chassis,-len/2+0.4+i*1.1,0.95,0,g);
  /* пол и нижний пояс кузова */
  box(len,0.14,HW*2,M.wood,0,FY-0.05,0,g);
  box(len+0.02,0.2,HW*2+0.04,BP,0,FY-0.18,0,g);
  for(let i=0;i<Math.floor(len/0.62);i++) box(0.07,0.14,HW*2,BP,-len/2+0.3+i*0.62,FY-0.32,0,g);
  /* борта: сплошная нижняя панель с рёбрами + решётка, стойки, верхний пояс */
  const lat=std(0x5d6770,.45,.55);
  for(const s of [-1,1]){
    box(len,0.5,0.05,BP,0,FY+0.27,s*HW,g);
    for(let i=0;i<Math.floor(len/0.3);i++) box(0.035,0.44,0.02,BP,-len/2+0.15+i*0.3,FY+0.27,s*(HW+0.03),g).castShadow=false;
    box(len,0.1,0.1,BP,0,FY+SH,s*HW,g);
    if(!heavy){ box(len,0.06,0.06,BP,0,FY+0.55,s*HW,g);
      for(let i=0;i<Math.floor(len/0.16);i++) box(0.028,SH-0.58,0.028,lat,-len/2+0.08+i*0.16,FY+0.55+(SH-0.58)/2,s*HW,g).castShadow=i%3===0; }
    for(let i=0;i<=Math.floor(len/1.3);i++) box(0.1,SH+0.12,0.1,BP,-len/2+i*(len/Math.floor(len/1.3)),FY+SH/2,s*HW,g);
    /* красно-белая световозвращающая лента по борту (требование для грузовиков КНР) */
    for(let i=0;i<Math.floor(len/0.5);i++) box(0.24,0.05,0.01,i%2?M.reflWhite:M.reflRed,-len/2+0.25+i*0.5,FY+0.08,s*(HW+0.035),g).castShadow=false;
    /* боковая защита */
    for(const yy of [0.52,0.78]) box(len-3.6,0.07,0.04,M.greyPl,-dir*0.5,yy,s*(HW-0.05),g);
  }
  /* передний щит с лестницей и задние решётчатые двери */
  box(0.08,SH+0.4,HW*2,BP,dir*(len/2-0.04),FY+SH/2+0.2,0,g);
  for(let i=0;i<6;i++) box(0.05,0.03,0.4,M.galv,dir*(len/2+0.03),FY+0.2+i*0.28,0.6,g);
  const rx=-dir*(len/2+0.02);
  for(const s of [-1,1]){ box(0.05,SH,HW-0.04,BP,rx,FY+SH/2,s*HW/2,g); box(0.05,0.05,HW-0.1,M.galv,rx-dir*0.03,FY+SH*0.55,s*HW/2,g); }
  for(let i=0;i<8;i++) box(0.01,0.05,0.22,i%2?M.reflWhite:M.reflRed,rx-dir*0.05,FY+0.1,-HW+0.15+i*0.3,g).castShadow=false;
  /* груз */
  if(heavy){
    const cr=grp(0,0,0,g);
    box(2.6,1.7,2.2,M.crate,0,2.1,0,cr);
    for(let i=-1;i<=1;i+=2){ box(0.12,1.75,2.24,M.wood,i*1.15,2.1,0,cr); box(2.64,0.12,0.14,M.wood,0,2.85,i*1.05,cr); }
    for(let i=0;i<2;i++) box(1.3,0.9,2.0,M.carton,-len/2+1.4+i*1.5,1.7,0,g);
  } else if(load){
    /* груз по типам (SKU A–D): поперечные секции по 1,24 м, в секции — стопки одного типа */
    const R=LOOK.R, order=[1,2,3,0,1,3,2,0,1,2,3,0];
    let x0=-len/2+0.1, oi=0;
    while(x0<len/2-0.7){
      const ti=order[oi++%order.length], T=CTYPE[ti];
      const cross=T.l>0.62;                                  // длинный короб — поперёк кузова
      const dx=cross?T.w:T.l, dz=cross?T.l:T.w, nx=Math.max(1,Math.floor(1.22/dx)), nz=Math.floor((HW*2-0.1)/dz);
      const layers=Math.min(Math.floor(1.7/T.h),2+((R()*3)|0));
      for(let i=0;i<nx;i++) for(let j=0;j<nz;j++){ const lay=Math.max(1,layers-((R()<0.18)?1:0));
        for(let k=0;k<lay;k++){ const m=cartonMesh(ti); m.position.set(x0+dx/2+i*dx+(R()-.5)*0.02,FY+0.02+k*T.h,-HW+0.05+dz/2+j*dz+(R()-.5)*0.02);
          m.rotation.y=(cross?Math.PI/2:0)+(R()-.5)*0.04; g.add(m); } }
      x0+=Math.max(nx*dx,0.6)+0.04;
    }
    for(let i=0;i<Math.floor(len/2.2);i++) box(0.05,0.02,HW*2+0.02,M.dark,-len/2+1.0+i*2.2,FY+SH-0.05,0,g).castShadow=false;
  }
  /* кабина, колёса 8×4: две управляемые оси спереди, две ведущие сзади */
  const cx=dir*(len/2+1.55);
  ao(len+3.8,3.4,dir*1.5,0,g);
  cab(g,cx,dir,false);
  for(const ax of [cx-dir*0.15+(-dir)*0*1, cx-dir*1.95]) for(const s of [-1,1]){ tire(g,ax,0.54,s*1.03,0.54,0.315,'z'); fender(g,ax,s*1.03,0.54,0.42); }
  for(let i=0;i<2;i++){ const wx=-dir*(len/2-1.9-i*1.36); wheel(g,wx,0,0.54,true); for(const s of [-1,1]) fender(g,wx,s*0.91,0.54,0.72); }
  for(const s of [-1,1]){                                    // брызговики
    box(0.03,0.5,0.62,M.blackPl,-dir*(len/2-1.9-1.36)-dir*0.9,0.32,s*1.12,g).castShadow=false;
    box(0.03,0.5,0.62,M.blackPl,-dir*(len/2-1.9)+dir*0.8,0.32,s*1.12,g).castShadow=false; }
  /* задние фонари, противоподкатный брус, номер */
  for(const s of [-1,1]){ box(0.06,0.14,0.36,M.blackPl,rx-dir*0.1,0.9,s*0.92,g); box(0.02,0.1,0.3,M.lensRed,rx-dir*0.135,0.9,s*0.92,g).castShadow=false; }
  box(0.12,0.16,2.2,M.greyPl,-dir*(len/2+0.22),0.5,0,g);
  for(let i=0;i<8;i++) box(0.01,0.12,0.26,i%2?M.reflWhite:M.reflRed,-dir*(len/2+0.285),0.5,-0.98+i*0.28,g).castShadow=false;
  for(const s of [-1,1]) box(0.09,0.3,0.09,M.chassis,-dir*(len/2+0.18),0.7,s*0.72,g);
  const rp=new THREE.Mesh(new THREE.PlaneGeometry(0.44,0.22),plateMat(V.plate,'cn')); rp.position.set(-dir*(len/2+0.29),0.72,0.45); rp.rotation.y=-dir*Math.PI/2; g.add(rp);
  for(let i=0;i<Math.round(len/2.0);i++) for(const s of [-1,1]) box(0.09,0.05,0.03,M.lensAmber,-len/2+0.6+i*2.0,FY+0.52,s*(HW+0.06),g).castShadow=false;
  TRK.cur=null;
  return g;
}

/* ---------- казахстанский автопоезд «тандем»: грузовик + прицеп, шторные кузова ----------
   Кузов: рама с поперечинами, дощатый пол, алюминиевая обвязка с такелажными проушинами, передний борт с рёбрами,
   задний портал с распашными дверями и штангами запоров, дуги крыши, тент. Штора ближнего борта — из полотнищ:
   curtainSet(b,u) собирает её гармошкой к переднему борту (u = 1) и вынимает сдвижные стойки. */
M.reflYellow=std(0xf2d21c,.3,.25,{envMapIntensity:1.3}); M.tarpIn=std(0xc9cdd1,.85,0);
function curtainSet(b,u){
  const C=b.userData.curt; if(!C) return; C.u=u; const n=C.strips.length, e=u*u*(3-2*u);
  for(let i=0;i<n;i++){ const st=C.strips[i], xc=C.x0+C.w*(i+0.5), xo=C.x0+0.05+i*C.pitch;
    st.position.x=xc+(xo-xc)*e; st.rotation.y=(i%2?1:-1)*e*C.ang; }
  C.posts.forEach(p=>p.visible=u<0.5);
}
function curtainBody(g,off,len,o){
  o=o||{}; const FY=1.34, IH=2.6, HW=1.275, RY=FY+IH;
  const b=grp(off,0,0,g); b.userData.body={len,FY,IH,HW};
  /* рама, поперечины, пол, обвязка с проушинами и контурной лентой */
  for(const s of [-1,1]) box(len,0.24,0.09,M.chassis,0,FY-0.27,s*0.42,b);
  for(let i=0;i<Math.round(len/0.82);i++) box(0.07,0.12,HW*2-0.1,M.chassis,-len/2+0.3+i*0.82,FY-0.12,0,b).castShadow=false;
  box(len,0.08,HW*2,M.wood,0,FY-0.02,0,b);
  for(const s of [-1,1]){
    box(len,0.16,0.07,M.alu,0,FY-0.02,s*(HW+0.005),b);
    for(let i=0;i<Math.floor(len/0.42);i++) box(0.12,0.035,0.012,M.blackPl,-len/2+0.3+i*0.42,FY-0.005,s*(HW+0.042),b).castShadow=false;
    for(let i=0;i<Math.floor(len/0.6);i++) box(0.3,0.05,0.008,i%2?M.reflWhite:M.reflYellow,-len/2+0.3+i*0.6,FY-0.07,s*(HW+0.043),b).castShadow=false;
    box(len,0.14,0.08,M.alu,0,RY-0.07,s*HW,b);                                            // верхний пояс с рельсом шторы
    for(let i=0;i<Math.round(len/2.0);i++) box(0.09,0.05,0.03,M.lensAmber,-len/2+0.6+i*2.0,FY+0.1,s*(HW+0.06),b).castShadow=false;
  }
  const nb=Math.round(len/0.9);
  for(let i=0;i<=nb;i++) box(0.04,0.05,HW*2,M.galv,-len/2+0.06+i*((len-0.12)/nb),RY-0.04,0,b).castShadow=false;   // дуги крыши
  box(len+0.02,0.03,HW*2+0.06,M.tarp,0,RY+0.02,0,b);                                       // тент крыши
  /* передний борт — со стороны кабины */
  box(0.06,IH+0.1,HW*2+0.04,TRK.paints.white,-len/2+0.03,FY+IH/2,0,b);
  for(let i=0;i<6;i++) box(0.03,IH-0.2,0.07,M.alu,-len/2+0.075,FY+IH/2,-HW+0.25+i*((HW*2-0.5)/5),b).castShadow=false;
  box(0.035,0.45,HW*2-0.2,M.alu,-len/2+0.08,FY+0.25,0,b).castShadow=false;
  /* задний портал, двери, штанги запоров, петли */
  for(const s of [-1,1]) box(0.09,IH,0.09,M.alu,len/2-0.045,FY+IH/2,s*(HW-0.03),b);
  box(0.09,0.1,HW*2,M.alu,len/2-0.045,RY-0.05,0,b);
  for(const s of [-1,1]){
    box(0.04,IH-0.12,HW-0.07,TRK.paints.white,len/2-0.02,FY+IH/2,s*(HW/2-0.01),b);
    for(const zz of [0.24,0.86]){ cyl(0.016,IH-0.1,M.galv,len/2+0.02,FY+IH/2,s*HW*zz,b,8).castShadow=false;
      box(0.03,0.05,0.2,M.galv,len/2+0.03,FY+1.05,s*(HW*zz+0.08),b).castShadow=false;
      for(const yy of [0.06,IH-0.16]) box(0.05,0.07,0.06,M.steelDark,len/2+0.02,FY+yy,s*HW*zz,b).castShadow=false; }
    for(const yy of [0.3,1.3,2.3]) box(0.03,0.12,0.07,M.steelDark,len/2+0.015,FY+yy,s*(HW-0.06),b).castShadow=false;
  }
  /* дальняя штора — закрыта: полотно, ремни, пряжки */
  { const L=len-0.18; box(L,IH-0.2,0.035,M.tarp,-0.02,FY+IH/2,-(HW+0.02),b);
    for(let i=0;i<Math.floor(L/0.55);i++){ box(0.045,IH-0.3,0.012,M.blackPl,-len/2+0.36+i*0.55,FY+IH/2,-(HW+0.045),b).castShadow=false;
      box(0.06,0.09,0.02,M.chrome,-len/2+0.36+i*0.55,FY+0.24,-(HW+0.05),b).castShadow=false; }
    box(L,0.3,0.004,M.tarpBlue,-0.02,RY-0.35,-(HW+0.04),b).castShadow=false;
    for(const px of [-len/6,len/6]) box(0.07,IH-0.1,0.05,M.alu,px,FY+IH/2,-(HW-0.03),b); }
  /* ближняя штора — полотнища с ремнями; сдвижные стойки вынимаются */
  const near=grp(0,0,0,b); b.userData.near=near;
  const x0=-len/2+0.1, n=Math.round((len-0.2)/0.275), w=(len-0.2)/n, C={strips:[],posts:[],x0,w,pitch:0.03,ang:1.462,u:0};
  for(let i=0;i<n;i++){ const st=grp(x0+w*(i+0.5),FY+IH/2,HW+0.03,near);
    box(w+0.004,IH-0.2,0.012,M.tarp,0,0,0,st);
    box(w+0.004,0.3,0.004,M.tarpBlue,0,IH/2-0.35,0.009,st).castShadow=false;
    if(i%2===0){ box(0.045,IH-0.3,0.01,M.blackPl,0,0,0.012,st).castShadow=false; box(0.06,0.09,0.02,M.chrome,0,-IH/2+0.24,0.018,st).castShadow=false; }
    cyl(0.018,0.03,M.steelDark,0,IH/2-0.07,-0.02,st,8).castShadow=false;                  // ролик на рельсе
    C.strips.push(st); }
  for(const px of [-len/6,len/6]){ const p=box(0.07,IH-0.1,0.05,M.alu,px,FY+IH/2,HW-0.03,near); C.posts.push(p); }
  b.userData.curt=C; curtainSet(b,o.open||0);
  /* груз: короба уложены вручную «дорожками» по типам (каждому SKU — своё место поперёк кузова) */
  if(o.lanes) kzLanes(b,FY+0.02,o.lanes[0],o.lanes[1],o.tall);
  return b;
}
/* дорожки казахского кузова: поперёк 2,4 м = A 0,4 + C 0,8 + B 0,6 + D 0,6; z — центр дорожки, d — шаг стопки вдоль кузова, n — ярусов */
const KZLANE={0:{z:-1.0,d:0.312,n:3},2:{z:-0.4,d:0.412,n:3},1:{z:0.32,d:0.412,n:2},3:{z:0.94,d:0.512,n:2}};   // шаг = короб + 12 мм
function kzLanes(b,y,x0,x1,tall){
  const R=LOOK.R;
  for(const ti of [0,2,1,3]){ const L=KZLANE[ti], T=CTYPE[ti], ns=Math.floor((x1-x0+1e-6)/L.d);
    for(let i=0;i<ns;i++){ const lv=L.n+(tall?1:0)-((R()<0.22)?1:0);
      for(let k=0;k<lv;k++){ const m=cartonMesh(ti); m.position.set(x0+L.d*(i+0.5)+(R()-.5)*0.012,y+k*T.h,L.z+(R()-.5)*0.012);
        m.rotation.y=Math.PI/2+(R()-.5)*0.03; b.add(m); } } }
}
function tandem(x,z,rotY,o){
  o=o||{}; const g=grp(x,0,z,G.trucks); g.rotation.y=rotY||0; g.userData.truck={kind:'kz'};
  const plate=o.plate||'017 ABZ 05';
  TRK.cur={paint:TRK.paints.white,style:'eu',plate,plateKind:'kz'};
  ao(28,3.6,-2.5,0,g);
  /* грузовик: кузов 8,2 м на раме, кабина, колёса 6×2 */
  const b1=curtainBody(g,-5.8,8.2,{lanes:o.lanes1||[-4.0,3.2],tall:o.tall!==undefined?o.tall:(o.open?0:1),open:o.open}); g.userData.b1=b1;
  const cx=-12.4;
  cab(g,cx,-1,true);
  for(const s of [-1,1]) box(10.6,0.26,0.09,M.chassis,cx+5.2,0.95,s*0.45,g);
  for(const s of [-1,1]){ tire(g,cx-0.0,0.54,s*1.03,0.54,0.315,'z'); }
  wheel(g,-5.8-1.6,0,0.54,true); wheel(g,-5.8-0.25,0,0.54,false);
  for(const wx of [-7.4,-6.05]) for(const s of [-1,1]) fender(g,wx,s*0.95,0.54,0.72);
  for(const s of [-1,1]) for(const yy of [0.5,0.78]) box(4.2,0.06,0.04,M.greyPl,-5.8+1.6,yy,s*1.2,g);
  for(const s of [-1,1]) for(const xx of [-3.7,-1.9]) box(0.05,0.4,0.04,M.greyPl,xx,0.68,s*1.2,g).castShadow=false;
  rbox(0.9,0.45,0.5,0.06,M.greyPl,-9.6,0.72,-0.95,g);                                     // инструментальный ящик
  { const sw=grp(-3.2,0.62,0,g); sw.rotation.z=Math.PI/2; tire(sw,0,0,0,0.5,0.3,'x'); }   // запасное колесо под рамой
  for(const s of [-1,1]){ box(0.08,0.16,0.44,M.blackPl,-1.72,0.95,s*0.95,g); box(0.02,0.12,0.36,M.lensRed,-1.675,0.95,s*0.95,g).castShadow=false; }
  box(0.1,0.14,2.3,M.greyPl,-1.72,0.55,0,g);
  /* сцепка: тягово-сцепное устройство и дышло прицепа, поворотный круг */
  box(0.3,0.16,0.3,M.chassis,-1.62,0.78,0,g);
  for(const s of [-1,1]){ const d=box(1.75,0.1,0.09,M.chassis,-0.62,0.8,s*0.26,g); d.rotation.y=s*0.3; }
  cyl(0.5,0.08,M.chassis,4.6-2.6,1.0,0,g,24);
  const b2=curtainBody(g,4.6,8.2,{lanes:o.lanes2||[-4.0,3.2],tall:o.tall!==undefined?o.tall:(o.open?0:1),open:o.open}); g.userData.b2=b2;
  wheel(g,4.6-2.6,0,0.54,true); wheel(g,4.6+1.6,0,0.54,true); wheel(g,4.6+2.95,0,0.54,true);
  for(const wx of [4.6-2.6,4.6+1.6,4.6+2.95]) for(const s of [-1,1]) fender(g,wx,s*0.95,0.54,0.72);
  for(const s of [-1,1]) for(const yy of [0.5,0.78]) box(2.6,0.06,0.04,M.greyPl,4.6-0.5,yy,s*1.2,g);
  rbox(0.8,0.42,0.5,0.06,M.greyPl,4.6-0.6,0.74,0.95,g);                                   // ящик для ремней и противооткатов
  for(const s of [-1,1]){ const at=cyl(0.13,0.8,M.chassis,4.6-0.5,0.82,s*0.2,g,12); at.rotation.z=Math.PI/2; }   // ресиверы
  /* задний свес: фонари, брус, номер */
  const rx=4.6+4.1+0.12;
  box(0.12,0.16,2.3,M.greyPl,rx+0.1,0.52,0,g);
  for(const s of [-1,1]){ box(0.08,0.16,0.44,M.blackPl,rx,0.95,s*0.95,g); box(0.02,0.12,0.36,M.lensRed,rx+0.045,0.95,s*0.95,g).castShadow=false; }
  for(let i=0;i<10;i++) box(0.01,0.1,0.2,i%2?M.reflWhite:M.reflRed,rx+0.165,0.52,-1.05+i*0.23,g).castShadow=false;
  const rp=new THREE.Mesh(new THREE.PlaneGeometry(0.52,0.12),plateMat(plate,'kz')); rp.position.set(rx+0.17,0.78,0); rp.rotation.y=Math.PI/2; g.add(rp);
  for(const s of [-1,1]){ box(0.03,0.5,0.62,M.blackPl,-5.8-2.5,0.32,s*1.12,g).castShadow=false; box(0.03,0.5,0.62,M.blackPl,4.6+3.75,0.32,s*1.12,g).castShadow=false; }
  TRK.cur=null;
  return g;
}

/* ---------- автопоезд-тандем 145 м³: грузовик + прицеп с центральными осями, низкий пол ----------
   Кузов по образцу на фото заказчика: под шторой — металлический каркас борта (стойки из профильной трубы
   и горизонтальные обрешётины), дуги и прогоны крыши, тёмный задний портал с дверями, пол из ламинированной фанеры.
   В середине правого (обращённого в зал) борта каждого кузова — проём без обрешётки: через него подают груз.
   Размеры модели: кузов 9,9 м, внутри 9,8 × 2,48 × 2,98 м ≈ 72,4 м³, два кузова ≈ 145 м³ (уточнять по паспорту ТС). */
const KZB={FY:0.95,IH:2.98,HW:1.275,L:9.9,GAP:1.1};
M.plyFloor=std(0x716b63,.72,.04); M.frameDark=std(0x3f454c,.5,.55); M.bulkTarp=std(0xa9adb0,.85,0);
function frameBody(g,off,len,o){
  o=o||{}; const FY=KZB.FY, IH=KZB.IH, HW=KZB.HW, RY=FY+IH, OW=KZB.GAP;
  const b=grp(off,0,0,g); b.userData.body={len,FY,IH,HW,gap:OW};
  /* рама, поперечины, пол, обвязка */
  for(const s of [-1,1]) box(len,0.2,0.09,M.chassis,0,FY-0.24,s*0.42,b);
  for(let i=0;i<Math.round(len/0.82);i++) box(0.07,0.1,HW*2-0.1,M.chassis,-len/2+0.3+i*0.82,FY-0.09,0,b).castShadow=false;
  box(len,0.06,HW*2,M.plyFloor,0,FY-0.01,0,b);
  for(let i=1;i<Math.round(len/1.25);i++) box(0.012,0.002,HW*2-0.1,M.dark,-len/2+i*1.25,FY+0.021,0,b).castShadow=false;   // стыки листов фанеры
  for(const s of [-1,1]){
    box(len,0.15,0.07,M.alu,0,FY-0.03,s*(HW+0.005),b);
    for(let i=0;i<Math.floor(len/0.42);i++) box(0.12,0.035,0.012,M.blackPl,-len/2+0.3+i*0.42,FY-0.01,s*(HW+0.042),b).castShadow=false;
    for(let i=0;i<Math.floor(len/0.6);i++) box(0.3,0.05,0.008,i%2?M.reflWhite:M.reflYellow,-len/2+0.3+i*0.6,FY-0.08,s*(HW+0.043),b).castShadow=false;
    box(len,0.12,0.08,M.alu,0,RY-0.06,s*HW,b);                                             // верхний пояс с рельсом шторы
    for(let i=0;i<Math.round(len/2.0);i++) box(0.09,0.05,0.03,M.lensAmber,-len/2+0.6+i*2.0,FY+0.09,s*(HW+0.06),b).castShadow=false;
  }
  /* крыша: дуги, два прогона, тент */
  const nb=Math.round(len/0.9);
  for(let i=0;i<=nb;i++) box(0.04,0.04,HW*2,M.galv,-len/2+0.06+i*((len-0.12)/nb),RY-0.03,0,b).castShadow=false;
  for(const s of [-1,1]) box(len-0.1,0.03,0.04,M.galv,0,RY-0.065,s*0.45,b).castShadow=false;
  box(len+0.02,0.03,HW*2+0.06,M.tarp,0,RY+0.02,0,b);
  /* передний борт: тент на каркасе с обрешёткой */
  box(0.03,IH+0.06,HW*2+0.02,M.bulkTarp,-len/2+0.015,FY+IH/2,0,b);
  for(const zz of [-HW+0.06,-0.42,0.42,HW-0.06]) box(0.045,IH-0.06,0.045,M.galv,-len/2+0.055,FY+IH/2,zz,b).castShadow=false;
  for(let i=0;i<7;i++) box(0.03,0.03,HW*2-0.12,M.galv,-len/2+0.06,FY+0.3+i*0.42,0,b).castShadow=false;
  /* задний портал — тёмная сталь, двери, штанги запоров, петли */
  for(const s of [-1,1]) box(0.1,IH,0.1,M.frameDark,len/2-0.05,FY+IH/2,s*(HW-0.03),b);
  box(0.1,0.12,HW*2,M.frameDark,len/2-0.05,RY-0.06,0,b); box(0.1,0.1,HW*2,M.frameDark,len/2-0.05,FY-0.03,0,b);
  for(const s of [-1,1]){
    box(0.04,IH-0.14,HW-0.08,M.frameDark,len/2-0.02,FY+IH/2,s*(HW/2-0.01),b);
    for(const zz of [0.24,0.86]){ cyl(0.016,IH-0.12,M.galv,len/2+0.02,FY+IH/2,s*HW*zz,b,8).castShadow=false;
      box(0.03,0.05,0.2,M.galv,len/2+0.03,FY+1.05,s*(HW*zz+0.08),b).castShadow=false; }
    for(const yy of [0.3,1.4,2.5]) box(0.03,0.12,0.07,M.steelDark,len/2+0.015,FY+yy,s*(HW-0.06),b).castShadow=false;
  }
  /* каркас бортов: стойки из трубы и шесть обрешётин; в середине правого борта — проём */
  const np=Math.round((len-0.3)/0.96), px=i=>-len/2+0.15+i*((len-0.3)/np), RAILS=[0.38,0.8,1.22,1.64,2.06,2.48], zl=HW-0.035;
  for(const s of [-1,1]){
    for(let i=0;i<=np;i++){ const x=px(i); if(s>0&&Math.abs(x)<OW-0.02) continue; box(0.045,IH-0.14,0.045,M.galv,x,FY+IH/2,s*zl,b); }
    if(s<0) for(const y of RAILS) box(len-0.3,0.035,0.022,M.galv,0,FY+y,s*(zl-0.03),b).castShadow=false;
    else for(const y of RAILS) for(const e of [-1,1]){ const a=e<0?-len/2+0.15:OW, c=e<0?-OW:len/2-0.15;
      box(c-a,0.035,0.022,M.galv,(a+c)/2,FY+y,zl-0.03,b).castShadow=false; }
  }
  for(const e of [-1,1]) box(0.06,IH-0.14,0.06,M.alu,e*OW,FY+IH/2,zl,b);                    // стойки проёма
  for(const e of [-1,1]) box(0.012,0.5,0.045,M.reflYellow,e*OW,FY+0.5,zl+0.031,b).castShadow=false;   // метки на стойках проёма
  /* левая штора закрыта: полотно, ремни, пряжки */
  { const L=len-0.18; box(L,IH-0.2,0.035,M.tarp,-0.02,FY+IH/2,-(HW+0.02),b);
    for(let i=0;i<Math.floor(L/0.55);i++){ box(0.045,IH-0.3,0.012,M.blackPl,-len/2+0.36+i*0.55,FY+IH/2,-(HW+0.045),b).castShadow=false;
      box(0.06,0.09,0.02,M.chrome,-len/2+0.36+i*0.55,FY+0.24,-(HW+0.05),b).castShadow=false; }
    box(L,0.3,0.004,M.tarpBlue,-0.02,RY-0.35,-(HW+0.04),b).castShadow=false; }
  /* правая штора — полотнища; curtainSet(b,u) собирает её к переднему борту */
  const near=grp(0,0,0,b); b.userData.near=near;
  const x0=-len/2+0.1, n=Math.round((len-0.2)/0.275), w=(len-0.2)/n, C={strips:[],posts:[],x0,w,pitch:0.03,ang:1.462,u:0};
  for(let i=0;i<n;i++){ const st=grp(x0+w*(i+0.5),FY+IH/2,HW+0.03,near);
    box(w+0.004,IH-0.2,0.012,M.tarp,0,0,0,st);
    box(w+0.004,0.3,0.004,M.tarpBlue,0,IH/2-0.35,0.009,st).castShadow=false;
    if(i%2===0){ box(0.045,IH-0.3,0.01,M.blackPl,0,0,0.012,st).castShadow=false; box(0.06,0.09,0.02,M.chrome,0,-IH/2+0.24,0.018,st).castShadow=false; }
    cyl(0.018,0.03,M.steelDark,0,IH/2-0.07,-0.02,st,8).castShadow=false;
    C.strips.push(st); }
  b.userData.curt=C; curtainSet(b,o.open||0);
  if(o.lanes) kzLanes(b,FY+0.02,o.lanes[0],o.lanes[1],o.tall);
  return b;
}
function tandem145(x,z,rotY,o){
  o=o||{}; const g=grp(x,0,z,G.trucks); g.rotation.y=rotY||0; g.userData.truck={kind:'kz145'};
  const plate=o.plate||'248 KZA 13', L=KZB.L, O1=-5.8, O2=O1+L+1.0, cx=-12.9, R1=0.42, R2=0.40;
  TRK.cur={paint:TRK.paints.white,style:'eu',plate,plateKind:'kz'};
  ao(31,3.6,-1.6,0,g);
  /* грузовик */
  const b1=frameBody(g,O1,L,{lanes:o.lanes1,tall:o.tall,open:o.open}); g.userData.b1=b1;
  cab(g,cx,-1,true);
  for(const s of [-1,1]) box(11.6,0.22,0.09,M.chassis,cx+5.6,0.7,s*0.45,g);
  for(const s of [-1,1]) tire(g,cx,0.54,s*1.03,0.54,0.315,'z');
  for(const wx of [O1+1.3,O1+2.55]){ wheel(g,wx,0,R1,true); for(const s of [-1,1]) fender(g,wx,s*0.95,R1,0.72); }
  for(const s of [-1,1]) for(const yy of [0.42,0.64]) box(4.6,0.06,0.04,M.greyPl,O1-1.9,yy,s*1.2,g);          // боковая защита
  for(const s of [-1,1]) for(const xx of [O1-3.9,O1-1.9,O1+0.1]) box(0.05,0.34,0.04,M.greyPl,xx,0.55,s*1.2,g).castShadow=false;
  rbox(0.9,0.4,0.5,0.06,M.greyPl,O1-3.2,0.58,-0.95,g);                                     // инструментальный ящик
  const r1=O1+L/2;
  for(const s of [-1,1]){ box(0.08,0.14,0.42,M.blackPl,r1+0.05,0.74,s*0.95,g); box(0.02,0.1,0.34,M.lensRed,r1+0.095,0.74,s*0.95,g).castShadow=false; }
  box(0.1,0.12,2.3,M.greyPl,r1+0.02,0.5,0,g);
  for(const s of [-1,1]) box(0.03,0.42,0.62,M.blackPl,O1+3.45,0.26,s*1.12,g).castShadow=false;
  /* сцепка: жёсткое дышло прицепа с центральными осями */
  box(0.3,0.16,0.3,M.chassis,r1+0.1,0.6,0,g);
  box(O2-r1-0.2,0.12,0.16,M.chassis,(r1+O2)/2+0.1,0.6,0,g);
  /* прицеп */
  const b2=frameBody(g,O2,L,{lanes:o.lanes2,tall:o.tall,open:o.open}); g.userData.b2=b2;
  for(const wx of [O2-0.68,O2+0.68]){ wheel(g,wx,0,R2,true); for(const s of [-1,1]) fender(g,wx,s*0.95,R2,0.72); }
  for(const s of [-1,1]) for(const yy of [0.42,0.64]) for(const e of [-1,1]) box(2.9,0.06,0.04,M.greyPl,O2+e*3.05,yy,s*1.2,g);
  rbox(0.8,0.38,0.5,0.06,M.greyPl,O2-2.9,0.56,0.95,g);                                     // ящик для ремней и упоров
  for(const s of [-1,1]){ const at=cyl(0.12,0.8,M.chassis,O2+2.6,0.6,s*0.2,g,12); at.rotation.z=Math.PI/2; }
  for(const s of [-1,1]) for(const e of [-1,1]){ box(0.07,0.5,0.07,M.chassis,O2+e*3.9,0.42,s*0.6,g); box(0.2,0.03,0.2,M.chassis,O2+e*3.9,0.17,s*0.6,g).castShadow=false; }   // опорные стойки
  const rx=O2+L/2+0.05;
  box(0.12,0.14,2.3,M.greyPl,rx+0.08,0.46,0,g);
  for(const s of [-1,1]){ box(0.08,0.14,0.42,M.blackPl,rx,0.74,s*0.95,g); box(0.02,0.1,0.34,M.lensRed,rx+0.045,0.74,s*0.95,g).castShadow=false; }
  for(let i=0;i<10;i++) box(0.01,0.1,0.2,i%2?M.reflWhite:M.reflRed,rx+0.145,0.46,-1.05+i*0.23,g).castShadow=false;
  const rp=new THREE.Mesh(new THREE.PlaneGeometry(0.52,0.12),plateMat(plate,'kz')); rp.position.set(rx+0.15,0.64,0); rp.rotation.y=Math.PI/2; g.add(rp);
  for(const s of [-1,1]) box(0.03,0.42,0.62,M.blackPl,O2+1.6,0.26,s*1.12,g).castShadow=false;
  TRK.cur=null;
  return g;
}
