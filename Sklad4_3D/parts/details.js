/* ====================== ПРОЕЗДЫ МЕЖДУ СЕКЦИЯМИ И ДЕТАЛИ ЗДАНИЯ ======================
   Проезды для погрузчика у линий колонн: южная магистраль ↔ северная магистраль ↔ крытый пост.
   Разметка, отбойные ограждения, сферические зеркала, подвесные таблички, знаки на стенах и колоннах. */
function signTex(lines,bg,fg,w,h,o){
  o=o||{}; const c=cnv(w,h), g=c.getContext('2d'); g.fillStyle=bg; g.fillRect(0,0,w,h);
  if(o.border){ g.strokeStyle=o.border; g.lineWidth=h*0.05; g.strokeRect(h*0.05,h*0.05,w-h*0.1,h-h*0.1); }
  g.fillStyle=fg; g.textAlign='center'; g.textBaseline='middle';
  const n=lines.length; lines.forEach((t,i)=>{ let px=(o.px||[])[i]||h*0.6/n*1.2; g.font=`700 ${px}px "Barlow Condensed","Roboto Condensed",sans-serif`;
    const tw=g.measureText(t).width; if(tw>w*0.9){ px*=w*0.9/tw; g.font=`700 ${px}px "Barlow Condensed","Roboto Condensed",sans-serif`; }
    g.fillText(t,w/2,h*(i+0.5)/n+(o.dy||0)); });
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=ANISO; return t; }
function signBoard(w,h,tex,x,y,z,ry,p,o){                    // табличка: алюминиевая панель с напечатанным лицом (с двух сторон, если o.two)
  o=o||{}; const g=grp(x,y,z,p||G.struct); g.rotation.y=ry||0;
  box(w+0.03,h+0.03,0.018,M.alu,0,0,0,g).castShadow=!!o.shadow;
  const m=new THREE.MeshStandardMaterial({map:tex,roughness:.5,metalness:0,envMapIntensity:.5});
  const f=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m); f.position.z=0.0105; g.add(f);
  if(o.two){ const b=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m); b.position.z=-0.0105; b.rotation.y=Math.PI; g.add(b); }
  if(o.hang){ for(const s of [-1,1]) box(0.008,o.hang,0.008,M.galv,s*(w/2-0.08),h/2+o.hang/2,0,g).castShadow=false; }
  return g; }
function guardRail(x,z0,z1){                                 // отбойное ограждение вдоль проезда: стойки с чёрно-жёлтыми полосами, две трубы
  const L=z1-z0, g=grp(x,0,(z0+z1)/2,G.struct), n=Math.max(2,Math.round(L/1.5)+1);
  for(let i=0;i<n;i++){ const z=-L/2+i*L/(n-1);
    box(0.09,0.5,0.09,M.yellow,0,0.25,z,g); box(0.095,0.08,0.095,M.dark,0,0.38,z,g).castShadow=false; box(0.095,0.08,0.095,M.dark,0,0.16,z,g).castShadow=false;
    box(0.18,0.012,0.18,M.steelDark,0,0.006,z,g).castShadow=false; }
  for(const y of [0.22,0.44]){ const t=cyl(0.03,L,M.yellow,0,y,0,g,10); t.rotation.x=Math.PI/2; }
  return g; }
const hatchTex=(function(){ const c=cnv(128,128), g=c.getContext('2d'); g.fillStyle='#f2b705'; g.fillRect(0,0,128,128);
  g.fillStyle='#14161a'; for(let i=-2;i<4;i++){ g.beginPath(); g.moveTo(i*64,0); g.lineTo(i*64+32,0); g.lineTo(i*64+32+128,128); g.lineTo(i*64+128,128); g.closePath(); g.fill(); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.wrapS=t.wrapT=THREE.RepeatWrapping; return t; })();
function hatchStrip(x0,z0,x1,z1){ const w=x1-x0, d=z1-z0, t=hatchTex.clone(); t.needsUpdate=true; t.repeat.set(Math.max(1,w/0.4),Math.max(1,d/0.4));
  return decal(w,d,new THREE.MeshStandardMaterial({map:t,transparent:true,opacity:.9,roughness:.62,metalness:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3}),(x0+x1)/2,(z0+z1)/2,0.0175); }
const arrowTex=(function(){ const c=cnv(128,256), g=c.getContext('2d'); g.fillStyle='rgba(242,183,5,.92)';
  g.beginPath(); g.moveTo(64,6); g.lineTo(122,96); g.lineTo(84,96); g.lineTo(84,250); g.lineTo(44,250); g.lineTo(44,96); g.lineTo(6,96); g.closePath(); g.fill();
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; })();
function floorArrow(x,z,rot){ return decal(0.7,1.4,new THREE.MeshStandardMaterial({map:arrowTex,transparent:true,depthWrite:false,roughness:.62,metalness:0,polygonOffset:true,polygonOffsetFactor:-3}),x,z,0.0185,rot||0); }
function convexMirror(x,y,z,ry){                             // сферическое зеркало на кронштейне
  const g=grp(x,y,z,G.struct); g.rotation.y=ry;
  const dome=new THREE.Mesh(new THREE.SphereGeometry(0.42,24,10,0,Math.PI*2,0,0.75),std(0xdfe6ec,.04,1.0,{envMapIntensity:1.8}));
  dome.rotation.x=Math.PI/2; dome.scale.set(1,1,0.55); dome.position.z=-0.2; g.add(dome);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.29,0.02,8,28),std(0xe0691f,.5,.2)); g.add(rim);
  box(0.03,0.03,0.34,M.steelDark,0,0,-0.2,g).castShadow=false;
  return g; }
