/* ---------------------------------------------------------------- планировки A / B / C по размерам зала
   Ряды стеллажей — вдоль z (вдоль линий колонн): колонны x 16,05 и 32,05 стоят во флю двойных рядов (флю 0,95 м).
   Высота каждого ряда — по кровле: верх груза не выше кровли минус 2,1 м (светильники, лотки, спринклеры).
   Перед стеллажами — главный проезд z 13,8…16,8 (у автопоезда — от его борта, z 11,95), за ними — полоса Л1–П1 (z 30,65…35,2).
   Юг (z 6,9…13,9): приёмка у Л2 (буфер, карантин, рабочее место с терминалами и принтером), экспедиция x 16,6…21,4. */
const PT=1.6, LOADH=1.45;
const levFor=(x0,x1,y0)=>{ const lim=Math.min(topLim(x0),topLim(x1)); let l=1; while(l*PT+(y0||0)+LOADH<=lim) l++; return l; };
const GZ_L2=GATES[1].z, GZ_L1=GATES[0].z;                     // оси ворот Л2 (10,58) и Л1 (32,8)
const KZY=GATES[1].z;                                          // ось поста П2 (автопоезд)
/* места на полу: центр паллеты, поворот (1,2 м вдоль ry), откуда подъезжать (курс) */
const spot=(x,z,yaw,kind)=>({x,z,ry:PI/2,yaw,kind,occ:null,res:null});
function southZones(v){
  const S={inb:[],qua:[],exp:[],rear:[]};                                                   // B: экспедиция — у Л1 (поток через каналы FIFO с юга на север)
  for(let x=3.6;x<=13.65;x+=1.0){ if(x>2.9&&x<4.4) continue;                               // напротив двери охраны — проход; у Л2 (x < 3,2) — подъезд к машине
    const q=x>11.0; (q?S.qua:S.inb).push(spot(x,8.05,PI,q?'qua':'inb')); }
  for(let x=3.6;x<=13.65;x+=1.0){ if(x>6.3&&x<9.8) continue; if(v==='C'&&x>2.9&&x<6.2) continue;  // проход на север к главному проезду; в C — подъезд к входному конвейеру x 4,5
    const e=v==='A'&&x>12.0; (e?S.exp:S.inb).push(Object.assign(spot(x,13.25,0,e?'exp':'inb'),{alt:PI})); }   // ближний к проезду ряд: ставят с юга, ричтрак берёт/ставит с проезда; в A восточные два — экспедиция
  if(v==='A'){ for(const x of [17.1,18.1,19.1,20.1]) S.exp.push(spot(x,8.05,PI,'exp')); for(const x of [17.1,18.1]) S.exp.push(Object.assign(spot(x,13.25,0,'exp'),{alt:PI})); }
  for(let x=(v==='B'?7.0:5.2);x<=(v==='B'?16.05:15.0);x+=1.0) (v==='B'?S.exp:S.rear).push(spot(x,34.6,0,v==='B'?'exp':'rear'));   // буфер у Л1 вдоль ограждения (B — экспедиция, обмотка у ворот)
  return S; }
/* KZ: 42 места (2 ряда поперёк × 9 + 12 вдоль секций), погрузка вилами с северного борта; мировые координаты при стоянке на посту */
function kzSlots(){ const out=[]; const secs=[[29.235,7.57,9],[38.77,9.70,12]];
  for(const [cx,Lin,n] of secs) for(let k=0;k<n;k++){ const x=cx-Lin/2+0.05+(k+0.5)*((Lin-0.1)/n);
    out.push({x,z:KZY-0.65+0.02,ry:PI/2,row:0,sec:out.length<18?0:1},{x,z:KZY+0.65-0.02,ry:PI/2,row:1,sec:out.length<18?0:1}); }
  return out; }
