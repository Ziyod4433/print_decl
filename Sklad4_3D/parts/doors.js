/* ---------- секционные ворота: 8 панелей едут по направляющим под кровлю ---------- */
const DOORS=[];
function sectionalDoor(xFix,inS,gz,gw,gh){
  const g=grp(0,0,0,G.walls), NP=8, ph=gh/NP, Rr=0.42, IN=0.19;
  const panels=[];
  for(let i=0;i<NP;i++){
    const p=new THREE.Group(); g.add(p);
    box(0.045,ph-0.01,gw+0.08,M.doorPanel,0,0,0,p);
    for(const y of [-0.17,0.17]) box(0.052,0.012,gw+0.06,M.doorRib,0,y*ph,0,p).castShadow=false;   // V-образные пазы
    if(i===5) for(let k=0;k<4;k++){                                      // ряд окон
      const zc=-gw/2+0.52+k*(gw-1.04)/3;
      box(0.056,ph*0.5,0.62,M.doorGlass,0,0,zc,p).castShadow=false;
      box(0.058,ph*0.56,0.03,M.doorRib,0,0,zc-0.32,p); box(0.058,ph*0.56,0.03,M.doorRib,0,0,zc+0.32,p);
    }
    if(i===0){ box(0.07,0.05,gw+0.08,M.rubber,0,-ph/2+0.02,0,p);         // нижний уплотнитель
      box(0.05,0.06,0.16,M.dark,inS*0.04,-ph/2+0.12,gw/2-0.3,p); }       // ручка
    for(let k=0;k<3;k++) box(0.03,0.06,0.08,M.galv,inS*0.035,ph/2-0.01,-gw/2+0.2+k*(gw-0.4)/2,p);   // петли
    for(const s of [-1,1]) cyl(0.03,0.04,M.dark,xFix*0+inS*0.05,0,s*(gw/2+0.02),p,10).rotation.x=Math.PI/2;   // ролики
    panels.push(p);
  }
  for(const s of [-1,1]){                                                // направляющие
    const zz=gz+s*(gw/2+0.07);
    box(0.07,gh+0.1,0.06,M.galv,xFix+inS*IN,(gh+0.1)/2,zz,g);
    box(gh+0.3,0.07,0.06,M.galv,xFix+inS*(IN+Rr+(gh+0.3)/2),gh+Rr,zz,g);
    const c=box(0.62,0.07,0.06,M.galv,xFix+inS*(IN+Rr*0.3),gh+Rr*0.7,zz,g); c.rotation.z=inS*0.78;
    box(0.04,0.55,0.04,M.galv,xFix+inS*(IN+Rr+gh*0.8),gh+Rr+0.3,zz,g);  // подвес к ферме
  }
  cyl(0.045,gw+0.5,M.steelDark,xFix+inS*(IN+0.18),gh+Rr+0.32,gz,g,10).rotation.x=Math.PI/2;   // пружинный вал
  for(const s of [-1,1]) cyl(0.07,0.62,M.dark,xFix+inS*(IN+0.18),gh+Rr+0.32,gz+s*0.62,g,12).rotation.x=Math.PI/2;
  box(0.34,0.42,0.3,M.steelDark,xFix+inS*(IN+0.22),gh+Rr+0.18,gz+gw/2+0.55,g);                // привод
  box(0.05,0.34,0.22,M.yellow,xFix+inS*0.3,1.35,gz+gw/2+0.62,g);                                // пост кнопок
  cyl(0.03,0.02,M.red,xFix+inS*0.33,1.42,gz+gw/2+0.62,g,12).rotation.z=Math.PI/2;
  const d={g,panels,xFix,inS,gz,gw,gh,ph,R:Rr,IN,NP,open:0};
  DOORS.push(d); return d;
}
function doorSet(d,o){
  d.open=o; const tr=o*(d.gh+0.12);
  d.panels.forEach((p,i)=>{
    const s=(i+0.5)*d.ph+tr; let x,y,a;
    if(s<=d.gh){ x=0; y=s; a=0; }
    else { const u=s-d.gh, q=Math.PI*d.R/2;
      if(u<q){ a=u/d.R; x=d.R-d.R*Math.cos(a); y=d.gh+d.R*Math.sin(a); }
      else { a=Math.PI/2; x=d.R+(u-q); y=d.gh+d.R; } }
    p.position.set(d.xFix+d.inS*(d.IN+x),y,d.gz); p.rotation.z=-d.inS*a;
  });
}
const DOOR={ L1:sectionalDoor(0,1,GATES[0].z,GATES[0].w,GATE_H), L2:sectionalDoor(0,1,GATES[1].z,GATES[1].w,GATE_H),
             P1:sectionalDoor(W,-1,GATES[0].z,GATES[0].w,GATE_H), P2:sectionalDoor(W,-1,GATES[1].z,GATES[1].w,GATE_H) };
const DOOR_DEF={L1:1,L2:0.96,P1:1,P2:0.96};
for(const k in DOOR) doorSet(DOOR[k],DOOR_DEF[k]);
