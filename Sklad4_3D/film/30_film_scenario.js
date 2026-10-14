/* короб в руках: между кистями, по курсу корпуса (в мировых координатах — человек может стоять в кузове) */
const _a=V(0,0,0),_b=V(0,0,0),_a2=V(0,0,0),_v=V(0,0,0),_v2=V(0,0,0),_p0=V(0,0,0), Yv=V(0,1,0), Xv=V(1,0,0), Zv=V(0,0,1);
const _q=new THREE.Quaternion(), _q2=new THREE.Quaternion(), _q3=new THREE.Quaternion(), _q0=new THREE.Quaternion(), _eu=new THREE.Euler(0,0,0,'YXZ');
function inHands(H,box,ys){ const rb=H.rb; H.root.updateMatrixWorld(true);
  if(rb&&rb.LeftHand&&rb.RightHand){ rb.LeftHand.getWorldPosition(_a); rb.RightHand.getWorldPosition(_b); _a.add(_b).multiplyScalar(0.5); }
  else H.root.localToWorld(_a.set(0,0.98,0.42));
  const c=box.userData.carton, hh=c?c.hh:0.4;
  /* сбит с ног (удар в обходе): короб выпадает из рук, падает на пол с ударом ребром и покачиванием, лежит, пока человек не встал */
  const K=H.knock; if(K&&K.e!==undefined){ if(!K.bx) K.bx={x:_a.x,y:_a.y,z:_a.z,t:K.u,th:(0.2+0.3*Math.abs(Math.sin(H.seed)))*(H.seed>5?-1:1),yaw:(H.seed%1)*0.8,hh};
    const B=K.bx, dt=Math.max(0,K.u-B.t), fy=K.fy+hh*0.5+0.004, drop=Math.max(0,B.y-fy);
    const st=settle(dt,{h:drop,th:B.th,half:(c?Math.max(c.l,c.w):0.4)*0.5});
    box.position.set(B.x+K.wx*0.25*Math.min(1,dt*3),fy+st.dy,B.z+K.wz*0.25*Math.min(1,dt*3)); box.rotation.set(0,B.yaw,0); box.rotateOnAxis(Xv,st.th); return; }
  _eu.setFromQuaternion(H.root.getWorldQuaternion(_q),'YXZ');
  const yn=_eu.y+(c&&c.l>0.62?Math.PI/2:0);                // естественный хват; если известно, куда ставить, — короб уже в руках развёрнут
  let yy=(ys===undefined||ys===null)?yn:ys+Math.PI*Math.round((yn-ys)/Math.PI);     //   как в слоте (с точностью до 180°), без поворота в последний миг
  if(c&&rb&&rb.LeftHand&&rb.RightHand){ const span=rb.LeftHand.getWorldPosition(_v2).distanceTo(rb.RightHand.getWorldPosition(_a2)), across=Math.abs(Math.cos(yy-_eu.y))>0.7?c.l:c.w;
    if(across>span+0.05) yy=yn; }                            // между ладонями короб не помещается этой стороной — несут как удобно, довернут при укладке
  box.position.set(_a.x,_a.y-hh*0.55,_a.z); box.rotation.set(0,yy,0); }
function holdYaw(b,dst){ if(!dst) return null; _v2.copy(b.position); _q2.copy(b.quaternion); dst(0); _eu.setFromQuaternion(b.quaternion,'YXZ'); const y=_eu.y;
  b.position.copy(_v2); b.quaternion.copy(_q2); return y; }
/* короб в слоте родителя (стойка, кузов): позиция слота + оседание после отпускания (dt — время с момента отпускания) */
function putSlot(b,par,x,y,z,yaw,dt,S){
  let th=0; if(dt<1.3&&S){ const s=settle(Math.max(0,dt),S); y+=s.dy; th=s.th; }
  b.position.copy(par.localToWorld(_v.set(x,y,z)));
  par.getWorldQuaternion(_q); _q.multiply(_q2.setFromAxisAngle(Yv,yaw)); if(th) _q.multiply(_q2.setFromAxisAngle(S.ax?Xv:Zv,th));
  b.quaternion.copy(_q); }
/* переход «руки → точка отпускания» в последние 0,22 с и «исходное место → руки» в первые 0,2 с */
/* короб в слот опускается сверху и из слота выходит вверх (дуга через точку над слотом) — не проходит сквозь соседей */
const _c=V(0,0,0), _e=V(0,0,0);
function arcLerp(out,a,b,u,toSlot,h){ const sy=toSlot?b.y:a.y, top=Math.max(Math.max(a.y,b.y)+0.06,sy+(h||0)+0.05);   // над соседями своего яруса
  const k=1-u, w0=k*k*k, w1=3*u*k*k, w2=3*u*u*k, w3=u*u*u;                          // кубическая дуга: вверх — поверх — вниз
  return out.set(w0*a.x+w1*a.x+w2*b.x+w3*b.x, w0*a.y+(w1+w2)*top+w3*b.y, w0*a.z+w1*a.z+w2*b.z+w3*b.z); }function handTo(b,who,T,rel,put){ inHands(who,b,holdYaw(b,put)); const u=(T-(rel-0.22))/0.22; if(u<=0) return;
  _p0.copy(b.position); _q0.copy(b.quaternion); put(0); _e.copy(b.position); arcLerp(b.position,_p0,_e,ez(u),true,b.userData.carton&&b.userData.carton.hh); b.quaternion.copy(_q0.slerp(b.quaternion,ez(u))); }
function handFrom(b,who,T,grab,src,dst){ const u=(T-grab)/0.2; if(u>=1) return false; const ys=holdYaw(b,dst);
  src(); _p0.copy(b.position); _q0.copy(b.quaternion); inHands(who,b,ys); _e.copy(b.position); arcLerp(b.position,_p0,_e,ez(u),false,b.userData.carton&&b.userData.carton.hh); b.quaternion.copy(_q0.slerp(b.quaternion,ez(u))); return true; }
const placePose=y=>y<0.35?{reach:0.9,bend:0.55,squat:0.45,carry:0.25}:y<0.8?{reach:0.95,bend:0.42,squat:0.08,carry:0.25}:{reach:1,bend:0.12,carry:0.3};
const hyp=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
function route(tr,t,pts,v,pose){                         // идёт по точкам от уже поставленного ключа; возвращает время прихода
  for(let i=1;i<pts.length;i++){ const p=pts[i-1],q=pts[i]; t+=Math.max(0.3,hyp(p,q)/v);
    tr.key(t,q[0],q[1],q[2]!==undefined?q[2]:Math.atan2(q[0]-p[0],q[1]-p[1]),pose); } return t; }

/* ===================== казахский кузов: дорожки по типам, разбор стойки двумя рабочими ===================== */
function laneSlot(r,side,ti,h){ const L=KZLANE[ti], n=F.kCnt[r][side][ti]++, st=Math.floor(n/L.n), lv=n%L.n, hy=F.kHy[r][side][ti], y=lv?(hy[st]||0):0; hy[st]=y+h+0.004;   // высота стопки — по фактическим коробам
  const xc=side==='S'?XS0+L.d*(st+0.5):XN0-L.d*(st+0.5), xf=side==='S'?XS0+L.d*(st+1):XN0-L.d*(st+1);
  return {lp:V(xc,BEDY+y,L.z),stand:[side==='S'?xf+0.42:xf-0.42,L.z],yaw:side==='S'?-Math.PI/2:Math.PI/2,y}; }
function unloadPlan(r,t0){                                // кузов r (0 — грузовик, 1 — прицеп): двое берут из стойки по одному коробу
  const PI=Math.PI, wn=CREW[r][0], ws=CREW[r][1], seq={}, sideOf={}, idx={}, free={}, idle=F.kIdle, g={}, tr=F.trK, cur=F.kPos;
  seq[wn]=[16,19,6,5,4,8,10,1,3]; seq[ws]=[14,15,17,18,13,12,11,7,9,0,2]; sideOf[wn]='N'; sideOf[ws]='S'; idx[wn]=idx[ws]=0; free[wn]=t0+0.6; free[ws]=t0;
  const DEP={7:[14,15],8:[15,16],9:[17,18],10:[18,19],0:[7],1:[8],2:[9],3:[10],5:[6],4:[5],12:[13],11:[12]};   // что должно быть снято раньше (лежит сверху)
  for(const w of CREW[r]) tr[w].key(free[w],cur[w][0],cur[w][1],idle[w],{});
  KB[r]=[]; let guard=0, tEnd=t0;
  while((idx[wn]<seq[wn].length||idx[ws]<seq[ws].length)&&guard++<60){
    const cand=CREW[r].filter(w=>idx[w]<seq[w].length).sort((p,q)=>free[p]-free[q]);
    let w=null; for(const c of cand){ const s=seq[c][idx[c]]; if((DEP[s]||[]).every(d=>g[d]!==undefined)){ w=c; break; } }
    if(!w) break;
    const s=seq[w][idx[w]++], q=RSLOT[s], ti=q.ti, T=SKUS[F.k14[s]], hv=heavyKg(T.kg), cw=T.w, qy=F.ys14[s], side=sideOf[w], trk=tr[w];
    const ps=[RB.x+(side==='S'?-1:1)*(0.75+0.38),Math.max(-0.05,Math.min(0.95,RB.z+q.z))], pyaw=side==='S'?PI/2:-PI/2;
    let t=free[w]+Math.max(0.4,hyp(cur[w],ps)/1.35); trk.key(t,ps[0],ps[1],pyaw,{});
    let tw=t; (DEP[s]||[]).forEach(d=>{ tw=Math.max(tw,g[d]+0.7); }); if(tw>t+0.05){ trk.key(tw,ps[0],ps[1],pyaw,{}); t=tw; }
    trk.key(t+0.42,ps[0],ps[1],pyaw,qy<0.6?{reach:1,bend:0.5,squat:0.3}:qy<1.0?{reach:1,bend:0.28}:{reach:1,bend:0.08});
    const grab=t+0.48; g[s]=grab;
    trk.key(t+0.86,ps[0],ps[1],pyaw,{carry:1,cw,heavy:hv});
    const L=laneSlot(r,side,ti,T.h), t1=t+0.86+Math.max(0.6,hyp(ps,L.stand)/(1.2-0.25*hv));
    trk.key(t1,L.stand[0],L.stand[1],L.yaw,{carry:1,cw,heavy:hv});
    trk.key(t1+0.42,L.stand[0],L.stand[1],L.yaw,Object.assign({cw,heavy:hv*0.5},placePose(L.y)));
    const rel=t1+0.5; trk.key(t1+0.9,L.stand[0],L.stand[1],L.yaw,{bend:0.05});
    KB[r][s]={by:w,grab,rel,lp:L.lp,ti};
    F.KZE[r].push([rel,0,4.2e-5*T.kg*(L.lp.z-(RB.z+q.z))]);
    free[w]=t1+0.92; cur[w]=L.stand; tEnd=Math.max(tEnd,rel+0.5);
  }
  [[wn,[1.9,-0.4]],[ws,[-1.9,-0.3]]].forEach(([w,p])=>{ const t=free[w]+Math.max(0.4,hyp(cur[w],p)/1.35); tr[w].key(t,p[0],p[1],idle[w],{}); cur[w]=p; F.kFree[w]=t; });
  return {tEnd};
}

/* ===================== замер образцов в фильме =====================
   Тот же порядок, что в живом процессе: с поддона образцов снимают сверху, мелкие и крупные по очереди; места на поддоне
   замеренных считаются сразу для всех. Упаковщик работает с южной стороны поддонов (весовой стол и выход Goodscan), контролёр —
   с северной (портал); каждый ждёт, если короб под ним ещё не сняли или то, на что класть, ещё не положили. */
