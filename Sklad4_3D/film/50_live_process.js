/* ===================== ЖИВОЙ ПРОЦЕСС: непрерывный цикл склада в реальном времени =====================
   Отличие от фильма: здесь нет заранее написанного сценария. Склад живёт как система с состоянием:
   машины из Китая приходят к Л2 и выгружаются лентой, первый короб каждого типа проходит DWS, короба собираются в стоечные
   поддоны и уезжают в ячейки; автопоезд встаёт на пост П2, и погрузчик подаёт стойки в проёмы по FIFO (самый старый день
   первым), пока оба кузова не заполнятся; автопоезд уезжает, приходит следующий — пока в ячейках не кончится груз;
   тогда цикл начинается заново. Каждый участник (погрузчик, грузчики, лента, машины) решает, что делать, по текущему
   состоянию; движение и физика — те же, что в фильме (пробеги погрузчика, мокап людей, пружины подвесок, укладка коробов). */
const SIM=window.SIM=F.SIM={on:false,speed:1,T:0,cfg:{inTrucks:2,perTruck:60,today:3,maxBelt:7},st:null,stat:''};
(function(){
const PI=Math.PI, L90=-PI/2, R90=PI/2, PT=RACK.PITCH;
const VE=1.9, VL=1.5, VS=0.55, VR=1.0, aE=0.85, aL=0.65, aR=0.55, ACC=0.6, DEC=0.8;
const P1X=18.8, P2X=35.1;                                   // проезды между секциями
const ZN=26.3;                                               // северная магистраль симуляции: между стойками ряда B (до z 24,5) и ограждениями колонн (от z 27,8)
const EOS=[[11.2,11.0],[13.2,11.0],[18.7,11.0],[20.5,11.0]];
const RAILS=[16.42,20.38,32.42,36.38];                            // стойки ограждений проездов (ряд A, z 18,0…20,85): разворот на южной магистрали — не рядом с ними  // запас пустых стоек: четыре места по два яруса, южнее магистрали (не на линии колонны x 16,05)
const LABEL_AT=[5.25,13.07];
const PLACE_REQ={7:[0],8:[1],9:[2],10:[3],5:[4],6:[5],12:[11],13:[12],14:[7],15:[7,8],16:[8],17:[9],18:[9,10],19:[10]};   // что должно лежать ниже
const DEP={7:[14,15],8:[15,16],9:[17,18],10:[18,19],0:[7],1:[8],2:[9],3:[10],5:[6],4:[5],12:[13],11:[12]};               // что снять раньше
let rng=1; const R=()=>{ rng=(rng*1664525+1013904223)>>>0; return rng/4294967296; };
const hyp2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);

/* ---------- пружина с демпфером, считается по ходу ---------- */
function Spring(f,z,lim){ this.w=2*PI*f; this.z=z; this.x=0; this.v=0; this.lim=lim; }
Spring.prototype.step=function(u,dt){ const n=Math.max(1,Math.ceil(dt/(1/240))), h=dt/n; u=Math.max(-this.lim,Math.min(this.lim,u));
  for(let i=0;i<n;i++){ const a=this.w*this.w*(u-this.x)-2*this.z*this.w*this.v; this.v+=a*h; this.x+=this.v*h; } return this.x; };

/* ---------- планировщик пробегов погрузчика (та же механика, что в фильме, но состояние живёт между заданиями) ---------- */
function FkPlan(x,z,yaw){
  this.S=[]; this.LK=[[0,0.06]]; this.TK=[[0,0]]; this.tc=0; this.lv=0.06; this.tv=0; this.lEnd=0; this.tEnd=0;
  this.Ap=[x+Math.sin(yaw)*AX,z+Math.cos(yaw)*AX]; this.yw=yaw; this.run=null; this.rollBase=0; this.dist=0; this.aisle='ZL'; this.free=0;
}
FkPlan.prototype={
  pv(y){ return [Math.cos(y),-Math.sin(y)]; },
  close(){ if(!this.run) return; const r=mkRun(this.run.pc,ACC,DEC); this.S.push({t0:this.tc,t1:this.tc+r.T,run:r,rev:this.run.rev,len:r.L,d0:this.dist}); this.dist+=r.L; this.tc+=r.T; this.run=null; },
  open(rev){ if(this.run&&this.run.rev!==rev) this.close(); if(!this.run) this.run={pc:[],rev,L:0}; },
  line(d,v,rev){ if(d<-1e-3) console.warn('погрузчик: отрицательный отрезок',d.toFixed(2),this.Ap,this.yw); if(d<1e-3) return; this.open(!!rev);
    const k=rev?-1:1; this.run.pc.push({p:this.Ap.slice(),yaw:this.yw,len:d,v,dir:k}); this.Ap=[this.Ap[0]+Math.sin(this.yw)*d*k,this.Ap[1]+Math.cos(this.yw)*d*k]; this.run.L+=d; },
  fwdX(x,v){ this.line((x-this.Ap[0])/Math.sin(this.yw),v); }, fwdZ(z,v){ this.line((z-this.Ap[1])/Math.cos(this.yw),v); },
  backX(x,v){ this.line(-(x-this.Ap[0])/Math.sin(this.yw),v||VR,true); }, backZ(z,v){ this.line(-(z-this.Ap[1])/Math.cos(this.yw),v||VR,true); },
  arc(dy,w,rev,rho){ this.open(!!rev); rho=rho||RHO; const y1=this.yw+dy, k=Math.sign(dy)*(rev?-1:1), p0=this.pv(this.yw), C=[this.Ap[0]+k*rho*p0[0],this.Ap[1]+k*rho*p0[1]], p1=this.pv(y1);
    this.run.pc.push({c:C,k,rho,y0:this.yw,y1,len:Math.abs(dy)*rho,v:w*rho}); this.Ap=[C[0]-k*rho*p1[0],C[1]-k*rho*p1[1]]; this.yw=wrapA(y1); this.run.L+=Math.abs(dy)*rho; },
  Lf(v,dur,adv,delay){ this.close(); const ta=Math.max(this.tc+(delay||0),this.lEnd+0.02), r={ta,tb:ta+dur,v0:this.lv,v1:v}; this.LK.push([ta,this.lv],[ta+dur,v]); this.lv=v; this.lEnd=ta+dur; if(adv!==false) this.tc=ta+dur; return r; },
  Tl(v,dur){ this.close(); const ta=Math.max(this.tc,this.tEnd+0.02); this.TK.push([ta,this.tv],[ta+dur,v]); this.tv=v; this.tEnd=ta+dur; },
  hold(d){ this.close(); this.tc+=d; },
  cross(r,vc){ let lo=0,hi=1; for(let i=0;i<32;i++){ const m=(lo+hi)/2, v=r.v0+(r.v1-r.v0)*sst(m); if((v<vc)===(r.v1>r.v0)) lo=m; else hi=m; } return r.ta+(r.tb-r.ta)*(lo+hi)/2; },
  head(){ const y=this.yw; return Math.abs(wrapA(y-PI/2))<0.1?'E':Math.abs(wrapA(y+PI/2))<0.1?'W':Math.abs(wrapA(y))<0.1?'N':'S'; },
  /* --- составные манёвры --- */
  uturn(){ const h=this.head(), x=this.Ap[0], dir=h==='E'?1:-1;                 // разворот на магистрали задним ходом — не у колонн (x 16,05 и 32,05)
    const zn=this.aisle==='ZN', safe=v=>{ const c=v-0.6*dir; return Math.abs(v-16.05)>4.3&&Math.abs(v-32.05)>4.3&&v>7.5&&v<(zn?41.5:45)&&(zn||RAILS.every(rx=>Math.abs(rx-c)>1.4)); };
    if(!safe(x)){ let best=null; for(let v=x+dir*0.5;Math.abs(v-x)<12;v+=dir*0.5) if(safe(v)){ best=v; break; }
      if(best===null) for(let v=x-dir*0.5;Math.abs(v-x)<12;v-=dir*0.5) if(safe(v)){ best=v; break; }
      if(best!==null){ if((best-x)*dir>0) this.fwdX(best,VE); else this.line(Math.abs(best-x),VR,true); } }
    if(h==='E'){ this.arc(R90,aR,true); this.arc(R90,aR); } else { this.arc(L90,aR,true); this.arc(L90,aR); } },
  goX(x,v){ let h=this.head(), d=x-this.Ap[0]; if(Math.abs(d)<0.02) return;
    if((d>0)!==(h==='E')){ if(Math.abs(d)<2.0){ this.line(Math.abs(d),VR,true); return; } this.uturn(); h=this.head(); d=x-this.Ap[0]; if(Math.abs(d)<0.02) return; if((d>0)!==(h==='E')){ this.line(Math.abs(d),VR,true); return; } }
    this.fwdX(x,v); },
  turnTo(dir){ if(this.head()!==dir) this.uturn(); },
  enterN(cx,cz,v,rho){ const h=this.head(); rho=rho||RC; this.goX(h==='E'?cx-rho:cx+rho,v); this.arc(h==='E'?L90:R90,v>1.6?aE:aL,false,rho); this.close(); this.pocket='N'; return cz; },   // карман севернее линии (ячейки ряда A)
  enterS(cx,v,rho){ const h=this.head(); rho=rho||RHO; this.goX(h==='E'?cx-rho:cx+rho,v); this.arc(h==='E'?R90:L90,v>1.6?aE:aL,false,rho); this.close(); this.pocket='S'; },   // карман южнее линии (приёмка, запас, проёмы)
  exitN(dir,zl){ this.backZ(zl+RC,0.8); this.arc(dir==='E'?R90:L90,aR,true,RC); this.close(); this.pocket=null; },
  exitS(dir,zl){ this.backZ(zl-RHO,0.9); this.arc(dir==='E'?L90:R90,aR,true); this.close(); this.pocket=null; },
  passage(px,to){ let h=this.head(); const d=px-this.Ap[0]; if((d>0)!==(h==='E')&&Math.abs(d)>2.0){ this.uturn(); h=this.head(); }   // с одной магистрали на другую по проезду между секциями
    this.goX(h==='E'?px-RHO:px+RHO,VE); const hh=this.head();
    if(to==='ZN'){ this.arc(hh==='E'?L90:R90,aE); this.fwdZ(ZN-RHO,VE); this.arc(this.nextDir==='E'?R90:L90,aE); }
    else { this.arc(hh==='E'?R90:L90,aE); this.fwdZ(ZL+RHO,VE); this.arc(this.nextDir==='E'?L90:R90,aE); }
    this.close(); this.aisle=to; },
  toAisle(a,tx){ if(this.aisle===a) return;                                     // к нужной магистрали ближайшим проездом
    const px=Math.abs(this.Ap[0]-P1X)<Math.abs(this.Ap[0]-P2X)?P1X:P2X; this.nextDir=tx>=px?'E':'W'; this.passage(px,a); }
};

/* ---------- состояние ---------- */
const S={};
function rackObj(day,n,at){
  const o=rackFrame(null,0,0,0,{ao:false}); S.grp.add(o);
  const tag=dayTag(o,-0.5,1.24,0.765,day); const r={o,day,n:0,slots:new Array(20).fill(null),tag,at,rest:[],carry:[],ring:[],mode:'rest',id:S.racks.length};
  S.racks.push(r);
  for(let i=0;i<n;i++){ const q=RSLOT[i], b=mkBox(q.ti); b.pl=jit(q.ti); putRack(b,r,i,true); }
  return r;
}
function jit(ti){ const T=CTYPE[ti], ax=R()<0.5; return {jx:(R()-.5)*0.008,jz:(R()-.5)*0.008,jy:(R()-.5)*0.02,h:0.035+R()*0.035,th:(R()<.5?-1:1)*(0.03+R()*0.035),ax,half:(ax?T.w:T.l)/2}; }
function mkBox(ti){ const o=cartonT(ti); S.grp.add(o); const b={o,ti,mode:'free',pl:jit(ti),id:S.boxes.length}; o.userData.simBox=b; S.boxes.push(b); return b; }
function putRack(b,r,s,instant){ const q=RSLOT[s]; r.slots[s]=b; r.n++; b.mode='rack'; b.rack=r; b.slot=s; b.t0=instant?-9:S.T;
  b.o.position.set(q.x+b.pl.jx,q.y,q.z+b.pl.jz); b.o.rotation.set(0,b.pl.jy,0); r.o.add(b.o); }      // сразу в системе стойки: едет с ней на вилах
function takeRack(b){ const r=b.rack; r.slots[b.slot]=null; r.n--; S.grp.attach(b.o); b.rack=null; b.mode='free'; }
function setRest(r,x,y,z,yaw){ r.restP=V(x,y,z); r.restQ=new THREE.Quaternion().setFromAxisAngle(Yv,yaw); r.o.position.copy(r.restP); r.o.quaternion.copy(r.restQ); r.o.updateMatrixWorld(true); }

/* ---------- сборка ---------- */
function setup(){
  rng=20261009;
  S.grp=new THREE.Group(); scene.add(S.grp); S.racks=[]; S.boxes=[]; S.belt=[]; S.jobs=[]; S.ev=[];
  S.T=0; S.cycle=(S.cycle||0)+1; S.log=[];
  /* ячейки: свои стойки вместо штатных штабелей */
  S.cells=CELLS.map((c,i)=>({i,c,x:(c.x0+c.x1)/2,z:(c.z0+c.z1)/2-(c.row==='B'?0.75:0),row:c.row,yaw:c.row==='A'?PI:0,tiers:[],ok:c.row==='A'?(c.x0+c.x1)/2<44.4:(c.x0+c.x1)/2<42.5}));   // ряд B: стойка в глубине ячейки — у магистрали остаётся место для дуги; ячейки у восточной стены не используются (там стоят рохли и электротележка)
  S.hidden=[]; Object.values(CELLSTACK).forEach(o=>{ S.hidden.push([o,o.visible]); o.visible=false; });
  CELLSPEC.forEach(([i,layers,day])=>{ const cell=S.cells[i], tiers=layers>=3?2:1, fill=[1,0.7,0.55,1,0.7][i%5];
    for(let t=0;t<tiers;t++){ const n=t<tiers-1?20:Math.max(4,Math.round(20*fill)); const r=rackObj(day,n,{kind:'cell',cell,tier:t}); setRest(r,cell.x,t*PT,cell.z,cell.yaw); cell.tiers.push(r); } });
  /* запас пустых: четыре на месте штатного запаса, штатный скрыт */
  G.equip.children.forEach(o=>{ if(/Запас пустых/.test(o.userData.nm||'')){ S.hidden.push([o,o.visible]); o.visible=false; } });
  S.eo=EOS.map(p=>({x:p[0],z:p[1],tiers:[]}));
  for(let k=0;k<4;k++){ const sp=S.eo[k>>1], t=sp.tiers.length, r=rackObj(S.cfg().today,0,{kind:'eo',spot:sp,tier:t}); r.tag.visible=false; setRest(r,sp.x,t*PT,sp.z,0); sp.tiers.push(r); }
  /* приёмка: сейчас пусто — погрузчик привезёт стойку из запаса */
  S.rk=null; S.rkReady=false;
  /* машины: китайская — вне площадки, автопоезд — за воротами; второй китайский грузовик на площадке скрыт (мешает выезду) */
  if(typeof TRK_Q!=='undefined'){ S.hidden.push([TRK_Q,TRK_Q.visible]); TRK_Q.visible=false; }
  S.hidden.push([F.fork0,F.fork0.visible]); F.fork0.visible=false;                 // штатный погрузчик у северной магистрали — это и есть наш погрузчик
  [typeof JACK_Sa!=='undefined'&&JACK_Sa,typeof JACK_Sb!=='undefined'&&JACK_Sb].forEach(o=>{ if(o){ S.hidden.push([o,o.visible]); o.visible=false; } });   // рохли, припаркованные на краю магистрали у поста П2
  S.cnCargo=[]; F.cnT.traverse(o=>{ if(o.isMesh&&isCarton(o.material)&&o!==F.cnT){ S.hidden.push([o,o.visible]); o.visible=false; } });   // штатный груз скрыт: свой, поштучный
  S.kzCargo=[]; F.bod.forEach(b=>b.traverse(o=>{ if(o.isMesh&&isCarton(o.material)){ S.hidden.push([o,o.visible]); o.visible=false; } }));   // кузова приходят пустыми
  S.cn={state:'away',path:null,n:0,cargo:[],wtFree:0,busy:false}; S.kz={state:'away',path:null,n:0,lanes:null};
  S.kzT0=0;
  F.cnT.position.set(F.cn0.x,F.cn0.y,F.cn0.z-70); F.cnT.visible=false; F.kzT.position.set(F.kz0.x+40,F.kz0.y,F.kz0.z); F.kzT.visible=false;
  doorSet(DOOR.L2,0); doorSet(DOOR.P2,0); CHOCKS.visible=false; F.bod.forEach(b=>curtainSet(b,0)); F.WTr.visible=false;
  /* погрузчик: у запаса, курсом на восток */
  S.fk=new FkPlan(10.0,ZL,PI/2); S.fk.free=0; S.fkTask=null; S.fkE=[]; S.car=null; S.spr={fkP:new Spring(2.2,0.32,0.014),rkP:new Spring(1.25,0.10,0.016),rkR:new Spring(1.55,0.12,0.016),
    cnB:new Spring(1.7,0.30,0.010),cnC:new Spring(1.1,0.22,0.028),kzB:new Spring(1.6,0.32,0.008),kzC:new Spring(1.05,0.22,0.024)};
  S.fkPitch=0; S.sw={r:0,p:0};
  /* люди */
  const beltEnd=F.boom.localToWorld(V(F.bBase+0.28,F.yBase,0)); S.beltEnd=beltEnd;
  const faceTo=(x,z,tx,tz)=>Math.atan2(tx-x,tz-z);
  S.pyP=faceTo(PK_PICK[0],PK_PICK[1],beltEnd.x,beltEnd.z); S.pyC=faceTo(CT_WAIT[0],CT_WAIT[1],beltEnd.x,beltEnd.z);
  S.hum={};
  const mkH=(key,H,x,z,yaw)=>{ const tr=new Track().key(0,x,z,yaw,{}).fin(); S.hum[key]={H,tr,free:0,x,z,yaw,local:null}; };
  if(!F.PW&&!S.pwH){ S.pwH=HUM.build({role:'ГРУЗЧИК-УПАКОВЩИК',rnd:R}); } if(S.pwH){ S.grp.add(S.pwH.root); }
  mkH('PW',F.PW||S.pwH,PK_PICK[0],PK_PICK[1],S.pyP); mkH('CT',F.CT,CT_WAIT[0],CT_WAIT[1],S.pyC);
  mkH('W3',F.W3,46.5,7.5,0); mkH('W5',F.W5,47.2,12.6,-2.2); S.hum.W5.H.root.visible=true;
  F.W4.root.visible=false; F.W4box.visible=false;
  S.bw=F.bod.map(b=>{ b.updateMatrixWorld(true); const p=b.localToWorld(V(RB.x,0,RB.z)); return [p.x,p.z]; });
  S.kPos={K1:[1.9,-0.4],K2:[-1.9,-0.3],K3:[1.9,-0.4],K4:[-1.9,-0.3]}; S.kIdle={K1:-PI/2,K2:PI/2,K3:-PI/2,K4:PI/2};
  CREW.forEach((cw,r)=>{ const bx=S.bw[r][0]; const spot={[cw[0]]:[bx+1.5,13.2],[cw[1]]:[bx+4.75,13.2]};
    cw.forEach(w=>{ mkH(w,F.KH[w],spot[w][0],spot[w][1],PI); S.hum[w].spot=spot[w]; S.hum[w].body=r; S.hum[w].state='wait'; }); });
  { const C=F.bod[0].userData.curt, n=C.strips.length; S.cEdge=[C.x0+0.05+(n-1)*C.pitch,C.x0+C.w*(n-0.5)]; }
  S.kzE=[[],[]]; S.kzB0=[[0,0],[0,0]]; S.ringA=[];
  S.done=false; S.endT=null; S.inLeft=S.cfg().inTrucks; S.outN=0; S.loaded=0; S.placed=0; loadReset();
  S.wt={H:F.WT,tr:null,free:0}; F.WT.root.visible=false;
  S.dws={job:null}; F.lasers.forEach(l=>l.visible=false); F.lm.opacity=0; if(F.scan) F.scan.visible=false; if(F.dwsScr) F.dwsScr.material=F.scr[0];
}
S.cfg=()=>SIM.cfg;
const isCarton=m=>LOOK.cartons.includes(m)||(Array.isArray(m)&&LOOK.ctypeM.includes(m[0]))||LOOK.ctypeM.includes(m);
function teardown(){
  if(S.grp){ scene.remove(S.grp); S.grp.traverse(o=>{ if(o.isMesh&&o.userData.simBox===undefined&&o.geometry&&!o.geometry.userData.shared){} }); }
  (S.hidden||[]).forEach(([o,v])=>o.visible=v); S.hidden=[];
  F.cnT.position.set(F.cn0.x,F.cn0.y,F.cn0.z); F.cnT.visible=true; F.kzT.position.set(F.kz0.x,F.kz0.y,F.kz0.z); F.kzT.visible=true;
  F.WTr.visible=false; F.W4.root.visible=true;
}

/* ---------- короба: где и как ---------- */
function beltPlace(b,T){ const Lb=F.bTip-F.bBase, f=Math.min(1,b.x/Lb), tu=T-b.t0;
  let dy=0, th=0; if(tu<0.6){ const st=settle(tu,{h:0.03,th:b.pl.th*0.5,half:0.2}); dy=st.dy; th=st.th; }
  for(const ts of b.stops){ const ua=T-ts; if(ua>0&&ua<1.2) th+=0.035*Math.exp(-ua*7)*Math.sin(ua*15); }
  b.o.position.copy(F.boom.localToWorld(_v.set(lerp(F.bTip,F.bBase+0.34,f),lerp(F.yTip,F.yBase,f)-0.17+dy,0)));
  F.boom.getWorldQuaternion(_q); if(th) _q.multiply(_q2.setFromAxisAngle(Zv,th)); b.o.quaternion.copy(_q); }
function rackSlotPut(b,r,s,dt){ const q=RSLOT[s]; putSlot(b.o,r.o,q.x+b.pl.jx,q.y,q.z+b.pl.jz,b.pl.jy,dt,b.pl); }
function laneFree(body,ti){ const L=KZLANE[ti], lanes=S.kz.lanes[body], cap=Math.floor(3.6/L.d)*L.n; return (cap-lanes.S[ti])+(cap-lanes.N[ti]); }   // дорожки растут от торцов к проёму (±1,25 м свободны)
function laneSlot2(body,side,ti){ const L=KZLANE[ti], T=CTYPE[ti], lanes=S.kz.lanes[body];
  const cap=s=>Math.floor(3.6/L.d)*L.n; if(lanes[side][ti]>=cap(side)) side=side==='S'?'N':'S'; if(lanes[side][ti]>=cap(side)) return null;
  const n=lanes[side][ti]++, st=Math.floor(n/L.n), lv=n%L.n, X0=side==='S'?-4.85:4.85, sg=side==='S'?1:-1;
  const xc=X0+sg*L.d*(st+0.5), xf=X0+sg*L.d*(st+1);
  return {lp:V(xc,BEDY+lv*(T.h+0.004),L.z),stand:[xf+sg*0.42,L.z],yaw:side==='S'?-PI/2:PI/2,y:lv*T.h}; }
/* задание «из рук — в место»: до grab — src, потом в руках, в rel — дуга в dst, затем оседание */
function job(b,who,grab,rel,src,dst,fin){ const j={b,who,grab,rel,src,dst,fin,done:false}; b.mode='job'; b.job=j; S.jobs.push(j); return j; }
function boxFrame(b,T){
  if(b.mode==='belt') beltPlace(b,T);
  else if(b.mode==='job'){ const j=b.job;
    if(T<j.grab){ j.src(T); return; }
    if(T<j.rel){ if(!handFrom(b.o,j.who.H,T,j.grab,()=>j.src(T),dt=>j.dst(dt))) handTo(b.o,j.who.H,T,j.rel,dt=>j.dst(dt)); return; }
    j.dst(T-j.rel); if(T>j.rel+1.4){ b.mode='free'; b.job=null; j.done=true; j.fin&&j.fin(); } }
  else if(b.mode==='rackSet'){ rackSlotPut(b,b.rack,b.slot,T-b.t0); if(T>b.t0+1.4){ b.mode='rack'; b.rack.o.attach(b.o); } }
  else if(b.mode==='dws'){ putSlot(b.o,F.dws,-0.2,0.062,0,0,T-b.t0,b.pl); }
  else if(b.mode==='bodySet'){ putSlot(b.o,F.bod[b.body],b.lp.x+b.pl.jx,b.lp.y,b.lp.z+b.pl.jz,PI/2+b.pl.jy,T-b.t0,b.pl); if(T>b.t0+1.4){ b.mode='body'; F.bod[b.body].attach(b.o); } }
}

/* ---------- стойка: в покое или на вилах ---------- */
function rackFrame2(r,T){
  for(const c of r.carry){ if(T<=c.ta||T>=c.tb) continue;
    forksPose(_fp,_fq,PI); const up=_fp.y>r.restP.y+0.0004;
    if(up||(T>c.pe&&T<c.rs)){ const near=(T<c.pe+0.4||T>c.rs-0.4), k=near?c01((_fp.y-r.restP.y)/0.06):1;
      r.o.position.set(lerp(r.restP.x,_fp.x,k),_fp.y,lerp(r.restP.z,_fp.z,k)); r.o.quaternion.copy(r.restQ).slerp(_fq,k); r.o.updateMatrixWorld(true); return; } }
  r.o.position.copy(r.restP); r.o.quaternion.copy(r.restQ);
  if(r.ring.length){ let y=0; for(const e of r.ring) if(T>e[0]&&T<e[0]+3) y+=e[1]*ringR(T-e[0],40,7); r.o.position.y+=y; }
  r.o.updateMatrixWorld(true);
}

/* ---------- погрузчик: карманы и задания ---------- */
/* карман — место, куда погрузчик заезжает с магистрали носом: ячейка ряда A (с южной магистрали на север), ряда B
   (с северной — на юг), приёмка, запас пустых и проёмы кузовов (с южной — на юг) */
/* стойка на вилах при дуге у кармана описывает круг ~2,5 м вокруг внутреннего колеса. Защита колонн (x 16,05 / 32,05; z 14,1) и
   стойки ограждений у проездов (x 20,38 / 36,38) не должны попасть в него — отсюда курс подъезда (need) и запрет курса выезда (outBad) */
const COLS=[16.05,32.05], RAILW=[20.38,36.38], colIn=(a,b)=>COLS.some(x=>x>a&&x<b);
function sRule(x){ const hE=colIn(x-1.25,x+2.5), hW=colIn(x-2.5,x+1.25), oE=colIn(x+0.1,x+3.2), oW=colIn(x-3.2,x-0.1);
  return {need:hE?(hW?null:'W'):hW?'E':null,outBad:oE?'E':oW?'W':null}; }
function locCell(cell){ const xc=COLS.find(c=>Math.abs(c-cell.x)<2.6), tight=RAILW.some(rx=>cell.x>rx&&cell.x-0.75-rx<0.35), wall=cell.x<4.6?'W':cell.x>44.4?'E':null;
  const need=tight?'E':xc?(xc>cell.x?'E':'W'):null, outBad=need?(need==='E'?'W':'E'):null;   // у ограждения проезда — только с восточной стороны; у колонны — с той стороны, где корма при дуге уходит от колонны
  return cell.row==='A'?{aisle:'ZL',side:'N',rho:RC,x:cell.x,zIn:cell.z-FR+AX,back:ZL+RC,lowZ:ZL+RC,wall,yaw:cell.yaw,need,outBad}
                      :{aisle:'ZN',side:'S',rho:RC,x:cell.x,zIn:cell.z+FR-AX,back:ZN-RC,lowZ:ZN-RC,wall,yaw:cell.yaw,need,outBad}; }
function locS(x,z){ const q=sRule(x); return {aisle:'ZL',side:'S',rho:RHO,x,zIn:z+FR-AX,back:ZL-RHO,lowZ:ZL-RHO,wall:null,yaw:0,need:q.need,outBad:q.outBad}; }
/* подъезд по магистрали к x кармана: если цель позади — сначала разворот, потом подъезд (точка подъезда зависит от курса) */
function approach(P,x,rho,v,need){ let h=P.head(); const d=x-P.Ap[0];
  if(need&&(h!==need||(d>0)!==(need==='E'))){                                   // подъезжать нужно определённым курсом: встать за точкой подъезда, развернуться
    const sx=need==='E'?x-rho-3.6:x+rho+3.6; const go=()=>{ const dd=sx-P.Ap[0]; if(Math.abs(dd)<0.05) return; if((dd>0)===(P.head()==='E')) P.fwdX(sx,v); else P.line(Math.abs(dd),VR,true); };
    const dd=sx-P.Ap[0]; if(Math.abs(dd)>6&&(dd>0)!==(h==='E')){ P.uturn(); } go(); if(P.head()!==need) P.uturn(); h=P.head(); }
  else if((d>0)!==(h==='E')&&Math.abs(d)>2.0){ P.uturn(); h=P.head(); }
  P.goX(h==='E'?x-rho:x+rho,v); return P.head(); }
function goPocket(P,L,v,before){ P.toAisle(L.aisle,L.x); const h=approach(P,L.x,L.rho,v,L.need); if(before) before();
  const toN=L.side==='N'; P.arc(h==='E'?(toN?L90:R90):(toN?R90:L90),v>1.6?aE:aL,false,L.rho); P.close(); P.fwdZ(L.zIn,VS); P.close(); P.pocket=L; }
/* выезд задним ходом с поворотом на курс d; у торцевой стены корма при дуге назад ушла бы в стену — там прямо назад и дуга вперёд */
function leavePocket(P,d){ const L=P.pocket; if(!L) return; const zl=L.aisle==='ZL'?ZL:ZN, toN=L.side==='N'; if(L.outBad===d) d=d==='E'?'W':'E';
  if(L.wall&&((L.wall==='W'&&d==='E')||(L.wall==='E'&&d==='W'))){ P.backZ(toN?zl-RHO:zl+RHO,0.8); P.close(); P.arc(toN?(d==='E'?R90:L90):(d==='E'?L90:R90),aL); P.close(); }
  else { P.backZ(L.back,0.8); P.close(); P.arc(toN?(d==='E'?R90:L90):(d==='E'?L90:R90),aR,true,L.rho); P.close(); }
  P.aisle=L.aisle; P.pocket=null; }
function fkPickFloor(P,r){ P.hold(0.3); P.Tl(-0.06,1.0); const l=P.Lf(0.22,1.1); P.hold(0.3); return {ta:l.ta,pe:l.tb,tp:P.cross(l,0.008),rack:r}; }
function fkPickTier1(P,r){ P.hold(0.25); P.Tl(-0.05,0.9); const l=P.Lf(1.70,0.9); P.hold(0.3); return {ta:l.ta,pe:l.tb,tp:P.cross(l,PT+0.008),rack:r}; }
function fkPlaceFloor(P,c){ c.tm=P.tc; P.hold(0.3); P.Tl(0,0.9); const l=P.Lf(0.0,1.0); c.rs=l.ta; c.tb=l.tb; c.tr=P.cross(l,0.008); P.hold(0.4); }
function fkPlaceTier1(P,c){ c.tm=P.tc; P.hold(0.3); P.Tl(0,1.2); const l=P.Lf(PT-0.012,1.6); c.rs=l.ta; c.tb=l.tb; c.tr=P.cross(l,PT+0.008); P.hold(0.4); }
/* стойка на вилах едет к новому месту покоя: место переключается в момент подъезда (c.tm), чтобы опускание шло к нему */
function carryTo(c,r,x,y,z,yaw){ S.ev.push({T:c.tm,f:()=>{ setRest(r,x,y,z,yaw); }}); S.ev.push({T:c.tr,f:()=>{ r.ring.push([c.tr,y>0.5?-0.003:-0.002]); if(r.ring.length>6) r.ring.shift(); r.carry=r.carry.filter(k=>k.tb>S.T-1); }}); S.fkE.push([c.tr,-1]); }
/* взять стойку r из кармана L (ярус tier), выехать курсом d */
function pickAt(P,L,r,tier,d){ goPocket(P,L,VE,()=>{ if(tier){ P.Lf(PT-0.005,3.0); P.hold(0.2); } else P.Lf(0.0,1.0,false); });
  const c=tier?fkPickTier1(P,r):fkPickFloor(P,r); c.rs=Infinity; c.tb=Infinity; r.carry.push(c); S.fkE.push([c.tp,1]); r.at={kind:'forks'};   // rs/tb — пока не опустят
  if(tier){ P.backZ(L.lowZ,0.7); P.close(); P.Lf(0.25,3.0); P.hold(0.2); if(Math.abs(L.lowZ-L.back)>0.05){ P.fwdZ(L.back,VS); P.close(); } }   // с верхнего яруса: отъехать, чтобы стойка вышла из-под штабеля, опустить, потом дуга
  leavePocket(P,d); return c; }
/* поставить стойку на вилах в карман L (ярус tier) */
function placeAt(P,L,c,r,tier,x,y,z,yaw){ goPocket(P,L,VL,()=>{ P.Tl(-0.025,1.5); P.Lf(tier?1.75:0.25,tier?3.4:1.5); P.hold(0.2); });
  if(tier) fkPlaceTier1(P,c); else fkPlaceFloor(P,c); carryTo(c,r,x,y,z,yaw); P.Lf(0.06,tier?2.6:1.4,false,tier?2.8:1.6); }
/* места для пустых стоек: запас у магистрали (4 × 2 яруса), затем свободные ячейки ряда B (с дальнего конца), затем ряда A */
function emptyTarget(){ const sp=S.eo.filter(s=>s.tiers.length<2).sort((a,b)=>(b.tiers.length-a.tiers.length)||(a.x-b.x))[0]; if(sp) return {kind:'eo',spot:sp,tier:sp.tiers.length};
  const cells=S.cells.filter(c=>c.ok&&c.tiers.length<2&&c.tiers.every(r=>r.n===0)).sort((a,b)=>(b.row>a.row?1:b.row<a.row?-1:0)||(b.x-a.x));
  const c=cells.find(c=>c.tiers.length===1)||cells[0]; return c?{kind:'cell',cell:c,tier:c.tiers.length}:null; }
function emptySource(){ const sp=S.eo.filter(s=>s.tiers.length).sort((a,b)=>b.tiers.length-a.tiers.length)[0]; if(sp) return {kind:'eo',spot:sp,tier:sp.tiers.length-1,r:sp.tiers[sp.tiers.length-1]};
  const c=S.cells.filter(c=>c.tiers.length&&c.tiers[c.tiers.length-1].n===0).sort((a,b)=>a.x-b.x)[0]; return c?{kind:'cell',cell:c,tier:c.tiers.length-1,r:c.tiers[c.tiers.length-1]}:null; }
function takeFrom(src){ if(src.kind==='eo') src.spot.tiers.pop(); else src.cell.tiers.pop(); return src.kind==='eo'?locS(src.spot.x,src.spot.z):locCell(src.cell); }
function putTo(P,dst,c,r){ if(dst.kind==='eo'){ const sp=dst.spot; placeAt(P,locS(sp.x,sp.z),c,r,dst.tier,sp.x,dst.tier*PT,sp.z,0); r.at={kind:'eo',spot:sp,tier:dst.tier}; sp.tiers.push(r); }
  else { const cell=dst.cell; placeAt(P,locCell(cell),c,r,dst.tier,cell.x,dst.tier*PT,cell.z,cell.yaw); r.at={kind:'cell',cell,tier:dst.tier}; cell.tiers.push(r); } }
/* приёмка → ячейка */
function taskRkToCell(cell){ const P=S.fk, r=S.rk, tier=cell.tiers.length; P.tc=Math.max(P.tc,S.T);
  const [rx,rz]=RK_AT; const c=pickAt(P,locS(rx,rz),r,0,cell.x>rx?'E':'W'); S.rk=null; S.rkReady=false;
  putTo(P,{kind:'cell',cell,tier},c,r);
  const L=P.pocket; P.backZ(L.back,0.8); P.close(); P.outFn=d=>leavePocket(P,d); P.aisle=L.aisle;
  S.placed++; S.log.push('стойка '+DAYN[r.day]+' → ячейка '+cell.c.id+(tier?' · ярус 2':''));
  return {name:'в ячейку '+cell.c.id};
}
/* пустая стойка → приёмка */
function taskEoToRk(){ const P=S.fk, src=emptySource(); if(!src) return null; const r=src.r; P.tc=Math.max(P.tc,S.T);
  const L=takeFrom(src), [rx,rz]=RK_AT; const c=pickAt(P,L,r,src.tier,rx>L.x?'E':'W');
  placeAt(P,locS(rx,rz),c,r,0,rx,0,rz,0); r.at={kind:'rk'}; S.rkNext=r; S.rkReady=false; r.n=0; r.res={};
  leavePocket(P,'E');                                                          // у приёмки не стоим: вилы были бы там, где работает упаковщик
  return {name:'пустая стойка → приёмка'};
}
/* ячейка → проём кузова (держит на вилах, пока разбирают) */
function taskCellToBody(r,body){ const P=S.fk, cell=r.at.cell, tier=r.at.tier; P.tc=Math.max(P.tc,S.T);
  cell.tiers.pop(); const bx=S.bw[body][0], ZS=S.bw[body][1]+FR;
  const c=pickAt(P,locCell(cell),r,tier,bx>cell.x?'E':'W');
  const L=locS(bx,S.bw[body][1]); L.zIn=ZS-AX;
  P.toAisle('ZL',bx); const h=approach(P,bx,RHO,VL,L.need); P.arc(h==='E'?R90:L90,aL); P.close();
  P.Tl(-0.02,1.0); P.Lf(HOLDY,2.4); P.hold(0.2); c.up=P.tc; P.fwdZ(ZS-AX,0.6); P.close(); c.in=P.tc; P.hold(0.3); P.Tl(0,0.8); P.pocket=L;
  S.kzE[body].push([c.in,-0.004,0.003],[c.in+0.7,0.004,-0.003]);   // стойка касается кромки пола: кузов вздрагивает и возвращается (держит её погрузчик, не кузов)
  S.hold={rack:r,body,c,at:P.tc}; r.at={kind:'body',body};
  S.log.push('FIFO: '+DAYN[r.day]+' из '+cell.c.id+' → '+(body?'прицеп':'грузовик'));
  return {name:'стойка из '+cell.c.id+' → '+(body?'прицеп':'грузовик'),hold:true};
}
/* пустая стойка из проёма → приёмка (если там пусто и есть что выгружать), иначе в запас / свободную ячейку */
function taskBodyToEo(){ const P=S.fk, h=S.hold, r=h.rack, c=h.c, Lb=P.pocket; P.tc=Math.max(P.tc,S.T);
  S.fkE.push([P.tc,-0.75]); r.tag.visible=false; r.res={};
  P.Tl(-0.02,0.8); P.backZ(ZL-RHO,0.7); P.close(); P.Lf(0.25,2.4); P.hold(0.2); P.pocket=null;
  const toRk=!S.rk&&!S.rkNext&&(S.cn.state!=='away'||S.inLeft>0); let dst, name;
  const outDir=want=>Lb&&Lb.outBad===want?(want==='E'?'W':'E'):want;
  if(toRk){ const [rx,rz]=RK_AT; P.arc(outDir('W')==='E'?L90:R90,aR,true); P.close(); P.aisle='ZL';
    placeAt(P,locS(rx,rz),c,r,0,rx,0,rz,0); r.at={kind:'rk'}; S.rkNext=r; S.rkReady=false; r.n=0; leavePocket(P,'E'); name='приёмка'; }
  else { dst=emptyTarget(); const tx=dst.kind==='eo'?dst.spot.x:dst.cell.x; P.arc(outDir(tx>P.Ap[0]?'E':'W')==='E'?L90:R90,aR,true); P.close(); P.aisle='ZL';
    putTo(P,dst,c,r); const L=P.pocket; P.backZ(L.back,0.8); P.close(); P.outFn=d=>leavePocket(P,d); P.aisle=L.aisle; name=dst.kind==='eo'?'запас':'свободная ячейка '+dst.cell.c.id; }
  S.hold=null; return {name:'пустая стойка → '+name};
}
function fkLeavePocket(tx){ const P=S.fk; if(!P.pocket) return; if(P.aisle==='ZN') tx=Math.abs(P.Ap[0]-P1X)<Math.abs(P.Ap[0]-P2X)?P1X:P2X;   // с северной магистрали — к ближайшему проезду
  const d=tx>=P.Ap[0]?'E':'W'; P.tc=Math.max(P.tc,S.T); if(P.outFn) P.outFn(d); else leavePocket(P,d); P.outFn=null; }

/* ---------- планирование: кто что делает ---------- */
const ageOf=r=>(S.cfg().today-r.day+7)%7;                                  // возраст по бирке дня: сегодня ЧТ → ПТ/СБ/ВС — прошлая неделя, они старше ПН
function oldestRack(){ let best=null; for(const cell of S.cells){ const r=cell.tiers[cell.tiers.length-1]; if(!r||!r.n) continue;   // самая старая бирка; ячейка уходит целиком
    if(!best||ageOf(r)>ageOf(best)||(ageOf(r)===ageOf(best)&&cell.i<best.at.cell.i)) best=r; } return best; }
function cellFor(r){ const today=r.day; let c=S.cells.find(c=>c.tiers.length===1&&c.tiers[0].day===today&&c.tiers[0].n>0); if(c) return c;
  c=S.cells.find(c=>c.tiers.length===0&&c.ok); return c||null; }
function bodyNeeds(body){ if(!S.kz.lanes) return false; const need={0:9,2:3,1:4,3:4}; for(const ti in need) if(laneFree(body,+ti)<need[ti]) return false; return true; }
function crewReady(body){ return CREW[body].every(w=>S.hum[w].state==='in'&&S.hum[w].free<=S.T); }
function workersClear(){ const pw=S.hum.PW, ct=S.hum.CT; const at=(h,p)=>h.free<=S.T&&Math.hypot(h.x-p[0],h.z-p[1])<0.3; return at(pw,PK_PICK)&&at(ct,CT_WAIT); }
function planFk(){ const P=S.fk; if(S.fkTask) return;
  const kzIn=S.kz.state==='in';
  /* 1. собранная стойка — в ячейку */
  if(S.rk&&S.rkReady&&workersClear()){ const cell=cellFor(S.rk); if(cell){ fkLeavePocket(RK_AT[0]); S.fkTask=taskRkToCell(cell); S.fkTask.t1=P.tc; return; } }
  /* 2. автопоезд ждёт стойку */
  if(kzIn){ for(const body of [0,1]){ if(S.kzDone[body]) continue; if(!crewReady(body)) continue; if(!bodyNeeds(body)){ S.kzDone[body]=true; continue; }
      const r=oldestRack(); if(!r){ S.kzDone[body]=true; continue; }
      fkLeavePocket(r.at.cell.x); S.fkTask=taskCellToBody(r,body); S.fkTask.t1=P.tc; return; } }
  /* 3. приёмка пуста — привезти пустую стойку (если есть что выгружать) */
  if(!S.rk&&!S.rkNext&&(S.cn.state!=='away'||S.inLeft>0)&&emptySource()){ fkLeavePocket(14); const t=taskEoToRk(); if(t){ S.fkTask=t; S.fkTask.t1=P.tc; return; } }
}
function tickFk(){ const P=S.fk; if(S.fkTask){ if(S.fkTask.hold){ if(S.T>=S.fkTask.t1&&!S.unload) startUnload(); if(S.unload&&S.unload.done){ S.unload=null; S.fkTask=taskBodyToEo(); S.fkTask.t1=P.tc; } }
    else if(S.T>=S.fkTask.t1+0.3){ S.fkTask=null; if(S.rkNext){ S.rk=S.rkNext; S.rkNext=null; } } }
  if(!S.fkTask) planFk();
  if(S.jobs.length>40) S.jobs=S.jobs.filter(j=>!j.done);
  if(P.S.length>60){ const cut=P.S.findIndex(s=>s.t1>S.T-20); if(cut>1){ const d=P.S.splice(0,cut); d.forEach(s=>{ P.rollBase+=s.run.L*(s.rev?-1:1); }); } }
  while(P.LK.length>8&&P.LK[2][0]<S.T-30) P.LK.splice(0,2); while(P.TK.length>8&&P.TK[2][0]<S.T-30) P.TK.splice(0,2);
  S.fkE=S.fkE.filter(e=>e[0]>S.T-30);
}

/* ---------- разбор стойки в проёме (по фильму: двое, по одному коробу, своя дорожка) ---------- */
function startUnload(){ const h=S.hold, r=h.rack, body=h.body, t0=S.T+0.6, wn=CREW[body][0], ws=CREW[body][1];
  const seq={}, sideOf={}, idx={}, free={}, g={}; seq[wn]=[16,19,6,5,4,8,10,1,3]; seq[ws]=[14,15,17,18,13,12,11,7,9,0,2]; sideOf[wn]='N'; sideOf[ws]='S'; idx[wn]=idx[ws]=0; free[wn]=t0+0.6; free[ws]=t0;
  for(const w of [wn,ws]){ seq[w]=seq[w].filter(s=>r.slots[s]); } const cur={}; for(const w of CREW[body]){ const hh=S.hum[w]; cur[w]=[hh.x,hh.z]; }
  let guard=0, tEnd=t0;
  while((idx[wn]<seq[wn].length||idx[ws]<seq[ws].length)&&guard++<60){
    const cand=CREW[body].filter(w=>idx[w]<seq[w].length).sort((p,q)=>free[p]-free[q]);
    let w=null; for(const c of cand){ const s=seq[c][idx[c]]; if((DEP[s]||[]).every(d=>g[d]!==undefined||!r.slots[d])){ w=c; break; } }
    if(!w) break;
    const s=seq[w][idx[w]++], q=RSLOT[s], ti=q.ti, T=CTYPE[ti], hv=heavy(ti), cw=T.w, side=sideOf[w], H=S.hum[w], trk=H.tr, b=r.slots[s];
    const ps=[RB.x+(side==='S'?-1:1)*(0.75+0.38),Math.max(-0.05,Math.min(0.95,RB.z+q.z))], pyaw=side==='S'?PI/2:-PI/2;
    let t=free[w]+Math.max(0.4,hyp2(cur[w],ps)/1.35); trk.key(t,ps[0],ps[1],pyaw,{});
    let tw=t; (DEP[s]||[]).forEach(d=>{ if(g[d]!==undefined) tw=Math.max(tw,g[d]+0.7); }); if(tw>t+0.05){ trk.key(tw,ps[0],ps[1],pyaw,{}); t=tw; }
    trk.key(t+0.42,ps[0],ps[1],pyaw,q.y<0.6?{reach:1,bend:0.5,squat:0.3}:q.y<1.0?{reach:1,bend:0.28}:{reach:1,bend:0.08});
    const grab=t+0.48; g[s]=grab;
    trk.key(t+0.86,ps[0],ps[1],pyaw,{carry:1,cw,heavy:hv});
    const L=laneSlot2(body,side,ti); if(!L){ idx[w]=seq[w].length; continue; }
    const t1=t+0.86+Math.max(0.6,hyp2(ps,L.stand)/(1.2-0.25*hv));
    trk.key(t1,L.stand[0],L.stand[1],L.yaw,{carry:1,cw,heavy:hv});
    trk.key(t1+0.42,L.stand[0],L.stand[1],L.yaw,Object.assign({cw,heavy:hv*0.5},placePose(L.y)));
    const rel=t1+0.5; trk.key(t1+0.9,L.stand[0],L.stand[1],L.yaw,{bend:0.05});
    const bd=F.bod[body], bb=b;
    S.ev.push({T:grab-0.01,f:()=>{ takeRack(bb); job(bb,H,grab,rel,T2=>{ rackSlotPut(bb,r,s,9); },dt=>{ putSlot(bb.o,bd,L.lp.x+bb.pl.jx,L.lp.y,L.lp.z+bb.pl.jz,PI/2+bb.pl.jy,dt,bb.pl); },()=>{ bb.mode='body'; bb.body=body; bd.attach(bb.o); S.loaded++; }); }});
    S.kzE[body].push([rel,-7e-6*T.kg,2.0e-5*T.kg*L.lp.z]);                           // подвеска: ≈7 мм на тонну груза; крен — от плеча короба до оси кузова (тяжёлые D у правого борта)
    S.ev.push({T:rel,f:()=>loadAdd(body,T.kg,L.lp.x)});
    free[w]=t1+0.92; cur[w]=L.stand; tEnd=Math.max(tEnd,rel+0.5);
  }
  for(const w of CREW[body]){ const p=S.kPos[w], t=free[w]+Math.max(0.4,hyp2(cur[w],p)/1.35); S.hum[w].tr.key(t,p[0],p[1],S.kIdle[w],{}); S.hum[w].tr.fin(); S.hum[w].free=t; S.hum[w].x=p[0]; S.hum[w].z=p[1]; }
  S.unload={tEnd:tEnd+0.6,done:false};
}

/* ---------- приёмка: грузчик в кузове, лента, упаковщик, контролёр ---------- */
function newTrack(h,T){ h.tr=new Track().key(T,h.x,h.z,h.yaw,{}); return h.tr; }
function finTrack(h,x,z,yaw,T){ h.tr.key(T,x,z,yaw,{}); h.tr.fin(); h.x=x; h.z=z; h.yaw=yaw; h.free=T; }
function cnCargoBuild(){ const n=S.cfg().perTruck, boxes=[], seen={};
  for(let k=0;k<n;k++){ const ti=SEQ[k%20], b=mkBox(ti); b.sample=!seen[ti]; seen[ti]=true; b.k=k; boxes.push(b); }
  /* штабели по бокам от места грузчика (локально в кузове): колонки по три короба, ближние к грузчику — первыми, сверху вниз */
  const cols=[]; for(const B of [{x0:-3.9,x1:-1.65},{x0:1.0,x1:3.25}]) for(let z=-0.95;z<=0.95;z+=0.47) for(let x=B.x0+0.33;x<B.x1;x+=0.64) cols.push({x,z,b:[]});
  cols.sort((a,b)=>Math.abs(a.x)-Math.abs(b.x)||a.z-b.z);
  boxes.forEach((b,i)=>{ const c=cols[Math.floor(i/3)%cols.length]; c.b.push(b); });
  cols.forEach(c=>{ let y=1.28+0.02; for(let j=c.b.length-1;j>=0;j--){ const b=c.b[j], T=CTYPE[b.ti]; b.cp=[c.x,j,c.z]; b.mode='cargo';   // j=0 — верхний (снимают первым)
      b.o.position.set(c.x+(R()-.5)*0.02,y,c.z+(R()-.5)*0.02); b.o.rotation.set(0,(R()-.5)*0.04+(T.l>0.62?PI/2:0),0); F.cnT.add(b.o); y+=T.h+0.004; } });
  return boxes;
}
function tickReception(){ const cn=S.cn, T=S.T;
  /* грузчик в кузове: по одному коробу на ленту, пока лента не переполнена */
  if(cn.state==='in'&&cn.cargo.length&&S.belt.length<S.cfg().maxBelt&&S.wt.free<=T&&!S.wt.job){
    const b=cn.cargo.shift(), e=T+2.3, side=b.cp[0]<0?-1:1, low=[0.15,0.4,0.7][Math.min(2,b.cp[1])], cw=CTYPE[b.ti].w, hv=heavy(b.ti), wx=-0.32, wz=0.62;
    const WT=new Track(); WT.key(T,wx,wz,0,{}); WT.key(e-1.95,wx+0.08*side,wz-0.05,PI-0.35*side,{twist:0.25*side});
    WT.key(e-1.55,wx+0.1*side,wz-0.08,PI-0.35*side,{reach:1,bend:0.25+low*0.6,squat:low*0.35});
    WT.key(e-1.3,wx+0.1*side,wz-0.08,PI-0.35*side,{reach:0.6,carry:0.5,bend:0.2+low*0.5,squat:low*0.3,cw,heavy:hv});
    WT.key(e-0.95,wx+0.05*side,wz-0.02,PI*0.5*side,{carry:1,cw,heavy:hv,twist:-0.2*side});
    WT.key(e-0.5,wx,wz+0.06,0,{carry:1,cw,heavy:hv}); WT.key(e-0.12,wx,wz+0.1,0,{reach:0.9,carry:0.3,bend:0.3,cw}); WT.key(e+0.25,wx,wz+0.05,0,{bend:0.05}); WT.fin();
    S.wt.tr=WT; S.wt.free=e+0.3; S.wt.job=b;
    const cp=b.o.position.clone(), cq=b.o.quaternion.clone();
    S.ev.push({T:e-1.3,f:()=>{ S.grp.attach(b.o); b.mode='wt'; b.e=e; }});
    S.ev.push({T:e,f:()=>{ b.mode='belt'; b.x=0; b.v=0; b.t0=e; b.stops=[]; S.belt.push(b); S.wt.job=null; }});
  }
  /* упаковщик и контролёр: первый короб у конца ленты */
  const b0=S.belt[0]; if(b0&&!b0.taken&&b0.x>=F.bTip-F.bBase-0.01&&S.rk){
    const who=b0.sample?'CT':'PW', h=S.hum[who];
    if(h.free<=T){ const slot=freeSlot(S.rk,b0.ti); if(slot!==null){ b0.taken=true; const p=who==='PW'?planPW(b0,slot):planCT(b0,slot); S.ev.push({T:p-0.05,f:()=>{ const i=S.belt.indexOf(b0); if(i>=0) S.belt.splice(i,1); }}); } }
  }
  /* стойка собрана: бирка и этикетка — контролёр */
  if(S.rk&&!S.rkReady&&S.rk.n>=20&&S.rk.slots.every(Boolean)&&!S.rk.labeling&&S.hum.CT.free<=T&&S.rk.slots.every(b=>b.mode==='rack')) planLabel();
}
function freeSlot(r,ti){ for(let s=0;s<20;s++){ const q=RSLOT[s]; if(q.ti!==ti||r.slots[s]||r.res&&r.res[s]) continue; if((PLACE_REQ[s]||[]).every(d=>r.slots[d]||(r.res&&r.res[d]))) return s; } return null; }
function planPW(b,slot){ const h=S.hum.PW, r=S.rk, T=S.T, st=standFor(slot,'PK'), q=RSLOT[slot], ti=b.ti, cw=CTYPE[ti].w, hv=heavy(ti), carry={carry:1,cw,heavy:hv};
  r.res=r.res||{}; r.res[slot]=b; const p=T+0.45, tr=newTrack(h,T);
  tr.key(p-0.06,PK_PICK[0],PK_PICK[1]+0.03,S.pyP,{reach:1,bend:0.3}); tr.key(p+0.32,PK_PICK[0],PK_PICK[1],S.pyP-0.3,Object.assign({bend:0.08},carry));
  const via=st.f==='S'?[[4.8,10.86]]:st.f==='N'?[[4.6,13.07]]:[];
  let t=route(tr,p+0.32,[PK_PICK,...via,[st.x,st.z,st.yaw]],1.3-0.3*hv,carry);
  tr.key(t+0.42,st.x,st.z,st.yaw,Object.assign({cw,heavy:hv*0.5},placePose(q.y))); const rel=t+0.5; tr.key(t+0.9,st.x,st.z,st.yaw,{bend:0.05});
  t=route(tr,t+0.9,[[st.x,st.z],...via.slice().reverse(),[PK_PICK[0],PK_PICK[1],S.pyP]],1.45,{}); finTrack(h,PK_PICK[0],PK_PICK[1],S.pyP,t);
  job(b,h,p,rel,()=>beltPlace(b,S.T),dt=>rackSlotPut(b,r,slot,dt),()=>{ putRackLater(b,r,slot,rel); }); return p;
}
function putRackLater(b,r,slot,rel){ r.slots[slot]=b; r.n++; b.rack=r; b.slot=slot; b.mode='rack'; r.o.attach(b.o); delete r.res[slot]; }
function planCT(b,slot){ const h=S.hum.CT, r=S.rk, T=S.T, st=standFor(slot,'CT'), q=RSLOT[slot], ti=b.ti, cw=CTYPE[ti].w, hv=heavy(ti), carry={carry:1,cw,heavy:hv}, east=PI/2, north=PI;
  r.res=r.res||{}; r.res[slot]=b; const c=T+0.5, tr=newTrack(h,T);
  tr.key(c-0.05,CT_WAIT[0]-0.04,CT_WAIT[1]+0.04,S.pyC,{reach:1,bend:0.3}); tr.key(c+0.32,CT_WAIT[0],CT_WAIT[1],S.pyC+0.5,Object.assign({bend:0.08},carry));
  const tD=route(tr,c+0.32,[CT_WAIT,[DWS_PLACE[0],DWS_PLACE[1],east]],1.35-0.25*hv,carry);
  tr.key(tD+0.6,DWS_PLACE[0],DWS_PLACE[1],east,{reach:0.9,bend:0.55,squat:0.35,carry:0.2,cw}); const dws0=tD+0.66;
  tr.key(tD+1.15,DWS_VIEW[0],DWS_VIEW[1],east,{scan:1,scanner:true}); tr.key(tD+1.7,DWS_VIEW[0],DWS_VIEW[1],east+0.2,{scan:1,scanner:true});
  tr.key(tD+2.1,DWS_VIEW[0],DWS_VIEW[1],north+0.25,{look:0.2}); const scan0=tD+2.2, scan1=scan0+2.0;
  tr.key(scan1+0.5,DWS_VIEW[0],DWS_VIEW[1],north+0.25,{look:-0.1}); tr.key(scan1+0.9,DWS_PLACE[0],DWS_PLACE[1],east,{});
  tr.key(scan1+1.3,DWS_PLACE[0],DWS_PLACE[1],east,{reach:0.9,bend:0.55,squat:0.35,carry:0.2,cw}); const dws1=scan1+1.35;
  tr.key(scan1+1.72,DWS_PLACE[0],DWS_PLACE[1],east,carry);
  const tE=route(tr,scan1+1.72,[DWS_PLACE,[st.x,st.z,st.yaw]],1.3-0.25*hv,carry);
  tr.key(tE+0.42,st.x,st.z,st.yaw,Object.assign({cw,heavy:hv*0.5},placePose(q.y))); const rel=tE+0.5; tr.key(tE+0.9,st.x,st.z,st.yaw,{bend:0.05});
  const back=route(tr,tE+0.9,[[st.x,st.z],[6.8,10.8],[CT_WAIT[0],CT_WAIT[1],S.pyC]],1.45,{}); finTrack(h,CT_WAIT[0],CT_WAIT[1],S.pyC,back);
  S.dws.job={b,dws0,dws1,scan0,scan1,ti};
  job(b,h,c,dws0,()=>beltPlace(b,S.T),dt=>putSlot(b.o,F.dws,-0.2,0.062,0,0,dt,b.pl),()=>{ b.mode='dws'; b.t0=dws0;
    S.ev.push({T:dws1-0.01,f:()=>{ job(b,h,dws1,rel,()=>putSlot(b.o,F.dws,-0.2,0.062,0,0,9,b.pl),dt=>rackSlotPut(b,r,slot,dt),()=>{ putRackLater(b,r,slot,rel); }); }}); });
  return c;
}
function planLabel(){ const h=S.hum.CT, r=S.rk, T=S.T, tr=newTrack(h,T); r.labeling=true;
  const tL=route(tr,T+0.3,[CT_WAIT,[6.8,10.75],[6.95,13.0],[LABEL_AT[0],LABEL_AT[1],PI]],1.4,{});
  tr.key(tL+0.7,LABEL_AT[0],LABEL_AT[1],PI,{reach:0.85,bend:0.1}); tr.key(tL+1.2,LABEL_AT[0],LABEL_AT[1],PI,{scan:1,scanner:true}); tr.key(tL+1.7,LABEL_AT[0],LABEL_AT[1],PI,{scan:1,scanner:true});
  const back=route(tr,tL+1.9,[[LABEL_AT[0],LABEL_AT[1]],[7.0,13.05],[CT_WAIT[0],CT_WAIT[1],S.pyC]],1.4,{}); finTrack(h,CT_WAIT[0],CT_WAIT[1],S.pyC,back);
  S.ev.push({T:tL+0.7,f:()=>{ const today=S.cfg().today; if(r.day!==today||!r.tag.visible){ r.o.remove(r.tag); r.tag=dayTag(r.o,-0.5,1.24,0.765,today); } r.tag.visible=true; r.labeling=false; S.rkReady=true; r.day=today; }});
}

/* ---------- машины ---------- */
function tickTrucks(){ const T=S.T, cn=S.cn, kz=S.kz;
  /* из Китая: приезд, выгрузка, отъезд */
  if(cn.state==='away'&&S.inLeft>0&&!S.cnNext){ S.cnNext=T+(cn.n?25:3); }
  if(cn.state==='away'&&S.cnNext&&T>=S.cnNext){ const c0=F.cn0; cn.path=mkPath([{t0:T,t1:T+9,pts:[[c0.x,c0.z-58],[c0.x,c0.z-20],[c0.x,c0.z]],ease:'brake',u0:0.5}]);
    cn.state='arrive'; cn.n++; S.inLeft--; S.cnNext=null; F.cnT.visible=true; cn.cargo=cnCargoBuild(); cn.t0=T; cn.tag=null; S.log.push('машина из Китая №'+cn.n+' — к Л2'); }
  if(cn.state==='arrive'){ doorSet(DOOR.L2,kv(T,[[cn.t0+5.5,0],[cn.t0+8.0,0.97]])); if(T>=cn.t0+9.3){ cn.state='in'; F.WTr.visible=true; S.wt.free=T+1.2; } }
  if(cn.state==='in'&&!cn.cargo.length&&!S.wt.job){ cn.state='leave'; cn.t1=T+2.0; const c0=F.cn0; cn.path=mkPath([{t0:cn.t1,t1:cn.t1+10,pts:[[c0.x,c0.z],[c0.x,c0.z+16],[c0.x,c0.z+60]],ease:'go',u0:0.45}]);
    S.ev.push({T:cn.t1-0.2,f:()=>{ F.WTr.visible=false; }}); S.log.push('машина из Китая №'+cn.n+' выгружена, уезжает'); }
  if(cn.state==='leave'){ doorSet(DOOR.L2,kv(T,[[cn.t1+1.5,0.97],[cn.t1+4.0,0]])); if(T>=cn.t1+10.5){ cn.state='away'; F.cnT.visible=false; F.cnT.position.z=F.cn0.z-70; } }
  /* автопоезд: пока есть что грузить */
  const haveCargo=S.cells.some(c=>c.tiers.some(r=>r.n>0))||S.rk&&S.rk.n>0||cn.state!=='away'||S.inLeft>0;
  if(kz.state==='away'&&!S.kzNext&&haveCargo) S.kzNext=T+(kz.n?30:40);
  if(kz.state==='away'&&S.kzNext&&T>=S.kzNext&&S.cells.some(c=>c.tiers.some(r=>r.n>0))){ const k0=F.kz0; kz.t0=T; kz.path=mkPath([{t0:T+3.2,t1:T+14.2,pts:[[k0.x+34,k0.z],[k0.x+14,k0.z],[k0.x,k0.z]],ease:'brake',u0:0.5}]);
    kz.state='arrive'; kz.n++; S.kzNext=null; F.kzT.visible=true; kz.lanes=[0,1].map(()=>({S:{0:0,1:0,2:0,3:0},N:{0:0,1:0,2:0,3:0}})); S.kzDone=[false,false]; S.kzE=[[],[]]; S.kzB0=[[0,0],[0,0]]; loadReset();
    { const gone=[]; F.bod.forEach(b=>b.traverse(o=>{ if(o.userData.simBox&&o.userData.simBox.mode==='body') gone.push(o); })); gone.forEach(o=>{ S.grp.attach(o); o.visible=false; o.userData.simBox.mode='gone'; }); }   // груз прошлого рейса уехал
    S.log.push('автопоезд №'+kz.n+' — через П2 на пост'); }
  if(kz.state==='arrive'){ doorSet(DOOR.P2,kv(T,[[kz.t0,0],[kz.t0+2.6,1],[kz.t0+15.4,1],[kz.t0+18.2,0]]));
    if(T>=kz.t0+14.4){ kz.state='in'; kz.tIn=T; CHOCKS.visible=false; S.ev.push({T:T+1.4,f:()=>{ CHOCKS.visible=true; }});
      CREW.forEach((cw,r)=>{ const t=T+1.8+r*0.3; planCrewIn(cw,r,t); }); } }
  if(kz.state==='in'){ const allDone=S.kzDone&&S.kzDone[0]&&S.kzDone[1]&&!S.fkTask&&!S.hold;
    if(allDone&&!kz.finishing){ kz.finishing=true; planCrewOut(); } }
  if(kz.state==='leave'){ doorSet(DOOR.P2,kv(T,[[kz.t1-3.4,0],[kz.t1-0.8,1],[kz.t1+12,1],[kz.t1+14.5,0]])); if(T>=kz.t1+12.5){ kz.state='away'; kz.finishing=false; F.kzT.visible=false; F.kzT.position.x=F.kz0.x+40; } }
}
function inBody(r,x,z){ const p=F.bod[r].localToWorld(V(x,0,z)); return [p.x,p.z]; }
function planCrewIn(cw,r,t){ const [wn,ws]=cw, byaw=F.kz0.r, yAlong=d=>byaw+(d>0?PI/2:-PI/2), [XO,XC]=S.cEdge, xin={[wn]:0.45,[ws]:-0.45};
  const cop0=t+0.4, cop1=cop0+3.6, tci={[wn]:cop1+0.7,[ws]:cop1+3.4};
  S.kzCurt=S.kzCurt||[]; S.kzCurt[r]={t0:cop0,t1:cop1,open:true};
  for(const w of cw){ const h=S.hum[w], tr=newTrack(h,S.T); let tt=t;
    if(w===ws){ const p0=inBody(r,XC+0.35,1.68), p1=inBody(r,XO+0.35,1.68);
      tr.key(cop0-0.3,p0[0],p0[1],yAlong(-1),{}); tr.key(cop0,p0[0],p0[1],yAlong(-1),{reach:0.75,bend:0.06}); tr.key(cop1,p1[0],p1[1],yAlong(-1),{reach:0.75,bend:0.06}); tr.key(cop1+0.4,p1[0],p1[1],yAlong(-1),{}); tt=cop1+0.4; }
    const q=inBody(r,xin[w],1.62); tr.key(Math.max(tt+0.4,tci[w]-0.35),q[0],q[1],byaw+PI,{}); tr.key(tci[w],q[0],q[1],byaw+PI,{reach:0.85,bend:0.35}); tr.fin();
    h.state='walkIn'; h.ci={t:tci[w],x:xin[w]}; h.free=tci[w]+2.4; S.kzE[r].push([tci[w]+0.5,-0.0012,0.0008]);
    S.ev.push({T:tci[w]+0.9,f:()=>{ h.state='in'; h.tr=new Track().key(tci[w]+0.9,xin[w],0.95,PI,{}).key(tci[w]+2.3,S.kPos[w][0],S.kPos[w][1],S.kIdle[w],{}).fin(); h.x=S.kPos[w][0]; h.z=S.kPos[w][1]; h.yaw=S.kIdle[w]; }}); }
}
function planCrewOut(){ const kz=S.kz, T=S.T, byaw=F.kz0.r, yAlong=d=>byaw+(d>0?PI/2:-PI/2), [XO,XC]=S.cEdge;
  let tj0=T+1.5, last=T;
  CREW.forEach((cw,r)=>{ const bx=S.bw[r][0], [wn,ws]=cw; const tj=Math.max(S.hum[wn].free,S.hum[ws].free,tj0)+1.0;
    [[ws,-0.45,tj,[bx-3.4,13.2,PI]],[wn,0.45,tj+1.0,[bx+3.3,13.2,PI]]].forEach(([w,xj,tjw,pt])=>{ const h=S.hum[w], trk=h.tr;
      trk.key(Math.max(h.free,tjw-2.4),h.x,h.z,h.yaw,{}); trk.key(tjw-0.8,xj,0.9,0,{}); trk.key(tjw-0.12,xj,0.93,0,{squat:0.5,bend:0.25}); trk.key(tjw,xj,0.95,0,{squat:0.3,reach:0.35}); trk.fin();
      const b=F.bod[r], s=b.localToWorld(V(xj,BEDY,0.95)), e=b.localToWorld(V(xj,0,1.73)), e2=inBody(r,xj,1.8), W=new Track();
      const tf=(0.225+Math.sqrt(0.225*0.225+4*4.905*BEDY))/9.81;
      W.key(tjw+tf,e.x,e.z,byaw,{squat:0.3,bend:0.1,reach:0.3}); W.key(tjw+tf+0.15,e.x,e.z,byaw,{squat:0.72,bend:0.35}); W.key(tjw+tf+0.8,e2[0],e2[1],byaw,{});
      const ta=route(W,tjw+tf+0.8,[e2,pt],1.35,{}); h.J={tj:tjw,tf,s,e,W,last:pt}; h.state='inJump'; h.free=ta; last=Math.max(last,ta);
      S.ev.push({T:tjw,f:()=>{ h.state='jump'; }}); S.ev.push({T:tjw+tf,f:()=>{ h.state='out'; h.tr=W; h.x=pt[0]; h.z=pt[1]; h.yaw=pt[2]; }});
      S.kzE[r].push([tjw,0.0012,-0.0008]); }); tj0=tj+1.0; });
  /* кладовщик фотографирует, K2/K4 закрывают шторы, упоры убраны, выезд задним ходом */
  const tw=last+0.5, w3=S.hum.W3, w3x=S.bw[1][0]+1.1, ly=PI+0.12, tr3=newTrack(w3,T);
  const twa=route(tr3,tw,[[w3.x,w3.z],[47.0,8.6],[47.0,12.7],[w3x,13.75,ly]],1.35,{});
  tr3.key(twa+0.5,w3x,13.75,ly,{scan:1,scanner:true}); tr3.key(twa+1.9,w3x,13.75,ly,{scan:1,scanner:true});
  const tb=route(tr3,twa+2.3,[[w3x,13.75],[47.0,12.7],[47.0,8.6],[46.5,7.5,0]],1.3,{}); finTrack(w3,46.5,7.5,0,tb);
  const curt0=twa+2.5, curt1=curt0+4.2; kz.t1=curt1+3.0;
  [['K2',0],['K4',1]].forEach(([w,r])=>{ const h=S.hum[w], W=h.J.W, p0=inBody(r,XO-0.35,1.68), p1=inBody(r,XC-0.35,1.68), p2=inBody(r,XC-0.9,2.6);
    W.key(curt0-3.0,h.J.last[0],h.J.last[1],h.J.last[2],{}); W.key(curt0-0.5,p0[0],p0[1],yAlong(1),{}); W.key(curt0,p0[0],p0[1],yAlong(1),{reach:0.75,bend:0.06});
    W.key(curt1,p1[0],p1[1],yAlong(1),{reach:0.75,bend:0.06}); W.key(curt1+0.4,p1[0],p1[1],yAlong(1),{}); W.key(curt1+1.4,p2[0],p2[1],byaw+PI,{}); W.fin(); h.x=p2[0]; h.z=p2[1]; h.yaw=byaw+PI; h.free=curt1+1.4;
    S.kzCurt[r]={t0:curt0,t1:curt1,open:false}; });
  S.ev.push({T:curt0-1.0,f:()=>{ CHOCKS.visible=false; }});
  const k0=F.kz0; kz.path=mkPath([{t0:kz.t1,t1:kz.t1+12,pts:[[k0.x,k0.z],[k0.x+12,k0.z],[k0.x+36,k0.z]],ease:'go',u0:0.45,rev:true}]);
  S.ev.push({T:kz.t1-0.5,f:()=>{ kz.state='leave'; S.outN++; S.log.push('автопоезд №'+kz.n+' загружен: '+S.loaded+' коробов всего · выезд через П2');
    CREW.flat().forEach(w=>{ const h=S.hum[w]; S.ev.push({T:kz.t1+13,f:()=>{ h.state='wait'; const tr=newTrack(h,S.T); const ta=route(tr,S.T+0.5,[[h.x,h.z],[h.spot[0],h.spot[1],PI]],1.3,{}); finTrack(h,h.spot[0],h.spot[1],PI,ta); }}); }); }});
}

/* ---------- шаг времени ---------- */
function substep(dt){ const T=S.T+dt;
  /* события */
  S.ev.sort((a,b)=>a.T-b.T); while(S.ev.length&&S.ev[0].T<=T){ const e=S.ev.shift(); e.f(); }
  /* лента: накопление */
  const Lb=F.bTip-F.bBase, LW=Lb-0.34, kS=Lb/LW;
  for(let i=0;i<S.belt.length;i++){ const b=S.belt[i]; let lim=Lb; if(i>0){ const p=S.belt[i-1]; lim=Math.min(lim,p.x-((CTYPE[p.ti].l+CTYPE[b.ti].l)/2+0.04)*kS); }
    const vf=b.v+(BELTV-b.v)*(1-Math.exp(-dt/SLIP)); let xn=b.x+(b.v+vf)/2*dt;
    if(xn>=lim){ if(b.x<lim-1e-4&&vf>0.2&&b.stops.length<6) b.stops.push(T); xn=Math.max(b.x,lim); b.v=0; } else b.v=vf; b.x=xn; }
  S.T=T;
  tickReception(); tickTrucks(); tickFk();
  if(S.unload&&!S.unload.done&&T>=S.unload.tEnd) S.unload.done=true;
  /* пружины: погрузчик и стойка на вилах (вход — кинематика пути), машины */
  const P=S.fk, on=P.S.length&&T<P.S[P.S.length-1].t1+1; const k=on?kin(P.S,T):{v:0,w:0,af:0}; S.kinFk=k;
  S.fkPitch=S.spr.fkP.step(-k.af*0.0042,dt); S.sw.p=S.spr.rkP.step(-k.af*0.0048,dt); S.sw.r=S.spr.rkR.step(-k.v*k.w*0.007,dt);
  const acc=(path,st)=>{ if(!path) return 0; const s=path[0]; if(T<s.t0+0.45||T>s.t1+0.05) return 0; return accSm(path,T)*(s.rev?-1:1); };
  const ca=S.cn.path&&(S.cn.state==='arrive'||S.cn.state==='leave')?acc(S.cn.path):0, ka=S.kz.path&&(S.kz.state==='arrive'||S.kz.state==='leave')?acc(S.kz.path):0;
  S.cnB=S.spr.cnB.step(-ca*0.0011,dt); S.cnC=S.spr.cnC.step(-ca*0.0055,dt); S.kzB=S.spr.kzB.step(-ka*0.0010,dt); S.kzC=S.spr.kzC.step(-ka*0.0050,dt);
  /* конец цикла: груза нет, машин нет — через 12 с всё заново */
  if(!S.done){ const empty=!S.cells.some(c=>c.tiers.some(r=>r.n>0))&&!(S.rk&&S.rk.n>0)&&S.inLeft<=0&&S.cn.state==='away'&&S.kz.state==='away'&&!S.fkTask&&!S.belt.length;
    if(empty){ S.done=true; S.endT=T+12; S.log.push('склад пуст — цикл завершён, через 12 с начнётся заново'); } }
}
function applyVis(T){
  const P=S.fk;
  /* погрузчик */
  { const fp=P.S.length?pathAt(P.S,T):{x:P.Ap[0]-Math.sin(P.yw)*AX,z:P.Ap[1]-Math.cos(P.yw)*AX,yaw:P.yw,mv:false,sgn:1}, fl=kv(T,P.LK), ftl=kv(T,P.TK), k=S.kinFk||{v:0,w:0};
    const pitch=S.fkPitch+0.0045*sumE(S.fkE,T,u=>stepR(u,14,0.3));
    F.fk.position.set(fp.x,0,fp.z); F.fk.rotation.set(pitch,fp.yaw,0);
    let rr=P.rollBase; for(const s of P.S){ if(T<=s.t0) break; const q=pathAt([s],Math.min(T,s.t1)); rr+=(q.dist-s.d0)*(s.rev?-1:1); }
    const steer=fp.mv?Math.max(-1.25,Math.min(1.25,Math.atan2(1.54*k.w,Math.abs(k.v)+0.12)*(k.v<0?-1:1))):0;
    fkSet(F.fk,fl,rr,-steer,ftl); const Rg=F.fk.userData.rig; Rg.blueF.visible=fp.mv&&fp.sgn>0; Rg.blueB.visible=fp.mv&&fp.sgn<0; F.fk.updateMatrixWorld(true);
    const ring=sumE(S.fkE,T,u=>ringR(u,11,2.6))*0.004; F.sw={r:S.sw.r+0.0012*noise1(T,7.3,1.7)*Math.min(1,Math.abs(k.v)/1.5),p:S.sw.p+ring};
    let bk=0; { let s=0,n=0; for(let j=-4;j<=7;j++){ const t2=T+j*0.1, p2=P.S.length?pathAt(P.S,t2):null; s+=p2&&p2.mv&&p2.sgn<0?1:0; n++; } const u=s/n; bk=u*u*(3-2*u); } Rg.drv.back=bk; }
  /* машины */
  { const cn=S.cn; if(cn.path&&(cn.state==='arrive'||cn.state==='leave')){ const p=pathAt(cn.path,T); F.cnT.position.set(p.x,F.cn0.y,p.z); const r=roll(cn.path,T); F.cnW.forEach(w=>w.rotation.z=r/w.userData.r); }
    F.cnT.rotation.set(0,F.cn0.r,S.cnB||0); if(F.cnCab) F.cnCab.rotation.z=S.cnC||0;
    const kz=S.kz; if(kz.path&&(kz.state==='arrive'||kz.state==='leave')){ const p=pathAt(kz.path,T); F.kzT.position.set(p.x,F.kz0.y,p.z); const r=roll(kz.path,T); F.kzW.forEach(w=>w.rotation.z=r/w.userData.r); }
    F.kzT.rotation.set(0,F.kz0.r,S.kzB||0); if(F.kzCab) F.kzCab.rotation.z=S.kzC||0;
    F.bod.forEach((b,i)=>{ const E=S.kzE[i], B0=(S.kzB0||[[0,0],[0,0]])[i]; let rl=B0[1], y=B0[0]; for(const e of E){ if(T>e[0]&&T<e[0]+6){ rl+=e[2]*stepR(T-e[0],7.6,0.22); y+=e[1]*stepR(T-e[0],8.8,0.24); } else if(T>=e[0]+6){ rl+=e[2]; y+=e[1]; } } b.position.y=y; b.rotation.x=rl;
      const C=S.kzCurt&&S.kzCurt[i]; if(C){ const d=C.t1-C.t0, edge=(s,dur)=>trap(c01(s),Math.min(0.45,0.35/dur+0.05)); const yv=C.open?edge((T-C.t0)/d,d):1-edge((T-C.t0)/d,d); curtainSet(b,0.5-Math.sin(Math.asin(1-2*yv)/3)); } });
    F.kzT.updateMatrixWorld(true);
    if(!S.kzB0) S.kzB0=[[0,0],[0,0]];                             // старые (отыгравшие) события — в базу, чтобы просадка и крен от всего груза не терялись
    S.kzE.forEach((E,i)=>{ while(E.length>40&&E[0][0]+6<T){ const e=E.shift(); S.kzB0[i][0]+=e[1]; S.kzB0[i][1]+=e[2]; } }); }
  /* грузчик в кузове, лента */
  if(F.boom){ F.boom.updateMatrixWorld(true); if(S.cn.state==='in') F.tlRuns.forEach(b=>{ b.tex.offset.x=(((-Math.sign(b.sp||1)*0.55*T)%1)+1)%1; }); }
  if(F.WTr.visible){ const st=S.wt.tr?S.wt.tr.at(T):{x:-0.32,z:0.62,yaw:0,pose:{},walk:0,phase:0}; F.WTr.position.set(st.x,F.WTy,st.z); F.WTr.rotation.y=st.yaw; HUM.pose(F.WT,Object.assign({t:T,walk:st.walk*0.6,phase:st.phase},st.pose)); }
  /* стойки (сначала — чтобы короба в них встали на место) */
  for(const r of S.racks) rackFrame2(r,T);
  /* люди */
  for(const key in S.hum){ const h=S.hum[key], H=h.H; if(!H) continue;
    if(h.state==='in'||h.state==='inJump'){ const r=h.body, b=F.bod[r]; b.getWorldQuaternion(_q); _eu.setFromQuaternion(_q,'YXZ'); const byaw=_eu.y; const st=h.tr.at(T);
      b.localToWorld(_v.set(st.x,BEDY,st.z)); H.root.position.copy(_v); H.root.rotation.y=st.yaw+byaw; HUM.pose(H,Object.assign({t:T,walk:st.walk,phase:st.phase},st.pose)); }
    else if(h.state==='walkIn'){ const ci=h.ci, r=h.body, b=F.bod[r]; b.getWorldQuaternion(_q); _eu.setFromQuaternion(_q,'YXZ'); const byaw=_eu.y;
      if(T<ci.t) drive(H,h.tr.at(T),T); else { const u=c01((T-ci.t)/0.9); b.localToWorld(_v.set(ci.x,BEDY*ez(Math.min(1,u*1.3)),lerp(1.62,0.95,ez(c01(u*1.5-0.4))))); H.root.position.copy(_v); H.root.rotation.y=byaw+PI; HUM.pose(H,{t:T,reach:0.85*(1-u),bend:0.1+0.55*Math.sin(u*PI),squat:0.6*Math.sin(u*PI)}); } }
    else if(h.state==='jump'){ const J=h.J, r=h.body, b=F.bod[r]; b.getWorldQuaternion(_q); _eu.setFromQuaternion(_q,'YXZ'); const byaw=_eu.y; const u=c01((T-J.tj)/J.tf), tt=T-J.tj;
      H.root.position.set(lerp(J.s.x,J.e.x,u),Math.max(0,J.s.y+0.225*tt-4.905*tt*tt),lerp(J.s.z,J.e.z,u)); H.root.rotation.y=byaw; HUM.pose(H,{t:T,squat:0.3-0.12*Math.sin(u*PI),reach:0.4,bend:0.12}); }
    else drive(H,h.tr.at(T),T); }
  if(F.SUP){ F.SUP.root.position.set(10.3,0,13.2); F.SUP.root.rotation.y=-2.0; HUM.pose(F.SUP,{t:T,look:Math.sin(T*0.4)*0.5}); }
  /* короба */
  for(const b of S.boxes){ if(b.mode==='wt'){ inHands(F.WT,b.o); const u=(T-(b.e-0.32))/0.32; if(u>0){ _p0.copy(b.o.position); _q0.copy(b.o.quaternion); const bx=b.x; b.x=0; b.stops=b.stops||[]; b.t0=b.t0||b.e; beltPlace(b,b.e); b.o.position.lerpVectors(_p0,b.o.position,ez(u)); b.o.position.y+=0.10*Math.sin(PI*c01(u)); b.o.quaternion.copy(_q0.slerp(b.o.quaternion,ez(u))); } }
    else boxFrame(b,T); }
  /* DWS */
  { const J=S.dws.job; let si=0, on=false, sp=0; if(J&&T>=J.dws0&&T<J.dws1){ si=1; if(T>=J.scan0&&T<J.scan1){ on=true; sp=(T-J.scan0)/(J.scan1-J.scan0); } if(T>=J.scan1) si=2+J.ti; }
    F.lm.opacity=on?0.24+0.08*Math.sin(T*55):0; F.lasers.forEach(l=>l.visible=on);
    if(F.scan){ F.scan.visible=on; const hh=J?CTYPE[J.ti].h:0.4; F.scan.position.set(-0.2+(sp<0.5?-0.35+sp*1.4:0.35-(sp-0.5)*1.4),0.062+hh+0.003,0); }
    if(F.dwsScr) F.dwsScr.material=F.scr[si]; }
  PEOPLE.forEach(H=>{ if(H===F.PW||H===F.WP||H===F.SUP) return; if(H.root.parent&&H.root.visible) HUM.pose(H,Object.assign({t:T},H.base)); });
}
SIM.tick=function(dt){ if(!SIM.on) return; let left=Math.min(dt,0.25)*SIM.speed; const h=1/60;
  while(left>1e-6){ const d=Math.min(h,left); substep(d); left-=d; }
  if(S.done&&S.T>=S.endT){ teardown(); setup(); }
  applyVis(S.T); SIM.T=S.T; SIM.stat=status(); };
/* ---------- масса груза в кузовах и нагрузки на оси (оценка по рычагу) ----------
   Грузовик: передняя ось под кабиной (x −12,9), задняя тележка (x −3,9); прицеп с центральными осями — почти весь груз на его осях.
   Положение короба вдоль кузова lp.x → плечо до осей. Собственная масса не учитывается: показывается прибавка от груза. */
const AXF=-12.9, AXR=-3.875, KZO1=-5.8;
function loadReset(){ S.load=[{m:0,mx:0},{m:0,mx:0}]; }
function loadAdd(body,kg,lx){ if(!S.load) loadReset(); const L=S.load[body]; L.m+=kg; L.mx+=kg*lx; }
function axleInfo(){ if(!S.load) return null; const a=S.load[0], b=S.load[1];
  const xb=a.m?KZO1+a.mx/a.m:0, fr=a.m?a.m*Math.max(0,Math.min(1,(AXR-xb)/(AXR-AXF))):0;
  return {m1:a.m,m2:b.m,front:fr,rear:a.m-fr,cg1:a.m?a.mx/a.m:0,cg2:b.m?b.mx/b.m:0}; }
SIM.axles=axleInfo;
const tt=v=>(v/1000).toFixed(2).replace('.',',');
function status(){ const racks=S.cells.reduce((a,c)=>a+c.tiers.filter(r=>r.n>0).length,0), boxes=S.cells.reduce((a,c)=>a+c.tiers.reduce((s,r)=>s+r.n,0),0);
  const t=S.T, mm=Math.floor(t/60), ss=Math.floor(t%60);
  const now=S.fkTask?S.fkTask.name:'погрузчик ждёт';
  return `цикл ${S.cycle} · ${mm}:${String(ss).padStart(2,'0')} · в ячейках ${racks} стоек / ${boxes} коробов · машин из Китая осталось ${S.inLeft+(S.cn.state!=='away'?1:0)} · автопоездов загружено ${S.outN} · погружено ${S.loaded}${(()=>{ const A=axleInfo(); return A&&(A.m1+A.m2)>0?` · в кузовах ${tt(A.m1)} + ${tt(A.m2)} т (оси грузовика +${tt(A.front)} / +${tt(A.rear)} т)`:''; })()} · ${now}`; }
SIM.enter=function(){ if(SIM.on) return; if(F.on) exit(); prepScene(true);
  const keep=new Set([F.fk,F.CT.root,F.W3.root,F.W5.root,F.W4.root,F.tl2,F.dws].concat(Object.values(F.KH).map(H=>H.root)));
  S.filmVis=F.grp.children.map(o=>[o,o.visible]); F.grp.children.forEach(o=>{ o.visible=keep.has(o); });
  setup(); SIM.on=true; SIM.T=0; applyVis(0); if(SIM.onChange) SIM.onChange(); };
SIM.exit=function(){ if(!SIM.on) return; SIM.on=false; teardown(); (S.filmVis||[]).forEach(([o,v])=>o.visible=v); unprepScene(); if(SIM.onChange) SIM.onChange(); };
SIM.state=()=>S; SIM.log=()=>S.log;
SIM.owns=H=>SIM.on&&(H===F.PW||H===F.WP||H===F.SUP);
/* ---------- кнопки: запуск, скорость, строка состояния ---------- */
{ const bt=mkBtn('▶ Живой процесс · непрерывно',true,()=>{ if(SIM.on) SIM.exit(); else SIM.enter(); });
  bt.title='Склад работает сам, в реальном времени: выгрузка машин из Китая, DWS, стойки в ячейки, автопоезд грузится по FIFO до полного и уезжает — пока ячейки не опустеют; затем всё заново. Зайдите в режим обхода и смотрите изнутри.';
  const sp=document.createElement('div'); sp.style.cssText='display:none;gap:4px;margin:2px 0 6px'; sp.id='simspeed';
  [1,4,16].forEach(k=>{ const b=document.createElement('button'); b.textContent='×'+k; b.style.flex='1'; b.onclick=()=>{ SIM.speed=k; sp.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); }; if(k===1) b.className='on'; sp.appendChild(b); });
  bt.parentNode.insertBefore(sp,bt.nextSibling);
  const st=document.createElement('div'); st.id='simstat'; st.style.cssText='display:none;position:absolute;left:50%;bottom:40px;transform:translateX(-50%);max-width:88%;z-index:25;background:rgba(10,14,20,.78);color:#e9ecef;border:1px solid rgba(242,183,5,.5);border-radius:6px;padding:6px 12px;font:500 12px/1.4 system-ui,sans-serif;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
  view.appendChild(st);
  SIM.onChange=()=>{ bt.classList.toggle('on',SIM.on); bt.textContent=SIM.on?'■ Остановить живой процесс':'▶ Живой процесс · непрерывно'; sp.style.display=SIM.on?'flex':'none'; st.style.display=SIM.on?'block':'none'; };
  SIM.ui=()=>{ if(SIM.on) st.textContent=SIM.stat; };
}
})();
