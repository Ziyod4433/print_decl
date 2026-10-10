/* ---------- груз китайской машины: 4 типа коробов (SKU) ----------
   A — малый, B — стандартный, C — длинный, D — крупный. У каждого свой гофрокартон, печать и этикетка SKU. */
const CTYPE=[
  {id:'A',n:'малый',    l:0.40,w:0.30,h:0.30,kg:6.4, base:[222,212,190],ink:'#23427a',t1:'精密配件',t2:'SMALL PARTS',band:'#2f6fb8'},
  {id:'B',n:'стандарт', l:0.60,w:0.40,h:0.40,kg:14.2,base:[191,147,99], ink:'#2b241e',t1:'易碎品',  t2:'FRAGILE · 此面向上',band:null},
  {id:'C',n:'длинный',  l:0.80,w:0.40,h:0.35,kg:17.8,base:[166,124,80], ink:'#2b241e',t1:'长件',    t2:'LONG ITEM',band:'#1f7a43'},
  {id:'D',n:'крупный',  l:0.60,w:0.50,h:0.50,kg:23.5,base:[201,163,114],ink:'#8a2a1c',t1:'重物',    t2:'HEAVY · 小心轻放',band:'#c0392b'}];
(function(){
  const R=LOOK.R;
  function face(T,side){                     // side: 0 — торец/бок с этикеткой, 1 — крышка с лентой
    const s=512, c=cnv(s,s), g=c.getContext('2d'), b=T.base;
    g.fillStyle=`rgb(${b})`; g.fillRect(0,0,s,s);
    for(let i=0;i<1500;i++){ g.strokeStyle=`rgba(${b[0]-40+R()*60|0},${b[1]-40+R()*50|0},${b[2]-30+R()*40|0},.12)`;
      g.lineWidth=.7; g.beginPath(); const x=R()*s,y=R()*s; g.moveTo(x,y); g.lineTo(x+(R()*30-15),y+(R()*3-1.5)); g.stroke(); }
    for(let y=0;y<s;y+=5){ g.fillStyle=`rgba(90,60,30,${.016+R()*.01})`; g.fillRect(0,y,s,1.6); }
    for(let i=0;i<10;i++){ const x=R()*s,y=R()*s,r=20+R()*70, gr=g.createRadialGradient(x,y,0,x,y,r);
      gr.addColorStop(0,`rgba(110,75,40,${.03+R()*.06})`); gr.addColorStop(1,'rgba(110,75,40,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }
    const e=g.createLinearGradient(0,0,s,0); e.addColorStop(0,'rgba(60,40,20,.22)'); e.addColorStop(.05,'rgba(60,40,20,0)'); e.addColorStop(.95,'rgba(60,40,20,0)'); e.addColorStop(1,'rgba(60,40,20,.22)');
    g.fillStyle=e; g.fillRect(0,0,s,s);
    if(T.band){ g.fillStyle=T.band; g.globalAlpha=.85; g.fillRect(0,s*0.80,s,s*0.07); g.globalAlpha=1; }
    for(let i=0;i<7;i++){ const x=R()*s,y=R()*s,l=20+R()*90,a=R()*6.3;                 // потёртости и царапины от перевозки
      g.strokeStyle=`rgba(255,246,228,${.10+R()*.14})`; g.lineWidth=1+R()*2.5; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l*0.3); g.stroke(); }
    for(let i=0;i<3;i++){ const x=R()*s,y=R()*s,r=14+R()*30, gr=g.createRadialGradient(x-r*0.2,y-r*0.2,0,x,y,r);          // вмятины
      gr.addColorStop(0,'rgba(40,26,12,.16)'); gr.addColorStop(.7,'rgba(40,26,12,.05)'); gr.addColorStop(1,'rgba(255,240,215,.07)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }
    if(T.id==='D'||T.id==='C'){ for(const sx of [0.24,0.76]){ g.fillStyle='rgba(18,20,24,.88)'; g.fillRect(s*sx-7,0,14,s);        // полипропиленовые стяжки
        g.fillStyle='rgba(255,255,255,.14)'; g.fillRect(s*sx-7,0,3,s); } }
    const tw=s*0.14; g.fillStyle=T.id==='A'?'rgba(225,225,222,.7)':'rgba(196,150,86,.62)'; g.fillRect(s/2-tw/2,0,tw,side?s:s*0.16);
    if(side){ g.fillStyle='rgba(255,255,255,.1)'; g.fillRect(s/2-tw/2,0,tw*0.25,s); return c; }
    g.fillStyle=T.ink; g.globalAlpha=.82;
    g.font='700 64px "Noto Sans SC","Microsoft YaHei",sans-serif'; g.fillText(T.t1,26,150);
    g.font='600 30px sans-serif'; g.fillText(T.t2,28,196);
    g.lineWidth=7; g.strokeStyle=T.ink;
    for(let k=0;k<2;k++){ const x=380+k*56, y=96; g.beginPath(); g.moveTo(x,y+60); g.lineTo(x,y); g.moveTo(x-18,y+20); g.lineTo(x,y); g.lineTo(x+18,y+20); g.stroke(); }
    g.globalAlpha=1;
    /* этикетка SKU: крупная буква типа, штрихкод, вес */
    const lx=250,ly=250,lw=230,lh=170; g.fillStyle='rgba(247,246,240,.97)'; g.fillRect(lx,ly,lw,lh);
    g.fillStyle='#111'; g.font='800 92px "Barlow Condensed",sans-serif'; g.fillText(T.id,lx+12,ly+86);
    g.font='600 20px monospace'; g.fillText('SKU-'+T.id+(4100+CTYPE.indexOf(T)*37),lx+72,ly+34);
    g.fillText(T.kg.toFixed(1)+' KG',lx+72,ly+62);
    for(let x=lx+12;x<lx+lw-12;x+=2+(R()*3|0)){ g.fillRect(x,ly+100,1+(R()*2.4|0),52); }
    return c;
  }
  CTYPE.forEach(T=>{
    const side=new THREE.MeshStandardMaterial({map:LOOK.tex(face(T,0),1,1,true),roughness:.88,metalness:0,envMapIntensity:.45});
    const top=new THREE.MeshStandardMaterial({map:LOOK.tex(face(T,1),1,1,true),roughness:.88,metalness:0,envMapIntensity:.45});
    side.name='CARTON'; top.name='CARTON';
    T.mats=[side,side,top,top,side,side];                  // +x −x +y −y +z −z
    T.mat=side;
  });
  LOOK.ctypeM=CTYPE.flatMap(T=>[T.mats[0],T.mats[2]]);
})();
/* короб со снятыми фасками рёбер (гофрокартон не бывает с острой кромкой): 6 граней с материалами как у BoxGeometry + фаски */
function bevelBox(L,H,W2,bv){
  const h=[L/2,H/2,W2/2], P=[],U=[],G=[[],[],[],[],[],[]], V=(sx,sy,sz,ax)=>{ const s=[sx,sy,sz]; return [0,1,2].map(k=>s[k]*(k===ax?h[k]:h[k]-bv)); };
  const tri=(mi,a,b,c,ua,ub,uc)=>{ const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    const nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx, cx=a[0]+b[0]+c[0], cy=a[1]+b[1]+c[1], cz=a[2]+b[2]+c[2];
    if(nx*cx+ny*cy+nz*cz<0){ const t=b; b=c; c=t; const tu=ub; ub=uc; uc=tu; }
    const i=P.length/3; P.push(...a,...b,...c); U.push(...ua,...ub,...uc); G[mi].push(i,i+1,i+2); };
  const uvOf=(ax,sg,p)=>{ let u,v;                                       // развёртка как у BoxGeometry
    if(ax===0){ u=-sg*p[2]/W2; v=p[1]/H; } else if(ax===1){ u=p[0]/L; v=-sg*p[2]/W2; } else { u=sg*p[0]/L; v=p[1]/H; } return [u+0.5,v+0.5]; };
  for(let ax=0;ax<3;ax++) for(const sg of [-1,1]){ const mi=ax*2+(sg>0?0:1), o=[0,1,2].filter(k=>k!==ax), q=[];
    for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){ const s=[0,0,0]; s[ax]=sg; s[o[0]]=a; s[o[1]]=b; q.push(V(s[0],s[1],s[2],ax)); }
    tri(mi,q[0],q[1],q[2],uvOf(ax,sg,q[0]),uvOf(ax,sg,q[1]),uvOf(ax,sg,q[2])); tri(mi,q[0],q[2],q[3],uvOf(ax,sg,q[0]),uvOf(ax,sg,q[2]),uvOf(ax,sg,q[3])); }
  const eu=[0.02,0.5];
  for(let a=0;a<3;a++) for(let b=a+1;b<3;b++){ const c=3-a-b; for(const sa of [-1,1]) for(const sb of [-1,1]){
    const s0=[0,0,0], s1=[0,0,0]; s0[a]=sa; s0[b]=sb; s0[c]=-1; s1[a]=sa; s1[b]=sb; s1[c]=1;
    const A0=V(s0[0],s0[1],s0[2],a), A1=V(s1[0],s1[1],s1[2],a), B0=V(s0[0],s0[1],s0[2],b), B1=V(s1[0],s1[1],s1[2],b), mi=(a===1||b===1)?(a===1?b:a)*2:0;
    tri(mi,A0,A1,B1,eu,eu,eu); tri(mi,A0,B1,B0,eu,eu,eu); } }
  for(const sx of [-1,1]) for(const sy of [-1,1]) for(const sz of [-1,1]) tri(0,V(sx,sy,sz,0),V(sx,sy,sz,1),V(sx,sy,sz,2),eu,eu,eu);
  const g=new THREE.BufferGeometry(), idx=[]; let st=0;
  G.forEach((arr,mi)=>{ g.addGroup(st,arr.length,mi); idx.push(...arr); st+=arr.length; });
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); g.setIndex(idx);
  g.computeVertexNormals(); return g; }                      // вершины не общие (по три на треугольник) — нормали плоские; индекс нужен экспорту glTF для групп материалов
function cartonMesh(ti){                                   // короб типа ti: одна сетка, начало координат — центр дна
  const T=CTYPE[ti]; if(!T.geo){ T.geo=bevelBox(T.l,T.h,T.w,0.007); T.geo.translate(0,T.h/2,0); } const geo2=T.geo;
  const m=new THREE.Mesh(geo2,T.mats); m.castShadow=m.receiveShadow=true; m.userData.ctype=ti; return m;
}
function cartonT(ti){ const g=new THREE.Group(); g.add(cartonMesh(ti)); const T=CTYPE[ti]; g.userData.carton={l:T.l,w:T.w,hh:T.h,type:ti}; return g; }