function zoneFilm(PK,CT,MK){ const Z=DWSZ, s1=Z.spots[0], s2=Z.spots[1], items=Object.values(F.spIt), PI=Math.PI;
  const ov=(o,it)=>o.base>=it.top-0.012&&o.i<it.i+it.fx&&it.i<o.i+o.fx&&o.j<it.j+it.fz&&it.j<o.j+o.fz, small=it=>SKUS[FSKU[it.k]].ti<2;
  const on=new Set(items), ord=[], top=f=>f.slice().sort((a,b)=>b.top-a.top)[0]; let n=0;
  while(on.size){ const L=[...on], free=L.filter(it=>!L.some(o=>o!==it&&ov(o,it))), p=top(free.filter(i=>small(i)===(n%2===0)))||top(free); n++; on.delete(p); ord.push(p); }
  const MPK=new Pack(); ord.forEach(it=>{ it.mp=MPK.put(packFind(MPK,SKUS[FSKU[it.k]])); });
  let q=20261015; const rnd=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; };
  const P={PW:{tr:PK,t:Math.max(MK.pwArr,MK.spSet+0.8),pos:[Z.wPW[0],Z.wPW[1]],w:Z.wPW,faces:Z.FPW},CT:{tr:CT,t:Math.max(MK.ctArr,MK.spSet+0.8),pos:[Z.wCT[0],Z.wCT[1]],w:Z.wCT,faces:Z.FCT}};
  F.gsJobs=[]; F.ptJobs=[]; F.zj={}; let gsU=0, ptU=0, cnt=0;
  const mon=Math.atan2(Z.gs[0]-0.16-Z.TS[0],Z.gs[1]-0.16-Z.TS[1]), btn=Math.atan2(Z.gs[0]+GS.L0+0.2-Z.TS[0],Z.gs[1]+GS.BW/2+0.13-Z.TS[1]), arch=Math.atan2(Z.gs[0]+GS.ARCH-Z.OS[0],Z.gs[1]-Z.OS[1]);
  const cab=[Z.big[0]-1.22,Z.big[1]-0.62], px=Z.PS[0], pz=Z.PS[1]+0.15, scr=Math.atan2(cab[0]-px,cab[1]-pz);
  ord.forEach((it,idx)=>{ const k=it.k, K=SKUS[FSKU[k]], sm=small(it), W=sm?P.PW:P.CT, tr=W.tr, b={l:K.l,w:K.w,h:K.h,kg:K.kg,si:FSKU[k],cl:K.cl,hv:heavyKg(K.kg)};
    const st1=faceCands(s1[0],s1[1],0,it.x,it.z,W.faces)[0], st2=faceCands(s2[0],s2[1],0,it.mp.x,it.mp.z,W.faces)[0];
    const grabAt=Math.max(0,...ord.slice(0,idx).filter(o=>ov(o,it)).map(o=>F.zj[o.k].g1+0.7));
    const relAt2=Math.max(0,...it.mp.under.map(id=>F.zj[ord[id].k].rel2+0.45));
    tr.key(W.t,W.pos[0],W.pos[1],W.w[2],{});
    let j, c1, c2, tE;
    if(sm){ c1=carrySeg(tr,W.t+0.05,b,{toPick:F.nav.route(W.pos,[st1.x,st1.z]),pick:[st1.x,st1.z,st1.yaw],pickY:it.y,grabAt,toPlace:F.nav.route([st1.x,st1.z],[Z.TS[0],Z.TS[1]]),place:Z.TS,placeY:GS.TOP,relAt:gsU});
      const tPut=c1.rel, tS0=tPut+0.55, tS1=tS0+1.6, tB0=tS1+0.55;
      tr.key(tS0,Z.TS[0],Z.TS[1],mon,{look:0.15}); tr.key(tS1,Z.TS[0],Z.TS[1],mon,{look:0.1}); tr.key(tS1+0.3,Z.TS[0],Z.TS[1],btn,{reach:0.6,push:0.5}); tr.key(tB0,Z.TS[0],Z.TS[1],btn,{});
      j=gsJobMake(b,tPut,tS0,tS1,tB0);
      const t=walkSeg(tr,tB0+0.15,F.nav.route([Z.TS[0],Z.TS[1]],[Z.OS[0],Z.OS[1]]),arch,1.2);
      c2=carrySeg(tr,t,b,{pick:Z.OS,pickY:GS.TOP-0.02,grabAt:j.tO1+0.35,toPlace:F.nav.route([Z.OS[0],Z.OS[1]],[st2.x,st2.z]),place:[st2.x,st2.z,st2.yaw],placeY:it.mp.y,relAt:relAt2});
      gsU=c2.grab+0.3; F.gsJobs.push(j); }
    else { c1=carrySeg(tr,W.t+0.05,b,{toPick:F.nav.route(W.pos,[st1.x,st1.z]),pick:[st1.x,st1.z,st1.yaw],pickY:it.y,grabAt,toPlace:F.nav.route([st1.x,st1.z],[Z.PS[0],Z.PS[1]]),place:Z.PS,placeY:Z.PT[1],relAt:ptU});
      const tPut=c1.rel; tr.key(tPut+0.75,px,pz,Z.PS[2],{scan:1,scanner:true}); tr.key(tPut+1.5,px,pz,Z.PS[2],{scan:1,scanner:true});
      const tS0=tPut+1.6, tS1=tS0+2.2; tr.key(tS0+0.35,px,pz,scr,{look:0.2}); tr.key(tS1+0.4,px,pz,scr,{look:0.1});
      j={b,tPut,tS0,tS1,m:null,n:0,grab2:Infinity};
      c2=carrySeg(tr,tS1+0.4,b,{pick:Z.PS,pickY:Z.PT[1],grabAt:tS1+0.9,toPlace:F.nav.route([Z.PS[0],Z.PS[1]],[st2.x,st2.z]),place:[st2.x,st2.z,st2.yaw],placeY:it.mp.y,relAt:relAt2});
      ptU=c2.grab+0.3; F.ptJobs.push(j); }
    tE=walkSeg(tr,c2.t,F.nav.route([st2.x,st2.z],[W.w[0],W.w[1]]),W.w[2]);
    j.grab2=c2.grab; j.m=dwsMeas(b,rnd); j.n=++cnt;
    F.zj[k]={dev:sm?'gs':'pt',j,g1:c1.grab,r1:c1.rel,g2:c2.grab,rel2:c2.rel,mp:it.mp}; W.t=tE; W.pos=[W.w[0],W.w[1]]; });
  /* бирка дня на поддон замеренных — контролёр, со стороны петель */
  const C=P.CT, last=Math.max(...Object.values(F.zj).map(z=>z.rel2))+0.6, L=[s2[0]-0.5,s2[1]+1.12,PI];
  let t=Math.max(C.t,last); CT.key(t,C.pos[0],C.pos[1],C.w[2],{}); t=walkSeg(CT,t+0.2,F.nav.route(C.pos,[L[0],L[1]]),L[2]);
  CT.key(t+0.45,L[0],L[1],L[2],{reach:0.85,bend:0.1}); MK.mpTag=t+0.45; CT.key(t+0.95,L[0],L[1],L[2],{scan:1,scanner:true}); CT.key(t+1.45,L[0],L[1],L[2],{scan:1,scanner:true});
  t=walkSeg(CT,t+1.65,F.nav.route([L[0],L[1]],[C.w[0],C.w[1]]),C.w[2]); MK.ctIdle=t;
  MK.m0=Math.min(...Object.values(F.zj).map(z=>z.g1)); MK.mEnd=last; F.zord=ord;
  PK.key(900,P.PW.pos[0],P.PW.pos[1],P.PW.w[2],{}); CT.key(900,C.w[0],C.w[1],C.w[2],{}); PK.fin(); CT.fin(); F.trPK=PK; F.trCT=CT;
}

