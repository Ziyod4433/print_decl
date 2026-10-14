/* ===================== аппараты DWS в зоне замера: общая для фильма и живого процесса анимация по времени =====================
   Замер одного короба — «задание» j с моментами: tPut (короб положили), tS0…tS1 (статический замер / скан), у Goodscan ещё
   tB0…tB1 (лента 0,5 м/с от весового стола до конца ленты), tO1 (короб доехал по выходному рольгангу до упора), grab2 (сняли).
   Всё считается из времени T и списка заданий — фильм остаётся функцией времени, живой процесс просто дописывает задания. */
const GSV=0.5, GSVO=0.45;                                    // скорость ленты и короба на гравитационном рольганге, м/с
const DWS_SHIFT0=37;                                         // замеров за смену до начала (счётчик на экранах)
/* задание Goodscan: b — короб {l,w,h,kg,si,cl}; tPut — положили на весовой стол; tS0…tS1 — 3D-камера; tB0 — пуск ленты */
function gsJobMake(b,tPut,tS0,tS1,tB0){ const X1=GS.L0+GS.L1, x0=0.42, tB1=tB0+0.15+(X1-x0)/GSV, xs=X1+0.03+GS.LO-0.045-b.l/2, tO1=tB1+(xs-X1)/GSVO;
  return {b,tPut,tS0,tS1,tB0,tB1,tO1,xs,m:null,n:0,grab2:Infinity}; }
/* где центр короба вдоль аппарата (локальная x): стол → лента с разгоном → рольганг → упор с лёгким отскоком */
function gsX(j,T){ const X1=GS.L0+GS.L1; if(T<j.tB0) return 0.42; if(T<j.tB1){ const tau=T-j.tB0; return Math.min(X1,0.42+GSV*(tau-0.15*(1-Math.exp(-tau/0.15)))); }
  if(T<j.tO1) return X1+GSVO*(T-j.tB1); const u=T-j.tO1; return j.xs-0.012*Math.exp(-u*7)*Math.sin(u*22); }
/* короб на Goodscan / на платформе портала (o — объект короба, pl — параметры оседания при укладке) */
function gsPlace(o,j,T,pl){ const X1=GS.L0+GS.L1, x=gsX(j,T), y=x<=X1?GS.TOP+0.004:GS.TOP-0.002-0.02*Math.min(1,(x-X1-0.03)/GS.LO); putSlot(o,F.gs,x,y,0,0,T-j.tPut,pl); }
function ptPlace(o,j,T,pl){ const P=DWSZ.PT; putSlot(o,F.dws,P[0],P[1],P[2],0,T-j.tPut,pl); }
/* замер с погрешностью аппарата: ±2 мм длина и ширина, ±1 мм высота, ±30 г */
function dwsMeas(b,rnd){ return {L:Math.round(b.l*1000+(rnd()-0.5)*4),W:Math.round(b.w*1000+(rnd()-0.5)*4),H:Math.round(b.h*1000+(rnd()-0.5)*2),kg:Math.max(0.1,b.kg+(rnd()-0.5)*0.06)}; }
const dwsCol=C=>'rgb('+C.paper.join(',')+')';
/* Goodscan: лента, ролики стола и рольганга, световой занавес (красные светодиоды — где короб перекрывает луч), вспышка фото,
   подсветка 3D-камеры, весы стола, экран оператора */
