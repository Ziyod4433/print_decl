/* ---------- [4] юнитизация: паллетообмотчик с поворотным столом (мачта с западной стороны, как в исходной расстановке; пандус с юга) ---------- */
const WRAP={};
{
  const g=grp(13.4,0,10.6); WRAP.g=g;
  const OR=std(0xf05500,.46,.14), Rr=0.8, MZ=-(Rr+0.46);
  ao(2.7,2.2,-0.3,0,g);
  cyl(Rr+0.07,0.1,M.steelDark,0,0.05,0,g,36);
  const ring=mesh(new THREE.TorusGeometry(Rr+0.07,0.014,6,48),M.yellow,0,0.1,0,g); ring.rotation.x=Math.PI/2;
  { const rg=grp(0,0,0,g); rg.rotation.y=-Math.PI/2;                      // въездной пандус под рохлю — с юга
    const rp=box(0.62,0.035,1.1,M.steelDark,-(Rr+0.36),0.052,0,rg); rp.rotation.z=0.17;
    for(let i=0;i<5;i++){ const rb=box(0.03,0.012,1.0,M.galv,-(Rr+0.14)-i*0.1,0.085-i*0.017,0,rg); rb.rotation.z=0.17; rb.castShadow=false; } }
  const tt=grp(0,0.1,0,g); WRAP.tt=tt;
  cyl(Rr,0.05,M.galv,0,0.025,0,tt,36);
  for(let i=0;i<8;i++) box(0.05,0.012,Rr*1.9,std(0x8d949b,.5,.4),0,0.055,0,tt).rotation.y=i*Math.PI/8;
  /* мачта, направляющая, каретка с рулоном — узел повёрнут на запад */
  const mg=grp(0,0,0,g); mg.rotation.y=Math.PI/2; WRAP.mast=mg;
  box(0.66,0.07,0.52,OR,0,0.035,MZ,mg);
  box(0.24,2.45,0.24,OR,0,1.26,MZ,mg); box(0.3,0.06,0.3,OR,0,2.51,MZ,mg);
  box(0.05,2.2,0.05,M.galv,0.15,1.26,MZ+0.13,mg); box(0.05,2.2,0.05,M.galv,-0.15,1.26,MZ+0.13,mg);
  const car=grp(0,0.55,MZ,mg); WRAP.car=car;
  box(0.46,0.44,0.30,M.steelDark,0,0,0.21,car);
  box(0.48,0.06,0.32,OR,0,0.24,0.21,car);
  cyl(0.115,0.52,std(0xeef2f5,.45,.05),0,0,0.45,car,20);                   // рулон стрейч-плёнки
  cyl(0.04,0.56,M.galv,0,0,0.45,car,10);
  for(const s of [-1,1]) cyl(0.032,0.56,M.galv,s*0.17,0,0.36,car,12);        // ролики предрастяжения
  const strip=box(0.016,0.46,0.44,M.filmSheet,0.0,0,0.78,car); strip.castShadow=false; strip.visible=false; WRAP.strip=strip;
  /* пульт с кнопками и аварийным грибком */
  const pn=grp(0.45,1.25,MZ,mg);
  rbox(0.24,0.34,0.16,0.03,M.steelDark,0,0,0,pn);
  box(0.16,0.07,0.01,std(0x9fe3a8,.3,0,{emissive:0x4ec463,emissiveIntensity:.7}),0,0.09,0.081,pn).castShadow=false;
  cyl(0.03,0.03,M.red,-0.05,-0.06,0.09,pn,12).rotation.x=Math.PI/2;
  cyl(0.02,0.02,M.green,0.06,-0.06,0.085,pn,10).rotation.x=Math.PI/2;
  box(0.08,0.8,0.08,M.steelDark,0.45,0.65,MZ,mg);
  /* штатная паллета на столе */
  const load=grp(0,0,0,tt); WRAP.load=load;
  pallet(load,0,0.05,0);
  for(let r=0;r<3;r++) for(let i=0;i<2;i++) for(let j=0;j<2;j++)
    box(0.57,0.38,0.39,M.carton,(i-0.5)*0.59,0.25+0.395*r,(j-0.5)*0.41,load);
  box(1.22,1.24,0.86,M.film,0,0.72,0,load).castShadow=false;
  tagEq(g,3,[13.4,1.4,10.6],11);
}
WRAP.g.userData.removed=true;                                 // обмотчик убран из модели (номер в редакторе сохранён)
