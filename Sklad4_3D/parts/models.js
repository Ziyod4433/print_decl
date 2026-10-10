/* ==========================================================================
   ДЕТАЛИЗАЦИЯ МОДЕЛЕЙ
   · ручная гидравлическая тележка (рохля) 2,5 т и электротележка: вилы-швеллеры с носком-клином, тандемные ролики,
     толкатели, гидроузел с поршнем, рулевые колёса из полиуретана, дышло с петлёй-рукоятью и рычагом;
     у электрической — кожух АКБ, пульт с кнопками и «грибком» аварийной остановки;
   · осевые вытяжные вентиляторы на стенах (как на фото зала): короб, обечайка, крыльчатка вращается, защитная решётка.
   Габариты прежние (вилы 1,15 м вперёд по +z, дышло назад), поэтому расстановка и проверки столкновений не меняются.
   ========================================================================== */
function palletJack(x,z,rot,electric){
  const g=grp(x,0,z); g.rotation.y=rot||0;
  const body=electric?M.green:std(0xc4271c,.45,.25), dk=M.steelDark, pu=std(0xd8892a,.6,0), hub=std(0x2b2f35,.5,.4);
  ao(0.8,1.9,0,0.1,g);
  /* вилы: швеллер 160 мм полкой вверх, клин к носку, ролики внутри */
  for(const s of [-1,1]){ const fx=s*0.19;
    box(0.16,0.012,1.02,body,fx,0.079,0.37,g);                                   // полка
    for(const e of [-1,1]) box(0.01,0.058,1.02,body,fx+e*0.075,0.053,0.37,g);    // стенки
    const tip=box(0.16,0.012,0.14,body,fx,0.064,0.935,g); tip.rotation.x=0.22;    // носок-клин
    for(const e of [-1,1]){ const w=box(0.01,0.04,0.13,body,fx+e*0.075,0.044,0.93,g); w.rotation.x=0.22; }
    for(const zz of [0.80,0.885]) cyl(0.036,0.05,pu,fx,0.036,zz,g,14).rotation.z=Math.PI/2;      // тандемные ролики
    cyl(0.012,0.17,M.galv,fx,0.036,0.842,g,8).rotation.z=Math.PI/2;
    cyl(0.018,0.02,pu,fx,0.03,0.99,g,10).rotation.z=Math.PI/2;                                   // заходной ролик
    const rodp=box(0.03,0.02,0.86,M.galv,fx,0.06,0.33,g); rodp.castShadow=false;                  // толкатель внутри вилы
  }
  /* поперечина у основания вил, опорная рама гидроузла */
  rbox(0.54,0.10,0.16,0.02,body,0,0.10,-0.12,g);
  rbox(0.30,0.20,0.22,0.03,body,0,0.20,-0.30,g);
  for(const s of [-1,1]) box(0.03,0.16,0.20,body,s*0.155,0.17,-0.30,g);
  /* гидроузел: цилиндр, хромированный поршень, обратный клапан */
  cyl(0.058,0.26,dk,0,0.36,-0.34,g,18);
  cyl(0.068,0.03,body,0,0.245,-0.34,g,18);
  cyl(0.024,0.10,M.chrome||M.galv,0,0.53,-0.34,g,12);
  cyl(0.018,0.04,dk,0.06,0.30,-0.40,g,8).rotation.z=Math.PI/2;
  /* рулевой узел: вилка и два колеса Ø200 из полиуретана */
  box(0.22,0.05,0.12,dk,0,0.20,-0.43,g);
  for(const s of [-1,1]){ const w=grp(s*0.075,0.10,-0.43,g);
    cyl(0.10,0.05,pu,0,0,0,w,22).rotation.z=Math.PI/2;
    cyl(0.055,0.056,hub,0,0,0,w,14).rotation.z=Math.PI/2; }
  cyl(0.014,0.22,M.galv,0,0.10,-0.43,g,8).rotation.z=Math.PI/2;
  /* дышло: наклонено назад, две трубы, петля-рукоять с рычагом подъёма */
  const h=grp(0,0.42,-0.43,g); h.rotation.x=-0.32;
  cyl(0.035,0.08,dk,0,0.0,0,h,12).rotation.z=Math.PI/2;                         // шарнир
  for(const s of [-1,1]) cyl(0.017,0.96,electric?dk:body,s*0.04,0.50,0,h,10);
  const loop=new THREE.Mesh(new THREE.TorusGeometry(0.15,0.019,8,24,Math.PI),M.dark); loop.position.set(0,0.98,0); loop.castShadow=true; h.add(loop);
  for(const s of [-1,1]) cyl(0.019,0.12,M.dark,s*0.15,0.92,0,h,10);
  cyl(0.022,0.12,std(0x1a1c1f,.85,0),0,1.13,0,h,10).rotation.z=Math.PI/2;      // резиновая накладка
  const lev=box(0.07,0.014,0.03,M.yellow,0.07,1.06,0.02,h); lev.rotation.z=0.4; // рычаг: подъём / нейтраль / опускание
  if(electric){
    /* электротележка: кожух АКБ над рамой, пульт на дышле, аварийный «грибок» */
    rbox(0.56,0.36,0.34,0.05,body,0,0.42,-0.42,g);
    box(0.40,0.02,0.24,M.dark,0,0.605,-0.42,g).castShadow=false;
    const lbl=box(0.2,0.08,0.005,M.yellow,0,0.45,-0.252,g); lbl.castShadow=false;
    rbox(0.22,0.07,0.12,0.02,M.dark,0,1.05,0.02,h);
    cyl(0.012,0.012,M.yellow,-0.05,1.09,0.04,h,10); cyl(0.012,0.012,M.yellow,0.05,1.09,0.04,h,10);
    cyl(0.026,0.025,std(0xd02018,.4,0),0,1.095,-0.02,h,14);
    cyl(0.03,0.04,dk,0,0.56,-0.62,g,12);                                         // ключ / разъём зарядки
  }
  return g;
}

