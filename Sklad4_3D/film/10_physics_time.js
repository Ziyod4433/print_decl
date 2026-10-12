/* кинематика по пути: скорость вперёд, угловая скорость, продольное ускорение (для клевка и раскачки груза) */
function kin(S,t){ const h=0.06, a=pathAt(S,t-h), b=pathAt(S,t+h), p=pathAt(S,t);
  return {v:(b.dist-a.dist)/(2*h)*p.sgn, w:wrapA(b.yaw-a.yaw)/(2*h), af:accSm(S,t)*p.sgn}; }

/* ===================== физика (аналитическая: всё — функция времени) ===================== */
function stepR(tau,w,z){ if(tau<=0) return 0; const wd=w*Math.sqrt(1-z*z), e=Math.exp(-z*w*tau);      // отклик пружины с демпфером на ступеньку нагрузки
  return 1-e*(Math.cos(wd*tau)+z*w/wd*Math.sin(wd*tau)); }
function ringR(tau,w,k){ return tau<=0?0:Math.exp(-k*tau)*Math.sin(w*tau); }                            // затухающий звон после удара
/* запечённая динамика: пружина с демпфером x'' = ω²(u−x) − 2ζω·x' (шаг 1/240 с). Вход u(T) — квазистатический отклик
   (клевок от ускорения, крен от поворота); снимается по пути 30 раз в секунду. Получается запаздывание, перелёт и
   затухающее покачивание после резкой остановки — то, чего нет у мгновенной формулы. */
function sampleIn(fn,T0,T1){ const di=1/30, m=Math.ceil((T1-T0)/di)+2, u=new Float32Array(m); for(let j=0;j<m;j++) u[j]=fn(T0+j*di); return {T0,di,u,m}; }
const inAt=(I,T)=>{ const q=(T-I.T0)/I.di, j=Math.max(0,Math.min(I.m-2,Math.floor(q))), k=Math.max(0,Math.min(1,q-j)); return I.u[j]+(I.u[j+1]-I.u[j])*k; };
function bakeSpring(I,f,z,map){ const w=2*Math.PI*f, dt=1/240, T0=I.T0, T1=I.T0+(I.m-1)*I.di, n=Math.ceil((T1-T0)/dt)+2, a=new Float32Array(n);
  const U=T=>map?map(inAt(I,T)):inAt(I,T); let x=U(T0), v=0;
  for(let i=0;i<n;i++){ const acc=w*w*(U(T0+i*dt)-x)-2*z*w*v; v+=acc*dt; x+=v*dt; a[i]=x; }
  return {T0,dt,a,n}; }
function bk(S,T){ if(!S) return 0; const q=(T-S.T0)/S.dt; if(q<=0) return S.a[0]; if(q>=S.n-1) return S.a[S.n-1]; const i=Math.floor(q), u=q-i; return S.a[i]+(S.a[i+1]-S.a[i])*u; }
const clampA=(v,a)=>Math.max(-a,Math.min(a,v));
const sumE=(E,T,f)=>{ let s=0; for(let i=0;i<E.length;i++){ const e=E[i]; if(T>e[0]) s+=e[1]*f(T-e[0]); } return s; };
const _st={dy:0,th:0};
function settle(dt,S){                                    // короб отпущен на высоте S.h с наклоном S.th: падение → удар ребром → покачивание
  const tf=Math.sqrt(2*S.h/9.81);
  if(dt<tf){ _st.dy=S.h-4.905*dt*dt; _st.th=S.th; }
  else { const u=dt-tf; _st.th=S.th*Math.exp(-u*9)*Math.cos(u*17); _st.dy=Math.abs(Math.sin(u*26))*0.0045*Math.exp(-u*13); }
  _st.dy+=Math.abs(_st.th)*S.half; return _st; }

/* ===================== время: кадр t → время процесса T (таймлапсы считаются в plan) ===================== */
let KN=[[0,0],[200,200]], T_END=200, FAST=[];
const tau=t=>{ for(let i=1;i<KN.length;i++){ const a=KN[i-1],b=KN[i]; if(t<=b[0]) return a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]); } return T_END; };
const tfOf=T=>{ for(let i=1;i<KN.length;i++){ const a=KN[i-1],b=KN[i]; if(T<=b[1]) return a[0]+(b[0]-a[0])*(T-a[1])/(b[1]-a[1]); } return KN[KN.length-1][0]; };
function mkTime(WARPS,TE){ T_END=TE; KN=[[0,0]]; let tf=0,T=0; const push=(T2,k)=>{ tf+=(T2-T)/k; T=T2; KN.push([tf,T]); };
  WARPS.forEach(([a,b,k])=>{ if(b-a<0.4) return; push(a,1); push(b,k); }); push(TE,1);
  F.T=+KN[KN.length-1][0].toFixed(2);
  FAST=WARPS.filter(w=>w[1]-w[0]>=0.4).map(([a,b,k])=>[tfOf(a),tfOf(b),'×'+(k%1?k.toFixed(1).replace('.',','):k)]); }

