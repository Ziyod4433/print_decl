/* ---------- ленточный DWS Goodscan (深圳市异方科技 / Shenzhen Yifang Technology, серия GM220 / GS210P) ----------
   По чертежу и фото производителя: секция статического замера 842 мм (весовой роликовый стол под консольной 3D-камерой),
   ленточный конвейер 1930 мм с лентой 900 мм через рамку светового занавеса (параллельный свет), высота стола 750 мм,
   общая высота 1820 мм, ширина 1330 мм; монитор с клавиатурой на стойке, пульт с аварийным стопом, выходной рольганг.
   Паспорт GM220: диапазон 10×3×3 … 150×88×88 см, вес до 100 кг, точность ±1 мм и ±10 г, 1–2 с на короб.
   Локальные оси: +x — по ходу груза (вход x = 0, выход x ≈ 3,8), +z — сторона оператора, −z — стойка камеры.
   Анимация: g.userData.gs — лента, ролики, светодиоды занавеса, камера, экран, весовой индикатор (см. set*). */
const GS={L0:0.84,L1:1.93,LO:1.0,TOP:0.75,BW:0.90,ARCH:1.30};
function gsScreenDraw(c,d){ const g=c.getContext('2d'), W=c.width, H=c.height; d=d||{};
  g.fillStyle='#0b1522'; g.fillRect(0,0,W,H); g.fillStyle='#e9eef3'; g.fillRect(0,0,W,40);
  g.fillStyle='#d4241c'; g.font='800 26px "Barlow Condensed",sans-serif'; g.textBaseline='middle'; g.fillText('GOODSCAN',14,21);
  const gw=g.measureText('GOODSCAN').width; g.fillStyle='#1b2733'; g.font='600 18px "Noto Sans SC","Barlow Condensed",sans-serif'; g.fillText('异方科技 · DWS · '+(d.model||'GM220'),24+gw,21);
  g.textAlign='right'; g.fillText(d.time||'10:42:07',W-12,21); g.textAlign='left';
  const st=d.state||'idle';
  if(st==='idle'){ g.fillStyle='#7f93a8'; g.font='700 40px "Barlow Condensed",sans-serif'; g.fillText('ГОТОВ К ЗАМЕРУ',20,110);
    g.font='500 22px "IBM Plex Mono",monospace'; g.fillText('положите короб на стол',22,160); g.fillText(d.left!==undefined?('образцов в очереди: '+d.left):'',22,196); }
  else if(st==='scan'){ g.fillStyle='#f2b705'; g.font='700 44px "Barlow Condensed",sans-serif'; g.fillText('ЗАМЕР…',20,104);
    g.fillStyle='#9fb4ca'; g.font='500 22px "IBM Plex Mono",monospace'; g.fillText('3D-камера · световой занавес',22,150); g.fillText('вес · штрихкод · фото',22,182);
    const k=Math.max(0,Math.min(1,d.k||0)); g.fillStyle='#22364c'; g.fillRect(22,214,W-44,14); g.fillStyle='#f2b705'; g.fillRect(22,214,(W-44)*k,14); }
  else { const L=d.L||0, Wd=d.W||0, Hd=d.H||0, kg=d.kg||0;
    g.fillStyle='#9fb4ca'; g.font='500 19px "IBM Plex Mono",monospace'; g.fillText((d.client||'')+' · '+(d.sku||''),20,64);
    g.fillStyle='#e9ecef'; g.font='700 40px "Barlow Condensed",sans-serif'; g.fillText(L+' × '+Wd+' × '+Hd+' мм',20,112);
    g.fillStyle='#53d16f'; g.font='700 48px "Barlow Condensed",sans-serif'; g.fillText(kg.toFixed(2).replace('.',',')+' кг',20,166);
    g.fillStyle='#9fb4ca'; g.font='500 20px "IBM Plex Mono",monospace'; g.fillText('V '+(L*Wd*Hd/1e9).toFixed(3).replace('.',',')+' м³ · '+(d.code||''),20,210);
    g.fillStyle='#53d16f'; g.font='600 22px "IBM Plex Mono",monospace'; g.fillText('✓ OK · в WMS / SafeLoad',20,246);
    /* миниатюра фото: короб сверху в цвете клиента */
    g.fillStyle='#16222f'; g.fillRect(W-118,138,104,80); g.fillStyle=d.col||'#b88a5a'; const bw=Math.min(84,L/8), bh=Math.min(62,Wd/8); g.fillRect(W-66-bw/2,178-bh/2,bw,bh);   // фото сверху: короб в цвете картона клиента
    g.strokeStyle='#53d16f'; g.lineWidth=2; g.strokeRect(W-66-bw/2-4,178-bh/2-4,bw+8,bh+8); }
  g.fillStyle='#22364c'; g.fillRect(0,H-26,W,26); g.fillStyle='#9fb4ca'; g.font='500 16px "IBM Plex Mono",monospace';
  g.fillText('за смену: '+(d.count||0)+' · ±1 мм · ±10 г',14,H-12); }