const PASS=[[16.6,20.2],[32.6,36.2]];
PASS.forEach((p,i)=>{
  const x0=p[0], x1=p[1], cx=(x0+x1)/2, z0=17.2, z1=26.3;
  decal(x1-x0,z1-z0,paintMat(0xf2b705,0.09),cx,(z0+z1)/2,0.0123);
  for(const x of [x0,x1]) decal(0.12,z1-z0,paintMat(PAL.yellow),x,(z0+z1)/2,0.0165);
  hatchStrip(x0-0.3,z0+0.3,x0-0.06,z1-0.3); hatchStrip(x1+0.06,z0+0.3,x1+0.3,z1-0.3);       // чёрно-жёлтые полосы под ограждением
  for(const zc of [18.0,25.5]) for(let k=0;k<5;k++) decal(0.36,1.3,paintMat(0xf2f2f2,.9),x0+0.38+k*0.71,zc,0.0172);   // пешеходные переходы
  floorArrow(cx-0.7,20.6,Math.PI); floorArrow(cx+0.7,23.0,0);
  stencil('ПРОЕЗД ПОГРУЗЧИКА',cx,21.75,3.3,'rgba(242,183,5,.92)');
  guardRail(x0-0.18,18.4,20.85); guardRail(x0-0.18,21.55,23.4); guardRail(x1+0.18,18.4,20.85); guardRail(x1+0.18,21.55,23.4);   // концы у магистралей укорочены (0,4 м с юга, 0,8 м с севера): стойка на вилах при повороте из проезда описывает круг 2,5 м
  /* подвесные таблички над въездами в проезд */
  const st=signTex(['ПРОЕЗД ПОГРУЗЧИКА','5 км/ч · уступи пешеходу'],'#14161a','#f2b705',1024,256,{border:'#f2b705',px:[112,62]});
  signBoard(2.4,0.6,st,cx,4.3,17.0,Math.PI,G.struct,{two:true,hang:1.6}); signBoard(2.4,0.6,st,cx,4.3,26.5,0,G.struct,{two:true,hang:1.6});
  /* сферические зеркала на колоннах у обоих выездов */
  const colx=i?32.05:16.05;
  convexMirror(colx+0.34,2.9,14.1+0.34,Math.PI*0.25); convexMirror(colx+0.34,2.9,28.2-0.34,Math.PI*0.75);
});
/* подвесные таблички секций: ряд, диапазон ячеек, цвет зоны */
[[1.2,15.3,'1–5'],[20.2,31.25,'6–10'],[36.2,46.85,'11–15']].forEach((s,si)=>{ const cx=(s[0]+s[1])/2, col='#'+BANDS[si].c.toString(16).padStart(6,'0');
  [['A',17.35,Math.PI],['B',26.15,0]].forEach(r=>{
    const t=signTex(['РЯД '+r[0],'ячейки '+r[0]+s[2].replace('–','–'+r[0])],col,'#ffffff',768,384,{px:[190,84]});
    signBoard(1.5,0.75,t,cx,4.6,r[1],r[2],G.struct,{two:true,hang:1.4}); }); });
