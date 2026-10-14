/* ---------- клиенты и SKU: сборная машина из Китая везёт груз нескольких отправителей ----------
   Каждый короб принадлежит клиенту (отправке) и своему SKU. Размер SKU не больше своего класса A/B/C/D: класс задаёт место
   в стоечном поддоне и дорожку в кузове, поэтому раскладка и погрузка прежние, а короба — разные: свой картон, печать,
   скотч, стяжки и этикетка, свой габарит и вес (их и показывает DWS). Высота ряда в стойке и в кузове считается по фактическим
   коробам под ним. Текстуры рисуются своим генератором — LOOK.R не трогается (от него зависят люди и раскладка). */
const CLIENTS=[
  {code:'XY',cn:'鑫源电子',en:'XINYUAN ELECTRONICS',city:'SHENZHEN · 深圳',ru:'Синьюань, электроника',paper:[226,224,216],ink:'#1d4f9c',acc:'#2f7fd8',tape:'clear',cons:'XY-2610-041'},
  {code:'MJ',cn:'美佳家居',en:'MEIJIA HOME',city:'YIWU · 义乌',ru:'Мэйцзя, товары для дома',paper:[196,152,104],ink:'#9a1f1a',acc:'#d0392b',tape:'kraft',cons:'MJ-2610-118'},
  {code:'JD',cn:'骏达汽配',en:'JUNDA AUTO PARTS',city:'GUANGZHOU · 广州',ru:'Цзюньда, автозапчасти',paper:[160,118,76],ink:'#16181b',acc:'#f2b705',tape:'yellow',straps:true,cons:'JD-2610-077'},
  {code:'AH',cn:'安和陶瓷',en:'ANHE CERAMICS',city:'FOSHAN · 佛山',ru:'Аньхэ, керамика',paper:[210,180,134],ink:'#1f6b3f',acc:'#2e9b5a',tape:'fragile',cons:'AH-2610-205'},
  {code:'HL',cn:'恒力工具',en:'HENGLI TOOLS',city:'NINGBO · 宁波',ru:'Хэнли, инструмент',paper:[182,138,92],ink:'#c2410c',acc:'#ea7a1a',tape:'print',straps:true,cons:'HL-2610-063'},
  {code:'LT',cn:'乐童玩具',en:'LETONG TOYS',city:'SHANTOU · 汕头',ru:'Лэтун, игрушки',paper:[238,236,230],ink:'#7a2e9b',acc:'#e0447a',tape:'clear',kids:true,cons:'LT-2610-152'}];