function gsVisAt(jobs,T){ const G2=F.gs&&F.gs.userData.gs; if(!G2) return;
  let belt=0, rin=0, rout=0, J=null, last=null;
  for(const j of jobs){ if(T>j.tB0){ const d=Math.max(0,Math.min(T,j.tB1)-j.tB0); belt+=GSV*d; rin+=GSV*Math.min(d,(GS.L0-0.42+j.b.l/2)/GSV); }
    if(T>j.tB1) rout+=GSVO*(Math.min(T,j.tO1)-j.tB1);
    if(T>=j.tPut&&T<j.grab2+0.2) J=j; if(T>=j.tS0) last=j; }
  G2.setBelt(-belt/0.25); G2.setRoll(rin/0.025,rout/0.024);
  let curt=0, fl=0, k=0, mode='idle';
  if(J){ const x=gsX(J,T), b=J.b; if(Math.abs(x-GS.ARCH)<b.l/2+0.01) curt=GS.TOP+b.h; fl=Math.exp(-Math.pow((x-GS.ARCH)/0.05,2));
    if(T>=J.tS0&&T<J.tS1){ k=(T-J.tS0)/(J.tS1-J.tS0); mode='scan'; } else if(T>=J.tS1&&T<J.tB0+1.5) mode='ok'; }
  G2.setCurtain(curt); G2.setFlash(fl); G2.setScan(mode==='scan'?Math.max(0.3,k):mode==='ok'?0.25:0,mode);
  G2.weight(J&&T>J.tPut+0.3&&T<J.tB0+0.5?J.m.kg:0);
  const cnt=DWS_SHIFT0+(last?last.n:0);
  if(!last){ G2.screen({state:'idle',count:cnt}); return; }
  const tOut=last.tB0+(GS.ARCH+last.b.l/2+0.05-0.42)/GSV, K=SKUS[last.b.si], C=CLIENTS[last.b.cl];
  if(T<tOut) G2.screen({state:'scan',k:Math.min(1,(T-last.tS0)/(tOut-last.tS0)),count:cnt-1});
  else G2.screen({state:'res',L:last.m.L,W:last.m.W,H:last.m.H,kg:last.m.kg,client:C.code+' '+C.en.split(' ')[0],sku:K.code,code:C.cons,col:dwsCol(C),count:cnt}); }
/* портальный DWS: лучи двух сканеров и линия по коробу во время скана, экран на шкафу */
function ptVisAt(jobs,T){ let J=null, last=null; for(const j of jobs){ if(T>=j.tPut&&T<j.grab2+0.2) J=j; if(T>=j.tS0) last=j; }
  const on=!!(J&&T>=J.tS0&&T<J.tS1), sp=on?(T-J.tS0)/(J.tS1-J.tS0):0;
  F.lm.opacity=on?0.24+0.08*Math.sin(T*55):0; F.lasers.forEach(l=>l.visible=on);
  if(F.scan){ F.scan.visible=on; const hh=J?J.b.h:0.4; F.scan.position.set(DWSZ.PT[0]+(sp<0.5?-0.35+sp*1.4:0.35-(sp-0.5)*1.4),DWSZ.PT[1]+hh+0.003,DWSZ.PT[2]); }
  if(!F.ptDraw) return; if(F.dwsScr&&F.dwsScr.material!==F.ptMat) F.dwsScr.material=F.ptMat;
  const cnt=DWS_SHIFT0+(last?last.n:0);
  if(!last) F.ptDraw({state:'idle',count:cnt});
  else if(T<last.tS1) F.ptDraw({state:'scan',k:Math.max(0,(T-last.tS0)/(last.tS1-last.tS0)),count:cnt-1});
  else { const K=SKUS[last.b.si], C=CLIENTS[last.b.cl]; F.ptDraw({state:'res',L:last.m.L,W:last.m.W,H:last.m.H,kg:last.m.kg,client:C.code+' '+C.en.split(' ')[0],sku:K.code,count:cnt}); } }

/* ===================== общие помощники фильма и живого процесса: дорожки людей, перенос короба, грани стоек, поддон образцов ===================== */
/* ---------- дорожки людей: отрезки с ценой (сторона погрузчика дороже); маршрут — кратчайший по графу (Дейкстра) ---------- */
function Nav(lanes){ const L=lanes.map(l=>{ const a=[l[0],l[1]], b=[l[2],l[3]], len=Math.hypot(b[0]-a[0],b[1]-a[1]); return {a,b,c:l[4]||1,len,u:[(b[0]-a[0])/len,(b[1]-a[1])/len]}; }), P=[];
  const add=p=>{ for(let k=0;k<P.length;k++) if(Math.hypot(P[k][0]-p[0],P[k][1]-p[1])<0.05) return k; P.push([p[0],p[1]]); return P.length-1; };
  const tOn=(l,p)=>(p[0]-l.a[0])*l.u[0]+(p[1]-l.a[1])*l.u[1], dOn=(l,p)=>Math.abs((p[0]-l.a[0])*l.u[1]-(p[1]-l.a[1])*l.u[0]);
  L.forEach(l=>{ add(l.a); add(l.b); });
  for(let i=0;i<L.length;i++) for(let j=i+1;j<L.length;j++){ const A=L[i], B=L[j], den=A.u[0]*B.u[1]-A.u[1]*B.u[0]; if(Math.abs(den)<1e-6) continue;
    const dx=B.a[0]-A.a[0], dz=B.a[1]-A.a[1], ta=(dx*B.u[1]-dz*B.u[0])/den, tb=(dx*A.u[1]-dz*A.u[0])/den;
    if(ta>-0.03&&ta<A.len+0.03&&tb>-0.03&&tb<B.len+0.03) add([A.a[0]+A.u[0]*ta,A.a[1]+A.u[1]*ta]); }
  L.forEach(l=>{ l.pts=P.map((p,k)=>({k,t:tOn(l,p)})).filter(o=>o.t>-0.03&&o.t<l.len+0.03&&dOn(l,P[o.k])<0.04).sort((a,b)=>a.t-b.t); });
  this.L=L; this.P=P; this.tOn=tOn; }
