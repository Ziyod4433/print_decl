/* ---------- шины, стекло, краска, тенты, номера (общие для всей техники) ---------- */
const TRK={n:0};
{
  const tr=cnv(256,64), g=tr.getContext('2d');                 // протектор: вдоль окружности
  g.fillStyle='#1b1d20'; g.fillRect(0,0,256,64);
  for(let i=0;i<16;i++){ const x=i*16; g.fillStyle='#0b0c0e'; g.fillRect(x,4,5,56);
    g.fillRect(x+5,16,8,4); g.fillRect(x+5,44,8,4); }
  g.fillStyle='#0b0c0e'; g.fillRect(0,20,256,3); g.fillRect(0,41,256,3);
  TRK.treadT=LOOK.tex(tr,1,1); TRK.treadT.wrapS=THREE.RepeatWrapping;
  const sw=cnv(512,64), g2=sw.getContext('2d');                // боковина с надписями
  g2.fillStyle='#202226'; g2.fillRect(0,0,512,64);
  g2.fillStyle='rgba(120,124,130,.55)'; g2.font='700 22px sans-serif';
  for(let k=0;k<2;k++){ g2.fillText('315/80 R22.5  156/150L',20+k*256,40); }
  TRK.sideT=LOOK.tex(sw,1,1,true);
  M.tyreT=new THREE.MeshStandardMaterial({color:0xffffff,map:TRK.treadT,bumpMap:TRK.treadT,bumpScale:0.02,roughness:.92,metalness:0,envMapIntensity:.3});
  M.tyreS=new THREE.MeshStandardMaterial({color:0x9a9ea4,map:TRK.sideT,roughness:.85,metalness:0,envMapIntensity:.3});
  M.rimSilver=std(0xc4c9ce,.32,.75,{envMapIntensity:1.0}); M.rimGrey=std(0x8e959c,.45,.6); M.rimFork=std(0x34383d,.5,.35); M.rimWhite=std(0xe9ebec,.4,.25);
  M.hubDark=std(0x2d3136,.5,.6);
  M.cabGlass=new THREE.MeshStandardMaterial({color:0x7d8f9b,roughness:.07,metalness:.05,envMapIntensity:.45,transparent:true,opacity:.3});   // лёгкая тонировка: виден салон и водитель   // тонированное, но прозрачное: виден салон и водитель
  M.blackPl=std(0x1c1e21,.62,.05); M.greyPl=std(0x3a3e44,.55,.1);
  M.ledW=std(0xffffff,.2,0,{emissive:0xf2f6ff,emissiveIntensity:2.2}); M.lensAmber=std(0xffa21a,.25,0,{emissive:0xff8a00,emissiveIntensity:.35});
  M.lensRed=std(0xc0271f,.25,0,{emissive:0xa01010,emissiveIntensity:.5}); M.reflRed=std(0xc81e1e,.3,.2,{emissive:0x600000,emissiveIntensity:.2});
  M.reflWhite=std(0xf2f2f2,.3,.3,{envMapIntensity:1.4});
  M.chassis=std(0x1f2226,.55,.35);
  const mkPaint=c=>new THREE.MeshPhysicalMaterial({color:c,roughness:.28,metalness:.05,clearcoat:.8,clearcoatRoughness:.12,envMapIntensity:1.0});
  TRK.paints={white:mkPaint(0xe8eaec),blue:mkPaint(0x1f4f9a),red:mkPaint(0xa82a22),yellow:mkPaint(0xe0a31a),silver:mkPaint(0xb9bfc5),green:mkPaint(0x2f6b50)};
  TRK.bodyPaint={green:std(0x2f7355,.5,.35),blue:std(0x2c5d93,.5,.35),grey:std(0x7d858d,.5,.4)};
  /* ткань тента: плетение и складки */
  const tp=cnv(256,256), g3=tp.getContext('2d'); g3.fillStyle='rgb(128,128,128)'; g3.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=2){ g3.fillStyle=`rgba(0,0,0,${.03+LOOK.R()*.03})`; g3.fillRect(0,y,256,1); }
  for(let x=0;x<256;x+=2){ g3.fillStyle=`rgba(255,255,255,${.02+LOOK.R()*.03})`; g3.fillRect(x,0,1,256); }
  for(let i=0;i<14;i++){ const x=LOOK.R()*256; const gr=g3.createLinearGradient(x-10,0,x+10,0);
    gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(.5,'rgba(0,0,0,.12)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g3.fillStyle=gr; g3.fillRect(x-10,0,20,256); }
  TRK.tarpBump=LOOK.tex(tp,4,1);
  M.tarp=new THREE.MeshStandardMaterial({color:0xd4d8dc,roughness:.78,metalness:0,bumpMap:TRK.tarpBump,bumpScale:.004,envMapIntensity:.5});
  M.tarpBlue=new THREE.MeshStandardMaterial({color:0x27528f,roughness:.8,metalness:0,bumpMap:TRK.tarpBump,bumpScale:.004,envMapIntensity:.5});
}
/* надпись перевозчика на двери кабины и на тенте: canvas → плоскость с полигональным смещением (не мерцает на краске) */
function decalMat(lines,bg,fg,w,h){
  const c=cnv(w||512,h||128), g=c.getContext('2d'); if(bg){ g.fillStyle=bg; g.fillRect(0,0,c.width,c.height); }
  g.fillStyle=fg||'#1b2a44'; g.textBaseline='middle';
  lines.forEach((L,i)=>{ g.font=L.font||'700 54px "Barlow Condensed","Noto Sans SC",sans-serif'; g.textAlign=L.align||'left'; g.fillText(L.t,L.x!==undefined?L.x:16,L.y!==undefined?L.y:c.height/2); });
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=ANISO;
  return new THREE.MeshStandardMaterial({map:t,transparent:!bg,roughness:.5,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,envMapIntensity:.6}); }
function trkDecal(par,mat,w,h,x,y,z,ry){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat); m.position.set(x,y,z); m.rotation.y=ry||0; m.castShadow=false; m.receiveShadow=true; par.add(m); return m; }
/* номерной знак: китайский жёлтый (крупнотоннажный) или казахстанский */
function plateMat(text,kind){
  const c=cnv(440,140), g=c.getContext('2d');
  if(kind==='kz'){ g.fillStyle='#f4f5f2'; g.fillRect(0,0,440,140); g.fillStyle='#1d6fb8'; g.fillRect(8,8,70,124);
    g.fillStyle='#f2c200'; g.beginPath(); g.arc(43,52,18,0,6.3); g.fill(); g.fillStyle='#fff'; g.font='700 30px sans-serif'; g.fillText('KZ',20,118);
    g.fillStyle='#111'; g.font='700 84px "Roboto Condensed",sans-serif'; g.fillText(text,92,102); }
  else { g.fillStyle='#f0b400'; g.fillRect(0,0,440,140); g.strokeStyle='#111'; g.lineWidth=6; g.strokeRect(8,8,424,124);
    g.fillStyle='#111'; g.font='700 80px "Noto Sans SC","Microsoft YaHei",sans-serif'; g.fillText(text,26,100); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=ANISO;
  return new THREE.MeshStandardMaterial({map:t,roughness:.4,metalness:.3,envMapIntensity:.8});
}
/* ---------- шина с диском: группа в точке оси; axis — направление оси ---------- */
const _tireGeo={};
function tireGeo(r,w){
  const k=r.toFixed(3)+'_'+w.toFixed(3); if(_tireGeo[k]) return _tireGeo[k];
  const rr=r*0.6, sh=Math.min(0.06,w*0.22), pts=[];
  pts.push([rr,-w/2+0.01],[rr+0.03,-w/2]);                                        // посадка на обод
  const sidePts=8; for(let i=0;i<=sidePts;i++){ const a=i/sidePts; pts.push([rr+0.03+(r-sh-rr-0.03)*a, -w/2-0.012*Math.sin(a*Math.PI)]); }
  for(let i=0;i<=6;i++){ const a=i/6*Math.PI/2; pts.push([r-sh+Math.sin(a)*sh, -w/2+sh-Math.cos(a)*sh]); }   // плечо
  for(let i=0;i<=6;i++){ const a=i/6*Math.PI/2; pts.push([r-sh+Math.cos(a)*sh, w/2-sh+Math.sin(a)*sh]); }
  for(let i=sidePts;i>=0;i--){ const a=i/sidePts; pts.push([rr+0.03+(r-sh-rr-0.03)*a, w/2+0.012*Math.sin(a*Math.PI)]); }
  pts.push([rr+0.03,w/2],[rr,w/2-0.01]);
  const geo=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),40);
  /* UV: протектор повторяется по окружности */
  const uv=geo.attributes.uv; for(let i=0;i<uv.count;i++) uv.setX(i,uv.getX(i)*Math.round(2*Math.PI*r/0.35));
  geo.rotateX(Math.PI/2);                                       // ось вдоль Z
  return _tireGeo[k]=geo;
}
function tire(g,x,y,z,r,w,axis,rimMat){
  const wg=new THREE.Group(); wg.position.set(x,y,z); g.add(wg);
  const inner=new THREE.Group(); wg.add(inner);
  if(axis!=='z') inner.rotation.y=Math.PI/2;                    // ось вдоль X
  const big=r>0.4;
  const t=new THREE.Mesh(tireGeo(r,w),M.tyreT); t.castShadow=t.receiveShadow=true; inner.add(t);
  const rim=rimMat||(big?M.rimSilver:M.rimFork);
  const rk=big?0.58:0.46;
  const rd=new THREE.Mesh(new THREE.CylinderGeometry(r*0.6,r*0.6,w*0.92,28,1,true),M.hubDark); rd.rotation.x=Math.PI/2; inner.add(rd);
  if(!big){ const sw=new THREE.Mesh(new THREE.RingGeometry(r*0.44,r*0.62,28),M.tyre); for(const s of [-1,1]){ const q=sw.clone(); q.position.z=s*w*0.44; q.rotation.y=s>0?0:Math.PI; inner.add(q); } }
  for(const s of [-1,1]){                                        // диски с отверстиями и гайками с обеих сторон
    const disk=new THREE.Mesh(new THREE.CylinderGeometry(r*rk,r*rk,0.02,28),rim); disk.rotation.x=Math.PI/2; disk.position.z=s*(w*0.42); disk.castShadow=true; inner.add(disk);
    const hub=new THREE.Mesh(new THREE.CylinderGeometry(r*0.2,r*0.24,0.06,16),big?M.hubDark:rim); hub.rotation.x=Math.PI/2; hub.position.z=s*(w*0.46); inner.add(hub);
    if(big){ for(let i=0;i<10;i++){ const a=i/10*Math.PI*2;
        const h=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.024,8),M.dark); h.rotation.x=Math.PI/2; h.position.set(Math.cos(a+0.31)*r*0.42,Math.sin(a+0.31)*r*0.42,s*(w*0.43)); inner.add(h);
        const n=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.03,6),M.chrome); n.rotation.x=Math.PI/2; n.position.set(Math.cos(a)*r*0.3,Math.sin(a)*r*0.3,s*(w*0.47)); inner.add(n); } }
  }
  wg.userData.r=r; wg.userData.isWheel=true;
  return wg;
}
