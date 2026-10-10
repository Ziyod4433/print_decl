/* ===================== ФИЛЬМ «ПРОЦЕСС СКЛАДА» (v7) =====================
   Процесс: заезд к Л2 → выгрузка телескопической лентой (4 типа коробов) → первый короб каждого типа — образец на DWS →
   остальные собираются в стоечный поддон у ленты → погрузчик ставит стойку вторым ярусом в ячейку по FIFO →
   автопоезд-тандем 145 м³ заезжает передним ходом через П2 и встаёт внутри вдоль южной магистрали, правым бортом к ряду A;
   шторы открывают, под ними — каркас с проёмом посередине каждого кузова → по FIFO (самый старый день) стойка из ячейки A14
   подаётся в проём на поднятых вилах; грузчики внутри берут короба по одному и кладут в свои дорожки. Первая стойка — в грузовик,
   вторая — в прицеп. Пустые стойки возвращаются к приёмке → фото, шторы, выезд задним ходом через П2.
   Движение погрузчика: пробеги из прямых и дуг (поворот вокруг внутреннего переднего колеса), скорость ограничена на участках,
   разгон и торможение плавные; остановки — только у груза и на смене направления.
   Расстановка: машины, ячейки процесса и LPR на время фильма стоят в штатном положении; телескопический конвейер и DWS в фильме
   свои. Всё остальное показывается так, как расставил пользователь; если его объект оказался на маршруте — фильм предупреждает.
   Физика аналитическая (всё — функция времени): падение и покачивание короба при укладке, проскальзывание на ленте,
   подвеска кузова, клевок и просадка погрузчика, раскачка стойки на вилах, самоцентрирование опор в чашах.
   Таймлапсы помечены в кадре «УСКОРЕНО ×N». */
