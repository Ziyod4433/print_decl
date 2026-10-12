  /* ==== реалистичная модель человека: Ready Player Me (скелет Mixamo) + рабочая одежда ====
     Мокап-скелет (выше) остаётся «драйвером»: его локальные повороты копируются на кости модели.
     Одежда: пиджак → рабочая куртка (обрезаны фалды, перекраска), брюки → рабочие, туфли → ботинки,
     сигнальный жилет со световозвращающими полосами — отдельная оболочка поверх торса, каска на кости головы. */
  const ALL=[], RP={ready:false,cb:[],src:null,tex:{},mat:{}};
  const QC=new THREE.Quaternion(-0.70710678,0,0,0.70710678);
  let KH=0.96, HY=1.02, SP2=1.35;
  const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  function imgCanvas(img){ const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; c.getContext('2d').drawImage(img,0,0); return c; }
  function recolor(tex,hex,k,geo){
    const key=(tex.uuid)+hex+(k||''); if(RP.tex[key]) return RP.tex[key];
    const c=imgCanvas(tex.image), g=c.getContext('2d'), id=g.getImageData(0,0,c.width,c.height), d=id.data;
    let sum=0,n=0; const uv=geo&&geo.attributes.uv;
    if(uv){ for(let v=0;v<uv.count;v++){ const x=Math.min(c.width-1,Math.max(0,(uv.getX(v)%1)*c.width|0)), y=Math.min(c.height-1,Math.max(0,(uv.getY(v)%1)*c.height|0)), i=(y*c.width+x)*4;
        sum+=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]; n++; } }
    else for(let i=0;i<d.length;i+=32){ sum+=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2]; n++; }
    const avg=sum/n||1, [r,gg,b]=hexRGB(hex), e=k||0.85;
    for(let i=0;i<d.length;i+=4){ const l=(0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2])/avg, f=Math.pow(Math.max(l,0.001),e);
      d[i]=Math.min(255,r*f); d[i+1]=Math.min(255,gg*f); d[i+2]=Math.min(255,b*f); }
    g.putImageData(id,0,0); const t=new THREE.CanvasTexture(c); t.flipY=false; t.encoding=THREE.sRGBEncoding;
    t.wrapS=tex.wrapS; t.wrapT=tex.wrapT; t.anisotropy=4; RP.tex[key]=t; return t; }
  function vestMat(col){
    if(RP.mat['v'+col]) return RP.mat['v'+col];
    const Hc=512, c=document.createElement('canvas'); c.width=64; c.height=Hc; const g=c.getContext('2d');
    const r=document.createElement('canvas'); r.width=64; r.height=Hc; const q=r.getContext('2d');
    g.fillStyle=col; g.fillRect(0,0,64,Hc); q.fillStyle='rgb(0,205,0)'; q.fillRect(0,0,64,Hc);
    for(let i=0;i<900;i++){ g.fillStyle=`rgba(0,0,0,${Math.random()*0.05})`; g.fillRect(Math.random()*64,Math.random()*Hc,2,2); }
    const Y0=HY-0.05, Y1=SP2+0.2, row=y=>(1-(y-Y0)/(Y1-Y0))*Hc, sw=0.05/(Y1-Y0)*Hc;
    for(const y of [HY+0.11,HY+0.31]){ const y0=row(y)-sw/2;
      g.fillStyle='#c3c7ca'; g.fillRect(0,y0,64,sw); g.fillStyle='rgba(255,255,255,.25)'; g.fillRect(0,y0+sw*0.3,64,sw*0.2);
      q.fillStyle='rgb(0,80,150)'; q.fillRect(0,y0,64,sw); }
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const rm=new THREE.CanvasTexture(r);
    const m=new THREE.MeshStandardMaterial({map:t,roughnessMap:rm,metalnessMap:rm,roughness:1,metalness:1,envMapIntensity:.5,side:THREE.DoubleSide,skinning:true});
    m.name='HUM_vest'; RP.mat['v'+col]=m; return m; }
  function prep(gl){
    const sc=gl.scene; sc.updateMatrixWorld(true);
    const hw=sc.getObjectByName('Wolf3D_Headwear'); if(hw) hw.parent.remove(hw);
    const wp=n=>new THREE.Vector3().setFromMatrixPosition(sc.getObjectByName(n).matrixWorld);
    HY=wp('Hips').y; SP2=wp('Spine2').y; KH=HY/1.0613;
    const top=sc.getObjectByName('Wolf3D_Outfit_Top'), bones=top.skeleton.bones.map(b=>b.name);
    const geo=top.geometry, pos=geo.attributes.position, nor=geo.attributes.normal, si=geo.attributes.skinIndex, sw=geo.attributes.skinWeight, idx=geo.index.array;
    const GX=['getX','getY','getZ','getW'], sI=(v,k)=>si[GX[k]](v), sW=(v,k)=>sw[GX[k]](v);     // атрибуты могут быть чередующимися
    const dom=[]; for(let v=0;v<pos.count;v++){ let bi=0,bw=-1; for(let k=0;k<4;k++){ const w=sW(v,k); if(w>bw){ bw=w; bi=sI(v,k); } } dom.push(bones[bi]); }
    const arms=/Arm|Hand|Shoulder/, torso={Hips:1,Spine:1,Spine1:1,Spine2:1};
    let CZ=0; for(let v=0;v<pos.count;v++) CZ+=pos.getZ(v); CZ/=pos.count;          // перед — +Z (глаза)
    const keep=[], vest=[], NKY=wp('Neck').y;
    for(let t=0;t<idx.length;t+=3){ const tri=[idx[t],idx[t+1],idx[t+2]];
      if(tri.every(v=>Math.abs(pos.getX(v))<0.064&&pos.getY(v)>NKY-0.016&&pos.getY(v)<NKY+0.052&&pos.getZ(v)>0.05)) continue;   // галстук-бабочка от пиджака модели — не к рабочей куртке
      if(tri.every(v=>pos.getY(v)<HY-0.03&&pos.getZ(v)<CZ-0.02&&!arms.test(dom[v]))) continue;   // фалды пиджака сзади — прочь: куртка до пояса
      if(tri.every(v=>{ const n=dom[v], y=pos.getY(v); return y>HY-0.03&&(torso[n]&&y<SP2+0.17||(n==='Neck'&&y<SP2+0.06)||(/Shoulder/.test(n)&&y<SP2+0.12)); })) vest.push(...tri);
      else keep.push(...tri); }
    /* торс куртки — отдельной сеткой: у кого жилет, торс заменяет жилет (все слои пиджака окрашиваются в жилет, без просветов) */
    const tg=geo.clone(); tg.setIndex(vest.slice());
    const tm=new THREE.SkinnedMesh(tg,top.material); tm.name='Wolf3D_TopTorso'; top.parent.add(tm); tm.bind(top.skeleton,top.bindMatrix);
    geo.setIndex(keep);
    let cx=0,cz=0; vest.forEach(v=>{ cx+=pos.getX(v); cz+=pos.getZ(v); }); cx/=vest.length; cz/=vest.length;
    const Y0=HY-0.05, Y1=SP2+0.2, map=new Map(), P=[],N=[],U=[],SI=[],SW=[],I=[];
    vest.forEach(v=>{ let m=map.get(v); if(m===undefined){ m=map.size; map.set(v,m);
      const x=pos.getX(v),y=pos.getY(v),z=pos.getZ(v),nx=nor.getX(v),ny=nor.getY(v),nz=nor.getZ(v);
      const rx=x-cx, rz=z-cz, rl=Math.hypot(rx,rz)||1;                                       // наружу от оси торса — жилет всегда поверх куртки
      P.push(x+rx/rl*0.002+nx*0.002,y+ny*0.002,z+rz/rl*0.002+nz*0.002); N.push(nx,ny,nz); U.push(Math.atan2(x-cx,z-cz)/(Math.PI*2)+0.5,(y-Y0)/(Y1-Y0));
      for(let k=0;k<4;k++){ SI.push(sI(v,k)); SW.push(sW(v,k)); } }
      I.push(m); });
    const vg=new THREE.BufferGeometry();
    vg.setAttribute('position',new THREE.Float32BufferAttribute(P,3)); vg.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
    vg.setAttribute('uv',new THREE.Float32BufferAttribute(U,2)); vg.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));
    vg.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4)); vg.setIndex(I);
    const vm=new THREE.SkinnedMesh(vg,vestMat('#ff6a13')); vm.name='Wolf3D_Vest'; top.parent.add(vm); vm.bind(top.skeleton,top.bindMatrix);
    /* кисти — отдельной сеткой: рабочие перчатки (у кого их нет — тот же материал кожи) */
    { const body=sc.getObjectByName('Wolf3D_Body'), bg=body.geometry, bb=body.skeleton.bones.map(b=>b.name), bsi=bg.attributes.skinIndex, bsw=bg.attributes.skinWeight, bi=bg.index.array;
      const hand=[]; for(let v=0;v<bg.attributes.position.count;v++){ let k0=0,w0=-1; for(let k=0;k<4;k++){ const w=bsw[GX[k]](v); if(w>w0){ w0=w; k0=bsi[GX[k]](v); } } hand.push(/Hand/.test(bb[k0])); }
      const kb=[], gl2=[]; for(let t=0;t<bi.length;t+=3){ const tri=[bi[t],bi[t+1],bi[t+2]]; (tri.every(v=>hand[v])?gl2:kb).push(...tri); }
      const gg=bg.clone(); gg.setIndex(gl2); bg.setIndex(kb);
      const gm=new THREE.SkinnedMesh(gg,body.material); gm.name='Wolf3D_Gloves'; body.parent.add(gm); gm.bind(body.skeleton,body.bindMatrix); }
    /* короткая стрижка: оболочка по коже головы выше линии роста волос (лоб, виски, затылок), отступ 4,5 мм по нормали,
       та же привязка к скелету — у модели голова без волос, а под каской люди выглядели бритыми наголо */
    { const head=sc.getObjectByName('Wolf3D_Head'), hb=wp('Head'), hg=head.geometry, hp=hg.attributes.position, hn=hg.attributes.normal, hi=hg.index.array;
      const ok=v=>{ const x=hp.getX(v), y=hp.getY(v)-hb.y, z=hp.getZ(v)-hb.z; return y>0.07+0.55*z&&!(Math.abs(x)>0.076&&y<0.13); };
      const ki=[]; for(let t=0;t<hi.length;t+=3) if(ok(hi[t])&&ok(hi[t+1])&&ok(hi[t+2])) ki.push(hi[t],hi[t+1],hi[t+2]);
      const g2=hg.clone(); g2.morphAttributes={}; const P2=g2.attributes.position;
      for(let v=0;v<P2.count;v++) P2.setXYZ(v,hp.getX(v)+hn.getX(v)*0.0045,hp.getY(v)+hn.getY(v)*0.0045,hp.getZ(v)+hn.getZ(v)*0.0045);
      g2.setIndex(ki); g2.computeVertexNormals();
      const hm=new THREE.SkinnedMesh(g2,hairMat('#1a1512')); hm.name='Wolf3D_HairCut'; head.parent.add(hm); hm.bind(head.skeleton,head.bindMatrix); }
    sc.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; o.frustumCulled=false; } });
    RP.src=gl;
  }
  /* ткань: мелкое плетение и складки — рельеф для куртки и брюк (без него одежда при приближении была как пластик) */
  function fabricTex(){ if(RP.fabric) return RP.fabric; const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d');
    g.fillStyle='#808080'; g.fillRect(0,0,256,256); let q=11; const r=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; };
    for(let y=0;y<256;y+=2){ g.fillStyle=`rgba(0,0,0,${.05+r()*.05})`; g.fillRect(0,y,256,1); }
    for(let x=0;x<256;x+=2){ g.fillStyle=`rgba(255,255,255,${.04+r()*.05})`; g.fillRect(x,0,1,256); }
    for(let i=0;i<9;i++){ const x=r()*256, w=12+r()*30, gr=g.createLinearGradient(x-w,0,x+w,0); gr.addColorStop(0,'rgba(0,0,0,0)'); gr.addColorStop(.5,`rgba(0,0,0,${.12+r()*.1})`); gr.addColorStop(1,'rgba(255,255,255,.05)'); g.fillStyle=gr; g.fillRect(x-w,0,2*w,256); }
    const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(7,7); RP.fabric=t; return t; }
  /* бейдж на шнурке, рация у старших, световозвращающие ленты на голенях, защитные очки у части людей */
  function badgeMat(){ if(RP.mat.badge) return RP.mat.badge; const c=document.createElement('canvas'); c.width=96; c.height=128; const g=c.getContext('2d');
    g.fillStyle='#f6f6f2'; g.fillRect(0,0,96,128); g.fillStyle='#1b3f8f'; g.fillRect(0,0,96,22); g.fillStyle='#fff'; g.font='700 13px sans-serif'; g.fillText('BURAQ',8,16);
    g.fillStyle='#c9b8a4'; g.fillRect(10,30,34,42); g.fillStyle='#2b2b2b'; for(let i=0;i<4;i++) g.fillRect(52,34+i*10,36,4); g.fillRect(10,82,76,4); g.fillRect(10,92,50,4);
    g.fillStyle='#111'; for(let x=10;x<86;x+=3) g.fillRect(x,104,1+(x*7%3),16);
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const m=new THREE.MeshStandardMaterial({map:t,roughness:.5,metalness:0}); RP.mat.badge=m; return m; }
  function gear(H,prof,v){ const rb=H.rb, lead=/СТАРШ|БРИГАД|КЛАДОВ|КОНТРОЛ/.test(H.role||'');
    const add=(bone,m,x,y,z)=>{ m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; bone.add(m); return m; };
    if(rb.Spine2&&prof.vest){
      add(rb.Spine2,new THREE.Mesh(new THREE.PlaneGeometry(0.07,0.094),badgeMat()),0.085,0.085,0.168);                       // бейдж на левой стороне груди
      const ln=add(rb.Spine2,new THREE.Mesh(new THREE.BoxGeometry(0.014,0.12,0.003),MT.strap),0.06,0.19,0.158); ln.rotation.z=0.3;   // шнурок
      if(lead){ add(rb.Spine2,new THREE.Mesh(new THREE.BoxGeometry(0.032,0.095,0.024),MT.scanner),-0.095,0.155,0.128);           // рация на правой лямке
        add(rb.Spine2,new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.1,6),MT.strap),-0.105,0.25,0.128).castShadow=false; } }
    if(!prof.guard) for(const L of ['Left','Right']){ const b=rb[L+'Leg']; if(!b) continue;                                     // ленты на голенях
      for(const yy of [0.27,0.33]) add(b,new THREE.Mesh(new THREE.CylinderGeometry(0.097,0.094,0.028,18,1,true),MT.refl),0,yy,0).castShadow=false; }
    if(rb.Head&&v.h>0.72&&!prof.guard){ const gl=new THREE.Group(); const lens=std(0x9fb8c8,.1,0,{transparent:true,opacity:.5,envMapIntensity:1.4});   // защитные очки
      for(const s of [-1,1]){ const l=new THREE.Mesh(new THREE.BoxGeometry(0.046,0.026,0.004),lens); l.position.set(s*0.031,0.044,0.097); l.rotation.y=s*0.25; gl.add(l);
        const tm=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.006,0.11),MT.strap); tm.position.set(s*0.066,0.046,0.045); gl.add(tm); }
      const br=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.005,0.004),MT.strap); br.position.set(0,0.046,0.1); gl.add(br); gl.traverse(o=>{ if(o.isMesh) o.castShadow=false; }); rb.Head.add(gl); } }
  const JACKET=['#35476a','#4a515b','#435447','#56504a','#2f4568'], PANTS=['#3a414c','#464c55','#353940','#4b4741'];
  const SKIN=[[1,1,1],[0.93,0.85,0.79],[0.8,0.68,0.58],[0.97,0.9,0.84],[0.72,0.58,0.48]];
  const VEST={vestO:'#ff6a13',vestY:'#cfe81c',vestB:'#1f48a8'}, GLOVE=['#c9a23a','#8a8f96','#b9b3a6','#3f4349'];
  function hardHat(mat){ const g=new THREE.Group();
    const dome=new THREE.SphereGeometry(0.127,30,12,0,Math.PI*2,0,Math.PI/2); dome.scale(1,0.94,1.13);
    g.add(new THREE.Mesh(dome,mat));
    const rg=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.014,0.25),mat); rg.position.y=0.108; rg.scale.set(1,1,0.98); g.add(rg);
    const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.146,0.012,36),mat); brim.scale.set(1,1,1.2); brim.position.set(0,0.004,0.022); g.add(brim);
    const band=new THREE.Mesh(new THREE.CylinderGeometry(0.121,0.121,0.03,28,1,true),MT.strap); band.scale.set(1,1,1.12); band.position.y=0.02; g.add(band);
    g.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } }); return g; }
  function guardCap(){ const g=new THREE.Group();
    const c=new THREE.Mesh(new THREE.CylinderGeometry(0.112,0.108,0.075,28),MT.guard); c.scale.set(1,1,1.1); g.add(c);
    const v=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.01,18,1,false,-0.9,1.8),MT.strap); v.scale.set(1.25,1,1.1); v.position.set(0,-0.03,0.08); v.rotation.x=0.18; g.add(v);
    return g; }
  function hairMat(col){ if(RP.mat['h'+col]) return RP.mat['h'+col];
    if(!RP.hairTex){ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d');   // мелкие пряди: штрихи разной яркости
      g.fillStyle='#808080'; g.fillRect(0,0,256,256); let q=7; const r=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; };   // свой генератор: общий LOOK.R не трогаем
      for(let i=0;i<5000;i++){ const x=r()*256, y=r()*256, l=100+r()*110|0; g.strokeStyle=`rgba(${l},${l},${l},.5)`; g.lineWidth=0.8;
        g.beginPath(); g.moveTo(x,y); g.lineTo(x+(r()-.5)*3,y+2+r()*5); g.stroke(); }
      RP.hairTex=new THREE.CanvasTexture(c); RP.hairTex.wrapS=RP.hairTex.wrapT=THREE.RepeatWrapping; RP.hairTex.repeat.set(6,6); }
    const m=new THREE.MeshStandardMaterial({color:col,map:RP.hairTex,roughness:.72,metalness:0,envMapIntensity:.5,skinning:true}); m.name='HUM_hair';
    RP.mat['h'+col]=m; return m; }
  const HAIR=['#16120f','#1a1512','#0f0d0c','#2b2019','#3a2b20','#1f1a17','#5b5752'];
  function rpmMat(src,key,fn){ const k=src.uuid+key; if(RP.mat[k]) return RP.mat[k]; const m=src.clone(); fn(m); RP.mat[k]=m; return m; }
  function rpmAttach(H){
    if(H.rb) return; const v=H.var, prof=H.prof||{}, guard=!!prof.guard;
    const c=THREE.SkeletonUtils.clone(RP.src.scene); c.name='RPM'; c.scale.setScalar(0.96+0.08*v.h);
    H.rig.add(c); H.rpm=c; H.rb={}; c.traverse(o=>{ if(o.isBone) H.rb[o.name]=o; });
    const J=guard?'#2a2e35':JACKET[(v.jacket*JACKET.length)|0], Pn=guard?'#2a2d33':PANTS[(v.pants*PANTS.length)|0];
    const sk=SKIN[(v.skin*SKIN.length)|0];
    c.traverse(o=>{ if(!o.isMesh) return; const n=o.name, m=o.material;
      if(n==='Wolf3D_Outfit_Top'||n==='Wolf3D_TopTorso') o.material=rpmMat(m,J,x=>{ x.map=recolor(m.map,J,0.85,o.geometry); x.metalness=0; x.roughness=1; x.bumpMap=fabricTex(); x.bumpScale=0.0022; x.name='HUM_jacket'; });
      else if(n==='Wolf3D_Outfit_Bottom') o.material=rpmMat(m,Pn,x=>{ x.map=recolor(m.map,Pn,0.85,o.geometry); x.metalness=0; x.roughness=1; x.bumpMap=fabricTex(); x.bumpScale=0.0018; x.name='HUM_pants'; });
      else if(n==='Wolf3D_Outfit_Footwear') o.material=rpmMat(m,'boot',x=>{ x.map=recolor(m.map,'#3a3029',0.9,o.geometry); x.metalness=0; x.roughness=0.8; x.name='HUM_boot'; });
      else if(n==='Wolf3D_Gloves'&&!guard){ const gc=GLOVE[(v.vest*GLOVE.length)|0]; o.material=rpmMat(m,'glove'+gc,x=>{ x.map=null; x.color.set(gc); x.roughness=.9; x.metalness=0; x.normalMap=null; x.name='HUM_glove'; }); }
      else if(n==='Wolf3D_Body'||n==='Wolf3D_Head'||n==='Wolf3D_Gloves') o.material=rpmMat(m,sk.join(),x=>{ x.color.setRGB(sk[0],sk[1],sk[2]); x.name='HUM_skin'; });
      else if(n==='Wolf3D_Beard'){ o.visible=v.beard<0.4; }
      else if(n==='Wolf3D_HairCut'){ const k=(v.h*7.13+v.beard*3.71)%1; o.visible=guard||k>0.07; o.material=hairMat(HAIR[(k*HAIR.length)|0]); }   // ~7 % — бритые наголо
      else if(n==='Wolf3D_Vest'){ if(prof.vest) o.material=vestMat(VEST[prof.vest]||'#ff6a13'); else o.visible=false; } });
    c.traverse(o=>{ if(o.name==='Wolf3D_TopTorso') o.visible=!prof.vest; });
    const hd=H.rb.Head;
    if(prof.hat){ const h=hardHat(MT[prof.hat]); h.position.set(0,0.104,0.012); h.rotation.x=-0.06; hd.add(h); H.hat=h; }
    else if(guard){ const h=guardCap(); h.position.set(0,0.165,0.01); hd.add(h); H.hat=h; }
    H.fing=[]; for(const k in H.rb){ const mm=/^(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)([123])$/.exec(k); if(mm) H.fing.push({b:H.rb[k],q0:H.rb[k].quaternion.clone(),L:mm[1]==='Left',th:mm[2]==='Thumb',j:+mm[3]}); }
    const rh=H.rb.RightHand; if(rh){ H.scanner.position.set(0,0.09,0.035); H.scanner.rotation.set(0,Math.PI,0); rh.add(H.scanner); }
    gear(H,prof,v);
    rpmSync(H);
  }
  function rpmSync(H){ const rb=H.rb;
    for(const n of BN){ const b=H.B[n], r=rb[n]; if(!r) continue;
      if(n==='Hips'){ r.quaternion.copy(QC).multiply(b.quaternion); const p=b.position; r.position.set(p.x*0.01*KH,p.z*0.01*KH,-p.y*0.01*KH); }
      else r.quaternion.copy(b.quaternion); }
    /* пальцы: хват зависит от позы (несёт, держит ручку или руль, сканер в правой) */
    if(H.fing){ const p=H.st||{}, g=Math.max(p.carry||0,p.push||0,p.drive||0,(p.reach||0)*0.35);
      for(const f of H.fing){ let c=0.22+0.75*g; if(!f.L&&p.scan) c=Math.max(c,0.95);
        const a=f.th?c*0.35:c*(f.j===1?0.75:1.05);
        f.b.quaternion.copy(f.q0).multiply(_fq.setFromAxisAngle(_fx,a)); } } }
  const _fq=new THREE.Quaternion(), _fx=new THREE.Vector3(1,0,0), _fz=new THREE.Vector3(0,0,1);
  /* загрузка модели (встроена в файл) */
  (function(){ try{
    const s=atob(RPM_GLB), u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i);
    new THREE.GLTFLoader().parse(u.buffer,'',gl=>{ prep(gl); RP.ready=true; ALL.forEach(rpmAttach); RP.cb.splice(0).forEach(f=>f()); },
      e=>console.error('RPM',e));
  }catch(e){ console.error('RPM',e); } })();