/* ---------- осевые вытяжные вентиляторы на стенах ---------- */
HALL.spin=[];
HALL.fans=()=>{
  const housing=std(0x2a2e33,.55,.35), blade=std(0x8f979e,.35,.7), grille=std(0x1f2226,.5,.5);
  const fan=(x,y,z,ry)=>{ const g=grp(x,y,z,G.walls); g.rotation.y=ry;          // локально: ось вентилятора — +z (в зал)
    box(1.06,1.06,0.10,housing,0,0,0.05,g);
    for(const s of [-1,1]){ box(1.06,0.08,0.34,housing,0,s*0.49,0.17,g); box(0.08,1.06,0.34,housing,s*0.49,0,0.17,g); }
    const shr=new THREE.Mesh(new THREE.CylinderGeometry(0.46,0.46,0.31,32,1,true),HALL.fanShroud||(HALL.fanShroud=std(0x24282c,.6,.3,{side:THREE.DoubleSide})));   // обечайка — открытая труба
    shr.rotation.x=Math.PI/2; shr.position.z=0.17; shr.castShadow=true; shr.receiveShadow=true; g.add(shr);
    /* крыльчатка: ступица и 5 лопастей с углом атаки */
    const rot=new THREE.Group(); rot.position.z=0.2; g.add(rot);
    const hb=cyl(0.075,0.12,M.dark,0,0,0,rot,16); hb.rotation.x=Math.PI/2;
    for(let i=0;i<5;i++){ const a=i/5*Math.PI*2, bl=new THREE.Group(); bl.rotation.z=a; rot.add(bl);
      const b=box(0.10,0.34,0.008,blade,0,0.25,0,bl); b.rotation.y=0.45; b.scale.x=1; }
    /* защитная решётка со стороны зала: кольца и спицы */
    for(const r of [0.12,0.24,0.36,0.45]){ const t=new THREE.Mesh(new THREE.TorusGeometry(r,0.006,4,40),grille); t.position.z=0.345; g.add(t); }
    for(let i=0;i<8;i++){ const s=box(0.012,0.92,0.012,grille,0,0,0.345,g); s.rotation.z=i/8*Math.PI; s.castShadow=false; }
    const mt=cyl(0.09,0.14,M.dark,0,0,0.1,g,14); mt.rotation.x=Math.PI/2;      // двигатель за решёткой
    g.userData.nm='Осевой вытяжной вентилятор';
    HALL.spin.push({o:rot,sp:7.5+HALL.R()*2.5,ph:HALL.R()*6});
    return g; };
  for(const z of [17.6,24.7]){ fan(0.14,5.2,z,Math.PI/2); fan(W-0.14,5.2,z,-Math.PI/2); }   // боковые стены — между пилястрами
  for(const x of [36.5,43.0]) fan(x,5.2,0.14,0);                                             // южный торец над сервисным блоком
};
HALL.tick=t=>{ for(const s of HALL.spin) s.o.rotation.z=s.ph+t*s.sp; };   // вращение — функция времени (в фильме — время кадра)
HALL.fans();
