/* ==========================================================================
   ФОТОРЕАЛИЗМ: процедурные текстуры (бетон пола с затиркой, швами и следами шин,
   асфальт, гофрокартон с лентой и маркировкой, дерево поддонов, стрейч-плёнка),
   грязь на стенах, окружение для отражений как в реальном цеху.
   ========================================================================== */
const LOOK={};
{
  let seed=20260928; const R=()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  LOOK.R=R;
  const tex=(c,rx,ry,srgb)=>{ const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx||1,ry||1);
    t.anisotropy=ANISO; if(srgb) t.encoding=THREE.sRGBEncoding; return t; };
  LOOK.tex=tex;
  const blotch=(g,w,h,n,rmin,rmax,col,amin,amax)=>{ for(let i=0;i<n;i++){ const x=R()*w,y=R()*h,r=rmin+R()*(rmax-rmin);
    const gr=g.createRadialGradient(x,y,0,x,y,r); const a=amin+R()*(amax-amin);
    gr.addColorStop(0,`rgba(${col},${a})`); gr.addColorStop(1,`rgba(${col},0)`); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); } };
  const speck=(g,w,h,n,col,a,s)=>{ for(let i=0;i<n;i++){ g.fillStyle=`rgba(${col},${a*(0.4+R()*0.6)})`; const z=(s||1)*(0.6+R()*1.4); g.fillRect(R()*w,R()*h,z,z); } };
  LOOK.blotch=blotch; LOOK.speck=speck;
  const noiseID=(g,w,h,amp,sparse)=>{ const id=g.getImageData(0,0,w,h), d=id.data;           // зерно поштучно по пикселям — быстро
    for(let i=0;i<d.length;i+=4){ if(sparse&&R()>sparse) continue; const n=(R()-.5)*amp; d[i]+=n; d[i+1]+=n; d[i+2]+=n; } g.putImageData(id,0,0); };
  const lowres=(g,w,h,k,fn)=>{ const c=cnv(Math.ceil(w/k),Math.ceil(h/k)), q=c.getContext('2d'); q.fillStyle='rgb(128,128,128)'; q.fillRect(0,0,c.width,c.height);
    fn(q,c.width,c.height); g.imageSmoothingEnabled=true; g.globalCompositeOperation='overlay'; g.drawImage(c,0,0,w,h); g.globalCompositeOperation='source-over'; };

  /* ---------- 1. бетон: мелкая структура (плитка 2,5 м) ---------- */
  const cd=cnv(1024,1024), g1=cd.getContext('2d');
  g1.fillStyle='rgb(128,128,128)'; g1.fillRect(0,0,1024,1024);
  lowres(g1,1024,1024,4,(q,w,h)=>{ blotch(q,w,h,160,8,40,'170,170,170',.08,.2); blotch(q,w,h,160,8,40,'85,85,85',.07,.18); });
  for(let i=0;i<70;i++){ g1.strokeStyle=`rgba(${R()<.5?175:85},${R()<.5?175:85},${R()<.5?175:85},${.03+R()*.05})`;   // дуги затирки
    g1.lineWidth=6+R()*18; g1.beginPath(); const x=R()*1024,y=R()*1024,r=60+R()*200,a=R()*6.3; g1.arc(x,y,r,a,a+0.6+R()*1.4); g1.stroke(); }
  noiseID(g1,1024,1024,34); speck(g1,1024,1024,900,'50,50,50',.35,2.2); speck(g1,1024,1024,700,'190,190,190',.3,1.6);
  for(let i=0;i<40;i++){ g1.strokeStyle=`rgba(70,70,70,${.05+R()*.08})`; g1.lineWidth=.8; g1.beginPath();       // царапины
    let x=R()*1024,y=R()*1024; g1.moveTo(x,y); const a=R()*6.3, L=20+R()*120; g1.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L); g1.stroke(); }
  LOOK.concDetail=cd;

  /* ---------- 2. макро-карта пола всего зала: пятна, швы, следы шин, трещины ---------- */
  const MW=48.05, MD=76.05, PX=40, mw=Math.round(MW*PX), md=Math.round(MD*PX);
  const cm=cnv(mw,md), g2=cm.getContext('2d');
  const X=x=>x*PX, Z=z=>z*PX;
  g2.fillStyle='rgb(128,128,128)'; g2.fillRect(0,0,mw,md);
  lowres(g2,mw,md,8,(q,w,h)=>{ blotch(q,w,h,420,8,52,'172,174,176',.07,.18);          // пятна затирки и разнотона
    blotch(q,w,h,420,8,52,'84,84,84',.06,.16); blotch(q,w,h,60,25,90,'110,106,100',.06,.12); });
  for(let i=0;i<140;i++){ const x=R()*mw,y=R()*md,r=8+R()*50;               // масляные и водные пятна
    const gr=g2.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(58,56,52,${.10+R()*.18})`); gr.addColorStop(.7,`rgba(70,68,64,${.05+R()*.08})`); gr.addColorStop(1,'rgba(80,80,80,0)');
    g2.fillStyle=gr; g2.beginPath(); g2.ellipse(x,y,r,r*(0.5+R()*0.5),R()*3,0,6.3); g2.fill(); }
  /* нарезные швы: по осям колонн и посередине пролётов */
  const joint=(x0,z0,x1,z1)=>{ g2.strokeStyle='rgba(55,55,57,.75)'; g2.lineWidth=1.6; g2.beginPath(); g2.moveTo(X(x0),Z(z0)); g2.lineTo(X(x1),Z(z1)); g2.stroke();
    g2.strokeStyle='rgba(165,165,165,.18)'; g2.lineWidth=5; g2.beginPath(); g2.moveTo(X(x0),Z(z0)); g2.lineTo(X(x1),Z(z1)); g2.stroke(); };
  for(let x=8.0;x<MW;x+=8.0) joint(x,0,x,MD);
  for(let z=3.525;z<MD;z+=3.525) joint(0,z,MW,z);
  /* следы шин: пары дуг вдоль проездов и развороты у ворот (как на фото объекта) */
  const track=(pts,w,a,gap)=>{ for(const s of [-1,1]){ g2.strokeStyle=`rgba(40,40,42,${a})`; g2.lineWidth=w*PX; g2.lineCap='round'; g2.beginPath();
      pts.forEach((p,i)=>{ const q=pts[Math.min(i+1,pts.length-1)], o=pts[Math.max(i-1,0)]; let dx=q[0]-o[0], dz=q[1]-o[1]; const L=Math.hypot(dx,dz)||1;
        const nx=-dz/L*gap/2*s, nz=dx/L*gap/2*s; const x=X(p[0]+nx), y=Z(p[1]+nz); i?g2.lineTo(x,y):g2.moveTo(x,y); }); g2.stroke(); } };
  const arc=(cx,cz,r,a0,a1,n)=>Array.from({length:n||24},(_,i)=>{ const a=a0+(a1-a0)*i/((n||24)-1); return [cx+Math.cos(a)*r,cz+Math.sin(a)*r]; });
  for(let i=0;i<46;i++){ const z=15.2+(R()-0.5)*3.0, zz=z+(R()-0.5)*1.2; const x0=1+R()*20, x1=x0+10+R()*26;
    track([[x0,z],[ (x0+x1)/2,(z+zz)/2+(R()-.5)*.6],[x1,zz]],0.2,.025+R()*.05,0.98); }
  for(let i=0;i<40;i++){ const z=28.6+(R()-0.5)*3.4, zz=z+(R()-0.5)*1.4; const x0=1+R()*20, x1=x0+10+R()*26;
    track([[x0,z],[ (x0+x1)/2,(z+zz)/2+(R()-.5)*.6],[x1,zz]],0.2,.02+R()*.05,0.98); }
  for(let i=0;i<30;i++){ const z=33.2+(R()-0.5)*2.2; track([[R()*6,z],[24,z+(R()-.5)],[42+R()*6,z+(R()-.5)]],0.24,.03+R()*.04,1.9); }
  for(let i=0;i<60;i++){ const cx=2+R()*44, cz=R()<.5?15.2:28.6, r=1.6+R()*3, a0=R()*6.3;      // развороты к ячейкам
    track(arc(cx,cz+(R()-.5)*2,r,a0,a0+0.8+R()*1.6,18),0.2,.02+R()*.05,0.98); }
  for(let i=0;i<34;i++){ const r=2+R()*5, a0=R()*6.3; track(arc(3+R()*5,10.6+(R()-.5)*3,r,a0,a0+1+R()*2),0.2,.03+R()*.05,0.98); }   // у Л2
  for(let i=0;i<34;i++){ const r=2+R()*5, a0=R()*6.3; track(arc(42+R()*4,10.6+(R()-.5)*3,r,a0,a0+1+R()*2),0.2,.03+R()*.05,0.98); } // у П2
  for(let i=0;i<50;i++){ const r=3+R()*9, a0=R()*6.3; track(arc(4+R()*40,4+R()*30,r,a0,a0+0.6+R()*1.4),0.18,.012+R()*.03,0.9); } // случайные дуги по всему залу
  /* трещины */
  for(let i=0;i<26;i++){ g2.strokeStyle=`rgba(45,45,47,${.25+R()*.3})`; g2.lineWidth=0.8+R()*0.6; g2.beginPath();
    let x=R()*mw,y=R()*md; g2.moveTo(x,y); for(let k=0;k<14+R()*20;k++){ x+=(R()-.5)*14; y+=(R()-.5)*14; g2.lineTo(x,y); } g2.stroke(); }
  /* потёртости от поддонов в ячейках и у рольгангов */
  for(let i=0;i<120;i++){ const x=X(1.5+R()*45), y=Z(17.6+R()*8.3); g2.fillStyle=`rgba(${R()<.5?90:160},${R()<.5?90:160},${R()<.5?90:160},${.04+R()*.06})`;
    g2.save(); g2.translate(x,y); g2.rotate((R()-.5)*.2); g2.fillRect(-0.6*PX,-0.4*PX,1.2*PX,0.8*PX); g2.restore(); }
  LOOK.floorMacro=tex(cm,1,1); LOOK.floorMacro.wrapS=LOOK.floorMacro.wrapT=THREE.ClampToEdgeWrapping;

  /* ---------- 3. асфальт двора: мелкая фактура и макро (заплатки, трещины, колея) ---------- */
  const ad=cnv(512,512), g3=ad.getContext('2d');
  g3.fillStyle='rgb(128,128,128)'; g3.fillRect(0,0,512,512);
  noiseID(g3,512,512,90); speck(g3,512,512,3000,'40,40,40',.5,1.6); speck(g3,512,512,2000,'200,200,200',.4,1.3); blotch(g3,512,512,50,20,90,'100,100,100',.05,.12);
  LOOK.asphDetail=ad;
  const AX0=-60, AZ0=-70, AW=170, AD=170, APX=12;
  const ca=cnv(AW*APX,AD*APX), g4=ca.getContext('2d');
  g4.fillStyle='rgb(128,128,128)'; g4.fillRect(0,0,ca.width,ca.height);
  lowres(g4,ca.width,ca.height,8,(q,w,h)=>{ blotch(q,w,h,500,4,32,'175,175,175',.07,.18); blotch(q,w,h,500,4,32,'80,80,80',.07,.18); });
  for(let i=0;i<60;i++){ g4.fillStyle=`rgba(${R()<.5?70:110},${R()<.5?70:110},${R()<.5?70:110},${.12+R()*.2})`;    // заплатки
    g4.save(); g4.translate(R()*ca.width,R()*ca.height); g4.rotate(R()*.3); g4.fillRect(0,0,(1+R()*6)*APX,(1+R()*4)*APX); g4.restore(); }
  for(let i=0;i<120;i++){ g4.strokeStyle=`rgba(35,35,35,${.3+R()*.4})`; g4.lineWidth=0.7+R(); g4.beginPath();          // трещины
    let x=R()*ca.width,y=R()*ca.height; g4.moveTo(x,y); for(let k=0;k<10+R()*30;k++){ x+=(R()-.5)*9; y+=(R()-.5)*9; g4.lineTo(x,y); } g4.stroke(); }
  const ax=x=>(x-AX0)*APX, az=z=>(z-AZ0)*APX;
  for(const [xa,xb] of [[-26,-1],[49,74]]) for(let i=0;i<18;i++){ const z=10.6+(R()-.5)*6;                      // колея к воротам Л2 и П2
    g4.strokeStyle=`rgba(40,40,40,${.06+R()*.08})`; g4.lineWidth=0.35*APX; g4.beginPath(); g4.moveTo(ax(xa),az(z)); g4.bezierCurveTo(ax(xa+8),az(z+(R()-.5)*8),ax(xb-8),az(z+(R()-.5)*3),ax(xb),az(z+(R()-.5)*2)); g4.stroke(); }
  for(let i=0;i<50;i++){ const x=ax(-14+R()*84), y=az(-40+R()*110), r=(0.5+R()*1.8)*APX;                          // масляные пятна стоянок
    const gr=g4.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,`rgba(20,20,20,${.25+R()*.3})`); gr.addColorStop(1,'rgba(40,40,40,0)'); g4.fillStyle=gr; g4.fillRect(x-r,y-r,2*r,2*r); }
  LOOK.asphMacro=tex(ca,1,1); LOOK.asphMacro.wrapS=LOOK.asphMacro.wrapT=THREE.ClampToEdgeWrapping;
  LOOK.asphBox=[AX0,AZ0,AW,AD];

  /* ---------- 4. гофрокартон: фактура, лента, маркировка (3 вида) ---------- */
  const carton=(v)=>{ const s=512,c=cnv(s,s),g=c.getContext('2d');
    const base=[[190,146,98],[178,137,92],[199,160,112],[170,128,84]][v];
    g.fillStyle=`rgb(${base})`; g.fillRect(0,0,s,s);
    for(let i=0;i<1400;i++){ g.strokeStyle=`rgba(${base[0]-40+R()*60|0},${base[1]-40+R()*50|0},${base[2]-30+R()*40|0},.12)`;
      g.lineWidth=.7; g.beginPath(); const x=R()*s,y=R()*s; g.moveTo(x,y); g.lineTo(x+(R()*30-15),y+(R()*3-1.5)); g.stroke(); }
    for(let y=0;y<s;y+=5){ g.fillStyle=`rgba(90,60,30,${.018+R()*.01})`; g.fillRect(0,y,s,1.6); }   // рифление
    blotch(g,s,s,14,20,90,'120,80,40',.03,.10);
    const eg=g.createLinearGradient(0,0,s,0); eg.addColorStop(0,'rgba(70,45,20,.22)'); eg.addColorStop(.05,'rgba(70,45,20,0)'); eg.addColorStop(.95,'rgba(70,45,20,0)'); eg.addColorStop(1,'rgba(70,45,20,.22)');
    g.fillStyle=eg; g.fillRect(0,0,s,s);
    const eh=g.createLinearGradient(0,0,0,s); eh.addColorStop(0,'rgba(70,45,20,.2)'); eh.addColorStop(.05,'rgba(70,45,20,0)'); eh.addColorStop(.95,'rgba(70,45,20,0)'); eh.addColorStop(1,'rgba(70,45,20,.25)');
    g.fillStyle=eh; g.fillRect(0,0,s,s);
    /* лента скотча по центру */
    const tw=s*(0.13+R()*0.03); const tc=v===2?'rgba(214,176,112,.78)':'rgba(196,150,86,.62)';
    g.fillStyle=tc; g.fillRect(s/2-tw/2,0,tw,s);
    g.fillStyle='rgba(255,255,255,.10)'; g.fillRect(s/2-tw/2,0,tw*0.25,s);
    g.strokeStyle='rgba(90,60,30,.25)'; g.lineWidth=1; g.strokeRect(s/2-tw/2,-2,tw,s+4);
    /* маркировка: манипуляционные знаки, иероглифы, стрелки */
    g.fillStyle=v===1?'rgba(38,52,96,.72)':'rgba(40,34,30,.72)';
    g.font='700 44px "Noto Sans SC","Microsoft YaHei",sans-serif'; g.fillText(['易碎品','小心轻放','防潮','此面向上'][v],30,120);
    g.font='600 26px sans-serif'; g.fillText(['MADE IN CHINA','N.W. 18 KG','CTN NO. '+(100+R()*800|0),'G.W. 21 KG'][v],30,160);
    g.lineWidth=6; g.strokeStyle=g.fillStyle;
    for(let k=0;k<2;k++){ const x=360+k*60, y=70; g.beginPath(); g.moveTo(x,y+60); g.lineTo(x,y); g.moveTo(x-18,y+20); g.lineTo(x,y); g.lineTo(x+18,y+20); g.stroke(); }  // «верх»
    g.beginPath(); g.moveTo(40,420); g.lineTo(90,420); g.lineTo(80,470); g.lineTo(50,470); g.closePath(); g.stroke();               // бокал «хрупкое»
    g.beginPath(); g.moveTo(65,470); g.lineTo(65,495); g.moveTo(52,495); g.lineTo(78,495); g.stroke();
    /* белая этикетка со штрихкодом */
    if(v!==3){ const lx=330,ly=330,lw=140,lh=100; g.fillStyle='rgba(245,244,238,.95)'; g.fillRect(lx,ly,lw,lh);
      g.fillStyle='#111'; for(let x=lx+10;x<lx+lw-10;x+=2+(R()*3|0)){ const bw=1+(R()*2.5|0); g.fillRect(x,ly+36,bw,48); }
      g.font='600 14px monospace'; g.fillText('BRQ-'+(10000+R()*89999|0),lx+10,ly+26); }
    return c; };
  LOOK.cartonC=[0,1,2,3].map(carton);
  LOOK.cartons=LOOK.cartonC.map(c=>new THREE.MeshStandardMaterial({map:tex(c,1,1,true),roughness:.9,metalness:0,envMapIntensity:.45}));

  /* ---------- 5. дерево поддонов ---------- */
  const wd=cnv(512,128), g5=wd.getContext('2d');
  g5.fillStyle='rgb(196,164,118)'; g5.fillRect(0,0,512,128);
  for(let i=0;i<220;i++){ g5.strokeStyle=`rgba(${120+R()*40|0},${90+R()*30|0},${55+R()*25|0},${.12+R()*.2})`; g5.lineWidth=0.6+R()*1.6;
    g5.beginPath(); const y=R()*128; g5.moveTo(0,y); for(let x=0;x<=512;x+=32) g5.lineTo(x,y+Math.sin(x*0.02+i)*2.5+(R()-.5)*1.5); g5.stroke(); }
  for(let i=0;i<7;i++){ const x=R()*512,y=R()*128; const gr=g5.createRadialGradient(x,y,0,x,y,7+R()*6);   // сучки
    gr.addColorStop(0,'rgba(90,60,30,.7)'); gr.addColorStop(1,'rgba(110,80,40,0)'); g5.fillStyle=gr; g5.beginPath(); g5.ellipse(x,y,12,5,0,0,6.3); g5.fill(); }
  blotch(g5,512,128,20,10,60,'80,60,40',.05,.14);
  LOOK.wood=tex(wd,1,1,true);

  /* ---------- 6. складки стрейч-плёнки (рельеф) ---------- */
  const fw=cnv(256,256), g6=fw.getContext('2d');
  g6.fillStyle='rgb(128,128,128)'; g6.fillRect(0,0,256,256);
  for(let i=0;i<90;i++){ const y=R()*256; g6.strokeStyle=`rgba(${R()<.5?255:0},${R()<.5?255:0},${R()<.5?255:0},${.05+R()*.12})`; g6.lineWidth=1+R()*5;
    g6.beginPath(); g6.moveTo(0,y); g6.bezierCurveTo(80,y+(R()-.5)*16,170,y+(R()-.5)*16,256,y+(R()-.5)*6); g6.stroke(); }
  LOOK.filmBump=tex(fw,1,2);
}

/* ---------- инъекция «макро» по мировым координатам в стандартный материал ---------- */
function worldMacro(mat,o){                                     // o: {map, box:[x0,z0,w,d], k, rough, dirtY, dirtK}
  const key='wm'+(o.map?o.map.uuid:'')+(o.dirtY||0)+(o.k||0);
  mat.customProgramCacheKey=()=>key;
  mat.onBeforeCompile=sh=>{
    sh.uniforms.mMap={value:o.map||null}; sh.uniforms.mBox={value:new THREE.Vector4(...(o.box||[0,0,1,1]))};
    sh.uniforms.mK={value:o.k===undefined?1:o.k}; sh.uniforms.mRough={value:o.rough===undefined?0.6:o.rough};
    sh.uniforms.dY={value:o.dirtY||0}; sh.uniforms.dK={value:o.dirtK||0};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;')
      .replace('#include <project_vertex>','#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vWP; uniform sampler2D mMap; uniform vec4 mBox; uniform float mK,mRough,dY,dK;
      float wh(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
      float wn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(wh(i),wh(i+vec2(1,0)),f.x),mix(wh(i+vec2(0,1)),wh(i+vec2(1,1)),f.x),f.y); }`)
      .replace('#include <map_fragment>',`#include <map_fragment>
      float macL=1.;
      ${o.map?`{ vec2 muv=(vWP.xz-mBox.xy)/mBox.zw; vec3 mc=texture2D(mMap,muv).rgb*2.; diffuseColor.rgb*=mix(vec3(1.),mc,mK); macL=dot(mc,vec3(.333)); }`:''}
      ${o.dirtY?`{ float n=wn(vWP.xz*1.7+vWP.y*.3)*.6+wn(vec2(vWP.x+vWP.z,vWP.y)*6.)*.4;
        float d=smoothstep(dY,0.,vWP.y)*(.55+.45*n); diffuseColor.rgb*=1.-dK*d;
        float st=smoothstep(.72,.95,wn(vec2((vWP.x+vWP.z)*3.1,vWP.y*.35)))*smoothstep(0.,6.,vWP.y)*.5; diffuseColor.rgb*=1.-dK*.35*st; }`:''}`)
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=clamp(roughnessFactor*mix(1.,.55+.55*macL,mRough),.04,1.);`);
  };
  return mat;
}