/* номера ворот и знаки над воротами, выходы */
[[0.22,GATES[0].z,'Л1',Math.PI/2],[0.22,GATES[1].z,'Л2',Math.PI/2],[W-0.22,GATES[0].z,'П1',-Math.PI/2],[W-0.22,GATES[1].z,'П2',-Math.PI/2]].forEach(p=>{
  signBoard(1.5,0.9,signTex([p[2]],'#f2b705','#14161a',384,256,{px:[210]}),p[0],GATE_H+2.45,p[1],p[3],G.walls);
  const ex=new THREE.MeshStandardMaterial({map:signTex(['ВЫХОД · EXIT'],'#1f8f4a','#ffffff',512,128,{px:[84]}),emissive:0x1f8f4a,emissiveIntensity:.35,roughness:.5});
  const e=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.22),ex); e.position.set(p[0]+(p[0]<1?0.03:-0.03),GATE_H+0.42,p[1]+3.0); e.rotation.y=p[3]; G.walls.add(e);
  /* светофор въезда и пульт ворот */
  const g=grp(p[0]+(p[0]<1?0.12:-0.12),0,p[1]-2.35,G.walls); g.rotation.y=p[3];
  box(0.2,0.5,0.14,M.dark,0,2.7,0,g); box(0.14,0.14,0.02,std(0x3a0d0d,.4,0,{emissive:0xff2a1a,emissiveIntensity:.25}),0,2.82,0.075,g).castShadow=false;
  box(0.14,0.14,0.02,std(0x0d3a16,.4,0,{emissive:0x2bd14f,emissiveIntensity:1.1}),0,2.6,0.075,g).castShadow=false;
  rbox(0.26,0.36,0.12,0.02,M.steelDark,0,1.35,0,g); box(0.05,0.05,0.02,M.green,-0.05,1.42,0.065,g).castShadow=false; box(0.05,0.05,0.02,M.red,0.05,1.42,0.065,g).castShadow=false;
  box(0.03,1.3,0.03,M.galv,0,2.05,-0.03,g).castShadow=false;
  /* отбойные тумбы у косяков ворот */
  for(const s of [-1,1]){ const bx=p[0]+(p[0]<1?0.55:-0.55), bz=p[1]+s*(GATES[0].w/2+0.25);
    cyl(0.09,1.0,M.yellow,bx,0.5,bz,G.struct,14); cyl(0.092,0.12,M.dark,bx,0.78,bz,G.struct,14).castShadow=false; cyl(0.092,0.12,M.dark,bx,0.5,bz,G.struct,14).castShadow=false; }
});
/* знаки ограничения скорости на колоннах у магистралей */
{ const c=cnv(256,256), g=c.getContext('2d'); g.fillStyle='#fff'; g.beginPath(); g.arc(128,128,124,0,7); g.fill(); g.strokeStyle='#c8201c'; g.lineWidth=26; g.beginPath(); g.arc(128,128,108,0,7); g.stroke();
  g.fillStyle='#14161a'; g.font='700 150px "Barlow Condensed",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('5',128,136);
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding;
  const m=new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:0.5,roughness:.5});
  COLX.forEach(x=>[14.1,28.2].forEach(z=>{ for(const s of [-1,1]){ const d=new THREE.Mesh(new THREE.CircleGeometry(0.2,24),m); d.position.set(x+s*0.256,2.15,z); d.rotation.y=s*Math.PI/2; G.struct.add(d); } })); }
/* крытый пост: стоп-линия, колесоотбойная труба вдоль ограждения, противооткатные упоры */
decal(0.3,2.9,paintMat(0xf2f2f2,.95),44.6,GATES[0].z-0.4,0.0172); stencil('СТОП',43.4,GATES[0].z-0.4,2.4,'rgba(242,242,242,.9)',Math.PI/2);
{ const g=grp(0,0,0,G.struct); const t=cyl(0.07,40,M.yellow,24,0.16,34.35,g,12); t.rotation.z=Math.PI/2;
  for(let i=0;i<=20;i++) box(0.1,0.16,0.14,M.steelDark,4+i*2,0.08,34.35,g).castShadow=false; }
const CHOCKS=grp(0,0,0,G.equip);
function wheelChock(x,z,dir){ const s=new THREE.Shape(); s.moveTo(0,0); s.lineTo(0.3,0); s.lineTo(0.06,0.2); s.lineTo(0,0.2); s.closePath();
  const m=mesh(new THREE.ExtrudeGeometry(s,{depth:0.2,bevelEnabled:false}),M.yellow,x,0,z-0.1,CHOCKS); if(dir<0){ m.rotation.y=Math.PI; m.position.z=z+0.1; } return m; }