/* SKU: клиент, класс (0 A, 1 B, 2 C, 3 D), название, габарит (м), вес (кг), сколько в стойке клиента; первый короб каждого SKU — образец */
const SKUS=[];
[[0,3,'网络设备','NETWORK EQUIPMENT','сетевое оборудование',0.56,0.46,0.44,18.6,4],
 [0,2,'线槽','CABLE TRUNKING','кабель-канал',0.78,0.36,0.30,9.8,3],
 [0,1,'开关电源','POWER SUPPLY','блоки питания',0.58,0.38,0.36,11.2,4],
 [0,0,'控制模块','CONTROL MODULES','модули управления',0.39,0.29,0.25,4.1,5],
 [0,0,'适配器','ADAPTERS','адаптеры',0.33,0.24,0.20,2.6,4],
 [1,3,'家纺','HOME TEXTILE','домашний текстиль',0.60,0.50,0.48,15.4,4],
 [1,2,'窗帘杆','CURTAIN RODS','карнизы',0.80,0.40,0.34,12.7,3],
 [1,1,'玻璃餐具','GLASS TABLEWARE','стеклянная посуда',0.60,0.40,0.40,13.0,4,'glass'],
 [1,0,'厨房用品','KITCHENWARE','кухонная мелочь',0.40,0.30,0.30,6.0,9],
 [2,3,'刹车盘','BRAKE DISCS','тормозные диски',0.58,0.48,0.50,27.9,4,'heavy'],
 [2,2,'减震器','SHOCK ABSORBERS','амортизаторы',0.76,0.38,0.33,21.5,3,'heavy'],
 [2,1,'滤清器','FILTERS','фильтры',0.55,0.37,0.38,19.6,4],
 [2,0,'刹车片','BRAKE PADS','тормозные колодки',0.36,0.27,0.28,9.4,9,'heavy'],
 [3,3,'瓷砖','FLOOR TILES','плитка',0.60,0.45,0.42,26.1,4,'glass'],
 [3,2,'龙头','FAUCETS','смесители',0.70,0.40,0.30,16.0,3],
 [3,1,'洁具','SANITARY WARE','санфаянс',0.50,0.40,0.35,15.2,4,'glass'],
 [3,0,'卫浴配件','BATH ACCESSORIES','аксессуары для ванной',0.38,0.30,0.22,7.3,5],
 [3,0,'五金件','HARDWARE','фурнитура',0.28,0.22,0.18,4.8,4],
 [4,3,'空压机','AIR COMPRESSOR','компрессоры',0.55,0.50,0.40,21.0,4],
 [4,2,'水平尺','SPIRIT LEVELS','строительные уровни',0.80,0.35,0.25,14.2,3],
 [4,1,'工具套装','TOOL SETS','наборы инструмента',0.60,0.36,0.30,12.5,4],
 [4,0,'钻头','DRILL BITS','свёрла',0.30,0.25,0.20,5.5,5],
 [4,0,'紧固件','FASTENERS','метизы',0.40,0.20,0.15,6.1,4,'heavy'],
 [5,3,'大型玩具','LARGE TOYS','крупные игрушки',0.60,0.50,0.50,9.2,4],
 [5,2,'积木','BUILDING BLOCKS','конструкторы',0.78,0.40,0.35,6.8,3],
 [5,1,'拼图','PUZZLES','пазлы',0.58,0.40,0.40,5.6,4],
 [5,0,'毛绒玩具','PLUSH TOYS','мягкие игрушки',0.40,0.30,0.30,2.9,9]
].forEach(([cl,ti,cnN,enN,ru,l,w,h,kg,rack,mark],i)=>{ const C=CLIENTS[cl];
  const code=C.code+'-'+CTYPE[ti].id+Math.round(l*1000);
  SKUS.push({i,cl,ti,cnN,enN,ru,l,w,h,kg,rack,mark:mark||null,code,big:ti>=2}); });
CLIENTS.forEach((C,ci)=>{ C.skus=SKUS.filter(s=>s.cl===ci).map(s=>s.i); });
/* SKU класса ti у клиента cl (для стоек в ячейках: короб класса — короб этого клиента) */
const skuOf=(cl,ti,k)=>{ const L=CLIENTS[cl].skus.filter(i=>SKUS[i].ti===ti); return L.length?L[(k||0)%L.length]:-1; };
/* порядок коробов клиента на ленте: по SKU — образец, затем короба в стойку (как лежат в машине: отправка за отправкой) */
function clientBelt(cl){ const out=[]; CLIENTS[cl].skus.forEach(si=>{ out.push({si,sample:true}); for(let k=0;k<SKUS[si].rack;k++) out.push({si,sample:false}); }); return out; }
/* SKU для k-го слота стойки клиента: A-слоты 11…19 делятся между A-SKU по порядку укладки */
function rackSkus(cl){ const per={0:[],1:[],2:[],3:[]}; CLIENTS[cl].skus.forEach(si=>{ const S=SKUS[si]; for(let k=0;k<S.rack;k++) per[S.ti].push(si); });
  return RSLOT.map(q=>per[q.ti].shift()); }
