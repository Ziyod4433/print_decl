/* ---------- телескопический ленточный конвейер: база 4,6 м + две выдвижные секции до 9 м ----------
   Секции — отдельные группы, поэтому выдвижение можно менять на ходу: g.userData.tele.setExt(0…1)
   (в живом процессе и фильме конвейер стоит сложенным и выдвигается в кузов после остановки машины и открытия ворот).
   Геометрия каждой секции строится относительно её переднего (носового) края; площадка оператора едет с носовой секцией. */
function telescopicConveyor(x,z,rotY,lift,tilt,ext,dir){
  const g=grp(x,0,z,G.equip); g.rotation.y=rotY||0;
  lift=lift===undefined?0.70:lift;
  tilt=tilt===undefined?0:tilt;                                 // уклон стрелы, градусы (+ вверх)
  ext =ext===undefined?1:ext;                                   // выдвижение секций 0…1
  dir =(dir===undefined?1:dir)<0?-1:1;                          // направление хода коробов
  ao(11.0,1.7,-0.4,0,g);
  const OR=std(0xf05500,.46,.14), YL=std(0xffc400,.46,.10);     // оранжевая сталь и жёлтая площадка
  const V3=(a,b,c)=>new THREE.Vector3(a,b,c);
  const T=tilt*Math.PI/180, PX=-4.30, PY=0.90+lift;             // шарнир стрелы над задней опорой
  const boom=grp(PX,PY,0,g); boom.rotation.z=T;
  const bp=(px,py)=>[px-PX,py-PY];
  const rotPt=(px,py)=>{ const dx=px-PX,dy=py-PY,c=Math.cos(T),si=Math.sin(T);
    return V3(PX+dx*c-dy*si, PY+dx*si+dy*c, 0); };
  const st8=(a,b,th,mat,par)=>{ const d=b.clone().sub(a),L=d.length(); if(L<1e-4) return null;
    const m=box(L,th,th,mat,0,0,0,par||g);
    m.position.copy(a).addScaledVector(d,0.5);
    m.quaternion.setFromUnitVectors(V3(1,0,0),d.clone().normalize()); return m; };
  const BW=0.80;
  /* три вложенные секции: длина постоянна, выдвигается передний край; носовая — до 9 м за базу */
  const SECD=[[4.60,1.18,0.34,1.10+lift],[4.90,1.02,0.29,1.055+lift],[4.70,0.88,0.24,1.015+lift]];   // длина, ширина рамы, глубина, верх ленты
  const secG=[];
  SECD.forEach((s,i)=>{
    const [L,fw,dep,top]=s, bw=BW-i*0.07, sg=grp(0,0,0,boom); secG.push(sg);   // sg.position.x — передний край секции (в координатах стрелы)
    const ct=top-PY, ccx=-L/2;                                                   // в секции: x от −L (хвост) до 0 (нос)
    for(const sgn of [-1,1]){
      box(L,dep,0.055,OR,ccx,ct-dep/2-0.03,sgn*fw/2,sg);
      box(L,0.05,0.10,OR,ccx,ct-0.025,sgn*(fw/2-0.04),sg);
      box(L-0.2,0.03,0.16,M.galv,ccx,ct-0.005,sgn*(bw/2+0.10),sg).castShadow=false;
    }
    box(L,0.03,fw-0.16,OR,ccx,ct-dep-0.02,0,sg);
    box(L-0.10,0.06,bw,M.dark,ccx,ct-0.03,0,sg);
    const stp=beltStripe();
    const sp=box(L-0.30,0.008,bw-0.06,stp.m,ccx,ct+0.004,0,sg); sp.castShadow=false;
    stp.t.repeat.set(Math.max(2,Math.round(L*1.4)),1);
    beltRuns.push({tex:stp.t,sp:0.5*dir});
    cyl(0.055,bw+0.03,M.galv,-0.07,ct-0.03,0,sg,16).rotation.x=Math.PI/2;
    cyl(0.035,bw,M.galv,-L+0.12,ct-dep+0.06,0,sg,12).rotation.x=Math.PI/2;
  });
  /* приводной барабан и мотор-редуктор на хвосте стрелы */
  const [dx0,dy0]=bp(-4.30,1.07+lift);
  cyl(0.075,BW+0.06,M.galv,dx0,dy0,0,boom,18).rotation.x=Math.PI/2;
  const [mx,my]=bp(-4.24,0.66+lift);
  box(0.30,0.28,0.24,M.steelDark,mx,my,0.74,boom);
  cyl(0.085,0.26,M.steelDark,mx,my,0.98,boom,14).rotation.x=Math.PI/2;
  box(0.12,0.12,0.14,M.steelDark,mx,my+0.18,0.74,boom);
  /* задняя опора базы */
  for(const sg of [-1,1]){
    st8(V3(-4.20,0,sg*0.66),V3(-4.08,PY-0.14,sg*0.60),0.085,OR);
    box(0.26,0.035,0.26,OR,-4.20,0.018,sg*0.66,g);
  }
  box(0.09,0.09,1.24,OR,-4.10,0.30,0,g);
  /* передняя опора-гидроцилиндр: длина следует за уклоном */
  {
    const topPt=rotPt(-1.35,0.90+lift-0.30);
    for(const sg of [-1,1]){
      const a=V3(-1.35,0.05,sg*0.62), b=V3(topPt.x,topPt.y,sg*0.60);
      st8(a,b,0.11,M.steelDark);                                  // корпус цилиндра
      st8(a.clone().lerp(b,0.55),b,0.062,M.galv);                 // шток
      box(0.26,0.035,0.26,OR,-1.35,0.018,sg*0.66,g);
    }
    box(0.09,0.09,1.24,OR,-1.35,0.26,0,g);
    st8(V3(-4.05,0.26,0.62),V3(-1.42,0.26,0.62),0.06,OR);
    st8(V3(-4.05,0.26,-0.62),V3(-1.42,0.26,-0.62),0.06,OR);
  }
  /* площадка оператора на выдвижном конце — в носовой секции */
  {
    const PYd=0.46+lift, pw=0.98, pd=0.86;
    const pl=grp(-0.68,PYd-PY,-0.92,secG[2]);
    const pb=(w,hh,d,mat,px,py,pz)=>box(w,hh,d,mat,px,py,pz,pl);
    pb(pw,0.05,pd,YL,0,0,0);
    pb(pw-0.10,0.012,pd-0.10,M.galv,0,0.032,0).castShadow=false;
    pb(pw,0.09,0.09,YL,0,-0.07,-pd/2+0.05);
    pb(0.09,0.09,pd,YL,-pw/2+0.05,-0.07,0);
    const RH=1.02;
    [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([sx,sz])=>
      pb(0.055,RH,0.055,YL,sx*(pw/2-0.05),RH/2,sz*(pd/2-0.05)));
    [RH,RH*0.55].forEach(hh=>{
      pb(pw-0.10,0.05,0.05,YL,0,hh,-pd/2+0.05);
      pb(0.05,0.05,pd-0.10,YL,-pw/2+0.05,hh,0);
      pb(0.05,0.05,pd-0.10,YL, pw/2-0.05,hh,0);
    });
    for(const sx of [-1,1]){
      pb(0.07,0.07,0.56,OR,sx*(pw/2-0.16),-0.07,pd/2+0.22);
      pb(0.05,0.37,0.05,OR,sx*(pw/2-0.16),0.12,pd/2+0.47);
    }
    pb(0.05,0.62,0.05,YL,-pw/2+0.05,0.31,pd/2-0.30);
    pb(0.15,0.24,0.13,M.alu,-pw/2+0.02,0.58,pd/2-0.30);
    pb(0.03,0.05,0.05,M.green,-pw/2-0.06,0.62,pd/2-0.30);
  }
  /* короба на ленте — едут в системе координат стрелы, уклон отрабатывается сам; носовой конец ленты следует за выдвижением */
  const cargo=[];
  {
    const yBase=bp(0,1.10+lift)[1]+0.17, yTip=bp(0,1.015+lift)[1]+0.17;
    const cx0=bp(-4.10,0)[0], cx1=bp(0.1+9.0*ext-0.35,0)[0];
    for(let i=0;i<3;i++){
      const c=box(0.52,0.34,0.44,M.carton,cx0,yBase,0,boom);
      box(0.54,0.03,0.10,M.dark,0,0.17,0,c).castShadow=false;
      const e=dir>0?{o:c,x0:cx0,x1:cx1,t:i/3,sp:0.075,y0:yBase,y1:yTip}
                   :{o:c,x0:cx1,x1:cx0,t:i/3,sp:0.075,y0:yTip,y1:yBase};
      beltCargo.push(e); cargo.push(e);
    }
  }
  const tele={boom,secG,dir,get ext(){ return ext; },
    setExt(e){ ext=Math.max(0,Math.min(1,e)); const midX1=4.5*ext, tipX1=0.1+9.0*ext;
      secG[1].position.x=midX1-PX; secG[2].position.x=tipX1-PX;
      const cx1=bp(tipX1-0.35,0)[0]; cargo.forEach(c=>{ if(dir>0) c.x1=cx1; else c.x0=cx1; });
      g.userData.teleExt=ext; }};
  tele.setExt(ext);
  g.userData.tele=tele;
  return g;
}
