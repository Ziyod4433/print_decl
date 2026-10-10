/* ===================== камера по планам (время процесса T) ===================== */
const L3=(a,b,u)=>V(lerp(a[0],b[0],u),lerp(a[1],b[1],u),lerp(a[2],b[2],u));
const cnPos=T=>{ const p=pathAt(CN,T); return V(p.x,F.cn0.y,p.z); };
const kzPos=T=>{ const p=pathAt(KZ,T); return V(p.x,0,p.z); };
const fkP=()=>F.fk.position.clone();
const boxW=k=>F.box[k].position.clone();
let SHOTS=[];
function mkShots(){ const MK=F.MK, a6=cellC(5), a14=cellC(13), P=PICK[0], rx=RK_AT[0], rz=RK_AT[1];
const d6=a6[0]-18.29, d14=a14[0]-42.65, B2X=F.bw[1][0];                 // камеры у ячеек привязаны к центрам ячеек
const inB=(r,x,y,z)=>F.bod[r].localToWorld(V(x,y,z));                   // точка в системе кузова (камера внутри кузова)
const fkL=(dx,dy,dz)=>{ const p=F.fk.position; return V(p.x+(dx||0),dy===undefined?1.1:dy,p.z+(dz||0)); };
const orb=(cx,cy,cz,r,h,a0,a1)=>u=>{ const a=lerp(a0,a1,sst(u)); return [V(cx+r*Math.sin(a),h,cz+r*Math.cos(a)),V(cx,cy,cz)]; };
SHOTS=[
  {T0:0,T1:4.6,fov:38,ext:true,mb:1,f:u=>{ const a=-2.35+0.3*sst(u), r=78-14*sst(u); return [V(22+r*Math.sin(a),44-12*sst(u),16+r*Math.cos(a)),V(10,0,6+4*u)]; }},
  {T0:4.6,T1:8.2,fov:34,ext:true,mb:1.3,dof:{k:0.5,tgt:'cn'},hand:0.012,f:(u,T)=>{ const c=cnPos(T); return [V(-10.8,-0.55,lerp(-6,0,sst(u))),c.clone().add(V(0.3,1.7,5.5))]; }},
  {T0:8.2,T1:11.6,fov:46,mb:1,f:u=>[L3([8.6,1.9,14.6],[8.2,1.8,14.2],sst(u)),V(-3.5,1.0,10.2)]},
  {T0:11.6,T1:E0+0.9,fov:42,ext:true,dof:{k:0.8,tgt:'wt'},hand:0.012,f:u=>[L3([-1.2,2.25,12.9],[-1.0,2.2,12.5],sst(u)),V(-5.9,1.9,11.2)]},
  {T0:E0+0.9,T1:P.grab-0.6,fov:48,mb:1.2,dof:{k:0.7,tgt:'box0'},f:()=>{ const b=boxW(0); return [V(Math.min(3.9,b.x+0.9),1.95,12.0),V(b.x-0.6,b.y+0.15,10.9)]; }},
  {T0:P.grab-0.6,T1:P.grab+1.5,fov:44,dof:{k:0.6,tgt:'ct'},hand:0.01,f:u=>[L3([6.6,1.7,8.5],[6.3,1.65,8.8],sst(u)),V(4.6,1.0,10.7)]},
  {T0:P.grab+1.5,T1:P.dws0+0.3,fov:46,mb:1.2,f:u=>{ const c=F.CT.root.position; return [V(lerp(7.0,8.8,sst(u)),1.6,13.0),V(c.x+0.5,0.95,c.z)]; }},
  {T0:P.dws0+0.3,T1:P.scan1+0.9,fov:44,dof:{k:0.5,tgt:'dwsbox'},hand:0.008,f:u=>[L3([10.9,2.05,13.3],[10.6,1.95,13.5],sst(u)),V(8.4,0.85,10.2)]},
  {T0:P.scan1+0.9,T1:MK.tl1a,fov:44,mb:1,dof:{k:0.4,tgt:'rk'},f:u=>[L3([8.5,1.95,13.9],[8.1,1.85,14.1],sst(u)),V(6.0,0.8,11.8)]},
  {T0:MK.tl1a,T1:lerp(MK.tl1a,MK.tl1b,0.36),fov:48,mb:1,f:u=>[L3([9.9,3.4,15.4],[9.3,3.2,15.7],sst(u)),V(5.7,0.7,11.3)]},
  {T0:lerp(MK.tl1a,MK.tl1b,0.36),T1:lerp(MK.tl1a,MK.tl1b,0.7),fov:42,f:orb(rx,0.75,rz,3.6,2.5,1.0,0.1)},
  {T0:lerp(MK.tl1a,MK.tl1b,0.7),T1:MK.tl1b,fov:46,f:u=>[L3([2.2,3.0,14.4],[2.5,2.8,14.1],sst(u)),V(5.7,0.8,11.6)]},
  {T0:MK.tl1b,T1:F.tLabel+1.2,fov:38,dof:{k:0.6,tgt:'tag'},hand:0.008,f:u=>[L3([7.0,1.55,13.7],[6.8,1.5,13.5],sst(u)),V(5.35,1.15,12.8)]},
  {T0:F.tLabel+1.2,T1:MK.in1+1.6,fov:46,mb:1.1,dof:{k:0.4,tgt:'fk'},f:u=>[L3([2.8,2.0,14.5],[3.0,1.85,14.2],sst(u)),V(5.6,0.4,13.2)]},
  {T0:MK.in1+1.6,T1:MK.tr1a+0.6,fov:48,mb:1,f:u=>[L3([2.5,2.5,15.6],[2.3,2.4,15.2],sst(u)),V(5.9,0.9,14.0)]},
  {T0:MK.tr1a+0.6,T1:MK.tr1b-0.4,fov:50,mb:1.4,f:()=>{ const p=fkP(); return [V(p.x+6.6,2.3,17.15),V(p.x+1.2,1.0,15.75)]; }},
  {T0:MK.tr1b-0.4,T1:MK.up1-0.2,fov:46,mb:1,f:u=>[L3([22.9+d6,2.3,13.7],[22.5+d6,2.2,14.0],sst(u)),V(18.5+d6,1.6,17.6)]},
  {T0:MK.up1-0.2,T1:MK.at6+0.2,fov:44,mb:1,dof:{k:0.4,tgt:'rk'},f:u=>[L3([14.9+d6,2.2,15.9],[15.2+d6,2.3,16.3],sst(u)),V(18.3+d6,1.9,18.6)]},
  {T0:MK.at6+0.2,T1:MK.seat1+1.5,fov:30,dof:{k:0.5,tgt:'cup'},hand:0.006,f:u=>[L3([20.25+d6,1.88,20.95],[20.15+d6,1.85,20.85],sst(u)),V(19.01+d6,1.6,19.92)]},
  {T0:MK.seat1+1.5,T1:MK.out6+0.3,fov:50,mb:1,f:u=>[L3([14.6+d6,2.5,15.0],[14.3+d6,2.7,14.7],sst(u)),V(18.5+d6,1.6,18.5)]},
  /* автопоезд заезжает через П2; упоры, шторы, грузчики поднимаются в кузов */
  {T0:MK.out6+0.3,T1:MK.kin+4.4,fov:46,mb:1,f:(u,T)=>{ const k=kzPos(T); return [L3([39.9,1.9,15.4],[39.6,1.85,15.6],sst(u)),V(Math.min(k.x-11.5,50.5),1.9,10.7)]; }},
  {T0:MK.kin+4.4,T1:MK.kst+0.9,fov:40,mb:1,dof:{k:0.3,tgt:'kz'},hand:0.006,f:(u,T)=>{ const k=kzPos(T); return [V(17.4,1.3,13.0),V(k.x-13.2,1.9,10.7)]; }},
  {T0:MK.kst+0.9,T1:MK.up2+0.6,fov:50,hand:0.006,f:u=>[L3([25.6,2.2,15.6],[26.4,2.1,15.0],sst(u)),V(31.2,1.9,11.6)]},
  /* отбор по FIFO: ячейка A14 */
  {T0:MK.up2+0.6,T1:MK.out14+0.3,fov:42,dof:{k:0.5,tgt:'a14tag'},hand:0.008,f:u=>[L3([38.3+d14,2.2,16.5],[38.6+d14,2.1,16.8],sst(u)),V(42.4+d14,1.85,18.8)]},
  /* стойка — через магистраль к грузовику, в проём на поднятых вилах */
  {T0:MK.out14+0.3,T1:MK.trn1-0.3,fov:50,mb:0.8,f:()=>{ const p=fkP(); return [V(Math.min(46.4,p.x+5.4),2.3,17.5),V(p.x-0.9,1.2,13.6)]; }},
  {T0:MK.trn1-0.3,T1:MK.set1-0.8,fov:46,mb:1,dof:{k:0.4,tgt:'fk'},f:u=>[L3([24.9,2.1,14.6],[25.3,2.0,14.2],sst(u)),V(30.3,1.4,13.3)]},
  {T0:MK.set1-0.8,T1:MK.u1a+2.6,fov:42,dof:{k:0.4,tgt:'bed'},hand:0.006,f:u=>[L3([27.5,1.75,13.1],[27.7,1.7,12.9],sst(u)),V(30.3,1.5,11.3)]},
  {T0:MK.u1a+2.6,T1:MK.u1a+5.0,fov:64,ev:0.7,hand:0.006,f:u=>[inB(0,-3.9+0.2*sst(u),3.55,-0.7),inB(0,0.2,1.55,0.45)]},
  {T0:MK.u1a+5.0,T1:MK.u1b-0.6,fov:50,mb:0.6,f:u=>[L3([26.3,3.4,15.0],[26.6,3.3,14.7],sst(u)),V(30.2,1.6,11.7)]},
  {T0:MK.u1b-0.6,T1:MK.e1s+1.5,fov:46,dof:{k:0.3,tgt:'fk'},hand:0.006,f:u=>[L3([33.9,2.0,13.1],[34.1,2.05,13.4],sst(u)),V(30.4,1.35,12.7)]},
  /* пустая стойка — к приёмке; вторая стойка из A14 — в прицеп */
  {T0:MK.e1s+1.5,T1:MK.e1out+2.0,fov:52,mb:0.6,f:u=>[L3([9.0,5.0,8.4],[9.3,4.8,8.8],sst(u)),V(14.0,0.6,14.0)]},
  {T0:MK.e1out+2.0,T1:MK.out14b+0.5,fov:50,mb:0.5,f:()=>[V(39.6+d14,3.4,13.4),fkL(0,1.0,0.6)]},
  {T0:MK.out14b+0.5,T1:F.CAR[2].up,fov:46,mb:1,dof:{k:0.3,tgt:'fk'},f:u=>[L3([45.4,2.0,16.0],[45.1,1.9,15.6],sst(u)),V(41.3,1.4,13.2)]},
  {T0:F.CAR[2].up,T1:MK.u2a+2.6,fov:44,dof:{k:0.4,tgt:'bed2'},hand:0.006,f:u=>[L3([44.3,2.1,13.5],[44.1,2.05,13.2],sst(u)),V(B2X+0.2,1.55,11.5)]},
  {T0:MK.u2a+2.6,T1:MK.u2b-0.6,fov:64,ev:0.7,mb:0.6,f:u=>[inB(1,-3.9+0.2*sst(u),3.55,-0.7),inB(1,0.2,1.55,0.45)]},
  {T0:MK.u2b-0.6,T1:MK.e2s+0.5,fov:48,hand:0.006,f:u=>[L3([B2X+3.4,1.9,13.5],[B2X+3.2,1.85,13.9],sst(u)),V(B2X+0.2,1.3,12.8)]},
  /* пустая стойка — по магистрали к приёмке, вторым ярусом */
  {T0:MK.e2s+0.5,T1:MK.eo2+1.6,fov:52,mb:0.8,f:()=>{ const p=fkP(); return [V(p.x+6.5,3.6,17.6),V(p.x-0.5,1.0,14.6)]; }},
  {T0:MK.eo2+1.6,T1:MK.e2+1.5,fov:40,dof:{k:0.4,tgt:'eo'},hand:0.006,f:u=>[L3([10.2,3.0,8.4],[10.4,2.9,8.7],sst(u)),V(EO[0]+0.1,1.4,EO[1]+0.1)]},
  /* фото кузова, шторы, выезд задним ходом через П2 */
  {T0:MK.e2+1.5,T1:MK.curt0-0.3,fov:42,dof:{k:0.4,tgt:'w3'},hand:0.01,f:u=>[L3([B2X-1.6,1.75,16.0],[B2X-1.3,1.7,15.7],sst(u)),V(B2X+0.7,1.75,11.4)]},
  {T0:MK.curt0-0.3,T1:MK.go-0.6,fov:64,hand:0.006,f:u=>[L3([36.6,2.7,17.1],[35.9,2.6,16.7],sst(u)),V(35.6,1.9,11.6)]},
  {T0:MK.go-0.6,T1:MK.go+4.6,fov:42,mb:1.2,f:(u,T)=>{ const k=kzPos(T); return [V(19.9,1.5,13.2),V(k.x-9,2.0,10.8)]; }},
  {T0:MK.go+4.6,T1:MK.aer,fov:42,ext:true,mb:1.3,f:(u,T)=>{ const k=kzPos(T); return [L3([62.0,1.6,3.4],[62.5,1.8,3.0],sst(u)),V(Math.min(k.x+9.5,60.5),2.0,10.6)]; }},
  {T0:MK.aer,T1:T_END+0.01,fov:40,ext:true,mb:1,f:u=>[L3([72,30,-18],[36,58,-36],sst(u)),V(28,0,16)]}];
SHOTS.forEach(s=>{ s.t0=tfOf(s.T0); s.t1=tfOf(s.T1); });
F.shots=SHOTS; }
function shotAt(t){ for(let i=0;i<SHOTS.length;i++) if(t<SHOTS[i].t1) return i; return SHOTS.length-1; }
function camShot(t,si,out){ const s=SHOTS[si], T=tau(t), u=c01((T-s.T0)/(s.T1-s.T0)); const [p,l]=s.f(u,T);
  if(s.hand){ const a=s.hand; p.x+=noise1(t,1.3,1.1)*a*8; p.y+=noise1(t,1.7,2.3)*a*6; p.z+=noise1(t,1.1,0.7)*a*8; l.x+=noise1(t,0.9,3.1)*a*14; l.y+=noise1(t,1.2,4.2)*a*10; }
  out.position.copy(p); out.up.set(0,1,0); out.lookAt(l); out.fov=s.fov; out.aspect=camera.aspect; out.near=camera.near; out.far=camera.far;
  out.updateProjectionMatrix(); out.updateMatrixWorld(); return {s,look:l}; }