const FILM={on:false,play:false,t:0,T:150,W:1920,H:1080,built:false,recording:false,fps:24};
(function(){
const F=FILM, V=(x,y,z)=>new THREE.Vector3(x,y,z);
const c01=v=>Math.max(0,Math.min(1,v)), sst=u=>{u=c01(u); return u*u*(3-2*u);}, lerp=(a,b,u)=>a+(b-a)*u;
const ez=u=>{u=c01(u); return u*u*u*(u*(u*6-15)+10);};
function trap(u,a){ a=a||0.25; u=c01(u); const vm=1/(1-a);
  if(u<a) return vm*u*u/(2*a); if(u<1-a) return vm*(a/2+u-a); return 1-vm*(1-u)*(1-u)/(2*a); }
function brake(u,u0){ u=c01(u); u0=u0||0.55; const S=u0+(1-u0)/2;               // едет с ходу и тормозит
  return (u<u0?u:u0+(u-u0)-(u-u0)*(u-u0)/(2*(1-u0)))/S; }
function kv(t,K){ if(t<=K[0][0]) return K[0][1];
  for(let i=1;i<K.length;i++){ const a=K[i-1],b=K[i]; if(t<=b[0]) return a[1]+(b[1]-a[1])*sst((t-a[0])/(b[0]-a[0])); }
  return K[K.length-1][1]; }
const AX=0.62, FR=1.97;                          // от начала координат погрузчика: передняя ось и центр стойки на вилах
/* «пробег» погрузчика: цепочка прямых и дуг без остановок. Положение задаёт центр передней оси; дуга — поворот вокруг
   внутреннего переднего колеса (радиус RHO по оси). Скорость — по ограничениям участков, разгон и торможение ограничены:
   перед поворотом машина сбрасывает ход, на выходе набирает; остановки — только на смене направления и у груза. */
function mkRun(pieces,acc,dec){
  let L=0; pieces.forEach(p=>{ p.s0=L; L+=p.len; });
  const n=Math.max(3,Math.ceil(L/0.02)+1), ds=L/(n-1), v=new Float32Array(n), t=new Float32Array(n);
  let k=0; for(let i=0;i<n;i++){ const q=i*ds; while(k<pieces.length-1&&q>pieces[k].s0+pieces[k].len+1e-6) k++;
    const lim=p=>p.c?p.v*(0.3+0.7*Math.sin(Math.PI*Math.min(1,Math.max(0,(q-p.s0)/p.len)))):p.v;      // в дугу машина входит и выходит плавно: руль поворачивается не мгновенно
    v[i]=(k<pieces.length-1&&q>=pieces[k].s0+pieces[k].len-1e-6)?Math.min(lim(pieces[k]),lim(pieces[k+1])):lim(pieces[k]); }
  v[0]=0; for(let i=1;i<n;i++) v[i]=Math.min(v[i],Math.sqrt(v[i-1]*v[i-1]+2*acc*ds));
  v[n-1]=0; for(let i=n-2;i>=0;i--) v[i]=Math.min(v[i],Math.sqrt(v[i+1]*v[i+1]+2*dec*ds));
  for(let i=1;i<n;i++) t[i]=t[i-1]+ds/Math.max(0.01,(v[i]+v[i-1])/2);
  const R={pieces,L,n,ds,t,T:t[n-1]};
  R.sAt=tt=>{ if(tt<=0) return 0; if(tt>=R.T) return L; let lo=0,hi=n-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(t[m]<=tt) lo=m; else hi=m; }
    return (lo+(tt-t[lo])/Math.max(1e-6,t[hi]-t[lo]))*ds; };
  R.tAt=q=>{ const f=Math.min(n-1,Math.max(0,q/ds)), i=Math.min(n-2,Math.floor(f)); return t[i]+(t[i+1]-t[i])*(f-i); };
  return R; }
function runPose(R,q){ const P=R.pieces; let k=0; while(k<P.length-1&&q>P[k].s0+P[k].len) k++;
  const p=P[k], l=Math.min(p.len,Math.max(0,q-p.s0)); let ax,az,yaw;
  if(p.c){ yaw=p.y0+(p.y1-p.y0)*(p.len>0?l/p.len:0); ax=p.c[0]-p.k*p.rho*Math.cos(yaw); az=p.c[1]+p.k*p.rho*Math.sin(yaw); }
  else { yaw=p.yaw; ax=p.p[0]+Math.sin(yaw)*l*p.dir; az=p.p[1]+Math.cos(yaw)*l*p.dir; }
  return {x:ax-Math.sin(yaw)*AX,z:az-Math.cos(yaw)*AX,yaw}; }
function mkPath(segs){ let d=0; segs.forEach(s=>{
    if(s.run) s.len=s.run.L;
    else if(s.piv) s.len=Math.abs(s.piv.y1-s.piv.y0)*AX;                                 // разворот на месте вокруг передней оси
    else { s.c=new THREE.CatmullRomCurve3(s.pts.map(p=>V(p[0],0,p[1])),false,'centripetal'); s.len=s.c.getLength(); }
    s.d0=d; d+=s.len; }); return segs; }
function segEval(s,u){ u=c01(u);
  if(s.run){ const q=s.run.sAt(u*(s.t1-s.t0)), o=runPose(s.run,q); o.dist=s.d0+q; o.sgn=s.rev?-1:1; o.mv=u>0&&u<1; return o; }
  if(s.piv){ const e=ez(u), yaw=s.piv.y0+(s.piv.y1-s.piv.y0)*e;
    return {x:s.piv.x-Math.sin(yaw)*AX,z:s.piv.z-Math.cos(yaw)*AX,yaw,dist:s.d0+e*s.len,sgn:1,mv:u>0&&u<1}; }
  const e=s.ease==='io'?sst(u):s.ease==='lin'?u:s.ease==='brake'?brake(u,s.u0):s.ease==='go'?1-brake(1-u,s.u0):trap(u,s.a||0.25);
  const p=s.c.getPointAt(Math.min(1,Math.max(0,e))), tg=s.c.getTangentAt(Math.min(1,Math.max(0,e)));
  return {x:p.x,z:p.z,yaw:Math.atan2(tg.x,tg.z)+(s.rev?Math.PI:0),dist:s.d0+e*s.len,sgn:s.rev?-1:1,mv:u>0&&u<1}; }
function pathAt(S,t){ if(t<=S[0].t0) return segEval(S[0],0);
  for(let i=0;i<S.length;i++){ const s=S[i]; if(t<s.t0) return segEval(S[i-1],1); if(t<=s.t1) return segEval(s,(t-s.t0)/(s.t1-s.t0)); }
  return segEval(S[S.length-1],1); }
function roll(S,t){ let r=0; for(const s of S){ if(t<=s.t0) break; const q=pathAt([s],Math.min(t,s.t1)); r+=(q.dist-s.d0)*(s.rev?-1:1); } return r; }
const wrapA=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
const yawLerp=(a,b,u)=>a+wrapA(b-a)*u;
function seeded(fn){ const orig=Math.random; let s=20260929; Math.random=()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; };
  try{ return fn(); } finally { Math.random=orig; } }
const noise1=(t,f,ph)=>Math.sin(t*f+ph)*0.6+Math.sin(t*f*2.13+ph*1.7)*0.3+Math.sin(t*f*4.7+ph*0.3)*0.1;
/* скорость и ускорение по пути (для крена кузова) */
function accAt(S,t){ const h=0.12, d=x=>pathAt(S,x).dist; return (d(t+h)-2*d(t)+d(t-h))/(h*h); }
function accSm(S,t){ let s=0,n=0; for(let k=-4;k<=4;k++){ const w=1-Math.abs(k)/5; s+=accAt(S,t+k*0.08)*w; n+=w; } return s/n; }