function goodscanDWS(o){
  o=Object.assign({out:1},o||{});
  const g=new THREE.Group(), K=[];                                      // K — подвижные/светящиеся детали: не сливаются (batch.js)
  const WH=std(0xeeefec,.42,.12,{envMapIntensity:.8}), WH2=std(0xdfe1de,.5,.1), SS=std(0xc9ced3,.28,.85,{envMapIntensity:1.1}),
        DK=std(0x1b1d20,.6,.2), GR=std(0x868d94,.45,.55), YE=std(0xf2c21b,.45,.15), RU=std(0x2a2c2f,.92,0);
  const mk=(w,h,d,mat,x,y,z,p)=>box(w,h,d,mat,x,y,z,p||g);
  const {L0,L1,LO,TOP,BW}=GS, X1=L0+L1, ZB=0.47;
  /* --- секция статического замера: шкаф с дверцей, весовой роликовый стол --- */
  mk(L0-0.02,0.60,0.92,WH,L0/2,0.40,0);                                  // шкаф
  mk(L0-0.06,0.05,0.88,WH2,L0/2,0.095,0);                                // цоколь
  mk(0.34,0.48,0.012,WH2,0.26,0.40,0.466).castShadow=false;              // дверца
  mk(0.02,0.16,0.03,SS,0.40,0.40,0.48).castShadow=false;                 // ручка
  for(let i=0;i<6;i++) mk(0.22,0.012,0.006,DK,0.62,0.22+i*0.03,0.463).castShadow=false;   // жалюзи вентиляции
  { const c=cnv(256,96), gg=c.getContext('2d'); gg.fillStyle='#f4f5f2'; gg.fillRect(0,0,256,96); gg.fillStyle='#d4241c'; gg.font='800 40px "Barlow Condensed",sans-serif'; gg.fillText('GOODSCAN',14,48);
    gg.fillStyle='#1b2733'; gg.font='600 22px "Noto Sans SC","Barlow Condensed",sans-serif'; gg.fillText('异方科技 · DWS',16,82);
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.22,0.082),new THREE.MeshStandardMaterial({map:t,roughness:.5}));
    pl.position.set(0.62,0.58,0.467); g.add(pl); }
  /* весовой индикатор на лицевой стороне */
  const wc=cnv(192,64), wt=new THREE.CanvasTexture(wc); wt.encoding=THREE.sRGBEncoding;
  const wm=new THREE.MeshBasicMaterial({map:wt,toneMapped:false}); const wp=new THREE.Mesh(new THREE.PlaneGeometry(0.15,0.05),wm); wp.position.set(0.23,0.68,0.467); g.add(wp); K.push(wp);
  mk(0.17,0.07,0.01,DK,0.23,0.68,0.461).castShadow=false;
  mk(L0,0.05,0.92,SS,L0/2,TOP-0.055,0);                                  // рама весового стола
  for(const s of [-1,1]) mk(L0,0.06,0.03,SS,L0/2,TOP+0.01,s*ZB);        // бортики
  const rollIn=[]; for(let i=0;i<11;i++){ const r=cyl(0.025,0.88,SS,0.07+i*0.07,TOP-0.025,0,g,14); r.rotation.x=Math.PI/2; rollIn.push(r); K.push(r); }
  for(const sx of [0.05,L0-0.05]) for(const sz of [-0.42,0.42]){ mk(0.05,0.07,0.05,DK,sx,0.035,sz); }
  /* --- стойка с консолью 3D-камеры над весовым столом, монитор и клавиатура --- */
  const CX=0.42, CZ=-0.60;
  mk(0.30,0.02,0.30,WH,CX,0.01,CZ); mk(0.12,1.82,0.12,WH,CX,0.91,CZ);
  mk(0.10,0.10,0.66,WH,CX,1.76,CZ+0.30);                                 // консоль к оператору
  mk(0.32,0.14,0.26,WH,CX,1.68,0.0);                                     // головка камеры
  mk(0.22,0.012,0.16,std(0x0e1116,.08,.2,{envMapIntensity:1.4}),CX,1.605,0.0).castShadow=false;   // стекло объектива
  const ledM=std(0x1c4a2a,.3,0,{emissive:0x53d16f,emissiveIntensity:1.2}); const led=mk(0.08,0.016,0.012,ledM,CX,1.70,0.131); led.castShadow=false; K.push(led);
  { const c=cnv(256,48), gg=c.getContext('2d'); gg.fillStyle='#eeefec'; gg.fillRect(0,0,256,48); gg.fillStyle='#d4241c'; gg.font='800 30px "Barlow Condensed",sans-serif'; gg.fillText('GOODSCAN 3D',14,34);
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.038),new THREE.MeshStandardMaterial({map:t,roughness:.5})); pl.position.set(CX,1.665,0.131); g.add(pl); }
  /* световой конус 3D-камеры (структурированная подсветка) — виден только при замере */
  const conM=new THREE.MeshBasicMaterial({color:0x9fd8ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const con=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.46,1.6-TOP,4,1,true),conM); con.rotation.y=Math.PI/4; con.position.set(CX,(1.60+TOP)/2,0); con.renderOrder=4; g.add(con); K.push(con);
  /* монитор и клавиатура на своей стойке слева от весового стола — вне пути короба */
  const MX=-0.16, MZ=-0.22;
  mk(0.26,0.02,0.26,WH,MX,0.01,MZ); mk(0.06,1.30,0.06,WH,MX,0.66,MZ);
  const mon=grp(MX,1.36,MZ+0.06,g); mon.rotation.y=0.42; mon.rotation.x=-0.10;
  box(0.50,0.32,0.035,DK,0,0,0,mon); box(0.10,0.10,0.04,DK,0,0,-0.03,mon);
  const sc=cnv(512,320), stx=new THREE.CanvasTexture(sc); stx.encoding=THREE.sRGBEncoding; stx.anisotropy=ANISO; gsScreenDraw(sc,{state:'idle'});
  const smM=new THREE.MeshBasicMaterial({map:stx}); smM.color.multiplyScalar(1.5); const scr=new THREE.Mesh(new THREE.PlaneGeometry(0.47,0.29),smM); scr.position.z=0.0185; mon.add(scr); K.push(scr);
  const kb=grp(MX+0.02,1.02,MZ+0.20,g); kb.rotation.y=0.42; box(0.38,0.018,0.20,DK,0,0,0,kb); box(0.34,0.01,0.12,std(0x2f3338,.7,.1),0,0.014,0.03,kb).castShadow=false;
  /* --- ленточный конвейер через рамку светового занавеса --- */
  for(const s of [-1,1]){ mk(L1,0.15,0.05,WH,L0+L1/2,TOP-0.06,s*(BW/2+0.035)); mk(L1,0.02,0.09,WH2,L0+L1/2,TOP+0.012,s*(BW/2+0.055)); }
  mk(L1-0.06,0.50,0.94,WH,L0+L1/2,0.40,0);                               // корпус под лентой
  for(let i=0;i<2;i++){ mk(0.70,0.40,0.012,WH2,L0+0.45+i*0.95,0.40,0.476).castShadow=false; mk(0.02,0.12,0.03,SS,L0+0.75+i*0.95,0.40,0.488).castShadow=false; }
  for(let i=0;i<8;i++) mk(0.30,0.012,0.006,DK,X1-0.30,0.24+i*0.03,0.477).castShadow=false;
  for(const sx of [L0+0.06,X1-0.06]) for(const sz of [-0.42,0.42]){ mk(0.06,0.10,0.06,DK,sx,0.05,sz); cyl(0.04,0.03,DK,sx,0.015,sz,g,12); }
  const bc=cnv(64,256), bg2=bc.getContext('2d'); bg2.fillStyle='#16171a'; bg2.fillRect(0,0,64,256);
  for(let y=0;y<256;y+=8){ bg2.fillStyle='rgba(255,255,255,.05)'; bg2.fillRect(0,y,64,3); } { let q=77; const rr=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; }; for(let i=0;i<300;i++){ bg2.fillStyle=`rgba(255,255,255,${rr()*0.04})`; bg2.fillRect(rr()*64,rr()*256,2,2); } }
  const bt=new THREE.CanvasTexture(bc); bt.wrapS=bt.wrapT=THREE.RepeatWrapping; bt.repeat.set(1,L1/0.25); bt.anisotropy=ANISO;
  const belt=new THREE.Mesh(new THREE.PlaneGeometry(BW,L1-0.04),new THREE.MeshStandardMaterial({map:bt,roughness:.85,metalness:0,envMapIntensity:.3}));
  belt.rotation.x=-Math.PI/2; belt.rotation.z=Math.PI/2; belt.position.set(L0+L1/2,TOP+0.002,0); belt.receiveShadow=true; g.add(belt); K.push(belt);
  for(const x of [L0+0.04,X1-0.04]){ const d=cyl(0.045,BW+0.02,SS,x,TOP-0.043,0,g,16); d.rotation.x=Math.PI/2; }
  /* рамка светового занавеса: две стойки, верхняя балка, полосы излучателя и приёмника со светодиодами */
  const AX=L0+(GS.ARCH-L0), PZ=0.58;
  for(const s of [-1,1]){ mk(0.11,1.20,0.16,WH,AX,TOP-0.13+0.60,s*PZ); mk(0.03,0.92,0.035,DK,AX,TOP+0.50,s*(PZ-0.094)); }
  mk(0.12,0.13,PZ*2+0.16,WH,AX,1.755,0);
  const ledG=std(0x0b2412,.35,0,{emissive:0x35e06a,emissiveIntensity:1.6}), ledR=std(0x2a0806,.35,0,{emissive:0xff2a14,emissiveIntensity:2.2});
  const curt=[]; for(const s of [-1,1]) for(let i=0;i<16;i++){ const y=TOP+0.06+i*0.056, m=mk(0.012,0.022,0.006,ledG,AX+0.0,y,s*(PZ-0.116)); m.castShadow=false; m.userData.y=y; curt.push(m); K.push(m); }
  { const c=cnv(96,640), gg=c.getContext('2d'); gg.fillStyle='#eeefec'; gg.fillRect(0,0,96,640); gg.fillStyle='#d4241c'; gg.fillRect(0,0,96,8);
    gg.fillStyle='#1b2733'; gg.font='700 70px "Noto Sans SC","Microsoft YaHei",sans-serif'; gg.textAlign='center'; ['异','方','科','技'].forEach((h,i)=>gg.fillText(h,48,90+i*92));
    gg.fillStyle='#d4241c'; gg.font='800 16px "Barlow Condensed",sans-serif'; gg.fillText('GOODSCAN',48,470);
    gg.fillStyle='#111'; for(let i=0;i<9;i++) for(let j=0;j<9;j++) if((i*7+j*13+i*j)%3===0||i<2&&j<2||i>6&&j<2||i<2&&j>6) gg.fillRect(12+i*8,500+j*8,8,8);
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.10,0.66),new THREE.MeshStandardMaterial({map:t,roughness:.5}));
    pl.position.set(AX,TOP+0.62,PZ+0.081); g.add(pl); }
  { const c=cnv(512,64), gg=c.getContext('2d'); gg.fillStyle='#eeefec'; gg.fillRect(0,0,512,64); gg.fillStyle='#d4241c'; gg.font='800 40px "Barlow Condensed",sans-serif'; gg.fillText('GOODSCAN',16,46);
    gg.fillStyle='#1b2733'; gg.font='600 30px "Barlow Condensed",sans-serif'; gg.fillText('GM220 · DIMENSION · WEIGHT · SCAN',196,44);
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.96,0.12),new THREE.MeshStandardMaterial({map:t,roughness:.5}));
    pl.position.set(AX+0.061,1.755,0); pl.rotation.y=Math.PI/2; g.add(pl); }
  /* вспышка фото над лентой */
  const flM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.3),flM); fl.rotation.x=Math.PI/2; fl.position.set(AX,1.685,0); fl.renderOrder=4; g.add(fl); K.push(fl);
  /* пульт: аварийный стоп, пуск, ключ */
  { const p=grp(L0+0.20,TOP-0.02,BW/2+0.13,g); box(0.20,0.16,0.10,YE,0,0,0,p); cyl(0.028,0.03,M.red,0.05,0.03,0.06,p,16).rotation.x=Math.PI/2;
    cyl(0.016,0.02,M.green,-0.04,0.04,0.055,p,12).rotation.x=Math.PI/2; cyl(0.016,0.02,DK,-0.04,-0.03,0.055,p,12).rotation.x=Math.PI/2; }
  /* кабель питания по полу к колонне */
  { const c2=cyl(0.012,1.0,DK,CX,0.012,CZ-0.55,g,8); c2.rotation.x=Math.PI/2; }
  /* --- выходной гравитационный рольганг на своей опоре (уклон 2 см) --- */
  const rollOut=[];
  if(o.out){ const x0=X1+0.03, n=12, pitch=LO/n;
    for(const s of [-1,1]){ const r=mk(LO,0.09,0.04,GR,x0+LO/2,TOP-0.055-0.01,s*0.49); r.rotation.z=-0.02; }
    for(let i=0;i<n;i++){ const x=x0+pitch*(i+0.5), y=TOP-0.026-0.02*(i+0.5)/n; const r=cyl(0.024,0.94,SS,x,y,0,g,12); r.rotation.x=Math.PI/2; rollOut.push(r); K.push(r); }
    mk(0.05,0.10,0.98,YE,x0+LO-0.02,TOP+0.02,0);                          // упор в конце
    for(const sx of [x0+0.08,x0+LO-0.08]) for(const sz of [-0.45,0.45]){ mk(0.05,TOP-0.09,0.05,GR,sx,(TOP-0.09)/2,sz); mk(0.10,0.02,0.10,DK,sx,0.01,sz); }
    mk(0.04,0.04,0.94,GR,x0+0.08,0.25,0); mk(0.04,0.04,0.94,GR,x0+LO-0.08,0.25,0); }
  ao(X1+(o.out?LO:0)+0.3,1.6,(X1+(o.out?LO:0))/2,0,g);
  /* --- управление анимацией --- */
  const gs={K,belt,bt,rollIn,rollOut,curt,ledG,ledR,ledM,conM,flM,sc,stx,wc,wt,last:'',lastW:'',
    setBelt(off){ bt.offset.y=off; },
    setRoll(ai,ao2){ rollIn.forEach(r=>r.rotation.y=ai); rollOut.forEach(r=>r.rotation.y=ao2); },
    setCurtain(h){ for(const m of curt){ const mat=h>0&&m.userData.y<h?ledR:ledG; if(m.material!==mat) m.material=mat; } },
    setScan(k,mode){ conM.opacity=0.10*k; ledM.emissive.setHex(mode==='scan'?0xbfe3ff:mode==='ok'?0x53d16f:0x2f8f4a); ledM.emissiveIntensity=mode==='scan'?2.4+0.8*Math.sin(k*40):mode==='ok'?2.0:1.0; },
    setFlash(k){ flM.opacity=Math.max(0,Math.min(1,k))*0.9; },
    screen(d){ const key=JSON.stringify(d); if(key===gs.last) return; gs.last=key; gsScreenDraw(sc,d); stx.needsUpdate=true; },
    weight(kg){ const t=kg>0?kg.toFixed(2):'0.00'; if(t===gs.lastW) return; gs.lastW=t; const q=wc.getContext('2d'); q.fillStyle='#071107'; q.fillRect(0,0,192,64);
      q.fillStyle='#53d16f'; q.font='700 46px "IBM Plex Mono",monospace'; q.textAlign='right'; q.textBaseline='middle'; q.fillText(t,150,34); q.font='600 20px monospace'; q.fillText('kg',186,40); wt.needsUpdate=true; },
    /* точки для сценария: где лежит короб на столе, на ленте (u 0…1), на выходном рольганге (u 0…1) */
    table:new THREE.Vector3(CX,TOP,0), beltAt:u=>new THREE.Vector3(L0+0.06+(L1-0.12)*u,TOP+0.004,0), outAt:u=>new THREE.Vector3(X1+0.03+(LO-0.10)*u,TOP-0.002-0.02*u,0),
    len:X1+(o.out?LO:0), W:1.33};
  gs.weight(0); gs.setScan(0,'idle');
  g.userData.gs=gs; g.userData.dws2={L:gs.len};
  return g;
}
/* ---------- зона DWS (14.10): на месте брака, упаковочных материалов, зарядки АКБ и досок, x 34,9…44,6, z 0,9…6,5 ----------
   (западнее, x 31,55…34,55, — проходная здания охраны)
   Стоит одинаково при любом варианте приёмки. Ленточный Goodscan — вдоль южной стены, ход груза на восток, оператор с севера;
   портальный DWS — у восточного края; между ними и магистралью — два места под поддоны образцов (погрузчик заезжает с севера,
   с южной магистрали). Поддон с образцами ставят на свободное место; замеренные короба ложатся на поддон на втором месте. */