const DOCKS={L2:{gate:'L2',z:GZ_L2,door:'L2'},L1:{gate:'L1',z:GZ_L1,door:'L1'}};
function rec(V,list,k,p,r,o){ list.push({i:'v'+V+list.length,k,p,r:r||0,o}); }
/* ---------- вариант A ---------- */
function genA(){ const L=[], P=2.75, n=5, Lr=n*P+0.1, zc=ZS.z0+Lr/2, d=1.05, fill=0;
  const rows=[], seg=(x0,x1,first,last)=>{ const k=2, a=(x1-x0-(first?d:0)-(last?d:0)-k*2.3)/(k+1); let x=x0;
    if(first){ rows.push({x:x+d/2,dbl:0,r:0,fl:0.2}); x+=d; } x+=a;
    for(let i=0;i<k;i++){ rows.push({x:x+1.15,dbl:1,r:0,fl:0.2}); x+=2.3+a; }
    if(last){ rows.push({x:x+d/2,dbl:0,r:PI,fl:0.2}); } return a; };
  const aw=[seg(ZS.x0,16.05-0.475-d,true,false)];
  rows.push({x:16.05,dbl:1,r:0,fl:0.95});
  aw.push(seg(16.05+0.475+d,32.05-0.475-d,false,false));
  rows.push({x:32.05,dbl:1,r:0,fl:0.95});
  aw.push(seg(32.05+0.475+d,ZS.x1,false,true));
  rows.sort((a,b)=>a.x-b.x).forEach(w=>{ const half=w.dbl?(d+w.fl/2):d/2, lev=levFor(w.x-half,w.x+half,0);
    rec('A',L,'F01',[+w.x.toFixed(3),0,+zc.toFixed(3)],w.r,{n,lev,bw:2.65,dbl:w.dbl,fl:w.fl,pt:PT,fill}); });
  vehicles('A',L,{F11:4,F12:2,F13:1}); stations('A',L,true); return {recs:L,aw}; }
/* ---------- вариант B: шаттл-каналы в западном и среднем пролёте, адресная зона A — в восточном ---------- */
function genB(){ const L=[], nd=15, Lb=nd*0.85+0.3, zc=ZS.z0+Lb/2, d=1.05, P=2.75, n=5, Lr=n*P+0.1, zr=ZS.z0+Lr/2;
  for(const [x0,nc] of [[ZS.x0,10],[16.6,10]]){ const W=nc*1.4, lev=levFor(x0,x0+W,0.08);
    rec('B',L,'F02',[+(x0+W/2).toFixed(3),0,+zc.toFixed(3)],0,{nc,nd,lev,pt:PT,fifo:1,sh:3,fill:0}); }
  /* адресная зона A для мелких партий: одинарный ряд спиной к колоннам x 32,05, два двойных, одинарный у стены */
  const x0=32.525, x1=ZS.x1, a=(x1-x0-2*d-2*2.3)/3, rows=[{x:x0+d/2,dbl:0,r:0},{x:x0+d+a+1.15,dbl:1,r:0},{x:x0+d+2*a+2.3+1.15,dbl:1,r:0},{x:x1-d/2,dbl:0,r:PI}];
  rows.forEach(w=>{ const half=w.dbl?d+0.1:d/2; rec('B',L,'F01',[+w.x.toFixed(3),0,+zr.toFixed(3)],w.r,{n,lev:levFor(w.x-half,w.x+half,0),bw:2.65,dbl:w.dbl,fl:0.2,pt:PT,fill:0}); });
  vehicles('B',L,{F11:3,F12:2}); stations('B',L,true); return {recs:L,aw:[a]}; }
