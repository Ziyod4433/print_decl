/* ==========================================================================
   ЗАЛ КАК НА ФОТО ОБЪЕКТА: белый профнастил потолка с рёбрами, проёмы световых фонарей в кровле,
   ленточное остекление стен с переплётами (снаружи видно небо), сварная сетка ограждения,
   бирюзовый занавес-перегородка под кровлей по границе с соседом — ткань колышется от сквозняка.
   Узоры считаются по мировым координатам в шейдере: не зависят от развёртки и переживают слияние геометрии.
   ========================================================================== */
const WIND={value:0};                                           // время для колыхания ткани (в фильме — время кадра)

/* ---------- рассеянный свет внутри зала: кровля закрывает небо ----------
   Окружение (IBL) и полусфера одинаковы для двора и зала, поэтому зал под кровлей был освещён как улица и солнечные
   пятна тонули в подсветке. Здесь во все материалы PBR подмешивается множитель по мировым координатам: внутри зала
   небо закрыто (≈0,36), под световыми фонарями светлее, у открытых ворот — свет с улицы. Вид без кровли — как раньше. */
const IBL_U={value:1}, IBL_D={value:[0,1,2,3].map(()=>new THREE.Vector4())};
function IBLK(sh){
  if(sh.uniforms.uHallIn||sh.fragmentShader.indexOf('#include <lights_fragment_maps>')<0||sh.vertexShader.indexOf('#include <project_vertex>')<0) return;
  sh.uniforms.uHallIn=IBL_U; sh.uniforms.uDoor=IBL_D;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHallWP;')
    .replace('#include <project_vertex>','#include <project_vertex>\n{ vec4 hw=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nhw=instanceMatrix*hw;\n#endif\nvHallWP=(modelMatrix*hw).xyz; }');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
    varying vec3 vHallWP; uniform float uHallIn; uniform vec4 uDoor[4];
    float hallK(vec3 p){
      float rf=${EAVE.toFixed(2)}+${(RIDGE-EAVE).toFixed(2)}*(1.-abs(p.x-${(W/2).toFixed(3)})/${(W/2).toFixed(3)});
      float ins=smoothstep(-.02,.12,p.x)*smoothstep(-.02,.12,${W.toFixed(2)}-p.x)*smoothstep(-.02,.12,p.z)*smoothstep(-.02,.12,${D.toFixed(2)}-p.z)*step(p.y,rf+.05);
      if(ins<=0.) return 1.;
      float sk=exp(-pow((p.x-8.)/3.6,2.))+exp(-pow((p.x-20.)/3.6,2.))+exp(-pow((p.x-28.)/3.6,2.))+exp(-pow((p.x-40.)/3.6,2.));
      sk*=smoothstep(1.,7.,p.z)*smoothstep(1.,7.,${D.toFixed(2)}-p.z);
      float gt=0.;
      for(int i=0;i<4;i++){ vec4 d=uDoor[i]; vec2 q=vec2(p.x-d.x,p.z-d.y); gt+=d.z*exp(-dot(q,q)/(2.*4.5*4.5))*smoothstep(4.6,0.,p.y)*.9; }
      float kin=.26+.16*min(sk,1.2)+gt;
      return mix(1.,mix(1.,min(kin,1.),uHallIn),ins); }`)
   .replace('#include <lights_fragment_maps>',`#include <lights_fragment_maps>
    { float hk=hallK(vHallWP); iblIrradiance*=hk; irradiance*=hk;
    #if defined( RE_IndirectSpecular )
      radiance*=hk;
    #endif
    }`);
}
THREE.Material.prototype.onBeforeCompile=function(sh){ if(this.isMeshStandardMaterial) IBLK(sh); };
const EXPO={in:0.95,walk:1.0,out:0.52,                     // экспозиция: в зале под кровлей — выше (рассеянного света меньше, как в реальном цеху)
  at(c,walking){ if(!G.roof.visible) return EXPO.out;          // вид без кровли — открытый макет под солнцем
    const p=c.position, rf=EAVE+(RIDGE-EAVE)*(1-Math.abs(p.x-W/2)/(W/2));
    const d=Math.max(-p.x,p.x-W,-p.z,p.z-D,p.y-rf,0);          // насколько камера вне зала (м)
    const k=Math.max(0,Math.min(1,1-d/4));                      // плавный переход 4 м: из ворот наружу, над кровлей
    return EXPO.out+((walking?EXPO.walk:EXPO.in)-EXPO.out)*k; } };
function iblUpdate(){                                           // раз в кадр: кровля видна? какие ворота открыты? вентиляторы
  IBL_U.value=G.roof.visible?1:0; if(HALL.tick) HALL.tick(WIND.value);
  if(typeof DOORS!=='undefined') for(let i=0;i<4;i++){ const d=DOORS[i]; if(d) IBL_D.value[i].set(d.xFix,d.gz,d.open,0); }
}

const HALL={};
{ let q=20261010; HALL.R=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; };   // свой генератор: общий LOOK.R (раскладка коробов, люди) не сдвигается
}
{
  const wsInject=(mat,key,vtx,frag)=>{                          // мировые координаты в стандартный материал
    mat.customProgramCacheKey=()=>key;
    mat.onBeforeCompile=sh=>{
      sh.uniforms.uWind=WIND;
      sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP; uniform float uWind;')
        .replace('#include <project_vertex>',(vtx||'')+'\n#include <project_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;');
      sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;');
      frag(sh); IBLK(sh);
    };
    return mat;
  };
  HALL.ws=wsInject;

  /* ---------- профнастил потолка: светлая окраска, трапециевидные рёбра вдоль ската, шаг 0,2 м ---------- */
  HALL.roofM=wsInject(new THREE.MeshStandardMaterial({color:0xe4e7ea,roughness:.5,metalness:.18,envMapIntensity:.9}),'hallRoof',null,sh=>{
    sh.fragmentShader=sh.fragmentShader
      .replace('#include <map_fragment>',`#include <map_fragment>
        float rph=vWP.z*31.4159;                                  // 2π/0,2 м
        float rib=smoothstep(-.35,.35,sin(rph));
        diffuseColor.rgb*=.90+.10*rib;`)
      .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
        { float upw=(vec4(normal,0.)*viewMatrix).y;                // верх кровли снаружи: выветренная окраска, пыль, потёки к карнизу
          float nz=fract(sin(dot(floor(vWP.xz*vec2(.7,.18)),vec2(12.9898,78.233)))*43758.5453);
          if(upw>.3) diffuseColor.rgb*=.70+.06*nz-.05*smoothstep(4.,.5,min(vWP.x,${W.toFixed(2)}-vWP.x)); }
        { float c=cos(rph); float tilt=.55*c*c*c;
          normal=normalize(normal+(viewMatrix*vec4(0.,0.,tilt,0.)).xyz); }`);
  });

  /* ---------- световые фонари: опаловый поликарбонат, светится днём ---------- */
  HALL.skyM=std(0xeef4fa,.35,0,{emissive:0xe2ecf6,emissiveIntensity:2.4,transparent:true,opacity:.9,depthWrite:true});

  /* ---------- ленточное остекление: стекло прозрачное, белые переплёты через 1,2 м ---------- */
  HALL.glassM=wsInject(new THREE.MeshStandardMaterial({color:0xdfe9f1,roughness:.08,metalness:.1,transparent:true,opacity:.22,
    envMapIntensity:1.4,depthWrite:false}),'hallGlass',null,sh=>{
    sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      { float a=abs(vWP.x)<.4||abs(vWP.x-${W.toFixed(2)})<.4?vWP.z:vWP.x;   // вдоль стены
        float u=fract(a/1.2), fr=step(u,.035)+step(.965,u);
        float yy=fract((vWP.y-${WALL_H.toFixed(2)})/.8+.0), fh=step(yy,.06)+step(.94,yy);
        float f=clamp(fr+fh,0.,1.);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.94,.95),f); diffuseColor.a=mix(diffuseColor.a,1.,f); }`);
  });

  /* ---------- сварная сетка ограждения 50 × 100 мм, пруток 4 мм ---------- */
  const nc=cnv(64,128), ng=nc.getContext('2d');
  ng.clearRect(0,0,64,128); ng.fillStyle='rgba(255,255,255,1)';
  ng.fillRect(0,0,5,128); ng.fillRect(0,0,64,5);
  const nt=new THREE.CanvasTexture(nc); nt.wrapS=nt.wrapT=THREE.RepeatWrapping; nt.anisotropy=ANISO;
  nt.repeat.set(2.84/0.05,2.0/0.1);
  M.netGreen=new THREE.MeshStandardMaterial({color:0x22a04a,roughness:.55,metalness:.25,alphaMap:nt,transparent:true,
    side:THREE.DoubleSide,depthWrite:false,envMapIntensity:.7});

  /* ---------- бирюзовый занавес-перегородка под кровлей (как на фото зала) ---------- */
  HALL.curtain=()=>{
    const Z=OUR-0.08, Y0=4.9, NX=240, NY=10;
    const pos=[], uv=[], idx=[];
    for(let j=0;j<=NY;j++) for(let i=0;i<=NX;i++){
      const x=0.15+(W-0.3)*i/NX, v=j/NY, yt=roofY(x)-0.09;
      pos.push(x,Y0+(yt-Y0)*v,Z); uv.push(x/1.5,v);
    }
    for(let j=0;j<NY;j++) for(let i=0;i<NX;i++){ const a=j*(NX+1)+i, b=a+1, c=a+NX+1, d=c+1; idx.push(a,c,b,b,c,d); }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(new Array(pos.length).fill(0).map((_,k)=>k%3===2?1:0),3));
    geo.setIndex(idx);
    /* ткань: швы полотнищ через 1,5 м, поперечный шов, лёгкая неравномерность цвета */
    const c=cnv(128,256), g=c.getContext('2d');
    g.fillStyle='#22a196'; g.fillRect(0,0,128,256);
    for(let i=0;i<60;i++){ g.fillStyle=`rgba(${HALL.R()<.5?0:255},${HALL.R()<.5?40:255},${HALL.R()<.5?40:255},${.02+HALL.R()*.03})`;
      g.fillRect(HALL.R()*128,0,2+HALL.R()*10,256); }
    g.fillStyle='rgba(10,60,56,.55)'; g.fillRect(0,0,3,256); g.fillRect(125,0,3,256);       // сварной шов полотнищ
    g.fillStyle='rgba(255,255,255,.10)'; g.fillRect(4,0,2,256);
    g.fillStyle='rgba(10,60,56,.45)'; g.fillRect(0,170,128,3); g.fillRect(0,250,128,6);   // поперечный шов и подгиб у кромки
    g.fillStyle='rgba(235,240,240,.9)'; for(let x=10;x<128;x+=40) g.fillRect(x,248,6,6);    // люверсы
    const t=new THREE.CanvasTexture(c); t.wrapS=THREE.RepeatWrapping; t.encoding=THREE.sRGBEncoding; t.anisotropy=ANISO;
    const m=wsInject(new THREE.MeshStandardMaterial({map:t,roughness:.62,metalness:0,side:THREE.DoubleSide,envMapIntensity:.6}),'hallCurtain',
      /* колыхание: складки висят всегда, сквозняк качает низ сильнее, чем верх (верх закреплён на ферме) */
      `{ float x=transformed.x, v=clamp((transformed.y-${Y0.toFixed(2)})/(${(EAVE+0.4).toFixed(2)}-${Y0.toFixed(2)}),0.,1.), lo=pow(1.-v,1.4);
         float ph=x*13.96+.6*sin(x*.71);
         float pl=(.022+.03*lo)*sin(ph);
         float sw=lo*(.10*sin(.55*x+.8*uWind)+.04*sin(1.7*x-1.25*uWind+1.)+.025*sin(3.1*x+2.1*uWind));
         transformed.z+=pl+sw;
         float dx=(.022+.03*lo)*cos(ph)*(13.96+.43*cos(x*.71))+lo*(.055*cos(.55*x+.8*uWind)+.068*cos(1.7*x-1.25*uWind+1.)+.078*cos(3.1*x+2.1*uWind));
         vNormal=normalize(normalMatrix*normalize(vec3(-dx,0.,1.))); }`,      // нормаль — вместе со смещением
      ()=>{});
    const o=new THREE.Mesh(geo,m); o.castShadow=true; o.receiveShadow=true; o.userData.nm='Занавес-перегородка';
    G.roof.add(o); HALL.curtainMesh=o;
    /* трубчатый карниз занавеса */
    for(let x=0.15;x<W-0.1;x+=2.4){ const x1=Math.min(W-0.15,x+2.4), y0=roofY(x)-0.09, y1=roofY(x1)-0.09, L=Math.hypot(x1-x,y1-y0);
      const r=cyl(0.03,L,M.galv,(x+x1)/2,(y0+y1)/2,Z,G.roof,8); r.rotation.z=Math.PI/2+Math.atan2(y1-y0,x1-x); r.castShadow=false; }
    return o;
  };
}