const DWSZ={x0:35.9,x1:45.6,z0:0.9,z1:6.5,gs:[37.85,2.1,0],big:[44.0,3.9,0],spots:[[38.65,4.7],[41.05,4.7]],   // 15.10: на 1 м восточнее — проходная по SKP до x 35,55
  /* где стоят люди: TS — у весового стола Goodscan, OS — у выходного рольганга, PS — у платформы портала (короб ставят с севера,
     экран — на шкафу у юго-западного угла портала), wPW/wCT — ожидание (вне коридоров, куда заезжает погрузчик, и не на пути
     второго к граням поддонов: стоявший на перекрёстке у восточной грани контролёр не пускал упаковщика); Z0 — вход в зону */
  TS:[38.27,2.96,Math.PI],OS:[41.35,3.0,Math.PI],PS:[44.0,5.0,Math.PI],wPW:[38.65,3.3,0.25],wCT:[43.1,5.75,-Math.PI/2],Z0:[33.6,6.9],
  FPW:['S','W','E'],FCT:['N','E','W'],                                      // с каких граней поддонов работают: упаковщик — с юга (стол и выход Goodscan), контролёр — с севера (портал)
  PT:[0,0.062,0.38],                                                       // короб на платформе портала (в осях портала)
  /* дорожки людей в зоне [x0,z0,x1,z1,цена]: южная вдоль аппаратов, северная у проезда погрузчика (дороже), поперечные — между
     местами поддонов, к порталу и вход */
  nav:[[37.5,3.45,42.2,3.45,1],[37.5,5.85,42.2,5.85,2],[37.5,3.45,37.5,5.85,1],[39.85,3.45,39.85,5.85,1],[42.2,3.45,42.2,5.85,1],
       [42.2,5.0,44.0,5.0,1],[33.6,6.9,37.5,4.7,1]]};