/* ===================== расписание ===================== */
function plan(){
  const MK=F.MK={}, PI=Math.PI; teleSet(TELE_EXT);                 // расписание ленты — по выдвинутому конвейеру
  LB=(F.bTip-F.bBase)/BELTV; A0=E0+LB+SLIP;
  const a=k=>E0+OFF[k]+LB+SLIP;
  /* накопление на ленте: короб едет со скоростью ленты (с проскальзыванием при разгоне), упирается в упор или в предыдущий
     короб, если того ещё не сняли, и трогается снова, когда место освободилось. Считается по шагам 1/120 с. */
  const LW=F.bTip-F.bBase-0.34, kS=(F.bTip-F.bBase)/LW, Lb=F.bTip-F.bBase, sdt=1/120; F.bsim=[];
  const simBelt=(k,gPrev)=>{ const e=E0+OFF[k], P=F.bsim[k-1], D=k>0?((SKUS[FSKU[k-1]].l+SKUS[FSKU[k]].l)/2+0.04)*kS:0;
    const s=[], stops=[]; let x=0, v=0, t=e, arr=null;
    for(let i=0;i<120*60;i++){ let lim=Lb; if(P&&t<gPrev) lim=Math.min(lim,bsAt(P,t)-D);
      const vf=v+(BELTV-v)*(1-Math.exp(-sdt/SLIP)); let xn=x+(v+vf)/2*sdt;
      if(xn>=lim){ if(x<lim-1e-4&&vf>0.2) stops.push(t); xn=Math.max(x,lim); v=0; } else v=vf;
      x=xn; s.push(x); t+=sdt; if(arr===null&&x>=Lb-1e-4) arr=t; if(arr!==null&&t>arr+0.5) break; }
    F.bsim[k]={t0:e,dt:sdt,s:Float32Array.from(s),arr,stops}; return arr; };
  const beltEnd=F.boom.localToWorld(V(F.bBase+0.28,F.yBase,0));
  const faceTo=(x,z,tx,tz)=>Math.atan2(tx-x,tz-z);
  /* --- машина из Китая: с ходу к Л2 и торможение --- */
  const cn0=F.cn0; CN=mkPath([{t0:4.6,t1:11.6,pts:[[cn0.x,-48],[cn0.x,cn0.z-14],[cn0.x,cn0.z]],ease:'brake',u0:0.5}]);
  /* --- грузчик в кузове (локально в кузове): цикл «взял со штабеля → на ленту» --- */
  const WT=new Track(), wx=-0.32, wz=0.62; WT.key(0,wx,wz,0,{});
  SEQ.forEach((ti,k)=>{ const e=E0+OFF[k], side=k%2?1:-1, low=[0.15,0.55,0.35,0.7,0.25,0.5][k%6], cw=SKUS[FSKU[k]].w, hv=hvK(k);
    WT.key(e-2.3,wx,wz,0,{}); WT.key(e-1.95,wx+0.08*side,wz-0.05,PI-0.35*side,{twist:0.25*side});
    WT.key(e-1.55,wx+0.1*side,wz-0.08,PI-0.35*side,{reach:1,bend:0.25+low*0.6,squat:low*0.35});
    WT.key(e-1.3,wx+0.1*side,wz-0.08,PI-0.35*side,{reach:0.6,carry:0.5,bend:0.2+low*0.5,squat:low*0.3,cw,heavy:hv});
    WT.key(e-0.95,wx+0.05*side,wz-0.02,PI*0.5*side,{carry:1,cw,heavy:hv,twist:-0.2*side});
    WT.key(e-0.5,wx,wz+0.06,0,{carry:1,cw,heavy:hv});
    WT.key(e-0.12,wx,wz+0.1,0,{reach:0.9,carry:0.3,bend:0.3,cw});
    WT.key(e+0.25,wx,wz+0.05,0,{bend:0.05}); });
  WT.fin(); F.trWT=WT;
  /* --- упаковщик (с ленты — в стойку клиента) и контролёр (образец каждого SKU — в поддон образцов рядом) --- */
  const PK=new Track(), CT=new Track(), pk0=F.pw0, ct0=F.ct0;
  const pyP=faceTo(PK_PICK[0],PK_PICK[1],beltEnd.x,beltEnd.z), pyC=faceTo(CT_WAIT[0],CT_WAIT[1],beltEnd.x,beltEnd.z);
  PK.key(0,pk0.x,pk0.z,F.pwYaw,{}); PK.key(E0-2.6,pk0.x,pk0.z,F.pwYaw,{}); PK.key(E0-0.2,PK_PICK[0],PK_PICK[1],pyP,{});
  CT.key(0,ct0.x,ct0.z,F.ctYaw,{}); CT.key(E0-2.2,ct0.x,ct0.z,F.ctYaw,{}); CT.key(E0+1.6,CT_WAIT[0],CT_WAIT[1],pyC,{});
  F.nav=new Nav(NAV_L2.concat(DWSZ.nav)); const SPK=new Pack(); F.spIt={};
  PICK=[]; CTS=[]; let pkFree=E0-0.2, ctFree=E0+1.6;
  SEQ.forEach((ti,k)=>{ const ak=simBelt(k,k>0?PICK[k-1].grab+0.1:-1), K=SKUS[FSKU[k]], cw=K.w, hv=hvK(k), carry={carry:1,cw,heavy:hv};
    if(!SAMPLE[k]){                                      // упаковщик: с ленты — в стойку
      const s=SLOT_OF[k], st=standFor(s,'PK'), p=Math.max(ak+0.15,pkFree+0.55);
      PK.key(Math.max(p-0.5,pkFree+0.05),PK_PICK[0],PK_PICK[1],pyP,{});
      PK.key(p-0.06,PK_PICK[0],PK_PICK[1]+0.03,pyP,{reach:1,bend:0.3});
      PK.key(p+0.32,PK_PICK[0],PK_PICK[1],pyP-0.3,Object.assign({bend:0.08},carry));
      const via=st.f==='S'?[[4.8,10.86]]:st.f==='N'?[[4.6,13.07]]:[];
      let t=route(PK,p+0.32,[PK_PICK,...via,[st.x,st.z,st.yaw]],1.3-0.3*hv,carry);
      PK.key(t+0.42,st.x,st.z,st.yaw,Object.assign({cw,heavy:hv*0.5},placePose(FYS[s])));
      const rel=t+0.5; PK.key(t+0.9,st.x,st.z,st.yaw,{bend:0.05});
      t=route(PK,t+0.9,[[st.x,st.z],...via.slice().reverse(),[PK_PICK[0],PK_PICK[1],pyP]],1.45,{});
      PICK[k]={by:'PK',grab:p,rel,slot:s,ti}; pkFree=t;
    } else {                                              // контролёр: образец — в поддон образцов («как ляжет», Pack)
      const it=SPK.put(packFind(SPK,K)); it.k=k; F.spIt[k]=it;
      const st=faceCands(SP_AT[0],SP_AT[1],0,it.x,it.z)[0], c=Math.max(ak+0.3,ctFree+0.55);
      CT.key(Math.max(c-0.45,ctFree+0.05),CT_WAIT[0],CT_WAIT[1],pyC,{});
      CT.key(c-0.05,CT_WAIT[0]-0.04,CT_WAIT[1]+0.04,pyC,{reach:1,bend:0.3});
      CT.key(c+0.32,CT_WAIT[0],CT_WAIT[1],pyC+0.5,Object.assign({bend:0.08},carry));
      let t=route(CT,c+0.32,F.nav.route(CT_WAIT,[st.x,st.z]),1.3-0.25*hv,carry); t+=0.22; CT.key(t,st.x,st.z,st.yaw,carry);
      CT.key(t+0.42,st.x,st.z,st.yaw,Object.assign({cw,heavy:hv*0.5},placePose(it.y))); const rel=t+0.5; CT.key(t+0.9,st.x,st.z,st.yaw,{bend:0.05});
      const back=walkSeg(CT,t+0.9,F.nav.route([st.x,st.z],CT_WAIT),pyC,1.45);
      PICK[k]={by:'CT',grab:c,rel,sp:it,ti}; CTS.push(PICK[k]); ctFree=back;
    } });
  /* бирка дня и этикетка адреса: контролёр вешает на стойку, когда она собрана */
  const lastRel=Math.max(...PICK.map(p=>p.rel));
  let tL=Math.max(ctFree,lastRel+0.4)+0.3; CT.key(tL,CT_WAIT[0],CT_WAIT[1],pyC,{});
  MK.lab0=tL;
  tL=route(CT,tL,[CT_WAIT,[6.8,10.75],[6.95,13.0],[5.25,13.07,PI]],1.4,{});
  CT.key(tL+0.7,5.25,13.07,PI,{reach:0.85,bend:0.1}); F.tLabel=tL+0.7;
  CT.key(tL+1.2,5.25,13.07,PI,{scan:1,scanner:true}); CT.key(tL+1.7,5.25,13.07,PI,{scan:1,scanner:true});
  /* выгрузка закончена: упаковщик и контролёр идут в зону DWS (по линии z 9,25 перед комнатой смены; автопоезда на посту ещё нет) */
  const Z=DWSZ;
  PK.key(pkFree+0.6,PK_PICK[0],PK_PICK[1],pyP,{}); const pwArr=walkSeg(PK,pkFree+0.9,F.nav.route(PK_PICK,[Z.wPW[0],Z.wPW[1]]),Z.wPW[2],1.35);
  const ctArr=walkSeg(CT,tL+1.9,[[5.25,13.07],[7.0,13.05],...F.nav.route([7.0,10.83],[Z.wCT[0],Z.wCT[1]])],Z.wCT[2],1.35);   // в проход между стойкой и поддоном образцов — не через карман, куда заезжает погрузчик
  MK.pwArr=pwArr; MK.ctArr=ctArr;

  /* --- погрузчик: пробеги из прямых и дуг; остановки — только у груза и на смене направления --- */
  const S=[], LK=[[0,0.06]], TK=[[0,0]]; let tc=0, lv=0.06, tv=0, lEnd=0, tEnd=0;
  const [rx,rz]=RK_AT, a6=cellC(5), a14=cellC(13), PT=RACK.PITCH, ZA=ZL+RHO, ZC=ZL+RC;
  const VE=1.9, VL=1.5, VP=1.3, VS=0.55, VR=1.0, aE=0.85, aL=0.65, aR=0.55, ACC=0.6, DEC=0.8;   // м/с: порожний, с грузом, в проезде, подъезд к грузу, задний ход; дуги — по угловой скорости
  let Ap=[19.0-AX,ZL], yw=-PI/2, run=null;                   // центр передней оси и курс (0 — север, +π/2 — восток)
  const pv=y=>[Math.cos(y),-Math.sin(y)];
  const close=at=>{ if(!run) return; const R=mkRun(run.pc,ACC,DEC); if(at!==undefined) tc=at-R.T;
    S.push({t0:tc,t1:tc+R.T,run:R,rev:run.rev}); run.mk.forEach(([n,q])=>{ MK[n]=tc+R.tAt(q); }); tc+=R.T; run=null; };
  const open=rev=>{ if(run&&run.rev!==rev) close(); if(!run) run={pc:[],rev,mk:[],L:0}; };
  const line=(d,v,rev)=>{ if(d<-1e-3) console.warn('погрузчик: отрицательный отрезок',d,Ap,yw); if(d<1e-3) return; open(!!rev);
    const k=rev?-1:1; run.pc.push({p:Ap.slice(),yaw:yw,len:d,v,dir:k}); Ap=[Ap[0]+Math.sin(yw)*d*k,Ap[1]+Math.cos(yw)*d*k]; run.L+=d; };
  const fwdX=(x,v)=>line((x-Ap[0])/Math.sin(yw),v), fwdZ=(z,v)=>line((z-Ap[1])/Math.cos(yw),v);
  const backX=(x,v)=>line(-(x-Ap[0])/Math.sin(yw),v||VR,true), backZ=(z,v)=>line(-(z-Ap[1])/Math.cos(yw),v||VR,true);
  const arc=(dy,w,rev,rho)=>{ open(!!rev); rho=rho||RHO; const y1=yw+dy, k=Math.sign(dy)*(rev?-1:1), p0=pv(yw), C=[Ap[0]+k*rho*p0[0],Ap[1]+k*rho*p0[1]], p1=pv(y1);   // w — угловая скорость, рад/с
    run.pc.push({c:C,k,rho,y0:yw,y1,len:Math.abs(dy)*rho,v:w*rho}); Ap=[C[0]-k*rho*p1[0],C[1]-k*rho*p1[1]]; yw=y1; run.L+=Math.abs(dy)*rho; };
  const mark=n=>{ if(run) run.mk.push([n,run.L]); else MK[n]=tc; };
  const Lf=(v,dur,adv,delay)=>{ close(); const ta=Math.max(tc+(delay||0),lEnd+0.02), r={ta,tb:ta+dur,v0:lv,v1:v}; LK.push([ta,lv],[ta+dur,v]); lv=v; lEnd=ta+dur; if(adv!==false) tc=ta+dur; return r; };
  const Tl=(v,dur)=>{ close(); const ta=Math.max(tc,tEnd+0.02); TK.push([ta,tv],[ta+dur,v]); tv=v; tEnd=ta+dur; };
  const hold=d=>{ close(); tc+=d; };
  const cross=(r,vc)=>{ let lo=0,hi=1; for(let i=0;i<32;i++){ const m=(lo+hi)/2, v=r.v0+(r.v1-r.v0)*sst(m); if((v<vc)===(r.v1>r.v0)) lo=m; else hi=m; } return r.ta+(r.tb-r.ta)*(lo+hi)/2; };
  const L90=-PI/2, R90=PI/2;                                 // влево по карте: С→З→Ю→В; вправо: С→В→Ю→З
  /* 1) к карману приёмки: по магистрали на запад, поворот на юг, вилы — в петли стойки */
  fwdX(rx+RHO,VE); arc(L90,aE); mark('in1a'); fwdZ(rz+FR-AX,VS);
  close(F.tLabel+5.2); MK.fk0=S[0].t0; MK.in1=tc; LK.push([MK.fk0+0.3,0.06],[MK.fk0+1.7,0.0]); lv=0.0; lEnd=MK.fk0+1.7;
  hold(0.3); Tl(-0.06,1.0); const l1=Lf(0.22,1.1); hold(0.3);
  const c1={ta:l1.ta,pe:l1.tb,tp:cross(l1,0.008)};
  backZ(ZL-RHO,0.9); arc(L90,aR,true); close(); MK.out1=tc;               // задним ходом, корма уходит на запад — курс на восток
  /* 2) к ячейке A6 (ЧТ): второй ярус на стойку того же дня */
  MK.tr1a=tc; fwdX(a6[0]+0.03-RC,VL); arc(L90,aL,false,RC); close(); MK.tr1b=tc;
  Tl(-0.025,1.5); Lf(1.75,3.4); hold(0.2); c1.tm=tc; MK.up1=tc;
  fwdZ(a6[1]-FR+AX,VS); close(); MK.at6=tc;
  hold(0.3); Tl(0,1.2); const l3=Lf(PT-0.012,1.6); hold(0.4);
  c1.rs=l3.ta; c1.tb=l3.tb; c1.tr=cross(l3,PT+0.008); MK.seat1=c1.tr;
  Lf(0.06,2.6,false,2.8); backZ(ZC,0.8); arc(R90,aR,true,RC); close(); MK.out6=tc;
  /* 3) выгрузка закончена — поддон образцов в зону DWS. От A6 выезд только на восток (ограждение проезда), поэтому разворот у
        пустой ячейки A8; к поддону у Л2, затем по южной магистрали и через пост П2 (автопоезда ещё нет) — на место 1 зоны */
  const s1=Z.spots[0], s2=Z.spots[1];
  fwdX(27.6,VE); arc(R90,aR,true); arc(R90,aR); close(); MK.ut1=tc;                       // разворот: дуга назад + дуга вперёд, курс на запад (вилы проходят восточнее рохли у поста, x 24)
  fwdX(SP_AT[0]+RHO,VE); arc(L90,aE); close(); MK.spA=tc; fwdZ(SP_AT[1]+FR-AX,VS); close(); MK.spIn=tc;
  hold(0.3); Tl(-0.06,1.0); const lsp=Lf(0.22,1.1); hold(0.3); const csp={ta:lsp.ta,pe:lsp.tb,tp:cross(lsp,0.008)};
  backZ(ZL-RHO,0.9); arc(L90,aR,true); close(); MK.spOut=tc;                                  // корма на запад — курс на восток
  Tl(-0.025,1.5); fwdX(s1[0]-RHO,VL); arc(R90,aL); close(); MK.spZ=tc;
  fwdZ(s1[1]+FR-AX+2.2,VL); fwdZ(s1[1]+FR-AX,VS); close(); MK.spAt=tc;                     // долгий заезд: быстро, последние 2 м — медленно
  csp.tm=tc; hold(0.3); Tl(0,0.9); const lsp2=Lf(0.0,1.0); csp.rs=lsp2.ta; csp.tb=lsp2.tb; csp.tr=cross(lsp2,0.008); hold(0.4); MK.spSet=csp.tr;
  Lf(0.06,1.4,false,1.6); backZ(ZL-RHO,1.0); arc(L90,aR,true); close(); MK.spBack=tc;     // на магистраль, курс на восток — ждёт, пока замеряют
  /* 4) замер образцов: упаковщик — мелкие на ленточном Goodscan, контролёр — крупные на портале; замеренные — на поддон на месте 2 */
  zoneFilm(PK,CT,MK);
  /* 5) поддон замеренных (бирка ЧТ) → пустая ячейка A8 */
  hold(Math.max(0,MK.mpTag+1.6-tc)); MK.mpGo=tc;
  fwdX(s2[0]-RHO,VS+0.35); arc(R90,aL); close(); fwdZ(s2[1]+FR-AX+2.2,VE); fwdZ(s2[1]+FR-AX,VS); close(); MK.mpIn=tc;
  hold(0.3); Tl(-0.06,1.0); const lmp=Lf(0.22,1.1); hold(0.3); const cmp={ta:lmp.ta,pe:lmp.tb,tp:cross(lmp,0.008)};
  backZ(ZL-RHO,1.0); arc(R90,aR,true); close(); MK.mpOut=tc;                                  // корма на восток — курс на запад
  const a8=cellC(A8C); Tl(-0.025,1.5); fwdX(a8[0]+RC,VL); arc(R90,aL,false,RC); close(); MK.a8A=tc;
  Lf(0.25,1.2); hold(0.2); fwdZ(a8[1]-FR+AX,VS); close(); MK.a8At=tc;
  cmp.tm=tc; hold(0.3); Tl(0,0.9); const lmp2=Lf(0.0,1.0); cmp.rs=lmp2.ta; cmp.tb=lmp2.tb; cmp.tr=cross(lmp2,0.008); hold(0.4); MK.a8Set=cmp.tr;
  Lf(0.06,1.4,false,1.6); backZ(ZC,0.8); arc(R90,aR,true,RC); close(); MK.outA8=tc;          // курс на восток — к A14
  /* 3) FIFO: ячейка A14 (ПН — самый старый день), верхняя стойка */
  MK.tr2a=tc; fwdX(a14[0]-RC,VE); arc(L90,aE,false,RC); close(); MK.tr2b=tc;
  Lf(PT-0.005,3.0); hold(0.2); MK.up2=tc;
  fwdZ(a14[1]-FR+AX,VS); close(); MK.in2=tc;
  hold(0.25); Tl(-0.05,0.9); const l5=Lf(1.70,0.9); hold(0.3);
  const c2={ta:l5.ta,pe:l5.tb,tp:cross(l5,PT+0.008)};
  backZ(ZC,0.7); close(); MK.out14=tc; Lf(0.25,3.0); hold(0.2);
  /* автопоезд на посту П2: стоит вдоль южной магистрали правым бортом к ряду A; проёмы — посередине борта грузовика и прицепа */
  const bw=F.bod.map(b=>{ b.updateMatrixWorld(true); const p=b.localToWorld(V(RB.x,0,RB.z)); return [p.x,p.z]; });
  const B1X=bw[0][0], B2X=bw[1][0], ZS=bw[0][1]+FR; F.bw=bw;                // начало координат погрузчика, когда стойка стоит в проёме (курс на юг)
  const inBody=(r,x,z)=>{ const p=F.bod[r].localToWorld(V(x,0,z)); return [p.x,p.z]; };
  const present=c=>{                                     // стойка — на высоту пола кузова, подъезд в проём; стойка остаётся на вилах
    Tl(-0.02,1.0); Lf(HOLDY,2.4); hold(0.2); c.up=tc; fwdZ(ZS-AX,0.6); close(); c.in=tc; c.tm=tc; hold(0.3); Tl(0,0.8); };
  /* --- автопоезд: заезд через П2, упоры, шторы; в конце — выезд задним ходом --- */
  MK.kin=MK.outA8+0.3; MK.kst=MK.kin+11; MK.chk0=MK.kst+1.4; MK.cop0=MK.kst+1.8; MK.cop1=MK.cop0+3.6;
  /* бригады: K1, K2 — грузовик; K3, K4 — прицеп. Ждут в зале, открывают шторы, поднимаются в кузов через проём */
  F.kCnt=[0,1].map(()=>({S:{0:0,1:0,2:0,3:0},N:{0:0,1:0,2:0,3:0}})); F.kHy=[0,1].map(()=>({S:{0:[],1:[],2:[],3:[]},N:{0:[],1:[],2:[],3:[]}}));
  F.kPos={K1:[1.9,-0.4],K2:[-1.9,-0.3],K3:[1.9,-0.4],K4:[-1.9,-0.3]}; F.kIdle={K1:-PI/2,K2:PI/2,K3:-PI/2,K4:PI/2}; F.kFree={}; KB=[];
  F.KZE=[[],[]]; F.J={}; F.CI={}; F.trK={};
  { const C=F.bod[0].userData.curt, n=C.strips.length, xo=C.x0+0.05+(n-1)*C.pitch, xc=C.x0+C.w*(n-0.5); F.cEdge=[xo,xc]; }
  const [XO,XC]=F.cEdge, byaw=F.kz0.r, yAlong=d=>byaw+(d>0?PI/2:-PI/2);
  CREW.forEach((cw,r)=>{ const [wn,ws]=cw, bx=bw[r][0];
    const spot={[wn]:[bx+1.5,13.2],[ws]:[bx+4.75,13.2]}, xin={[wn]:0.45,[ws]:-0.45}, tci={[wn]:MK.cop1+0.7,[ws]:MK.cop1+3.4};
    for(const w of cw){ const W=new Track(), s=spot[w]; W.key(0,s[0],s[1],PI,{}); let t=MK.kst+0.4; W.key(t,s[0],s[1],PI,{});
      if(w===ws){                                          // открывает штору: идёт от задних дверей к переднему борту, собирая полотно
        const p0=inBody(r,XC+0.35,1.68), p1=inBody(r,XO+0.35,1.68);
        W.key(MK.cop0-0.3,p0[0],p0[1],yAlong(-1),{}); W.key(MK.cop0,p0[0],p0[1],yAlong(-1),{reach:0.75,bend:0.06});
        W.key(MK.cop1,p1[0],p1[1],yAlong(-1),{reach:0.75,bend:0.06}); W.key(MK.cop1+0.4,p1[0],p1[1],yAlong(-1),{}); t=MK.cop1+0.4; s[0]=p1[0]; s[1]=p1[1]; }
      const q=inBody(r,xin[w],1.62); W.key(Math.max(t+0.4,tci[w]-0.35),q[0],q[1],byaw+PI,{}); W.key(tci[w],q[0],q[1],byaw+PI,{reach:0.85,bend:0.35}); W.fin();
      F.CI[w]={t:tci[w],x:xin[w],W}; F.KZE[r].push([tci[w]+0.5,-0.0012,0.0008]);
      F.trK[w]=new Track().key(tci[w]+0.9,xin[w],0.95,PI,{}).key(tci[w]+2.3,F.kPos[w][0],F.kPos[w][1],F.kIdle[w],{}); } });
  const jmp=(w,r,xj,tj,pts)=>{                           // через проём спрыгнул в зал и отошёл на своё место
    const trk=F.trK[w]; trk.key(Math.max(F.kFree[w],tj-2.4),F.kPos[w][0],F.kPos[w][1],F.kIdle[w],{});
    trk.key(tj-0.8,xj,0.9,0,{}); trk.key(tj-0.12,xj,0.93,0,{squat:0.5,bend:0.25}); trk.key(tj,xj,0.95,0,{squat:0.3,reach:0.35}); trk.fin();
    const b=F.bod[r], s=b.localToWorld(V(xj,BEDY,0.95)), e=b.localToWorld(V(xj,0,1.73)), e2=inBody(r,xj,1.8), W=new Track();
    const tf=(0.225+Math.sqrt(0.225*0.225+4*4.905*BEDY))/9.81;                 // время полёта до пола зала
    W.key(tj+tf,e.x,e.z,byaw,{squat:0.3,bend:0.1,reach:0.3}); W.key(tj+tf+0.15,e.x,e.z,byaw,{squat:0.72,bend:0.35}); W.key(tj+tf+0.8,e2[0],e2[1],byaw,{});
    const ta=route(W,tj+tf+0.8,[e2,...pts],1.35,{});
    return {tj,tf,s,e,W,ta,last:pts[pts.length-1]}; };
  const hop=(r,t0)=>{ const [wn,ws]=CREW[r], bx=bw[r][0], tj=Math.max(F.kFree[wn],F.kFree[ws],t0)+5.2;
    F.J[ws]=jmp(ws,r,-0.45,tj,[[bx-3.4,13.2,PI]]); F.J[wn]=jmp(wn,r,0.45,tj+1.0,[[bx+3.3,13.2,PI]]); F.KZE[r].push([tj,0.002,-0.001],[tj+1.0,0.002,-0.001]); return tj+1.0; };
  /* 4) стойка — через магистраль к грузовику: поворот к борту, подъём, в проём на поднятых вилах */
  MK.tr3a=tc; arc(L90,aR,true,RC); close(); fwdX(B1X+RHO,VL); mark('trn1'); arc(L90,aL); close(); MK.p2b=tc;
  present(c2); MK.set1=c2.in;
  MK.u1a=tc; const u1=unloadPlan(0,MK.u1a); MK.u1b=u1.tEnd; F.KZE[0].push([c2.in,-0.004,0.003]);
  tc=Math.max(tc,u1.tEnd+0.8); Tl(-0.02,0.8); backZ(ZL-RHO,0.7); close(); MK.back1=tc; Lf(0.25,2.4); hold(0.2);
  hop(0,MK.back1);
  /* 5) пустая стойка — задним ходом на магистраль, к приёмке, на место запаса пустых */
  arc(R90,aR,true); close(); MK.e1s=tc;
  const toEO=(c,stack)=>{ fwdX(EO[0]+RHO,VE); arc(L90,aE); close(); if(stack){ Lf(1.75,2.6); hold(0.2); }
    c.eo=tc; fwdZ(EO[1]+FR-AX,stack?0.8:VS); close(); hold(0.3);
    const l=Lf(stack?PT-0.012:0.0,stack?1.6:1.0); c.rs=l.ta; c.tb=l.tb; c.tr=cross(l,(stack?PT:0)+0.008); hold(0.4); };
  toEO(c2,false); MK.e1=c2.tr;
  backZ(ZL-RHO,0.9); arc(L90,aR,true); close(); MK.e1out=tc;
  /* 6) вторая (нижняя) стойка A14 — в прицеп: его проём почти напротив ячейки */
  fwdX(a14[0]-RC,VE); arc(L90,aE,false,RC); close(); MK.in3a=tc;
  fwdZ(a14[1]-FR+AX,VS); close(); hold(0.25); Tl(-0.06,0.9); const l6=Lf(0.22,1.0); hold(0.3);
  const c4={ta:l6.ta,pe:l6.tb,tp:cross(l6,0.008)};
  backZ(ZC,0.7); arc(L90,aR,true,RC); close(); MK.out14b=tc;
  fwdX(B2X+RHO,VS+0.25); mark('trn2'); arc(L90,aL); close(); MK.zn2b=tc;
  present(c4); MK.set2=c4.in;
  MK.u2a=tc; const u2=unloadPlan(1,MK.u2a); MK.u2b=u2.tEnd; F.KZE[1].push([c4.in,-0.004,0.003]);
  tc=Math.max(tc,u2.tEnd+0.8); Tl(-0.02,0.8); backZ(ZL-RHO,0.7); close(); MK.back2=tc; Lf(0.25,2.4); hold(0.2);
  hop(1,MK.back2);
  /* 7) пустая стойка из прицепа — по магистрали к приёмке, вторым ярусом */
  arc(R90,aR,true); close(); MK.e2s=tc;
  toEO(c4,true); MK.e2=c4.tr; MK.eo2=c4.eo;
  Lf(0.06,2.6,false,2.6); backZ(ZL-RHO+0.3,0.8); close(); MK.fkEnd=tc+3;
  FK=mkPath(S); FKL=LK; FKT=TK; F._fkS=S;
  /* стойки: где стоят и когда едут на вилах */
  const fixed=(x,y,z,yaw)=>{ const p=V(x,y,z), q=new THREE.Quaternion().setFromAxisAngle(Yv,yaw); return (P,Q)=>{ P.copy(p); Q.copy(q); }; };
  F.RKr={o:F.RK,rest:[{T:0,f:fixed(rx,0,rz,0)},{T:c1.tm,f:fixed(a6[0]+0.03,PT,a6[1],PI)}],carry:[c1],ring:[[c1.tr,-0.003]]};
  F.R14r=[{o:F.R14[0],rest:[{T:0,f:fixed(a14[0],PT,a14[1],PI)},{T:c2.tm,f:fixed(EO[0],0,EO[1],0)}],carry:[c2],ring:[[c4.tr,-0.002]]},
           {o:F.R14[1],rest:[{T:0,f:fixed(a14[0],0,a14[1],PI)},{T:c4.tm,f:fixed(EO[0],PT,EO[1],0)}],carry:[c4],ring:[[c4.tr,-0.003]]}];
  F.a6ring=[[c1.tr,-0.002]];
  F.SPr={o:F.SP,rest:[{T:0,f:fixed(SP_AT[0],0,SP_AT[1],0)},{T:csp.tm,f:fixed(s1[0],0,s1[1],0)}],carry:[csp],ring:[[csp.tr,-0.002]]};
  F.MPr={o:F.MP,rest:[{T:0,f:fixed(s2[0],0,s2[1],0)},{T:cmp.tm,f:fixed(a8[0],0,a8[1],PI)}],carry:[cmp],ring:[[cmp.tr,-0.002]]};
  /* нагрузка на погрузчик: взял — просадка передней оси; стойку разобрали — отыграл; поставил пустую */
  F.FKE=[[c1.tp,1],[c1.tr,-1],[csp.tp,1],[csp.tr,-1],[cmp.tp,1],[cmp.tr,-1],[c2.tp,1],[lerp(MK.u1a,MK.u1b,0.5),-0.75],[c2.tr,-0.25],[c4.tp,1],[lerp(MK.u2a,MK.u2b,0.5),-0.75],[c4.tr,-0.25]];
  F.CAR=[c1,csp,cmp,c2,c4]; F.carTr=c4;                         // carTr — вторая стойка из A14 в прицеп (камеру ставить по ней, не по номеру в CAR)
  /* --- кладовщик: фото открытого кузова; затем рабочие закрывают шторы --- */
  const tw=c4.tr-1.5, w3x=B2X+1.1, ly=PI+0.12;
  W3P=new Track().key(0,46.5,7.5,0,{}).key(tw,46.5,7.5,0,{});
  const twa=route(W3P,tw,[[46.5,7.5],[47.0,8.6],[47.0,12.7],[w3x,13.75,ly]],1.35,{});
  W3P.key(twa+0.5,w3x,13.75,ly,{scan:1,scanner:true}); MK.photo=twa+0.9; W3P.key(twa+1.9,w3x,13.75,ly,{scan:1,scanner:true});
  route(W3P,twa+2.3,[[w3x,13.75],[w3x+1.6,14.3,PI*0.85]],1.3,{}); W3P.key(900,w3x+1.6,14.3,PI*0.85,{}); W3P.fin();
  MK.curt0=MK.photo+1.6; MK.curt1=MK.curt0+4.2; MK.go=MK.curt1+2.6;
  [['K2',0],['K4',1]].forEach(([w,r])=>{ const J=F.J[w], W=J.W, p0=inBody(r,XO-0.35,1.68), p1=inBody(r,XC-0.35,1.68), p2=inBody(r,XC-0.9,2.6);
    W.key(MK.curt0-3.0,J.last[0],J.last[1],J.last[2],{});
    W.key(MK.curt0-0.5,p0[0],p0[1],yAlong(1),{}); W.key(MK.curt0,p0[0],p0[1],yAlong(1),{reach:0.75,bend:0.06});
    W.key(MK.curt1,p1[0],p1[1],yAlong(1),{reach:0.75,bend:0.06}); W.key(MK.curt1+0.4,p1[0],p1[1],yAlong(1),{});
    W.key(MK.curt1+1.4,p2[0],p2[1],byaw+PI,{}); J.last=[p2[0],p2[1],byaw+PI]; });
  for(const w in F.J){ const J=F.J[w]; J.W.key(900,J.last[0],J.last[1],J.last[2],{}); J.W.fin(); }
  /* --- автопоезд: заезд передним ходом через П2 и выезд задним ходом по прямой --- */
  KZ=mkPath([{t0:MK.kin,t1:MK.kst,pts:[[F.kz0.x+34,F.kz0.z],[F.kz0.x+14,F.kz0.z],[F.kz0.x,F.kz0.z]],ease:'brake',u0:0.5},
             {t0:MK.go,t1:MK.go+12,pts:[[F.kz0.x,F.kz0.z],[F.kz0.x+12,F.kz0.z],[F.kz0.x+36,F.kz0.z]],ease:'go',u0:0.45,rev:true}]);
  MK.aer=MK.go+8.0; MK.end=MK.aer+3.0;
  /* --- фон: грузчик с коробом, бригадир со сканером --- */
  W4P=new Track().key(0,30.5,14.9,-PI/2,{carry:1}).key(36,30.5,14.9,-PI/2,{carry:1});
  route(W4P,36,[[30.5,14.9],[21.6,14.9],[20.4,14.2],[17.3,13.3],[16.1,12.4],[15.9,11.9,-PI*0.7]],1.3,{carry:1}); W4P.key(900,15.9,11.9,-PI*0.7,{carry:1}).fin();
  W5P=new Track().key(0,22,14.85,PI/2,{}).key(24,22,14.85,PI/2,{}).key(40,39.6,14.85,PI/2,{scanner:true}).key(41,39.9,14.75,PI*0.9,{scan:1,scanner:true})
    .key(46,39.9,14.75,PI*0.9,{scan:1,scanner:true}).key(60,26.5,14.85,-PI/2,{}).key(66.4,18.6,14.85,-PI/2,{}).key(68.4,17.8,17.1,PI*0.7,{}).key(900,17.8,17.1,PI*0.7,{}).fin();
  /* --- таймлапсы и подписи --- */
  MK.tl1a=PICK[0].rel+5.0; MK.tl1b=MK.lab0+4.1; F.w4off=lerp(MK.tl1a,MK.tl1b,0.36);
  /* замер в кадре: первый короб на Goodscan целиком, затем первый крупный на портале после него; остальное — ускорено */
  const G1=F.gsJobs[0], PJ=F.ptJobs.find(j=>j.tPut>G1.tB1+5.4)||F.ptJobs[F.ptJobs.length-1]; MK.G1=G1; MK.PJ=PJ; MK.gOut=G1.tB0+(GS.ARCH+G1.b.l/2+0.05-0.42)/GSV;
  const ZW=[]; const zw=(a,b,k)=>{ if(b-a>=0.4&&(!ZW.length||a>=ZW[ZW.length-1][1])) ZW.push([a,b,k]); };
  zw(MK.out6+0.25,MK.spA-0.6,8); zw(MK.spIn+2.6,MK.spOut-0.1,3); zw(MK.spOut+0.4,MK.spZ-0.6,10); zw(MK.spZ+0.6,MK.spAt-1.4,5); zw(MK.spSet+1.2,G1.tPut-2.0,5);
  zw(MK.gOut+3.6,PJ.tPut-1.8,7); zw(Math.max(PJ.tS1+1.6,MK.gOut+3.6),MK.mEnd-0.6,8); zw(MK.mpTag+1.8,MK.mpIn-0.6,8); zw(MK.mpIn+2.6,MK.mpOut-0.1,4); zw(MK.mpOut+0.4,MK.a8A-0.4,8); zw(MK.a8A+0.8,MK.a8At-0.6,3); zw(MK.a8Set+1.4,MK.outA8+0.2,5);
  const WARPS=[[TELE_T0+0.6,TELE_T1-0.6,4],[MK.tl1a,MK.tl1b,8],[MK.in1+3.2,MK.tr1b-0.4,4],[MK.tr1b+0.3,MK.at6-1.4,2],[MK.seat1+1.6,MK.out6+0.2,4],...ZW,
    [MK.kst+0.9,MK.cop0-0.3,2],[MK.cop1+0.3,MK.up2+0.4,2],[MK.up2+0.9,MK.in2-0.8,2.5],[MK.out14+0.3,MK.trn1-0.3,4],[MK.trn1+1.6,MK.set1-2.4,2.5],
    [MK.u1a+5.0,MK.u1b-0.6,12],[MK.u1b+1.4,MK.e1s+1.5,3],[MK.e1s+1.5,MK.trn2-0.3,14],[MK.trn2+1.6,MK.set2-2.4,3.5],
    [MK.u2a+2.6,MK.u2b-0.6,12],[MK.u2b+1.4,MK.back2+1.6,3],[MK.back2+5.0,MK.eo2+1.6,7]];
  F.PICK=PICK; F.KBs=KB;
  mkTime(WARPS,MK.end); mkCaps(); bakePhys();
}
/* динамика погрузчика, стойки на вилах и машин: входы снимаются с путей, отклик — пружины с демпфером */
function bakePhys(){ const MK=F.MK, fT0=FK[0].t0-2, fT1=MK.fkEnd+4;
  const fon=T=>T>FK[0].t0-1&&T<MK.fkEnd+1;
  const fa=sampleIn(T=>fon(T)?kin(FK,T).af:0,fT0,fT1), fl=sampleIn(T=>{ if(!fon(T)) return 0; const k=kin(FK,T); return k.v*k.w; },fT0,fT1);
  const fv=sampleIn(T=>fon(T)?kin(FK,T).v:0,fT0,fT1);
  const av=(S,win)=>T=>win(T)?accSm(S,T)*pathAt(S,T).sgn:0;
  const cw=T=>T>CN[0].t0+0.45&&T<CN[0].t1+0.05, kw=T=>(T>KZ[0].t0+0.45&&T<KZ[0].t1+0.05)||(T>KZ[1].t0-0.05&&T<KZ[1].t1-0.45);   // въезжают с ходу, уезжают с ходу — без «ступеньки» скорости
  const ca=sampleIn(av(CN,cw),CN[0].t0-2,CN[0].t1+7), ka=sampleIn(av(KZ,kw),KZ[0].t0-2,KZ[1].t1+7);
  F.PH={
    fkP:bakeSpring(fa,2.2,0.32,a=>clampA(-a*0.0042,0.014)),          // корпус на шинах: клевок при торможении, приседание при разгоне
    rkP:bakeSpring(fa,1.25,0.10,a=>clampA(-a*0.0048,0.016)),         // стойка на вилах: качается вперёд-назад
    rkR:bakeSpring(fl,1.55,0.12,a=>clampA(-a*0.007,0.016)),          //   и с боку на бок в повороте
    cnB:bakeSpring(ca,1.7,0.30,a=>clampA(-a*0.0011,0.010)),          // рама китайского грузовика на рессорах
    cnC:bakeSpring(ca,1.1,0.22,a=>clampA(-a*0.0055,0.028)),          // кабина на своей подвеске
    kzB:bakeSpring(ka,1.6,0.32,a=>clampA(-a*0.0010,0.008)),
    kzC:bakeSpring(ka,1.05,0.22,a=>clampA(-a*0.0050,0.024)), fv };
  F.cnCab=null; F.kzCab=null; F.cnT.traverse(o=>{ if(o.userData.cab&&!F.cnCab) F.cnCab=o.userData.cab; }); F.kzT.traverse(o=>{ if(o.userData.cab&&!F.kzCab) F.kzCab=o.userData.cab; });
}
/* водитель погрузчика поворачивается назад заранее (за ~0,7 с до заднего хода) и возвращается после */
function fkBack(T){ const I=F.PH&&F.PH.fv; if(!I) return 0; let s=0,n=0; for(let k=-4;k<=7;k++){ s+=inAt(I,T+k*0.1)<-0.06?1:0; n++; } const u=s/n; return u*u*(3-2*u); }
function mkCaps(){
  const MK=F.MK, cap=(T0,T1,no,a,b)=>({t0:tfOf(T0),t1:tfOf(T1),no,a,b}), P0=PICK[0];
  const PJ=MK.PJ, G1=MK.G1, rkKg=FRK.reduce((a,si)=>a+SKUS[si].kg,0), kgS=v=>v.toFixed(1).replace('.',','), mm=m=>m.L+' × '+m.W+' × '+m.H+' мм';
  CAPS=[cap(0.6,4.3,'T','СКЛАД №4 · БЛОК 4-1 · YUZHE PARK, ХОРГОС','Перегрузка Китай → Казахстан: от въезда машины до выезда автопоезда'),
    cap(4.8,12.0,'1','Заезд к воротам Л2','LPR фиксирует номер и время · фото пломбы · сверка документов'),
    cap(12.2,P0.grab-0.3,'2','Конвейер выдвигается в кузов · выгрузка лентой','сборная машина: груз нескольких клиентов · в кадре — отправка XY, 5 SKU разного размера и веса'),
    cap(P0.grab+0.1,P0.rel+2.2,'3','Образец каждого SKU — в поддон образцов','с каждого размера один короб · поддон стоит рядом с местом разгрузки'),
    cap(P0.rel+2.6,MK.lab0+2.6,'4','Остальное — в стоечный поддон клиента','20 коробов XY · тяжёлое вниз, лёгкое наверх · стойки несут верхний ярус — плёнка не нужна'),
    cap(MK.lab0+3.0,MK.out6+0.1,'5','Размещение по FIFO · второй ярус','ячейка A6 — тот же день приёмки (ЧТ) · опоры садятся в чаши нижней стойки'),
    cap(MK.out6+0.5,MK.spSet+1.0,'6','Выгрузка закончена — образцы в зону DWS','погрузчик везёт поддон образцов через пост П2, пока автопоезда нет · зона — на месте брака, АКБ и упаковки'),
    cap(MK.spSet+1.4,MK.gOut+3.4,'7','Мелкие образцы — ленточный DWS Goodscan','весовой стол → 3D-камера → лента через световой занавес и фото · ±1 мм · ±10 г · 1–2 с на короб'),
    cap(MK.gOut+3.8,PJ.tS1+1.4,'8','Крупные — портальный DWS','платформа с весами · два сканера сверху · штрихкод — ручным сканером'),
    cap(PJ.tS1+1.8,MK.mpTag+1.4,'9','Замеренные — на второй поддон · бирка дня','габарит, вес и фото каждого SKU — в WMS и SafeLoad'),
    cap(MK.mpTag+1.8,MK.outA8+0.1,'10','Образцы — в ячейку A8','поддон замеренных уходит в отгрузку вместе с грузом своего дня'),
    cap(MK.kin+0.4,MK.up2+0.3,'11','Автопоезд заезжает через П2','тандем 145 м³ встаёт внутри, правым бортом к ячейкам · упоры · шторы открыты, под ними каркас с проёмом'),
    cap(MK.up2+0.7,MK.trn1-0.5,'12','Отбор по FIFO','первой уходит самая старая дата — ПН: ячейка A14, сначала верхняя стойка'),
    cap(MK.trn1-0.1,MK.back1+1.0,'13','Стойка — в проём кузова, на поднятых вилах','погрузчик держит стойку у пола кузова · грузчики берут по одному коробу и кладут в свою дорожку'),
    cap(MK.back1+1.4,MK.out14b+0.2,'14','Пустая стойка — к приёмке · следующая из той же ячейки','ячейка A14 освобождается целиком — FIFO без остатков'),
    cap(MK.out14b+0.6,MK.back2+1.0,'15','Прицеп · погрузка через проём','вторая стойка · проём прицепа — через магистраль от ячейки · своя пара грузчиков'),
    cap(MK.back2+1.4,MK.e2+1.2,'16','Пустые стойки — в два яруса у ворот Л2','готовы к следующей машине из Китая'),
    cap(MK.e2+1.8,MK.curt1+0.8,'17','Фото кузова · шторы · пломба','100 % скан против плана · фото уходит клиенту'),
    cap(MK.go-1.6,MK.aer-0.2,'18','Выезд через П2','задним ходом по прямой · LPR на выезде'),
    cap(MK.aer+0.2,MK.end-0.3,'O','Цикл машины ≤ 4 ч · FIFO без исключений','Buraq Logistics · Склад №4, блок 4-1 · Yuzhe International Logistics Park, Хоргос')]; F.caps=CAPS;
  const card=(T0,T1,a,b,c)=>({t0:tfOf(T0),t1:tfOf(T1),a,b,c});
  CARDS=[card(6.0,11.2,'LPR · ВЪЕЗД 08:42','新F·3K218 · пломба № 0472913 ✓','#53d16f'),
    card(P0.rel-0.2,P0.rel+3.6,'ОБРАЗЕЦ · '+SKUS[FSKU[0]].code,'в поддон образцов · по одному с каждого SKU','#f2b705'),
    card(MK.tl1a+4,MK.tl1b-3,'XY · 5 SKU · 25 КОРОБОВ','5 образцов — в поддон образцов · 20 — в стойку клиента','#f2b705'),
    card(F.tLabel-0.2,F.tLabel+4.2,'СТОЙКА XY → A6 · БИРКА ЧТ','20 коробов · '+kgS(rkKg)+' кг · ярус 2','#4caf50'),
    card(MK.at6-0.4,MK.seat1+2.6,'ДВА ЯРУСА В ОДНОЙ ЯЧЕЙКЕ','нагрузку несут стойки, а не короба','#4caf50'),
    card(MK.gOut+0.2,MK.gOut+3.6,'GOODSCAN · '+SKUS[G1.b.si].code,mm(G1.m)+' · '+kgS(G1.m.kg)+' кг ✓','#53d16f'),
    card(PJ.tS1-0.1,PJ.tS1+3.2,'ПОРТАЛ · '+SKUS[PJ.b.si].code,mm(PJ.m)+' · '+kgS(PJ.m.kg)+' кг ✓','#53d16f'),
    card(MK.mpTag-0.3,MK.mpTag+3.6,'ОБРАЗЦЫ XY: 5 ИЗ 5','Goodscan — '+F.gsJobs.length+' · портал — '+F.ptJobs.length+' · данные в WMS','#f2b705'),
    card(MK.kin+3.0,MK.kst+0.6,'LPR · ВЪЕЗД П2 · 10:05','248 KZA 13 · тандем 145 м³','#53d16f'),
    card(MK.up2+1.0,MK.out14+1.0,'FIFO · ПН — САМАЯ СТАРАЯ','A14 уходит первой · скан при отборе','#e0412f'),
    card(MK.set1+1.0,MK.u1a+4.8,'КУЗОВ: ДОРОЖКИ ПО ТИПАМ','проём в каркасе борта · A · C · B · D','#f2b705'),
    card(MK.set2+0.6,MK.u2a+2.4,'ПРИЦЕП · ВТОРАЯ СТОЙКА','A14 пуста · груз не ставят на пол кузова','#e0412f'),
    card(MK.go+2.6,MK.go+7.6,'LPR · ВЫЕЗД П2 · 12:31','248 KZA 13 · цикл 3 ч 49 мин','#53d16f')];
}