/* avoid — где стоят другие люди: отрезок пути ближе 0,55 м к ним сильно дороже (обходят, если есть другой путь) */
const segD=(v,p,q)=>{ const dx=q[0]-p[0], dz=q[1]-p[1], l2=dx*dx+dz*dz, u=l2>1e-9?Math.max(0,Math.min(1,((v[0]-p[0])*dx+(v[1]-p[1])*dz)/l2)):0; return Math.hypot(v[0]-p[0]-dx*u,v[1]-p[1]-dz*u); };
Nav.prototype.route=function(a,b,avoid){ const L=this.L, P=this.P, n=P.length;
  const att=p=>{ let best=null; L.forEach((l,i)=>{ const t=Math.max(0,Math.min(l.len,this.tOn(l,p))), q=[l.a[0]+l.u[0]*t,l.a[1]+l.u[1]*t], d=Math.hypot(p[0]-q[0],p[1]-q[1])+(l.c>1?0.05:0); if(!best||d<best.d) best={i,t,q,d}; }); return best; };
  const A=att(a), B=att(b), adj=Array.from({length:n+2},()=>[]), pos0=i=>i<n?P[i]:i===n?A.q:B.q;
  const edge=(i,j,w)=>{ if(avoid) for(const v of avoid) if(segD(v,pos0(i),pos0(j))<0.55) w+=30; adj[i].push([j,w]); adj[j].push([i,w]); };
  L.forEach(l=>{ for(let k=1;k<l.pts.length;k++) edge(l.pts[k-1].k,l.pts[k].k,(l.pts[k].t-l.pts[k-1].t)*l.c); });
  const link=(X,id)=>{ const l=L[X.i]; let pv=null,nx=null; for(const o of l.pts){ if(o.t<=X.t+1e-6) pv=o; if(o.t>=X.t-1e-6&&!nx) nx=o; } if(pv) edge(id,pv.k,(X.t-pv.t)*l.c); if(nx) edge(id,nx.k,(nx.t-X.t)*l.c); };
  link(A,n); link(B,n+1); if(A.i===B.i) edge(n,n+1,Math.abs(A.t-B.t)*L[A.i].c);
  const dist=new Float64Array(n+2).fill(Infinity), prv=new Int32Array(n+2).fill(-1), done=new Uint8Array(n+2); dist[n]=0;
  for(;;){ let u=-1; for(let i=0;i<n+2;i++) if(!done[i]&&dist[i]<Infinity&&(u<0||dist[i]<dist[u])) u=i; if(u<0) break; done[u]=1; if(u===n+1) break;
    for(const [v,w] of adj[u]) if(dist[u]+w<dist[v]-1e-9){ dist[v]=dist[u]+w; prv[v]=u; } }
  const pos=i=>i<n?P[i]:i===n?A.q:B.q, chain=[];
  if(dist[n+1]<Infinity){ for(let i=n+1;;i=prv[i]){ chain.push(pos(i)); if(i===n||prv[i]<0) break; } chain.reverse(); }
  const out=[]; [a,...chain,b].forEach(p=>{ const q=out[out.length-1]; if(!q||Math.hypot(q[0]-p[0],q[1]-p[1])>0.03) out.push([p[0],p[1]]); });
  if(out.length<2) out.push([b[0],b[1]]);
  return out; };