/* экран портального DWS (живой процесс и фильм): ожидание → замер → результат */
function ptScreenDraw(c,d){ const g=c.getContext('2d'), W=c.width, H=c.height; d=d||{};
  g.fillStyle='#0c1a2e'; g.fillRect(0,0,W,H); g.fillStyle='#f2b705'; g.fillRect(0,0,W,8);
  g.fillStyle='#9fb4ca'; g.font='600 22px "Barlow Condensed",sans-serif'; g.textBaseline='alphabetic'; g.fillText('DWS · ПОРТАЛ · ОБМЕР · ВЕС · СКАН',20,40);
  const st=d.state||'idle';
  if(st==='idle'){ g.fillStyle='#e9ecef'; g.font='700 56px "Barlow Condensed",sans-serif'; g.fillText('ОЖИДАНИЕ',20,120);
    g.fillStyle='#9fb4ca'; g.font='500 24px "IBM Plex Mono",monospace'; g.fillText('крупные образцы: C · D',22,170); }
  else if(st==='scan'){ g.fillStyle='#f2b705'; g.font='700 56px "Barlow Condensed",sans-serif'; g.fillText('СКАН…',20,120);
    g.fillStyle='#9fb4ca'; g.font='500 24px "IBM Plex Mono",monospace'; g.fillText('два сканера · весы платформы',22,168);
    const k=Math.max(0,Math.min(1,d.k||0)); g.fillStyle='#22364c'; g.fillRect(22,200,W-44,14); g.fillStyle='#f2b705'; g.fillRect(22,200,(W-44)*k,14); }
  else { g.fillStyle='#9fb4ca'; g.font='500 20px "IBM Plex Mono",monospace'; g.fillText((d.client||'')+' · '+(d.sku||''),20,76);
    g.fillStyle='#e9ecef'; g.font='700 50px "Barlow Condensed",sans-serif'; g.fillText((d.L||0)+' × '+(d.W||0)+' × '+(d.H||0)+' мм',20,132);
    g.fillStyle='#53d16f'; g.font='700 50px "Barlow Condensed",sans-serif'; g.fillText((d.kg||0).toFixed(2).replace('.',',')+' кг',20,190);
    g.font='600 24px "IBM Plex Mono",monospace'; g.fillText('✓ в WMS',20,240); }
  g.fillStyle='#22364c'; g.fillRect(0,H-30,W,30); g.fillStyle='#9fb4ca'; g.font='500 18px "IBM Plex Mono",monospace'; g.fillText('замеров за смену: '+(d.count||0),16,H-9); }