/* ===================== сборка актёров ===================== */
const saved={};
function find(){
  F.cnT=TRK_L2; F.kzT=TRK_IN; F.fork0=FORK0;
  F.a14=CELLSTACK[13]; F.a6=CELLSTACK[5];
  F.lpr=null; G.equip.children.forEach(o=>{ const b=o.userData.base; if(o.userData.info===EQ[14]&&Math.abs((b?b[0]:o.position.x)+6.2)<0.3) F.lpr=o; });
  const near=(x,z)=>{ let best=null,bd=1e9; PEOPLE.forEach(H=>{ const p=H.root.position; if(!H.root.parent||H.root.parent!==G.people) return;
    const d=Math.hypot(p.x-x,p.z-z); if(d<bd){bd=d;best=H;} }); return bd<0.8?best:null; };
  F.PW=near(3.8,8.2); F.WP=near(12.2,9.2); F.SUP=near(9.2,12.4);
}
/* геометрия ленты по текущему выдвижению: нос и хвост в координатах стрелы (меняются, когда конвейер выдвигается) */
function teleGeom(){ const c=F.tlCargo&&F.tlCargo[0]; if(!c) return; const tipIsX1=c.x1>c.x0;
  F.bTip=tipIsX1?c.x1:c.x0; F.bBase=tipIsX1?c.x0:c.x1; F.yTip=tipIsX1?c.y1:c.y0; F.yBase=tipIsX1?c.y0:c.y1; }
