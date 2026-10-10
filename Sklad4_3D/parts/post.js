/* ==========================================================================
   КИНО-ГРАФИКА · HDR-рендер → объёмное затенение (SAO) → свечение (bloom)
   → глубина резкости → смаз движения камеры → плёночный тон (ACES), грейдинг,
   виньетка, зерно → сглаживание FXAA. Подписи рисуются поверх, без обработки.
   ========================================================================== */
const POST=(()=>{
  const gl=renderer.getContext(), GL2=renderer.capabilities.isWebGL2;
  const floatOK=GL2&&!!(gl.getExtension('EXT_color_buffer_float')||gl.getExtension('EXT_color_buffer_half_float'));
  const HDR=floatOK?THREE.HalfFloatType:THREE.UnsignedByteType;
  const P={on:!!GL2, ao:1.0, aoRadius:0.9, bloom:0.16, bloomThr:1.15, exposure:1.0,
    dof:0, focus:10, fstop:2.8, mblur:0, shutter:0.5, grain:0.04, vignette:0.30,
    sat:0.92, contrast:1.06, warm:0.02, time:0, lift:0.012, fxaa:true, scale:1};
  const rt=(w,h,o)=>new THREE.WebGLRenderTarget(w,h,Object.assign({minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,
    format:THREE.RGBAFormat,type:HDR,depthBuffer:false,stencilBuffer:false},o||{}));
  const beauty=rt(4,4,{depthBuffer:true});
  beauty.depthTexture=new THREE.DepthTexture(4,4); beauty.depthTexture.type=THREE.UnsignedIntType;
  const aoA=rt(4,4,{type:THREE.UnsignedByteType}), aoB=rt(4,4,{type:THREE.UnsignedByteType});
  const bl=[0,1,2,3].map(()=>[rt(4,4),rt(4,4)]);
  const dofRT=rt(4,4), ldr=rt(4,4,{type:THREE.UnsignedByteType});
  const quadCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1), quadScene=new THREE.Scene();
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),null); quad.frustumCulled=false; quadScene.add(quad);
  const V=`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
  const mat=(fs,u)=>new THREE.ShaderMaterial({uniforms:u,vertexShader:V,fragmentShader:fs,depthTest:false,depthWrite:false});
  const COMMON=`
    #include <packing>
    uniform sampler2D tDepth; uniform float cNear,cFar; uniform mat4 invProj;
    float vz(vec2 uv){ return perspectiveDepthToViewZ(texture2D(tDepth,uv).x,cNear,cFar); }
    vec3 vpos(vec2 uv){ float d=texture2D(tDepth,uv).x; vec4 c=vec4(uv*2.-1.,d*2.-1.,1.); vec4 v=invProj*c; return v.xyz/v.w; }
    float h12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }`;
  const camU=()=>({tDepth:{value:beauty.depthTexture},cNear:{value:.1},cFar:{value:100},invProj:{value:new THREE.Matrix4()}});

  /* 1. SAO по буферу глубины (нормали — из производных) */
  const mAO=mat(COMMON+`
    varying vec2 vUv; uniform vec2 res,fres; uniform float radius,projScale,intensity;
    void main(){
      vec2 uv0=(floor(vUv*fres)+.5)/fres;                       // центр полноразмерного texel — без «ничьих» при выборке
      vec3 p=vpos(uv0); if(-p.z>cFar*0.9){ gl_FragColor=vec4(1.); return; }
      vec2 fp=1./fres;                                          // нормаль по ближайшему соседу (без ступенек глубины)
      vec3 pr=vpos(uv0+vec2(fp.x,0.))-p, pl=p-vpos(uv0-vec2(fp.x,0.));
      vec3 pu=vpos(uv0+vec2(0.,fp.y))-p, pd=p-vpos(uv0-vec2(0.,fp.y));
      vec3 dx=abs(pr.z)<abs(pl.z)?pr:pl, dy=abs(pu.z)<abs(pd.z)?pu:pd;
      vec3 n=normalize(cross(dx,dy));
      float rs=clamp(radius*projScale/-p.z,2.,90.);            // радиус в пикселях
      float a0=h12(gl_FragCoord.xy)*6.2832, occ=0.;
      const int N=14;
      for(int i=0;i<N;i++){
        float f=(float(i)+.5)/float(N); float ang=a0+f*43.98; float r=f*rs;
        vec2 o=vec2(cos(ang),sin(ang))*r/res;
        vec3 q=vpos(uv0+o), v=q-p; float vv=dot(v,v), vn=dot(v,n);
        float e=radius*radius;
        float cosA=vn/sqrt(vv+1e-5);                            // угол к нормали: плоскость саму себя не затеняет
        occ+=max(0.,cosA-0.18)*max(0.,1.-vv/(e*4.));
      }
      float ao=clamp(1.-intensity*occ*1.6/float(N),0.,1.); ao=ao*ao;
      gl_FragColor=vec4(vec3(ao),1.);
    }`,Object.assign(camU(),{res:{value:new THREE.Vector2()},fres:{value:new THREE.Vector2()},radius:{value:1},projScale:{value:500},intensity:{value:1}}));
  mAO.extensions.derivatives=true;
  /* 2. двусторонний блюр AO с учётом глубины */
  const mAOBlur=mat(COMMON+`
    varying vec2 vUv; uniform sampler2D tAO; uniform vec2 dir;
    void main(){ float z0=vz(vUv), s=0., w=0.;
      for(int i=-4;i<=4;i++){ vec2 uv=vUv+dir*float(i); float z=vz(uv);
        float k=exp(-float(i*i)/10.)*max(0.,1.-abs(z-z0)/(0.04*abs(z0)+0.05)); s+=texture2D(tAO,uv).r*k; w+=k; }
      gl_FragColor=vec4(vec3(s/max(w,1e-4)),1.); }`,Object.assign(camU(),{tAO:{value:null},dir:{value:new THREE.Vector2()}}));
  /* 3. bloom: яркая часть, затем каскад гауссов */
  const mBright=mat(`varying vec2 vUv; uniform sampler2D tIn; uniform float thr; uniform vec2 px;
    void main(){ vec3 c=vec3(0.); for(int i=0;i<4;i++){ vec2 o=vec2(i==1||i==3?1.:-1.,i>1?1.:-1.)*px; c+=texture2D(tIn,vUv+o).rgb; } c*=.25;
      float l=max(max(c.r,c.g),c.b); c*=max(0.,l-thr)/max(l,1e-4); gl_FragColor=vec4(min(c,vec3(40.)),1.); }`,
    {tIn:{value:null},thr:{value:1},px:{value:new THREE.Vector2()}});
  const mBlur=mat(`varying vec2 vUv; uniform sampler2D tIn; uniform vec2 dir;
    void main(){ vec3 c=texture2D(tIn,vUv).rgb*.227;
      c+=(texture2D(tIn,vUv+dir*1.385).rgb+texture2D(tIn,vUv-dir*1.385).rgb)*.316;
      c+=(texture2D(tIn,vUv+dir*3.231).rgb+texture2D(tIn,vUv-dir*3.231).rgb)*.070;
      gl_FragColor=vec4(c,1.); }`,{tIn:{value:null},dir:{value:new THREE.Vector2()}});
  /* 4. глубина резкости: сбор по диску на половинном разрешении */
  const mDOF=mat(COMMON+`
    varying vec2 vUv; uniform sampler2D tIn,tAO; uniform float focus,coc,aoK; uniform vec2 res;
    float cocOf(vec2 uv){ float z=-vz(uv); return clamp(coc*abs(z-focus)/max(z,.01),0.,14.); }
    void main(){ float c0=cocOf(vUv); vec3 s=vec3(0.); float w=0.;
      for(int i=0;i<24;i++){ float f=sqrt((float(i)+.5)/24.); float a=float(i)*2.39996;
        vec2 o=vec2(cos(a),sin(a))*f*max(c0,1.)/res; vec2 uv=vUv+o;
        float ci=cocOf(uv); float k=smoothstep(0.,1.,ci-f*max(c0,1.)+1.)+(ci>=c0?1.:0.);
        vec3 col=texture2D(tIn,uv).rgb*mix(1.,texture2D(tAO,uv).r,aoK); s+=col*k; w+=k; }
      gl_FragColor=vec4(s/max(w,1e-4),c0); }`,Object.assign(camU(),{tIn:{value:null},tAO:{value:null},focus:{value:10},coc:{value:0},aoK:{value:1},res:{value:new THREE.Vector2()}}));
  /* 5. финал: AO, смаз движения камеры, DOF, bloom, тон ACES, грейдинг, виньетка, зерно */
  const mFinal=mat(COMMON+`
    varying vec2 vUv; uniform sampler2D tIn,tAO,tB0,tB1,tB2,tB3,tDOF;
    uniform float aoK,bloom,expo,grain,vign,sat,contrast,warm,lift,time,useDOF,mblur,dbg;
    uniform mat4 invVP,prevVP; uniform vec2 res;
    vec3 rrt(vec3 v){ vec3 a=v*(v+.0245786)-.000090537; vec3 b=v*(.983729*v+.4329510)+.238081; return a/b; }
    vec3 aces(vec3 c){                                       // ACES filmic (как в three.js), вход уже с экспозицией
      const mat3 I=mat3(.59719,.07600,.02840,.35458,.90834,.13383,.04823,.01566,.83777);
      const mat3 O=mat3(1.60475,-.10208,-.00327,-.53108,1.10813,-.07276,-.07367,-.00605,1.07602);
      return clamp(O*rrt(I*(c/.6)),0.,1.); }
    vec3 lin2srgb(vec3 c){ return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c)); }
    vec3 hdr(vec2 uv){ return texture2D(tIn,uv).rgb*mix(1.,texture2D(tAO,uv).r,aoK); }
    void main(){
      if(dbg>.5){ gl_FragColor=vec4(vec3(texture2D(tAO,vUv).r),1.); return; }
      vec3 c=hdr(vUv);
      if(mblur>0.){
        float d=texture2D(tDepth,vUv).x; vec4 wp=invVP*vec4(vUv*2.-1.,d*2.-1.,1.); wp/=wp.w;
        vec4 pp=prevVP*wp; vec2 puv=pp.xy/pp.w*.5+.5; vec2 vel=(vUv-puv)*mblur;
        float L=length(vel*res); if(L>40.) vel*=40./L;
        if(L>0.6){ vec3 s=c; float n=1.; for(int i=1;i<10;i++){ float f=float(i)/9.-.5; s+=hdr(vUv+vel*f); n+=1.; } c=s/n; }
      }
      if(useDOF>0.){ vec4 dd=texture2D(tDOF,vUv); c=mix(c,dd.rgb,smoothstep(.6,2.2,dd.a)); }
      vec3 b=texture2D(tB0,vUv).rgb*.5+texture2D(tB1,vUv).rgb*.7+texture2D(tB2,vUv).rgb*.9+texture2D(tB3,vUv).rgb*1.1;
      c+=b*bloom;
      c*=expo; c.r*=1.+warm; c.b*=1.-warm;
      c=aces(c);
      float l=dot(c,vec3(.2126,.7152,.0722));
      c=mix(vec3(l),c,sat);
      c=clamp((c-.5)*contrast+.5,0.,1.);
      c=c+lift*(1.-c)*vec3(.9,1.,1.15);
      vec2 q=vUv-.5; q.x*=res.x/res.y; c*=1.-vign*smoothstep(.25,1.05,dot(q,q)*1.6);
      c=lin2srgb(c);
      float g=h12(gl_FragCoord.xy+fract(time*13.37)*531.)-.5; c+=g*grain*(1.-l*.6);
      c+=(h12(gl_FragCoord.yx+7.)-.5)/255.;
      gl_FragColor=vec4(c,1.);
    }`,Object.assign(camU(),{tIn:{value:null},tAO:{value:null},tB0:{value:null},tB1:{value:null},tB2:{value:null},tB3:{value:null},tDOF:{value:null},
      aoK:{value:1},bloom:{value:.2},expo:{value:1},grain:{value:.04},vign:{value:.3},sat:{value:1},contrast:{value:1},warm:{value:0},lift:{value:0},
      time:{value:0},useDOF:{value:0},mblur:{value:0},dbg:{value:0},invVP:{value:new THREE.Matrix4()},prevVP:{value:new THREE.Matrix4()},res:{value:new THREE.Vector2()}}));
  /* 6. FXAA 3.11 (упрощённый) */
  const mFXAA=mat(`varying vec2 vUv; uniform sampler2D tIn; uniform vec2 px;
    float lu(vec3 c){ return dot(c,vec3(.299,.587,.114)); }
    void main(){
      vec3 m=texture2D(tIn,vUv).rgb; float lm=lu(m);
      float ln=lu(texture2D(tIn,vUv+vec2(0.,px.y)).rgb), ls=lu(texture2D(tIn,vUv-vec2(0.,px.y)).rgb);
      float le=lu(texture2D(tIn,vUv+vec2(px.x,0.)).rgb), lw=lu(texture2D(tIn,vUv-vec2(px.x,0.)).rgb);
      float mn=min(lm,min(min(ln,ls),min(le,lw))), mx=max(lm,max(max(ln,ls),max(le,lw)));
      if(mx-mn<max(.03,mx*.12)){ gl_FragColor=vec4(m,1.); return; }
      float lnw=lu(texture2D(tIn,vUv+vec2(-px.x,px.y)).rgb), lne=lu(texture2D(tIn,vUv+px).rgb);
      float lsw=lu(texture2D(tIn,vUv-px).rgb), lse=lu(texture2D(tIn,vUv+vec2(px.x,-px.y)).rgb);
      vec2 dir=vec2(-((lnw+lne)-(lsw+lse)),((lnw+lsw)-(lne+lse)));
      float rd=1./(min(abs(dir.x),abs(dir.y))+max((lnw+lne+lsw+lse)*.03125,1./128.));
      dir=clamp(dir*rd,-8.,8.)*px;
      vec3 a=.5*(texture2D(tIn,vUv+dir*(1./3.-.5)).rgb+texture2D(tIn,vUv+dir*(2./3.-.5)).rgb);
      vec3 b=a*.5+.25*(texture2D(tIn,vUv-dir*.5).rgb+texture2D(tIn,vUv+dir*.5).rgb);
      float lb=lu(b); gl_FragColor=vec4((lb<mn||lb>mx)?a:b,1.); }`,{tIn:{value:null},px:{value:new THREE.Vector2()}});

  const run=(m,target)=>{ quad.material=m; renderer.setRenderTarget(target); renderer.render(quadScene,quadCam); };
  const vp=new THREE.Matrix4(), ivp=new THREE.Matrix4();
  let bw=0,bh=0;
  function size(){
    const s=renderer.getDrawingBufferSize(new THREE.Vector2());
    const w=Math.max(4,Math.round(s.x*P.scale)), h=Math.max(4,Math.round(s.y*P.scale));
    if(w===bw&&h===bh) return; bw=w; bh=h;
    beauty.setSize(w,h); ldr.setSize(w,h);
    const hw=Math.max(2,w>>1), hh=Math.max(2,h>>1);
    aoA.setSize(hw,hh); aoB.setSize(hw,hh); dofRT.setSize(hw,hh);
    bl.forEach((p,i)=>{ const d=2<<i; p[0].setSize(Math.max(2,Math.round(w/d)),Math.max(2,Math.round(h/d))); p[1].setSize(Math.max(2,Math.round(w/d)),Math.max(2,Math.round(h/d))); });
  }
  function camUniforms(m,cam){ m.uniforms.cNear.value=cam.near; m.uniforms.cFar.value=cam.far; m.uniforms.invProj.value.copy(cam.projectionMatrixInverse); }
  function render(sc,cam,prevVP){
    size();
    const bgLayers=cam.layers.mask;
    cam.layers.set(0);
    renderer.setRenderTarget(beauty); renderer.clear(); renderer.render(sc,cam);
    /* AO */
    [mAO,mAOBlur,mDOF,mFinal].forEach(m=>camUniforms(m,cam));
    mAO.uniforms.res.value.set(aoA.width,aoA.height); mAO.uniforms.fres.value.set(bw,bh);
    mAO.uniforms.radius.value=P.aoRadius; mAO.uniforms.intensity.value=1;
    mAO.uniforms.projScale.value=aoA.height/(2*Math.tan(cam.fov*Math.PI/360));
    if(P.ao>0){
      run(mAO,aoA);
      mAOBlur.uniforms.tAO.value=aoA.texture; mAOBlur.uniforms.dir.value.set(1/aoA.width,0); run(mAOBlur,aoB);
      mAOBlur.uniforms.tAO.value=aoB.texture; mAOBlur.uniforms.dir.value.set(0,1/aoA.height); run(mAOBlur,aoA);
    }
    /* bloom */
    if(P.bloom>0){
      mBright.uniforms.tIn.value=beauty.texture; mBright.uniforms.thr.value=P.bloomThr;
      mBright.uniforms.px.value.set(0.5/bw,0.5/bh); run(mBright,bl[0][0]);
      for(let i=0;i<4;i++){
        const a=bl[i][0], b=bl[i][1];
        if(i>0){ mBlur.uniforms.tIn.value=bl[i-1][0].texture; mBlur.uniforms.dir.value.set(0,0); run(mBlur,a); }
        mBlur.uniforms.tIn.value=a.texture; mBlur.uniforms.dir.value.set(1/a.width,0); run(mBlur,b);
        mBlur.uniforms.tIn.value=b.texture; mBlur.uniforms.dir.value.set(0,1/a.height); run(mBlur,a);
      }
    }
    /* DOF */
    const useDOF=P.dof>0;
    if(useDOF){
      const u=mDOF.uniforms; u.tIn.value=beauty.texture; u.tAO.value=aoA.texture; u.aoK.value=P.ao;
      u.focus.value=P.focus; u.res.value.set(dofRT.width,dofRT.height);
      // диаметр кружка нерезкости в пикселях половинного буфера на бесконечности
      const f=0.5*24/Math.tan(cam.fov*Math.PI/360)/1000;   // эквивалентное фокусное (м) для кадра 24 мм по высоте
      u.coc.value=P.dof*(f*f/(P.fstop*Math.max(P.focus-f,0.05)))/(0.024)*dofRT.height*0.5;
      run(mDOF,dofRT);
    }
    /* финал */
    const u=mFinal.uniforms;
    u.tIn.value=beauty.texture; u.tAO.value=P.ao>0?aoA.texture:null; u.aoK.value=P.ao>0?P.ao:0;
    if(P.ao<=0){ u.tAO.value=aoA.texture; }
    u.tB0.value=bl[0][0].texture; u.tB1.value=bl[1][0].texture; u.tB2.value=bl[2][0].texture; u.tB3.value=bl[3][0].texture;
    u.bloom.value=P.bloom; u.expo.value=P.exposure*renderer.toneMappingExposure; u.grain.value=P.grain; u.vign.value=P.vignette;
    u.sat.value=P.sat; u.contrast.value=P.contrast; u.warm.value=P.warm; u.lift.value=P.lift; u.time.value=P.time;
    u.dbg.value=P.dbg||0; u.useDOF.value=useDOF?1:0; u.tDOF.value=dofRT.texture; u.res.value.set(bw,bh);
    vp.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse); ivp.copy(vp).invert();
    u.invVP.value.copy(ivp);
    if(prevVP&&P.mblur>0){ u.prevVP.value.copy(prevVP); u.mblur.value=P.mblur*P.shutter; } else u.mblur.value=0;
    if(P.fxaa){ run(mFinal,ldr); mFXAA.uniforms.tIn.value=ldr.texture; mFXAA.uniforms.px.value.set(1/bw,1/bh); run(mFXAA,null); }
    else run(mFinal,null);
    /* подписи — поверх, без обработки */
    cam.layers.set(1);
    const ac=renderer.autoClear; renderer.autoClear=false; renderer.render(sc,cam); renderer.autoClear=ac;
    cam.layers.mask=bgLayers;
    return vp;
  }
  return {P,render,HDR,floatOK,beauty};
})();