function dwsZoneMarks(){
  const Z=DWSZ, wm=paintMat(0xf2f2f2,.85), ym=paintMat(PAL.yellow,.95);
  /* контуры аппаратов: где стоит оборудование и куда не ставить поддоны */
  paintRect(Z.gs[0]-0.12,Z.gs[1]-0.78,Z.gs[0]+3.92,Z.gs[1]+0.78,0xf2f2f2,0.07);
  paintRect(Z.big[0]-1.6,Z.big[1]-1.0,Z.big[0]+1.6,Z.big[1]+1.0,0xf2f2f2,0.07);                  // вместе со шкафом у юго-западного угла
  /* места поддонов: жёлтые уголки и надпись */
  Z.spots.forEach(([x,z],i)=>{ const h=0.82, a=0.36;
    for(const sx of [-1,1]) for(const sz of [-1,1]){ decal(a,0.07,ym,x+sx*(h-a/2),z+sz*h,0.0168); decal(0.07,a,ym,x+sx*h,z+sz*(h-a/2),0.0168); }
    stencil('ПОДДОН ОБРАЗЦОВ · '+(i+1),x,z+1.08,1.5,'rgba(242,183,5,.92)'); });
  stencil('ЗОНА DWS · ЗАМЕР ОБРАЗЦОВ',40.0,6.15,4.2,'rgba(242,242,242,.9)');
  hatchStrip(Z.x0+0.1,Z.z1-0.12,Z.x1-0.1,Z.z1+0.02);                     // кромка зоны со стороны проезда
  /* подвесная табличка над зоной */
  const t=signTex(['DWS · ЗАМЕР ОБРАЗЦОВ','крупные — портальный DWS · мелкие — ленточный Goodscan'],'#14161a','#f2b705',1024,256,{border:'#f2b705',px:[104,50]});
  signBoard(3.2,0.8,t,40.6,4.3,6.4,0,G.struct,{two:true,hang:1.6});
}