function teleSet(e){ const t=F.tl2&&F.tl2.userData.tele; if(!t||Math.abs(t.ext-e)<1e-5) return; t.setExt(e); teleGeom(); }
function wheelsOf(root){ const w=[]; root.traverse(o=>{ if(o.userData&&o.userData.isWheel) w.push(o); }); return w; }
function build(){ seeded(()=>{
  find();
  F.grp=new THREE.Group(); F.grp.visible=false; scene.add(F.grp);
  const own=o=>{ if(o.parent) o.parent.remove(o); F.grp.add(o); return o; };
  F.cn0={x:F.cnT.position.x,y:F.cnT.position.y,z:F.cnT.position.z,r:F.cnT.rotation.y};
  F.kz0={x:F.kzT.position.x,y:F.kzT.position.y,z:F.kzT.position.z,r:F.kzT.rotation.y};
  F.pw0=F.PW?F.PW.root.position.clone():V(3.8,0,8.2); F.pwYaw=F.PW?F.PW.root.rotation.y:3.1;
  F.cnW=wheelsOf(F.cnT); F.kzW=wheelsOf(F.kzT); F.f0W=wheelsOf(F.fork0);
  const isCarton=m=>LOOK.cartons.includes(m)||(Array.isArray(m)&&LOOK.ctypeM.includes(m[0]))||LOOK.ctypeM.includes(m);
  F.cnGap=[]; F.cnT.traverse(o=>{ if(o.isMesh&&isCarton(o.material)&&o.position.x>-1.45&&o.position.x<0.85&&o.position.z>-0.25) F.cnGap.push(o); });
  /* грузчик в кузове и короба в руках (по одному на тип) */
  F.WT=HUM.build({role:'ГРУЗЧИК',rnd:Math.random}); F.WTr=F.WT.root; F.WTr.visible=false; F.cnT.add(F.WTr);
  F.WTy=1.28; F.WTbox={}; FSKU.forEach(si=>{ if(!F.WTbox[si]){ const b=skuBox(si); own(b); b.visible=false; F.WTbox[si]=b; } });
  /* лента телескопического конвейера */
  /* телескопический конвейер и DWS — свои экземпляры фильма в штатном положении: правка и удаление таких объектов в редакторе фильм не ломают */
  const mine=(kind,o,p,r,id)=>{ const g=libSpawn(kind,o,p,r,id); edMap.delete(id); const k=pickables.indexOf(g); if(k>=0) pickables.splice(k,1); return own(g); };
  F.tl2=mine('tele',{lift:0.0,tilt:3,ext:TELE_EXT,dir:-1},[0.35,0,10.9],Math.PI,'film-tl');   // лента с подъёмом к машине: голова в кузове выше основания; база отодвинута от ворот, чтобы сложенный конвейер не мешал закрыть створки
  F.dws=mine('dws',{h:2.0,w:1.6,load:0},[DWSZ.big[0],0,DWSZ.big[1]],DWSZ.big[2],'film-dws');      // DWS — в своей зоне (бывшие брак, АКБ, упаковка, доски)
  F.gs=mine('dws2',{out:1},[DWSZ.gs[0],0,DWSZ.gs[1]],DWSZ.gs[2],'film-gs');                       // ленточный Goodscan рядом
  { const c=cnv(512,300), t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; const m=new THREE.MeshBasicMaterial({map:t}); m.color.multiplyScalar(1.6); F.ptMat=m;
    let last=''; F.ptDraw=d=>{ const k=JSON.stringify(d); if(k===last) return; last=k; ptScreenDraw(c,d); t.needsUpdate=true; }; F.ptDraw({state:'idle'}); }
  const cg=beltCargo.filter(c=>c.eid==='film-tl'); F.tlCargo=cg; F.tlRuns=beltRuns.filter(b=>b.eid==='film-tl');
  if(cg.length){ F.boom=cg[0].o.parent; teleGeom(); }
  /* параметры оседания короба: высота отпускания, наклон, ось, небольшой разброс укладки */
  const rs=(K,rnd)=>{ const ax=rnd()<0.5; return {jx:(rnd()-.5)*0.008,jz:(rnd()-.5)*0.008,jy:(rnd()-.5)*0.02,
    h:0.035+rnd()*0.035,th:(rnd()<.5?-1:1)*(0.03+rnd()*0.035),ax,half:(ax?K.w:K.l)/2}; };
  let q5=20261014; const rb=()=>{ q5=(q5*1664525+1013904223)>>>0; return q5/4294967296; };
  /* 25 коробов процесса: на ленте → в руках → в стойку клиента или в поддон образцов → (зона DWS) → поддон замеренных.
     Первые 20 — тем же генератором, что раньше: люди фильма строятся после них и не должны поменяться */
  F.box=FSKU.map(si=>{ const b=skuBox(si); own(b); b.visible=false; return b; }); F.bs=FSKU.map((si,k)=>rs(SKUS[si],k<20?Math.random:rb));
  /* стоечный поддон приёмки: собирается у ленты, уезжает вторым ярусом в A6 */
  F.RK=own(rackFrame(null,RK_AT[0],0,RK_AT[1],{ao:false}));
  F.RKtag=dayTag(F.RK,-0.5,1.24,0.765,3); F.RKtag.visible=false;
  { const c=cnv(256,160),g=c.getContext('2d'); g.fillStyle='#f6f5ef'; g.fillRect(0,0,256,160); g.fillStyle='#111';
    g.font='700 44px "Barlow Condensed",sans-serif'; g.fillText('A6 · ЧТ · Я2',14,50); g.font='500 18px monospace'; g.fillText('BRQ-KZ-0210-0418',14,80);
    for(let x=14;x<240;x+=3+(x*7%4)) g.fillRect(x,92,1+(x*13%3),52);
    const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding;
    F.RKlab=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.125),new THREE.MeshStandardMaterial({map:t,roughness:.6}));
    F.RKlab.position.set(-0.5,1.02,0.775); F.RK.add(F.RKlab); F.RKlab.visible=false;
    const bk=box(0.24,0.16,0.012,M.dark,-0.5,1.02,0.765,F.RK); bk.castShadow=false; F.RKbk=bk; bk.visible=false; }
  /* поддон образцов (у ленты, рядом со стойкой) и поддон замеренных (в зоне DWS, место 2) */
  F.SP=own(rackFrame(null,SP_AT[0],0,SP_AT[1],{ao:false})); F.MP=own(rackFrame(null,DWSZ.spots[1][0],0,DWSZ.spots[1][1],{ao:false}));
  F.MPtag=dayTag(F.MP,-0.5,1.24,0.765,3); F.MPtag.visible=false;
  /* ячейка A14 (ПН): две стойки фильма вместо штатного штабеля — их разбирают по одному коробу; в ячейке — отправка её клиента */
  F.R14=[0,1].map(i=>{ const r=own(rackFrame(null,0,0,0,{ao:false})); dayTag(r,-0.5,1.24,0.765,0); return r; });
  F.k14=rackSkus((13*5)%CLIENTS.length); F.ys14=slotYs(F.k14.map(si=>SKUS[si].h));
  F.kb=[0,1].map(()=>F.k14.map(si=>own(skuBox(si)))); F.ks=[0,1].map(()=>F.k14.map(si=>rs(SKUS[si],Math.random)));
  /* DWS: штатный груз прячем; лазеры, линия сканирования, экраны */
  F.dwsLoad=[]; if(F.dws) F.dws.children.forEach(o=>{ if((o.userData&&/Поддон/.test(o.userData.nm||''))||(o.isMesh&&isCarton(o.material))) F.dwsLoad.push(o); });
  const lm=new THREE.MeshBasicMaterial({color:0xff2a1a,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  lm.color.multiplyScalar(4); F.lm=lm; F.lasers=[];
  if(F.dws){ const H=F.dws.userData.dws?F.dws.userData.dws.H:2.0;
    for(const sx of [-1,1]){ const gg=new THREE.BufferGeometry();
      gg.setAttribute('position',new THREE.Float32BufferAttribute([sx*0.19,H-0.3,0, sx*0.05,0.12,-0.78, sx*0.05,0.12,0.78],3));
      const m=new THREE.Mesh(gg,lm); m.renderOrder=5; F.dws.add(m); F.lasers.push(m); }
    const lineM=new THREE.MeshBasicMaterial({color:0xff2010}); lineM.color.multiplyScalar(3); lineM.name='LASERLINE';
    F.scan=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.004,0.9),lineM); F.dws.add(F.scan); F.scan.visible=false;
    F.dwsScr=F.dws.userData.dwsScreen; }
  /* погрузчик процесса, контролёр, люди */
  F.fk=own(forklift(0,0,0)); F.fk.rotation.order='YXZ'; F.fkW=F.fk.userData.rig.wheels;
  F.CT=HUM.build({role:'КОНТРОЛЁР',rnd:Math.random}); own(F.CT.root);
  F.ct0=V(9.6,0,9.0); F.ctYaw=-2.4;
  F.KH={}; for(const w of ['K1','K2','K3','K4']){ F.KH[w]=HUM.build({role:'ГРУЗЧИК',rnd:Math.random}); own(F.KH[w].root); }
  F.W3=HUM.build({role:'КЛАДОВЩИК',rnd:Math.random}); own(F.W3.root);
  F.W4=HUM.build({role:'ГРУЗЧИК',rnd:Math.random}); own(F.W4.root);
  F.W4box=skuBox(7); own(F.W4box);                                 // фон: короб посуды Мэйцзя
  F.W5=HUM.build({role:'БРИГАДИР',rnd:Math.random}); own(F.W5.root);
  /* казахский автопоезд на посту П2: кузова грузовика и прицепа (подвеска, шторы) */
  F.bod=[F.kzT.userData.b1,F.kzT.userData.b2]; F.b1=F.bod[0];
  plan();
  F.wn=document.createElement('div'); F.wn.id='filmwarn'; F.wn.title='Нажмите, чтобы скрыть'; F.wn.onclick=()=>{ F.wn.style.display='none'; };
  F.wn.style.cssText='display:none;position:absolute;left:50%;top:54px;transform:translateX(-50%);max-width:72%;z-index:30;background:rgba(32,24,10,.92);color:#ffd27a;border:1px solid #f2b705;border-radius:6px;padding:9px 14px;font:500 13px/1.45 system-ui,sans-serif;cursor:pointer';
  view.appendChild(F.wn);
  F.ov=document.createElement('canvas'); F.ov.id='filmov'; view.appendChild(F.ov); F.ovg=F.ov.getContext('2d');
  F.rc=document.createElement('canvas'); F.rcg=F.rc.getContext('2d',{willReadFrequently:true});
  F.built=true; }); }

