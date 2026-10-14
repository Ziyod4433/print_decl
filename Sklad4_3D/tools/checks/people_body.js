// Тело людей (модель RPM на скелете-драйвере): ботинки и руки в позах, шаге и беге.
// node tools/ev.js Sklad4_realistic_film.html tools/checks/people_body.js
// shoe — самая низкая точка ботинка над полом человека (м) в каждой позе и в фазах шага/бега: норма ≥ −0,03 (стойка −0,014; до 14.10
//   в шаге носок входил в пол на 7,6 см, в беге на 5,4); flat — в стойке пятка и носок у пола: heel и toe ≤ 0,03 (до 14.10 ботинок
//   был перевёрнут: heel 0,122);
// arms — кисти (hand) и предплечья (fore) внутри куртки и жилета глубже 1 см: [число вершин, глубина м]. Норма — ≤ 6 вершин и ≤ 0,07 м
//   (у выпуклости жилета и у локтя метрика по сечениям даёт ложные 3–6 вершин); «телефон» не считать — предплечье у плеча перед
//   грудью, метрика там врёт, смотреть глазами. До 14.10: «на поясе» 44/67 вершин на 9 см, «за спиной» 54 на 7 см, «скрещены» 18; err [].
(()=>{ const out={err:[],shoe:{},arms:{},flat:null}; const f3=v=>+v.toFixed(3);
 try{
 const H=PEOPLE.find(h=>h.rb&&h.prof&&h.prof.vest&&!h.root.userData.walkMe)||PEOPLE[1]; const M={}; H.rpm.traverse(o=>{ if(o.isSkinnedMesh) M[o.name]=o; });
 const v=new THREE.Vector3(), GX=['getX','getY','getZ','getW'];          // r128: у атрибутов нет getComponent
 const dom=o=>{ if(o.userData.dom) return o.userData.dom; const g=o.geometry, si=g.attributes.skinIndex, sw=g.attributes.skinWeight, bn=o.skeleton.bones.map(b=>b.name), d=[], used=new Set(g.index.array);
   for(let i=0;i<g.attributes.position.count;i++){ if(!used.has(i)){ d.push(null); continue; } let bi=0,bw=-1; for(let k=0;k<4;k++){ const w=sw[GX[k]](i); if(w>bw){ bw=w; bi=si[GX[k]](i); } } d.push(bn[bi]); }
   return o.userData.dom=d; };
 const pts=(o,flt)=>{ const d=dom(o), pos=o.geometry.attributes.position, r=[]; o.skeleton.update();
   for(let i=0;i<pos.count;i++){ const b=d[i]; if(!b||!flt(b,i)) continue; v.fromBufferAttribute(pos,i); o.boneTransform(i,v); v.applyMatrix4(o.matrixWorld); H.root.worldToLocal(v); r.push([v.x,v.y,v.z,b,i]); } return r; };
 const fw=M.Wolf3D_Outfit_Footwear, fz=fw.geometry.attributes.position;
 const shoe=()=>{ H.root.updateMatrixWorld(true); const p=pts(fw,()=>true); let m=9; p.forEach(q=>{ m=Math.min(m,q[1]); }); return f3(m); };
 const TORSO=/^(Hips|Spine|Spine1|Spine2)$/;
 const arms=()=>{ H.root.updateMatrixWorld(true);
   const T=[...pts(M.Wolf3D_Outfit_Top,b=>TORSO.test(b)),...pts(M.Wolf3D_Vest.visible?M.Wolf3D_Vest:M.Wolf3D_TopTorso,b=>TORSO.test(b)),...pts(M.Wolf3D_Outfit_Bottom,b=>b==='Hips')];
   const A=[...pts(M.Wolf3D_Gloves,()=>true).map(p=>(p[5]='hand',p)),...pts(M.Wolf3D_Outfit_Top,b=>/ForeArm/.test(b)).map(p=>(p[5]='fore',p))];
   const DY=0.03, NB=36, sl={}, pr={}; T.forEach(p=>{ const k=Math.round(p[1]/DY); (sl[k]=sl[k]||[]).push(p); });
   for(const k in sl){ const s=sl[k]; let cx=0,cz=0; s.forEach(p=>{ cx+=p[0]; cz+=p[2]; }); cx/=s.length; cz/=s.length; const R=new Array(NB).fill(0), bin=(x,z)=>((Math.floor((Math.atan2(x-cx,z-cz)+Math.PI)/(2*Math.PI)*NB))%NB+NB)%NB;
     s.forEach(p=>{ const i=bin(p[0],p[2]); R[i]=Math.max(R[i],Math.hypot(p[0]-cx,p[2]-cz)); });
     for(let i=0;i<NB;i++) if(!R[i]){ let j=1; while(j<NB&&!R[(i+j)%NB]&&!R[(i-j+NB)%NB]) j++; R[i]=Math.min(R[(i+j)%NB]||9,R[(i-j+NB)%NB]||9); }
     pr[k]={cx,cz,R,n:s.length,bin}; }
   const r={hand:[0,0],fore:[0,0]}; A.forEach(p=>{ const q=pr[Math.round(p[1]/DY)]; if(!q||q.n<12) return; const d=q.R[q.bin(p[0],p[2])]-Math.hypot(p[0]-q.cx,p[2]-q.cz);
     if(d>0.01){ const a=r[p[5]]; a[0]++; a[1]=Math.max(a[1],f3(d)); } }); return r; };
 const POSES=[['стоит',{}],['несёт',{carry:1}],['тяжёлый',{carry:1,heavy:1}],['наклон',{bend:1,reach:1}],['присед',{squat:1}],['на поясе',{akimbo:1}],['скрещены',{cross:1}],
   ['за спиной',{behind:1}],['говорит',{talk:1}],['планшет',{tablet:1}],['телефон',{phone:1}],['толкает',{push:1}],['сканер',{scan:1,scanner:1}]];
 for(const [lab,p] of POSES){ let w={hand:[0,0],fore:[0,0]}, sh=9; for(const t of [1,3,5.5]){ HUM.pose(H,Object.assign({t},p)); const a=arms(); for(const k of ['hand','fore']){ w[k][0]=Math.max(w[k][0],a[k][0]); w[k][1]=Math.max(w[k][1],a[k][1]); } sh=Math.min(sh,shoe()); }
   out.arms[lab]=w; out.shoe[lab]=sh; }
 for(const cl of ['walk','run']){ let sh=9, aw={hand:[0,0],fore:[0,0]}; for(let ph=0;ph<1;ph+=0.05){ const p={t:3,phase:ph}; p[cl]=1; HUM.pose(H,p); sh=Math.min(sh,shoe()); const a=arms(); for(const k of ['hand','fore']){ aw[k][0]=Math.max(aw[k][0],a[k][0]); aw[k][1]=Math.max(aw[k][1],a[k][1]); } }
   out.shoe[cl]=sh; out.arms[cl]=aw; }
 HUM.pose(H,{t:3}); H.root.updateMatrixWorld(true); const p=pts(fw,(b,i)=>fz.getX(i)>0); let heel=9,toe=9; p.forEach(q=>{ const z=fz.getZ(q[4]); if(z<-0.08) heel=Math.min(heel,q[1]); if(z>0.18) toe=Math.min(toe,q[1]); }); out.flat={heel:f3(heel),toe:f3(toe)};
 HUM.pose(H,Object.assign({t:0},H.base||{}));
 }catch(e){ out.err.push(e.message+' | '+(e.stack||'').split('\n').slice(0,3).join(' / ')); }
 return out; })()