const PI=Math.PI;
const pickPose=y=>y<0.45?{reach:1,bend:0.5,squat:0.35}:y<0.95?{reach:1,bend:0.28}:{reach:1,bend:0.08};
/* дописать в трек перенос: путь к месту взятия, взять (не раньше grabAt), путь к месту укладки, положить (не раньше relAt) */
function carrySeg(tr,t,b,o){ const hv=b.hv, cw=b.w, cp={carry:1,cw,heavy:hv};
  if(o.toPick&&o.toPick.length>1) t=route(tr,t+0.15,o.toPick,1.35,{});
  const pk=o.pick; t+=0.25; tr.key(t,pk[0],pk[1],pk[2],{}); const parr=t;
  let grab=t+0.42; if(o.grabAt&&o.grabAt>grab){ grab=o.grabAt; tr.key(grab-0.42,pk[0],pk[1],pk[2],{}); }
  tr.key(grab-0.05,pk[0],pk[1],pk[2],o.pickPose||pickPose(o.pickY)); tr.key(grab+0.35,pk[0],pk[1],pk[2],Object.assign({bend:0.1},cp)); t=grab+0.35;
  if(o.toPlace&&o.toPlace.length>1) t=route(tr,t,o.toPlace,1.3-0.3*hv,cp);
  const st=o.place; t+=0.22; tr.key(t,st[0],st[1],st[2],cp); const arr=t;
  let rel=t+0.5; if(o.relAt&&o.relAt>rel){ rel=o.relAt; tr.key(rel-0.5,st[0],st[1],st[2],cp); }
  tr.key(rel-0.08,st[0],st[1],st[2],Object.assign({cw,heavy:hv*0.5},placePose(o.placeY))); tr.key(rel+0.4,st[0],st[1],st[2],{bend:0.05});
  return {t:rel+0.4,grab,rel,parr,arr}; }
function walkSeg(tr,t,pts,yaw,v){ if(pts.length>1) t=route(tr,t,pts,v||1.4,{}); const e=pts[pts.length-1]; t+=0.25; tr.key(t,e[0],e[1],yaw,{}); return t; }

/* где встать, чтобы положить/взять короб в точке (lx, lz) стойки: ближайшая грань из разрешённых (по умолчанию — не со стороны петель,
   откуда заезжает погрузчик); стойка может стоять развёрнутой на 180° */
function faceCands(cx,cz,ryaw,lx,lz,faces){ const m=Math.abs(ryaw)>1?-1:1, d=0.37, cl=v=>Math.max(-0.55,Math.min(0.55,v)), out=[];
  for(const f of faces||['W','E','S']){ const reach=f==='W'?lx+0.75:f==='E'?0.75-lx:f==='S'?lz+0.75:0.75-lz;
    let ox,oz,yaw; if(f==='W'){ ox=-0.75-d; oz=cl(lz); yaw=PI/2; } else if(f==='E'){ ox=0.75+d; oz=cl(lz); yaw=-PI/2; } else if(f==='S'){ ox=cl(lx); oz=-0.75-d; yaw=0; } else { ox=cl(lx); oz=0.75+d; yaw=PI; }
    out.push({f,reach,x:cx+m*ox,z:cz+m*oz,yaw:wrapA(yaw+(m<0?PI:0))}); }
  out.sort((a,b)=>a.reach-b.reach); return out.filter((o,i)=>i===0||o.reach<=0.88); }        // дальше 0,88 м с грани не дотянуться

const packPos=(P,c)=>({x:P.x0+(c.i+c.fx/2)*P.c,z:P.z0+(c.j+c.fz/2)*P.c,y:P.y0+c.base+(c.base>0?0.004:0)});
/* место на поддоне образцов: самое низкое, где короб опирается не меньше чем на 60 %; не нашлось — выше (верх поддона 1,6 м) */
function packFind(P,b){ return P.find(b.l,b.w,b.h,1.18)||P.find(b.l,b.w,b.h,1.32)||P.find(b.l,b.w,b.h,1.38); }

/* дорожки людей у приёмки Л2 [x0,z0,x1,z1,цена]: южнее стоек — основная, севернее (откуда заезжает погрузчик) — дороже;
   поперечные — у торцов и в проходах между стойками; путь в зону DWS — по линии z 9,25 перед комнатой смены */
const NAV_L2=[[4.63,10.83,11.87,10.83,1],[4.63,13.07,11.87,13.07,3],[4.55,10.3,7.0,10.3,1],[4.63,10.83,4.63,13.07,1],[7.0,10.83,7.0,13.07,1],[9.5,10.83,9.5,13.07,1],[11.87,10.83,11.87,13.07,1],
  [7.0,10.83,7.0,9.25,1],[7.0,9.25,21.9,9.25,1],[21.9,9.25,30.4,9.0,1],[30.4,9.0,33.6,9.0,1],[33.6,9.0,33.6,6.9,1]];          // у колонны x 32 — восточнее пожарного шкафа