/* ===================== проверка: не стоит ли изменённый пользователем объект на маршрутах процесса ===================== */
function routeCheck(skip){
  const ed=[], bb=new THREE.Box3(), nm=o=>{ const i=o.userData.info; return (i&&(i.t||i.n))||o.userData.nm||'объект'; };
  edMap.forEach(o=>{ if(!o.visible||skip.includes(o)) return; const b=o.userData.base;
    const moved=o.userData.isClone||o.userData.isAdded||(b&&(Math.abs(o.position.x-b[0])>0.02||Math.abs(o.position.z-b[2])>0.02||Math.abs(wrapA(o.rotation.y-b[3]))>0.01));
    if(!moved) return; o.updateMatrixWorld(true); bb.setFromObject(o); if(bb.isEmpty()||bb.max.y<0.07||bb.min.y>2.4) return;
    ed.push({n:nm(o),x0:bb.min.x,x1:bb.max.x,z0:bb.min.z,z1:bb.max.z}); });
  const hit={}, add=(e,who,T)=>{ if(!hit[e.n]) hit[e.n]={who,T}; };
  if(ed.length){
    const box=(cx,cz,yaw,hx,hz,who,T)=>{ const s=Math.sin(yaw), c=Math.cos(yaw), ex=Math.abs(c)*hx+Math.abs(s)*hz, ez2=Math.abs(s)*hx+Math.abs(c)*hz;
      for(const e of ed){ if(hit[e.n]) continue; if(e.x1<cx-ex||e.x0>cx+ex||e.z1<cz-ez2||e.z0>cz+ez2) continue;
        const bx=(e.x0+e.x1)/2-cx, bz=(e.z0+e.z1)/2-cz, hx2=(e.x1-e.x0)/2, hz2=(e.z1-e.z0)/2;
        if(Math.abs(bx*c-bz*s)-(Math.abs(c)*hx2+Math.abs(s)*hz2)-hx>-0.02) continue;
        if(Math.abs(bx*s+bz*c)-(Math.abs(s)*hx2+Math.abs(c)*hz2)-hz>-0.02) continue; add(e,who,T); } };
    for(let T=FK[0].t0;T<F.MK.fkEnd;T+=0.15){ const p=pathAt(FK,T), s=Math.sin(p.yaw), c=Math.cos(p.yaw);
      const load=F.CAR.some(k=>T>k.tp&&T<k.tr), f=load?2.72:2.1, hw=load?0.75:0.6;                 // корпус −1,45…+0,9; вилы до 2,1; стойка до 2,72
      box(p.x+s*(f-1.45)/2,p.z+c*(f-1.45)/2,p.yaw,hw,(f+1.45)/2,'погрузчика',T); }
    const k0=F.kz0; box(k0.x+15,k0.z,0,26.5,1.45,'автопоезда',F.MK.kin);                                // полоса заезда и стоянки автопоезда
    const c0=F.cn0; box(c0.x,c0.z-27,0,1.5,36,'машины из Китая',5);
  }
  const L=Object.keys(hit); F.warn=L.map(n=>({n,who:hit[n].who,T:hit[n].T}));
  if(F.wn){ if(L.length){ const tm=T=>{ const t=tfOf(T); return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0'); };
      F.wn.innerHTML='⚠ На маршруте процесса стоят объекты, которые вы передвинули или добавили: '+F.warn.slice(0,4).map(w=>'<b>'+w.n+'</b> — на пути '+w.who+' ('+tm(w.T)+')').join('; ')+
        (L.length>4?' и ещё '+(L.length-4):'')+'. Процесс идёт по штатным маршрутам и проедет сквозь них: передвиньте объект или попросите пересчитать маршрут.';
      F.wn.style.display='block'; } else F.wn.style.display='none'; }
}

/* ===================== вход и выход ===================== */
function snap(o){ return o?{o,p:o.position.clone(),r:o.rotation.clone(),v:o.visible,parent:o.parent}:null; }
function restore(s){ if(!s) return; if(s.parent&&s.o.parent!==s.parent) s.parent.add(s.o); s.o.position.copy(s.p); s.o.rotation.copy(s.r); s.o.visible=s.v; }
function hideUI(){ return [G.flow,G.labels,G.roles,G.addr,G.dims,marker,edSelBox].filter(Boolean); }
/* подготовка сцены (общая для фильма и живого процесса): машины, ячейки процесса и LPR на время — в штатном положении
   (по ним рассчитаны маршруты); всё остальное остаётся так, как расставил пользователь: сдвинутые, скопированные и добавленные
   объекты видны и в фильме */
function prepScene(live){
  find();
  const anch=[F.cnT,F.kzT,F.lpr,F.a6,F.a14].concat(live?Object.values(CELLSTACK):[]).filter((o,i,a)=>o&&a.indexOf(o)===i);
  saved.lay=anch.map(o=>[o,o.position.clone(),o.rotation.y,o.visible]);
  anch.forEach(o=>{ const b=o.userData.base; if(b){ o.position.set(b[0],b[1],b[2]); o.rotation.y=b[3]; } o.visible=true; });
  if(!F.built) build();
  const uo=['t-l2','dws-3','dws-gs'].map(id=>edMap.get(id)).filter(o=>o&&o.visible);     // конвейер и оба DWS пользователя: в фильме работают штатные
  routeCheck(anch.concat(uo));
  const a6low=F.a6&&F.a6.userData.tiers?F.a6.userData.tiers[0]:null; F.a6low=a6low;
  saved.objs=[F.cnT,F.kzT,F.fork0,F.lpr,F.bod[0],F.bod[1],a6low,F.PW&&F.PW.root,F.WP&&F.WP.root,F.SUP&&F.SUP.root].filter(Boolean).map(snap);
  const eo0=live?[]:G.equip.children.filter(o=>/Запас пустых/.test(o.userData.nm||'')&&o.visible);   // штатный запас пустых у Л2: в фильме пустые стойки ставят на свой запас, а по линии z 9,25 идут в зону DWS
  const hid=[F.a14].concat(uo,eo0), hu=live?hideUI().filter(o=>o!==G.addr&&o!==G.labels):hideUI();   // в живом режиме адреса ячеек и подписи зон остаются
  saved.vis=hu.concat(hid).map(o=>[o,o.visible]).concat(F.cnGap.map(o=>[o,o.visible]),F.dwsLoad.map(o=>[o,o.visible]),F.tlCargo.map(c=>[c.o,c.o.visible]));
  saved.curt=F.bod.map(b=>b.userData.curt.u); saved.chk=CHOCKS.visible;
  saved.misc={roof:G.roof.visible,inter:interior.intensity,fov:camera.fov,expo:renderer.toneMappingExposure,pr:renderer.getPixelRatio(),
    doors:Object.keys(DOOR).map(k=>[k,DOOR[k].open]),P:Object.assign({},POST.P),scr:F.dwsScr?F.dwsScr.material:null,f0:F.fork0.userData.rig?F.fork0.userData.rig.lift:0};
  if(F.lpr) F.lpr.position.x-=2.0;
  if(F.WP) F.WP.root.visible=false;
  hu.concat(hid).forEach(o=>o.visible=false); F.tlCargo.forEach(c=>c.o.visible=false); F.dwsLoad.forEach(o=>o.visible=false);
  F.grp.visible=true;
}
function unprepScene(){
  F.grp.visible=false; if(F.wn) F.wn.style.display='none';
  saved.objs.forEach(restore);
  saved.vis.forEach(([o,v])=>o.visible=v);
  F.bod.forEach((b,i)=>{ curtainSet(b,saved.curt[i]); b.position.y=0; b.rotation.x=0; }); CHOCKS.visible=saved.chk;
  const m=saved.misc; G.roof.visible=m.roof; interior.intensity=m.inter; camera.fov=m.fov; renderer.toneMappingExposure=m.expo;
  m.doors.forEach(([k,o])=>doorSet(DOOR[k],o)); Object.assign(POST.P,m.P); if(F.dwsScr&&m.scr) F.dwsScr.material=m.scr;
  if(F.fork0.userData.rig) fkSet(F.fork0,m.f0,0,0);
  F.cnW.concat(F.kzW,F.f0W).forEach(w=>w.rotation.set(0,0,0));
  F.cnT.rotation.set(0,F.cn0.r,0); F.kzT.rotation.set(0,F.kz0.r,0); if(F.cnCab) F.cnCab.rotation.z=0; if(F.kzCab) F.kzCab.rotation.z=0;
  saved.lay.forEach(([o,p,r,v])=>{ o.position.copy(p); o.rotation.y=r; o.visible=v; });   // правка пользователя — обратно
  F.WTr.visible=false; F.lasers.forEach(l=>l.visible=true); F.lm.opacity=0; if(F.scan) F.scan.visible=false;
  renderer.shadowMap.needsUpdate=true;
}
function enter(opts){
  if(F.on) return; opts=opts||{}; if(F.SIM&&F.SIM.on) F.SIM.exit();
  if(walk) toggleWalk();
  prepScene(false);
  if(opts.size){ F.W=opts.size[0]; F.H=opts.size[1]; }
  document.getElementById('app').classList.add('film');
  renderer.setPixelRatio(1); renderer.setSize(F.W,F.H,false);
  camera.aspect=F.W/F.H; camera.updateProjectionMatrix();
  F.ov.width=F.rc.width=F.W; F.ov.height=F.rc.height=F.H;
  F.on=true; F.t=opts.t||0; F.play=!opts.paused; F.last=null;
  const fb=document.getElementById('filmbar'); if(fb){ fb.classList.add('on'); const sl=fb.querySelector('input'); if(sl) sl.max=F.T; }
  apply(F.t);
}
function exit(){
  if(!F.on) return;
  if(F.recording) stopRec();
  F.on=false; F.play=false;
  unprepScene();
  document.getElementById('app').classList.remove('film');
  const fb=document.getElementById('filmbar'); if(fb) fb.classList.remove('on');
  renderer.setPixelRatio(saved.misc.pr);
  resize(); flyTo(VIEWS[1][1]);
}

/* ===================== применение времени ===================== */
const _fp=V(0,0,0), _rp=V(0,0,0), _fq=new THREE.Quaternion(), _rq=new THREE.Quaternion();
function forksPose(p,q,yawOff){                           // где окажется стойка, стоящая на вилах: якорь вил, наклон мачты, раскачка
  const C=F.fk.userData.rig.carriage; C.updateMatrixWorld(true);
  C.getWorldQuaternion(q); const sw=F.sw; if(sw) q.multiply(_q2.setFromAxisAngle(Zv,sw.r)).multiply(_q3.setFromAxisAngle(Xv,sw.p));
  C.localToWorld(p.set(0,0.107,FR)); _v2.set(0,-RACK.UND,0).applyQuaternion(q); p.add(_v2);
  q.multiply(_q2.setFromAxisAngle(Yv,yawOff)); }
function rackAt(R,T){
  const o=R.o; let rest=R.rest[0]; for(const r of R.rest) if(T>=r.T) rest=r;
  rest.f(_rp,_rq);
  for(const c of R.carry){ if(T<=c.ta||T>=c.tb) continue;
    forksPose(_fp,_fq,Math.PI);
    const up=_fp.y>_rp.y+0.0004;
    if(up||(T>c.pe&&T<c.rs)){
      const near=(T<c.pe+0.4||T>c.rs-0.4), k=near?c01((_fp.y-_rp.y)/0.06):1;
      o.position.set(lerp(_rp.x,_fp.x,k),_fp.y,lerp(_rp.z,_fp.z,k)); o.quaternion.copy(_rq).slerp(_fq,k); o.updateMatrixWorld(true); return; } }
  o.position.copy(_rp); o.quaternion.copy(_rq);
  if(R.ring) o.position.y+=sumE(R.ring,T,u=>ringR(u,40,7));
  o.updateMatrixWorld(true); }
function bsAt(P,T){ const q=(T-P.t0)/P.dt; if(q<=0) return 0; const n=P.s.length; if(q>=n-1) return P.s[n-1]; const i=Math.floor(q), u=q-i; return P.s[i]+(P.s[i+1]-P.s[i])*u; }
function beltPos(b,k,T){                                  // короб на ленте: разгон с проскальзыванием, упор или очередь, покачивание при остановке
  const tu=T-(E0+OFF[k]), Lb=F.bTip-F.bBase, P=F.bsim&&F.bsim[k], s=P?bsAt(P,T):BELTV*(tu-(1-Math.exp(-tu/SLIP))*SLIP), f=Math.min(1,s/Lb), S=F.bs[k];
  let dy=0, th=0; if(tu<0.6){ const st=settle(tu,{h:0.03,th:S.th*0.5,half:0.2}); dy=st.dy; th=st.th; }
  const evs=P?P.stops.concat([P.arr]):[E0+OFF[k]+LB+SLIP];
  for(const ts of evs){ const ua=T-ts; if(ua>0&&ua<1.2) th+=0.035*Math.exp(-ua*7)*Math.sin(ua*15); }
  b.position.copy(F.boom.localToWorld(_v.set(lerp(F.bTip,F.bBase+0.34,f),lerp(F.yTip,F.yBase,f)-0.17+dy,0)));
  F.boom.getWorldQuaternion(_q); if(th) _q.multiply(_q2.setFromAxisAngle(Zv,th)); b.quaternion.copy(_q); }
function apply(t){
  const T=tau(t), MK=F.MK, PI=Math.PI;
  /* ворота */
  doorSet(DOOR.L2,kv(T,[[0,0],[8.6,0],[10.8,0.97]]));
  doorSet(DOOR.P2,kv(T,[[0,0],[MK.kin-3.2,0],[MK.kin-0.6,1],[MK.kst+1.2,1],[MK.kst+4.0,0],[MK.go-3.6,0],[MK.go-1.0,1]]));
  /* машина из Китая: торможение с клевком кабины */
  { const p=pathAt(CN,T); F.cnT.position.set(p.x,F.cn0.y,p.z); const r=roll(CN,T); F.cnW.forEach(w=>w.rotation.z=r/w.userData.r);
    F.cnT.rotation.set(0,F.cn0.r,bk(F.PH.cnB,T)); if(F.cnCab) F.cnCab.rotation.z=bk(F.PH.cnC,T);
    F.cnGap.forEach(o=>o.visible=T<11.2); }
  /* грузчик в кузове */
  { const on=T>11.2; F.WTr.visible=on; const st=F.trWT.at(T);
    F.WTr.position.set(st.x,F.WTy,st.z); F.WTr.rotation.y=st.yaw; HUM.pose(F.WT,Object.assign({t:T,walk:st.walk*0.6,phase:st.phase},st.pose));
    let hk=-1; SEQ.forEach((ti,k)=>{ const e=E0+OFF[k]; if(T>e-1.3&&T<e) hk=k; });
    if(F.boom) F.boom.updateMatrixWorld(true);
    Object.keys(F.WTbox).forEach(si=>{ const b=F.WTbox[si]; b.visible=on&&hk>=0&&FSKU[hk]===+si; if(!b.visible) return; inHands(F.WT,b);
      const e=E0+OFF[hk], u=(T-(e-0.32))/0.32; if(u<=0) return;                 // короб с рук — на ленту, короткой дугой
      _p0.copy(b.position); _q0.copy(b.quaternion); beltPos(b,hk,e);
      b.position.lerpVectors(_p0,b.position,ez(u)); b.position.y+=0.10*Math.sin(Math.PI*c01(u)); b.quaternion.copy(_q0.slerp(b.quaternion,ez(u))); }); }
  /* лента: конвейер выдвигается в кузов после остановки машины, потом лента идёт */
  teleSet(kv(T,[[TELE_T0,0],[TELE_T1,TELE_EXT]]));
  if(F.boom){ F.boom.updateMatrixWorld(true); F.tlRuns.forEach(b=>{ b.tex.offset.x=(((-Math.sign(b.sp||1)*0.55*Math.max(0,T-E0))%1)+1)%1; }); }
  /* упаковщик, контролёр */
  if(F.PW) drive(F.PW,F.trPK.at(T),T); drive(F.CT,F.trCT.at(T),T);
  /* погрузчик: путь, подъём, наклон мачты; клевок от разгона и торможения, просадка под грузом */
  { const fp=pathAt(FK,T), fl=kv(T,FKL), ftl=kv(T,FKT), on=T>FK[0].t0-1&&T<F.MK.fkEnd+1;
    const k=on?kin(FK,T):{v:0,w:0,af:0};
    const pitch=bk(F.PH.fkP,T)+0.0045*sumE(F.FKE,T,u=>stepR(u,14,0.3));
    F.fk.position.set(fp.x,0,fp.z); F.fk.rotation.set(pitch,fp.yaw,0);
    const rr2=roll(FK,T);
    const steer=fp.mv?Math.max(-1.25,Math.min(1.25,Math.atan2(1.54*k.w,Math.abs(k.v)+0.12)*(k.v<0?-1:1))):0;   // задние колёса: база 1,54 м
    fkSet(F.fk,fl,rr2,-steer,ftl); const R=F.fk.userData.rig; R.blueF.visible=fp.mv&&fp.sgn>0; R.blueB.visible=fp.mv&&fp.sgn<0;
    F.fk.updateMatrixWorld(true);
    /* раскачка стойки на вилах: крен наружу в повороте, запаздывание при разгоне, дрожь на ходу, звон после захвата */
    const ring=sumE(F.FKE,T,u=>ringR(u,11,2.6))*0.004;
    F.sw={r:bk(F.PH.rkR,T)+0.0012*noise1(T,7.3,1.7)*Math.min(1,Math.abs(k.v)/1.5),
          p:bk(F.PH.rkP,T)+ring};
    R.drv.back=on?fkBack(T):0; }
  /* автопоезд: заезд через П2 и выезд задним ходом; подвеска каждого кузова; упоры; шторы открывают после остановки и закрывают перед выездом */
  { const p=pathAt(KZ,T); F.kzT.position.set(p.x,F.kz0.y,p.z);
    F.kzT.rotation.set(0,F.kz0.r,bk(F.PH.kzB,T)); if(F.kzCab) F.kzCab.rotation.z=bk(F.PH.kzC,T);         // рама и кабина на подвеске
    const r=roll(KZ,T); F.kzW.forEach(w=>w.rotation.z=r/w.userData.r);
    F.bod.forEach((b,i)=>{ const E=F.KZE[i]; let rl=0; for(const e of E){ if(T>e[0]) rl+=e[2]*stepR(T-e[0],7.6,0.22); }
      b.position.y=sumE(E,T,u=>stepR(u,8.8,0.24)); b.rotation.x=rl; });
    const edge=(s,dur)=>trap(c01(s),Math.min(0.45,0.35/dur+0.05)), d1=MK.cop1-MK.cop0, d2=MK.curt1-MK.curt0;
    const y=T<MK.curt0?edge((T-MK.cop0)/d1,d1):1-edge((T-MK.curt0)/d2,d2), u=0.5-Math.sin(Math.asin(1-2*y)/3);
    F.bod.forEach(b=>curtainSet(b,u)); CHOCKS.visible=T>MK.chk0&&T<MK.curt0-0.5;
    F.kzT.updateMatrixWorld(true); }
  /* стойки */
  rackAt(F.RKr,T); rackAt(F.R14r[0],T); rackAt(F.R14r[1],T); rackAt(F.SPr,T); rackAt(F.MPr,T); F.MPtag.visible=T>MK.mpTag;
  if(F.a6low) F.a6low.position.y=sumE(F.a6ring,T,u=>ringR(u,40,7));
  F.RKtag.visible=F.RKlab.visible=F.RKbk.visible=T>F.tLabel;
  /* грузчики: ждут в зале, открывают шторы, поднимаются в кузов через проём; работают на полу кузова (в его системе координат);
     после разбора спрыгивают в зал */
  CREW.forEach((cw,r)=>{ const b=F.bod[r]; b.getWorldQuaternion(_q); _eu.setFromQuaternion(_q,'YXZ'); const byaw=_eu.y;
    cw.forEach(w=>{ const H=F.KH[w], J=F.J[w], Ci=F.CI[w];
      if(T<Ci.t) drive(H,Ci.W.at(T),T);
      else if(T<Ci.t+0.9){ const u=(T-Ci.t)/0.9;                                  // руками на пол кузова, колено, встал
        b.localToWorld(_v.set(Ci.x,BEDY*ez(Math.min(1,u*1.3)),lerp(1.62,0.95,ez(c01(u*1.5-0.4))))); H.root.position.copy(_v); H.root.rotation.y=byaw+PI;
        HUM.pose(H,{t:T,reach:0.85*(1-u),bend:0.1+0.55*Math.sin(u*PI),squat:0.6*Math.sin(u*PI)}); }
      else if(T<J.tj){ const st=F.trK[w].at(T); b.localToWorld(_v.set(st.x,BEDY,st.z)); H.root.position.copy(_v); H.root.rotation.y=st.yaw+byaw;
        HUM.pose(H,Object.assign({t:T,walk:st.walk,phase:st.phase},st.pose)); }
      else if(T<J.tj+J.tf){ const u=(T-J.tj)/J.tf, tt=T-J.tj;
        H.root.position.set(lerp(J.s.x,J.e.x,u),Math.max(0,J.s.y+0.225*tt-4.905*tt*tt),lerp(J.s.z,J.e.z,u)); H.root.rotation.y=byaw;
        HUM.pose(H,{t:T,squat:0.3-0.12*Math.sin(u*PI),reach:0.4,bend:0.12}); }
      else drive(H,J.W.at(T),T); }); });
  /* 20 коробов с ленты → стойка */
  /* 25 коробов с ленты: короб клиента → стойка; образец → поддон образцов → (зона DWS) руки → аппарат → руки → поддон замеренных */
  SEQ.forEach((ti,k)=>{ const b=F.box[k], e=E0+OFF[k], P=PICK[k], S=F.bs[k];
    if(T<e){ b.visible=false; return; } b.visible=true;
    if(T<P.grab){ beltPos(b,k,T); return; }
    const who=P.by==='PK'?F.PW:F.CT;
    if(P.by==='PK'){ const q=RSLOT[P.slot], put=dt=>putSlot(b,F.RK,q.x+S.jx,FYS[P.slot],q.z+S.jz,S.jy,dt,S);
      if(T<P.rel){ if(!handFrom(b,who,T,P.grab,()=>beltPos(b,k,T),put)) handTo(b,who,T,P.rel,put); return; }
      put(T-P.rel); return; }
    const it=P.sp, onSP=dt=>putSlot(b,F.SP,it.x+S.jx,it.y,it.z+S.jz,(it.rot?PI/2:0)+S.jy,dt,S), Zj=F.zj&&F.zj[k];
    if(T<P.rel){ if(!handFrom(b,who,T,P.grab,()=>beltPos(b,k,T),onSP)) handTo(b,who,T,P.rel,onSP); return; }
    if(!Zj||T<Zj.g1){ onSP(T-P.rel); return; }
    const w2=Zj.dev==='gs'?F.PW:F.CT, dev=tt=>Zj.dev==='gs'?gsPlace(b,Zj.j,tt,S):ptPlace(b,Zj.j,tt,S), m=Zj.mp, onMP=dt=>putSlot(b,F.MP,m.x+S.jx,m.y,m.z+S.jz,(m.rot?PI/2:0)+S.jy,dt,S);
    if(T<Zj.r1){ if(!handFrom(b,w2,T,Zj.g1,()=>onSP(9),dt=>dev(Zj.r1+dt))) handTo(b,w2,T,Zj.r1,dt=>dev(Zj.r1+dt)); return; }
    if(T<Zj.g2){ dev(T); return; }
    if(T<Zj.rel2){ if(!handFrom(b,w2,T,Zj.g2,()=>dev(T),onMP)) handTo(b,w2,T,Zj.rel2,onMP); return; }
    onMP(T-Zj.rel2); });
  /* 2 × 20 коробов стоек A14 → руки → дорожки кузова (первая стойка — грузовик, вторая — прицеп) */
  for(let r=0;r<2;r++) RSLOT.forEach((q,s)=>{ const b=F.kb[r][s], K=KB[r][s], S=F.ks[r][s], R=F.R14[r];
    const inR=dt=>putSlot(b,R,q.x+S.jx,F.ys14[s],q.z+S.jz,S.jy,9,null);
    if(T<K.grab){ inR(); return; }
    const who=F.KH[K.by], put=dt=>putSlot(b,F.bod[r],K.lp.x+S.jx,K.lp.y,K.lp.z+S.jz,PI/2+S.jy,dt,S);
    if(T<K.rel){ if(!handFrom(b,who,T,K.grab,inR,put)) handTo(b,who,T,K.rel,put); return; }
    put(T-K.rel); });
  /* аппараты DWS: лента, ролики, занавес, вспышка, камера, экраны, весы — по заданиям замера */
  F.gs.updateMatrixWorld(true); F.dws.updateMatrixWorld(true); gsVisAt(F.gsJobs,T); ptVisAt(F.ptJobs,T);
  /* фон: кладовщик (фото кузова), грузчик с коробом, бригадир со сканером */
  drive(F.W3,W3P.at(T),T); drive(F.W4,W4P.at(T),T); inHands(F.W4,F.W4box); F.W4.root.visible=F.W4box.visible=T<F.w4off;   // грузчик донёс короб и ушёл (за склейкой)
  drive(F.W5,W5P.at(T),T);
  if(F.SUP){ F.SUP.root.position.set(10.3,0,13.2); F.SUP.root.rotation.y=-2.0; HUM.pose(F.SUP,{t:T,look:Math.sin(T*0.4)*0.5,scan:T>20&&T<24?1:0,scanner:T>19.6&&T<24.4}); }
  PEOPLE.forEach(H=>{ if(H===F.PW||H===F.WP||H===F.SUP) return; if(H.root.parent&&H.root.visible) HUM.pose(H,Object.assign({t:T},H.base)); });
}