function camAt(t,out){ const si=shotAt(t); const r=camShot(t,si,out); return {si,s:r.s,look:r.look}; }
const pcam=new THREE.PerspectiveCamera();
function focusDist(s,look){
  const tg=s.dof&&s.dof.tgt; let p=look;
  if(tg==='fk') p=F.fk.position.clone().add(V(0,1.2,0));
  else if(tg==='kz') p=F.kzT.position.clone().add(V(-13,1.9,0));
  else if(tg==='cn') p=F.cnT.position.clone().add(V(0,1.8,0));
  else if(tg==='wt') p=F.WTr.getWorldPosition(V(0,0,0)).add(V(0,1.1,0));
  else if(tg==='ct') p=F.CT.root.position.clone().add(V(0,1.2,0));
  else if(tg==='box0') p=F.box[0].position.clone();
  else if(tg==='dwsbox') p=F.dws.localToWorld(V(-0.2,0.35,0));
  else if(tg==='rk') p=F.RK.position.clone().add(V(0,0.8,0));
  else if(tg==='tag') p=F.RK.localToWorld(V(-0.5,1.2,0.77));
  else if(tg==='a14tag') p=V(cellC(13)[0],1.9,cellC(13)[1]-0.75);
  else if(tg==='bed'||tg==='bed2') p=F.bod[tg==='bed'?0:1].localToWorld(V(RB.x,BEDY+0.6,RB.z));
  else if(tg==='w3') p=F.W3.root.position.clone().add(V(0,1.4,0));
  else if(tg==='eo') p=V(EO[0],1.5,EO[1]);
  return Math.max(0.6,camera.position.distanceTo(p));
}
function frame(t){
  const dt=1/F.fps;
  apply(Math.max(0,t-dt)); const pi=camAt(Math.max(0,t-dt),pcam).si;
  apply(t);
  const {si,s,look}=camAt(t,camera);
  const prevVP=new THREE.Matrix4().multiplyMatrices(pcam.projectionMatrix,pcam.matrixWorldInverse);
  G.roof.visible=true; interior.intensity=LIGHT.inRoof;
  const P=POST.P; P.time=t;
  P.grain=0.016; P.exposure=s.ext?EXPO.out*1.05:EXPO.at(camera)*1.03;   // в зале — экспозиция зала, снаружи (и планы «снаружи») — улицы P.dof=s.dof?s.dof.k:0; P.fstop=2.0; P.focus=focusDist(s,look);
  P.mblur=(s.mb||0.6)*(pi===si?1:0); P.shutter=0.5;
  renderer.shadowMap.needsUpdate=true;
  if(P.on) POST.render(scene,camera,P.mblur>0?prevVP:null); else renderer.render(scene,camera);
  overlay(t);
}