(function(){
  let seed=20261014; const R=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  const rgb=(c,k)=>`rgb(${c.map(v=>Math.max(0,Math.min(255,Math.round(v*(k||1))))).join(',')})`;
  function paper(g,s,sh,P){ g.fillStyle=rgb(P); g.fillRect(0,0,s,sh);
    for(let i=0;i<1200;i++){ g.strokeStyle=`rgba(${P[0]-45+R()*60|0},${P[1]-45+R()*50|0},${P[2]-35+R()*40|0},.11)`; g.lineWidth=.7;
      g.beginPath(); const x=R()*s,y=R()*sh; g.moveTo(x,y); g.lineTo(x+(R()*30-15),y+(R()*3-1.5)); g.stroke(); }
    for(let y=0;y<sh;y+=5){ g.fillStyle=`rgba(90,60,30,${.014+R()*.01})`; g.fillRect(0,y,s,1.5); }
    for(let i=0;i<8;i++){ const x=R()*s,y=R()*sh,r=20+R()*70, gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,`rgba(110,75,40,${.03+R()*.05})`); gr.addColorStop(1,'rgba(110,75,40,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }
    const e=g.createLinearGradient(0,0,s,0); e.addColorStop(0,'rgba(60,40,20,.2)'); e.addColorStop(.05,'rgba(60,40,20,0)'); e.addColorStop(.95,'rgba(60,40,20,0)'); e.addColorStop(1,'rgba(60,40,20,.2)');
    g.fillStyle=e; g.fillRect(0,0,s,sh); }
  function wear(g,s){ for(let i=0;i<6;i++){ const x=R()*s,y=R()*s,l=20+R()*90,a=R()*6.3;
      g.strokeStyle=`rgba(255,246,228,${.10+R()*.12})`; g.lineWidth=1+R()*2.5; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l*0.3); g.stroke(); }
    for(let i=0;i<3;i++){ const x=R()*s,y=R()*s,r=14+R()*30, gr=g.createRadialGradient(x-r*0.2,y-r*0.2,0,x,y,r);
      gr.addColorStop(0,'rgba(40,26,12,.15)'); gr.addColorStop(.7,'rgba(40,26,12,.05)'); gr.addColorStop(1,'rgba(255,240,215,.07)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); } }
  function tape(g,x,y,w,h,C,vert){                            // скотч по стилю клиента
    const st=C.tape; g.save();
    if(st==='clear'){ g.fillStyle='rgba(255,255,250,.30)'; g.fillRect(x,y,w,h); g.fillStyle='rgba(255,255,255,.16)'; vert?g.fillRect(x,y,w*0.22,h):g.fillRect(x,y,w,h*0.22); }
    else if(st==='kraft'){ g.fillStyle='rgba(176,124,62,.78)'; g.fillRect(x,y,w,h); g.fillStyle='rgba(255,230,190,.12)'; vert?g.fillRect(x,y,w*0.25,h):g.fillRect(x,y,w,h*0.25); }
    else { const bg=st==='yellow'?'#f2c21b':st==='fragile'?'#d8261c':C.acc, fg=st==='yellow'?'#16181b':'#ffffff', txt=st==='fragile'?'易碎 FRAGILE':st==='yellow'?'小心轻放 HANDLE WITH CARE':C.code+' · '+C.en;
      g.fillStyle=bg; g.globalAlpha=.92; g.fillRect(x,y,w,h); g.globalAlpha=1;
      g.beginPath(); g.rect(x,y,w,h); g.clip(); g.fillStyle=fg; g.font=`700 ${Math.round((vert?w:h)*0.48)}px "Barlow Condensed","Noto Sans SC",sans-serif`; g.textBaseline='middle';
      if(vert){ g.translate(x+w/2,y); g.rotate(Math.PI/2); for(let k=0;k<h;k+=g.measureText(txt).width+30) g.fillText(txt,k,0); }
      else for(let k=x;k<x+w;k+=g.measureText(txt).width+30) g.fillText(txt,k,y+h/2);
      if(st==='fragile'){ g.fillStyle='rgba(255,255,255,.9)'; } }
    g.restore(); }
  function icons(g,x,y,sz,ink,mark){                       // пиктограммы: «верх», «беречь от влаги», «хрупкое», «не больше 5 в штабеле»
    g.save(); g.strokeStyle=ink; g.fillStyle=ink; g.lineWidth=sz*0.09; g.globalAlpha=.85;
    for(let k=0;k<2;k++){ const ax=x+sz*0.25+k*sz*0.42, ay=y; g.beginPath(); g.moveTo(ax,ay+sz*0.95); g.lineTo(ax,ay+sz*0.1); g.moveTo(ax-sz*0.16,ay+sz*0.32); g.lineTo(ax,ay+sz*0.1); g.lineTo(ax+sz*0.16,ay+sz*0.32); g.stroke(); }
    const ux=x+sz*1.25, uy=y+sz*0.55; g.beginPath(); g.arc(ux,uy,sz*0.32,Math.PI,0); g.closePath(); g.fill(); g.beginPath(); g.moveTo(ux,uy); g.lineTo(ux,uy+sz*0.38); g.arc(ux-sz*0.08,uy+sz*0.38,sz*0.08,0,Math.PI); g.stroke();
    for(let k=0;k<3;k++){ g.fillRect(ux-sz*0.28+k*sz*0.24,uy-sz*0.62,sz*0.04,sz*0.16); }
    if(mark==='glass'){ const gx=x+sz*2.05, gy=y+sz*0.1; g.beginPath(); g.moveTo(gx-sz*0.22,gy); g.lineTo(gx+sz*0.22,gy); g.lineTo(gx+sz*0.12,gy+sz*0.42); g.lineTo(gx-sz*0.12,gy+sz*0.42); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(gx,gy+sz*0.42); g.lineTo(gx,gy+sz*0.82); g.moveTo(gx-sz*0.18,gy+sz*0.85); g.lineTo(gx+sz*0.18,gy+sz*0.85); g.stroke();
      g.beginPath(); g.moveTo(gx-sz*0.05,gy+sz*0.05); g.lineTo(gx+sz*0.04,gy+sz*0.18); g.lineTo(gx-sz*0.03,gy+sz*0.28); g.stroke(); }
    else if(mark==='heavy'){ const gx=x+sz*2.05, gy=y+sz*0.2; g.font=`800 ${sz*0.42}px "Barlow Condensed",sans-serif`; g.textAlign='center'; g.fillText('KG',gx,gy+sz*0.62);
      g.beginPath(); g.moveTo(gx-sz*0.3,gy+sz*0.75); g.lineTo(gx-sz*0.2,gy+sz*0.05); g.lineTo(gx+sz*0.2,gy+sz*0.05); g.lineTo(gx+sz*0.3,gy+sz*0.75); g.closePath(); g.stroke(); }
    else { const gx=x+sz*2.05, gy=y+sz*0.1; for(let k=0;k<3;k++) g.strokeRect(gx-sz*0.24,gy+k*sz*0.27,sz*0.48,sz*0.22);
      g.font=`800 ${sz*0.3}px "Barlow Condensed",sans-serif`; g.textAlign='center'; g.fillText('≤5',gx,gy+sz*1.05); }
    g.restore(); }
  function barcode(g,x,y,w,h){ g.fillStyle='#111'; for(let px=x;px<x+w;px+=2+(R()*3|0)) g.fillRect(px,y,1+(R()*2.4|0),h); }
  function qr(g,x,y,sz){ g.fillStyle='#111'; const n=11, c=sz/n; for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const fin=(i<3&&j<3)||(i<3&&j>n-4)||(i>n-4&&j<3);
      if(fin){ if(i===1&&j===1||i===1&&j===n-2||i===n-2&&j===1) continue; g.fillRect(x+i*c,y+j*c,c,c); } else if(R()<0.47) g.fillRect(x+i*c,y+j*c,c,c); } }
  function side(S){ const C=CLIENTS[S.cl], s=512, c=cnv(s,s), g=c.getContext('2d'); paper(g,s,s,C.paper);
    if(C.kids){ for(let i=0;i<9;i++){ g.fillStyle=['#f2b705','#2f9be0','#e0447a','#4caf50'][i%4]; g.globalAlpha=.55; g.beginPath(); g.arc(40+R()*430,250+R()*160,10+R()*22,0,7); g.fill(); } g.globalAlpha=1; }
    g.fillStyle=C.acc; g.globalAlpha=.88; g.fillRect(0,s*0.86,s,s*0.06); g.globalAlpha=1;
    g.fillStyle=C.ink; g.globalAlpha=.9; g.textBaseline='alphabetic';
    g.font='700 50px "Noto Sans SC","Microsoft YaHei",sans-serif'; g.fillText(C.cn,24,74);
    g.font='700 25px "Barlow Condensed",sans-serif'; g.fillText(C.en,26,104); g.font='500 17px "Barlow Condensed",sans-serif'; g.fillText(C.city,26,126);
    g.font='800 66px "Noto Sans SC","Microsoft YaHei",sans-serif'; g.fillText(S.cnN,24,206);
    g.font='700 30px "Barlow Condensed",sans-serif'; g.fillText(S.enN,26,242);
    g.font='600 20px monospace'; g.fillText('MODEL '+S.code,26,268); g.globalAlpha=1;
    icons(g,330,40,56,C.ink,S.mark);
    if(C.straps||S.mark==='heavy'){ for(const sx of [0.24,0.76]){ g.fillStyle='rgba(18,20,24,.86)'; g.fillRect(s*sx-7,0,14,s); g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(s*sx-7,0,3,s); } }
    tape(g,s/2-s*0.07,0,s*0.14,s*0.15,C,true);
    wear(g,s);
    /* транспортная этикетка отправки: клиент, номер отправки, SKU, габарит, вес, штрихкод */
    const lx=268,ly=282,lw=226,lh=166; g.fillStyle='rgba(248,247,242,.97)'; g.fillRect(lx,ly,lw,lh);
    g.fillStyle=C.acc; g.fillRect(lx,ly,lw,26); g.fillStyle='#fff'; g.font='700 19px "Barlow Condensed",sans-serif'; g.fillText(C.code+' · '+C.en.split(' ')[0],lx+8,ly+19);
    g.fillStyle='#111'; g.font='600 15px monospace'; g.fillText(C.cons,lx+8,ly+45); g.fillText('SKU '+S.code,lx+8,ly+63);
    g.fillText(Math.round(S.l*1000)+'×'+Math.round(S.w*1000)+'×'+Math.round(S.h*1000),lx+8,ly+81); g.fillText(S.kg.toFixed(1)+' KG',lx+8,ly+99);
    g.font='800 44px "Barlow Condensed",sans-serif'; g.fillText(CTYPE[S.ti].id,lx+lw-40,ly+72);
    barcode(g,lx+8,ly+108,lw-74,46); qr(g,lx+lw-58,ly+108,48);
    g.font='600 13px monospace'; g.fillStyle='#333'; g.fillText('MADE IN CHINA',lx+8,ly+lh+16);
    return c; }
  function top(C){ const s=256, c=cnv(s,s), g=c.getContext('2d'); paper(g,s,s,C.paper);
    if(C.straps){ for(const sy of [0.25,0.75]){ g.fillStyle='rgba(18,20,24,.86)'; g.fillRect(0,s*sy-4,s,8); } }
    tape(g,0,s/2-s*0.09,s,s*0.18,C,false); wear(g,s); return c; }
  const tops=CLIENTS.map(C=>{ const m=new THREE.MeshStandardMaterial({map:LOOK.tex(top(C),1,1,true),roughness:.86,metalness:0,envMapIntensity:.45}); m.name='CARTON'; return m; });
  SKUS.forEach(S=>{ const sd=new THREE.MeshStandardMaterial({map:LOOK.tex(side(S),1,1,true),roughness:.86,metalness:0,envMapIntensity:.45}); sd.name='CARTON';
    S.mats=[sd,sd,tops[S.cl],tops[S.cl],sd,sd]; LOOK.ctypeM.push(sd); });
  tops.forEach(m=>LOOK.ctypeM.push(m));
})();
function skuMesh(si){ const S=SKUS[si]; if(!S.geo){ S.geo=bevelBox(S.l,S.h,S.w,0.007); S.geo.translate(0,S.h/2,0); }
  const m=new THREE.Mesh(S.geo,S.mats); m.castShadow=m.receiveShadow=true; m.userData.ctype=S.ti; m.userData.sku=si; return m; }
function skuBox(si){ const g=new THREE.Group(); g.add(skuMesh(si)); const S=SKUS[si]; g.userData.carton={l:S.l,w:S.w,hh:S.h,type:S.ti,sku:si}; return g; }
const heavyKg=kg=>Math.max(0,Math.min(1,(kg-6)/17.5));
/* высоты коробов в стоечном поддоне по фактическим коробам: что лежит под каждым слотом (RSLOT) */
const RSUP={5:[4],6:[5],7:[0],8:[1],9:[2],10:[3],12:[11],13:[12],14:[7],15:[7,8],16:[8],17:[9],18:[9,10],19:[10]};
function slotYs(hs){ const y=[]; RSLOT.forEach((q,s)=>{ const sup=RSUP[s]; let v=RACK.Y0;
    if(sup) for(const k of sup){ const hk=hs[k]!=null?hs[k]:CTYPE[RSLOT[k].ti].h; v=Math.max(v,y[k]+hk+0.004); }
    y[s]=v; }); return y; }
/* «как положат руками»: короба произвольных размеров на прямоугольную площадку — каждый на самое низкое место, где он
   опирается не меньше чем на 60 % площади. По умолчанию — настил стойки 1,36 × 1,36 м с сеткой 4 см (поддон образцов);
   для кузова машины — своя площадка, шаг сетки и правило выбора места (score). Возвращает место (в осях площадки) и порядок снятия */
function Pack(o){ o=o||{}; this.c=o.c||0.04; this.nx=o.nx||34; this.nz=o.nz||34; this.x0=o.x0!==undefined?o.x0:-0.68; this.z0=o.z0!==undefined?o.z0:-0.68;
  this.y0=o.y0!==undefined?o.y0:RACK.Y0; this.h=new Float32Array(this.nx*this.nz); this.id=new Int32Array(this.nx*this.nz).fill(-1); this.items=[]; }
Pack.prototype.find=function(l,w,hh,maxTop,score){ const nx=this.nx, nz=this.nz, c=this.c, H=this.h; maxTop=maxTop||1.18; let best=null;
  for(const rot of [0,1]){ const fx=Math.ceil(((rot?w:l)+0.012)/c), fz=Math.ceil(((rot?l:w)+0.012)/c); if(fx>nx||fz>nz) continue;
    for(let i=0;i+fx<=nx;i++) for(let j=0;j+fz<=nz;j++){ let mx=0; for(let a=i;a<i+fx;a++) for(let b=j;b<j+fz;b++){ const v=H[a*nz+b]; if(v>mx) mx=v; }
      if(mx+hh>maxTop) continue; if(mx>0){ let sup=0; for(let a=i;a<i+fx;a++) for(let b=j;b<j+fz;b++) if(H[a*nz+b]>=mx-0.012) sup++; if(sup<0.6*fx*fz) continue; }
      const sc=score?score(this.x0+(i+fx/2)*c,this.z0+(j+fz/2)*c,mx,rot):mx*10+(i+j)*0.002+rot*0.0005; if(!best||sc<best.sc) best={sc,i,j,fx,fz,rot,base:mx,hh}; } }
  return best; };
Pack.prototype.put=function(b){ const nz=this.nz, c=this.c, H=this.h, top=b.base+b.hh+0.004, under=new Set();
  for(let a=b.i;a<b.i+b.fx;a++) for(let k=b.j;k<b.j+b.fz;k++){ const q=a*nz+k; if(this.id[q]>=0&&H[q]>=b.base-0.012) under.add(this.id[q]); H[q]=top; this.id[q]=this.items.length; }
  const it={x:this.x0+(b.i+b.fx/2)*c,z:this.z0+(b.j+b.fz/2)*c,y:this.y0+b.base+(b.base>0?0.004:0),rot:b.rot,i:b.i,j:b.j,fx:b.fx,fz:b.fz,base:b.base,top,h:b.hh,id:this.items.length,on:true,under:[...under]};
  this.items.push(it); return it; };
Pack.prototype.place=function(l,w,hh,maxTop,score){ const b=this.find(l,w,hh,maxTop,score); return b?this.put(b):null; };
/* можно ли снять: на нём не лежит ни один из оставшихся */
Pack.prototype.free=function(it){ return !this.items.some(o=>o.on&&o!==it&&o.base>=it.top-0.012&&o.i<it.i+it.fx&&it.i<o.i+o.fx&&o.j<it.j+it.fz&&it.j<o.j+o.fz); };
/* что лежит на нём (среди оставшихся) */
Pack.prototype.over=function(it){ return this.items.filter(o=>o.on&&o!==it&&o.base>=it.top-0.012&&o.i<it.i+it.fx&&it.i<o.i+o.fx&&o.j<it.j+it.fz&&it.j<o.j+o.fz); };