/* ---------- вариант C: краны-штабелёры, двойная глубина, P&D у торца, конвейер вдоль главного проезда ---------- */
const CZ={conv:16.95,front:19.9,corr:[11.95,16.15],inX:4.5,outX:46.4,fence:16.15};   // конвейер z 16,3…17,6; P&D 17,6…19,5; стеллажи с 19,9; ограждение z 16,15 — у колонн x 16,05/32,05 (z 14,05) проезд 1,6 м
function genC(){ const L=[], nb=4, Lr=nb*2.8+0.1, zc=CZ.front+Lr/2, wa=1.5, D=2.45, Wm=wa+2*D;
  const mods=[]; for(const [x0,x1] of [[ZS.x0,16.05-0.475],[16.05+0.475,32.05-0.475],[32.05+0.475,ZS.x1]]){
    const k=Math.floor((x1-x0+0.2)/(Wm+0.2)), sp=(x1-x0-k*Wm)/(k+1); for(let i=0;i<k;i++) mods.push(x0+sp+i*(Wm+sp)+Wm/2); }
  mods.forEach(x=>{ const lev=levFor(x-Wm/2,x+Wm/2,0.12); rec('C',L,'F03',[+x.toFixed(3),0,+zc.toFixed(3)],0,{nb,lev,dd:2,pt:PT,fill:0}); });
  /* главный конвейер вдоль z 16,35 от x 2,4 до 47,05 (поток на восток): вход — с юга у x 4,5 (между P&D первого крана),
     выход — на юг у x 46,4. Все P&D (x модуля ± 1,35) — на линии */
  const cx0=2.4, cx1=47.05, Lc=cx1-cx0;
  rec('C',L,'F08',[+((cx0+cx1)/2).toFixed(3),0,CZ.conv],PI/2,{len:+Lc.toFixed(2),w:1.3,h:0.5,typ:0});
  const sl=+(CZ.conv-0.65-13.6).toFixed(2), sz=+((13.6+CZ.conv-0.65)/2).toFixed(3);
  rec('C',L,'F08',[CZ.inX,0,sz],0,{len:sl,w:1.3,h:0.5,typ:0});                             // вход: z 13,6 … до главной линии
  rec('C',L,'F08',[CZ.outX,0,+((14.9+CZ.conv-0.65)/2).toFixed(3)],0,{len:+(CZ.conv-0.65-14.9).toFixed(2),w:1.3,h:0.5,typ:0});   // выход: до стола обмотки (z 14,05)
  vehicles('C',L,{F12:2}); stations('C',L,false); return {recs:L,mods}; }
/* техника на стоянке (зарядка — в восточной части полосы Л1–П1) и рабочие места */
function vehicles(V,L,n){ let k=0;
  for(let i=0;i<(n.F11||0);i++) rec(V,L,'F11',[46.0-i*3.5,0,33.95],0,{});                // стоянка у зарядки — поперёк полосы, задом к проезду
  for(let i=0;i<(n.F12||0);i++) rec(V,L,'F12',i?(V==='B'?[19.8,0,34.6]:V==='C'?[38.0,0,15.4]:[45.3,0,9.6]):[8.0,0,10.65],i?(V==='B'?-PI/2:V==='C'?-PI/2:0):-PI/2,{});   // второй — у П2, вне полосы погрузки
  for(let i=0;i<(n.F13||0);i++) rec(V,L,'F13',[2.6,0,33.95],0,{});                    // резерв: стоянка в западном конце полосы Л1–П1
  for(let i=0;i<(n.F10||0);i++) rec(V,L,'F10',[37.8-i*1.7,0,34.2],0,{}); }
function stations(V,L,exp){
  rec(V,L,'F17',[15.0,0,7.6],0,{}); rec(V,L,'F16',[14.9,0,13.2],PI,{n:4});
  rec(V,L,'F18',V==='B'?[5.0,0,34.4]:V==='C'?[CZ.outX,0,14.05]:[20.45,0,13.3],V==='C'?PI:0,{h:2.35,cy:0.55,load:0,film:0.4});   // обмотка — у экспедиции (B — у Л1, C — последняя станция выходного конвейера)
  for(const D of [DOCKS.L2,DOCKS.L1]){ rec(V,L,'F19',[-0.9,0,D.z],-PI/2,{w:2.0,l:2.5,dh:0.28}); rec(V,L,'F20',[-3.45,0,D.z],-PI/2,{w:3.4,h:3.8,d:0.8}); } }
const GEN={A:genA,B:genB,C:genC};