/* ===================== опорные точки расстановки ===================== */
const RK_AT=[5.75,11.95];                        // стоечный поддон собирается у конца ленты (карман Л2)
const cellC=i=>{ const c=CELLS[i]; return [(c.x0+c.x1)/2,(c.z0+c.z1)/2]; };
const PK_PICK=[4.66,11.42], CT_WAIT=[4.55,10.3], DWS_PLACE=[7.98,10.42], DWS_VIEW=[7.72,10.5];
const ZL=15.6;                                   // линия движения погрузчика по южной магистрали
const ZN=26.7;                                   // северная магистраль: линия движения погрузчика вдоль крытого поста
const P2X=34.4, X2=35.2, P1X=19.0;               // проезды между секциями: линия к проёму грузовика, линия для поворота к прицепу, линия второго проезда
const RHO=0.6, RC=0.25;                          // поворот погрузчика — вокруг внутреннего переднего колеса; у ячейки — почти на месте, руль до упора
const EO=[12.75,11.4];                           // пустые стойки возвращаются к приёмке (зона у ворот Л2)
const CREW=[['K1','K2'],['K3','K4']];            // бригады: грузовик и прицеп
const BEDY=KZB.FY+0.02, RB={x:0,z:0.5};          // пол кузова; стойка на вилах стоит в проёме посередине борта (локально в кузове)
const HOLDY=BEDY+0.10;                           // стойку держат на вилах в 10 см над полом кузова
const XS0=-2.6, XN0=3.6;                         // откуда растут дорожки в кузове: от переднего груза к проёму и от задних дверей к проёму
/* лента: 20 коробов — D D D D · C C C · B B B B · A×9; первый короб каждого типа — образец на DWS */
const SEQ=[3,3,3,3, 2,2,2, 1,1,1,1, 0,0,0,0,0,0,0,0,0];
const DT=4.0, OFF=SEQ.map((_,k)=>k*DT);
const E0=26.0, BELTV=1.25, SLIP=1/6;              // первый короб на ленте — когда конвейер выдвинулся в кузов (машина встала в 11,6; выдвижение 11,8…23,8)
const TELE_EXT=0.51, TELE_T0=11.8, TELE_T1=23.8;      // выдвижение конвейера фильма: доля хода и время (12 с на 4,6 м — как у реальных телескопов)
const SAMPLE={0:1,4:1,7:1,11:1};
const SLOT_OF=[3,0,1,2, 5,4,6, 10,7,8,9, 19,11,12,13,14,15,16,17,18];   // C: образец ставят вторым (средний), последний — наверх: колонку кладут снизу вверх   // короб k → слот стойки (образец — в слот у восточной грани)
const heavy=ti=>c01((CTYPE[ti].kg-6)/17.5);
function standFor(s,who){                         // где встать, чтобы положить короб в слот s: ближайшая доступная грань стойки
  const q=RSLOT[s], cx=RK_AT[0], cz=RK_AT[1], d=0.37, cl=v=>Math.max(-0.55,Math.min(0.55,v));
  let f;
  if(who==='CT') f='E';
  else f=(0.75+q.x<=0.56)?'W':(0.75+q.z<=0.7)?'S':'N';
  if(f==='W') return {f,x:cx-0.75-d,z:cz+cl(q.z),yaw:Math.PI/2};
  if(f==='E') return {f,x:cx+0.75+d,z:cz+cl(q.z),yaw:-Math.PI/2};
  if(f==='S') return {f,x:cx+cl(q.x),z:cz-0.75-d,yaw:0};
  return {f,x:cx+cl(q.x),z:cz+0.75+d,yaw:Math.PI}; }

let A0, LB, PICK, CTS, KB;                               // расписания коробов
let CN, FK, FKL, FKT, KZ, W3P, W4P, W5P;
let CAPS=[], CARDS=[];

