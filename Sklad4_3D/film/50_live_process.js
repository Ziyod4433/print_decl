/* ===================== ЖИВОЙ ПРОЦЕСС: непрерывный цикл склада в реальном времени =====================
   Отличие от фильма: здесь нет заранее написанного сценария. Склад живёт как система с состоянием:
   машины из Китая приходят (к Л2 или через П1) и выгружаются лентой; в машине — груз трёх клиентов, у каждого 4–5 SKU своего
   размера и веса. Короба клиента собираются в его стоечный поддон (на приёмке два места: пока собранную стойку увозят в ячейку,
   на втором месте собирается следующий клиент), а с каждого SKU один короб — образец — кладут в отдельный поддон образцов рядом
   с местом разгрузки. Машина выгружена — погрузчик везёт поддон образцов в зону DWS (бывшие брак, АКБ, упаковка, доски): мелкие
   образцы (A, B) замеряет ленточный Goodscan, крупные (C, D) — портальный DWS; замеренные ложатся на второй поддон, он получает
   бирку дня и уходит в ячейку. Потом автопоезд встаёт на пост П2, погрузчик подаёт стойки в проёмы по FIFO, пока оба кузова
   не заполнятся; автопоезд уезжает, приходит следующая машина из Китая — пока в ячейках есть груз; тогда цикл начинается заново.
   Каждый участник решает, что делать, по текущему состоянию: человек не идёт туда, где по плану поедет погрузчик, погрузчик
   не заезжает в карман, куда идёт человек; движение и физика — те же, что в фильме. */
const SIM=window.SIM=F.SIM={on:false,speed:1,T:0,cfg:{inTrucks:2,today:3,maxBelt:9,variant:(window.__SIMV|0)===2?2:1},st:null,stat:''};   // __SIMV — вариант приёмки для проверок (simrun/simshot: SIMV=2)
(function(){
const PI=Math.PI, L90=-PI/2, R90=PI/2, PT=RACK.PITCH;
const VE=1.9, VL=1.5, VS=0.55, VR=1.0, aE=0.85, aL=0.65, aR=0.55, ACC=0.6, DEC=0.8;
const P1X=18.8, P2X=35.1;                                   // проезды между секциями
const ZN=26.3;                                               // северная магистраль симуляции: между стойками ряда B (до z 24,5) и ограждениями колонн (от z 27,8)
const RAILS=[16.42,20.38,32.42,36.38];                       // стойки ограждений проездов (ряд A, z 18,0…20,85): разворот на южной магистрали — не рядом с ними
const PLACE_REQ={7:[0],8:[1],9:[2],10:[3],5:[4],6:[5],12:[11],13:[12],14:[7],15:[7,8],16:[8],17:[9],18:[9,10],19:[10]};   // что должно лежать ниже
const DEP={7:[14,15],8:[15,16],9:[17,18],10:[18,19],0:[7],1:[8],2:[9],3:[10],5:[6],4:[5],12:[13],11:[12]};               // что снять раньше
let rng=1; const R=()=>{ rng=(rng*1664525+1013904223)>>>0; return rng/4294967296; };
const hyp2=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const TRUCK_CL=[[0,1,2],[3,4,5]];                            // клиенты в первой и второй машине цикла (CLIENTS в parts/sku.js)

/* ---------- два варианта приёмки (SIM.cfg.variant) ----------
   1 — машина из Китая стоит на площадке у Л2 (на метр ниже пола), конвейер выходит через ворота и заходит в кузов сбоку;
   2 — машина задним ходом заезжает через П1 и встаёт на полосе Л1–П1 кабиной к П1; конвейер стоит на полосе западнее кузова
       и заходит в него через распахнутые задние двери; стойки собираются южнее полосы, погрузчик берёт их с северной магистрали.
   RKS — два места стоек клиентов (rkYaw — их курс: с северной магистрали погрузчик ставит стойку развёрнутой), SPP — поддон
   образцов, PK/CT — где ждут упаковщик и контролёр (у конца ленты), tl — куда ставится конвейер фильма, eos — запас пустых,
   fk0 — старт погрузчика, SUP — где стоит старший смены, hideP — штатный человек, который мешал бы на этом варианте,
   nav — дорожки людей у приёмки и путь в зону DWS [x0,z0,x1,z1,цена] (сторона, откуда заезжает погрузчик, дороже),
   wt — грузчик в кузове (место и куда смотрит нос ленты, локально в кузове), hideX — штатный груз кузова западнее этой x
   скрывается, blocks — площадки, на которых лежит груз нашей машины (локально в кузове); nogo — где у хвоста конвейера не встать,
   faces — с каких граней стойки клиента кладут упаковщик и контролёр (упаковщик ждёт севернее конца ленты, контролёр — южнее). */
const RCPV={
  1:{name:'машина у Л2 (площадка)',RKS:[[5.75,11.95],[8.25,11.95]],SPP:[10.75,11.95],rkYaw:0,PK:PK_PICK,CT:CT_WAIT,nogo:NOGO_L2,faces:{PW:['W','N','E'],CT:['S','E','W']},
     tl:[0.35,0,10.9,PI],eos:[[13.2,11.0],[18.7,11.0],[20.5,11.0]],fk0:[10.0,ZL,PI/2,'ZL'],SUP:[2.4,13.4,2.5],
     nav:NAV_L2,
     door:'L2',wt:{x:-0.32,z:0.62,hx:0,hz:1},hideX:2.35,
     blocks:[{x0:-3.6,x1:-1.65,z0:-1.2,z1:1.18},{x0:1.0,x1:2.3,z0:-1.2,z1:1.18}]},
  2:{name:'машина через П1 (полоса Л1–П1)',RKS:[[25.3,30.6],[27.8,30.6]],SPP:[22.8,30.6],rkYaw:PI,PK:[27.5,32.28],CT:[26.6,33.4],
     tl:[32.48,0,32.8,0],eos:[[10.8,30.6],[12.8,30.6]],fk0:[10.0,ZN,PI/2,'ZN'],SUP:[20.4,32.5,1.6],hideP:[21.5,30.2],
     nav:[[21.68,31.72,28.92,31.72,1],[21.68,29.48,28.92,29.48,3],[21.68,29.48,21.68,31.72,1],[24.05,29.48,24.05,31.72,1],[26.55,29.48,26.55,31.72,1],[28.92,29.48,28.92,31.72,1],
          [28.92,31.72,30.9,31.72,1],[30.9,31.72,31.2,31.15,1],[31.2,31.15,33.6,31.15,1],[33.6,31.15,33.6,6.9,1]],   // южнее носа сложенного конвейера (площадка оператора x 31,42…32,31, z 31,45…32,31), 14.10
     door:'P1',home:{x:38.52,y:0,z:32.8,r:PI},wt:{x:0.1,z:0.0,hx:1,hz:0},hideX:9,
     blocks:[{x0:-3.6,x1:-0.95,z0:-1.2,z1:1.18}]}
};

/* ---------- фазы процесса: машина из Китая выгружается целиком → образцы на DWS → бригада грузит автопоезд ----------
   Пока идёт выгрузка, грузчики K1…K4 ждут у комнаты смены (перед зданием охраны — туда погрузчик не заезжает: проверено
   картой его проездов за цикл); когда образцы замерены и поддон с ними в ячейке — идут к посту П2 перед будущей кабиной
   автопоезда и вдоль поста, и только тогда заезжает автопоезд. Автопоезд уехал, а машины из Китая ещё будут — бригада
   возвращается к комнате смены. */
const REC_SPOT={K1:[17.2,7.75],K2:[17.95,8.4],K3:[18.9,7.8],K4:[19.55,8.45]}, REC_YAW=0;
/* чем заняты, пока ждут: у приёмки K1 и K2 разговаривают лицом друг к другу, K3 — руки на поясе, K4 — с телефоном;
   у поста — руки за спиной, сцеплены, разговор, на поясе */
const IDLE_AT={rec:{K1:[{cross:1},0.86],K2:[{talk:1},-2.28],K3:[{akimbo:1},0.4],K4:[{phone:1},-0.3]},
               post:{K1:[{behind:1},PI],K2:[{cross:1},PI],K3:[{talk:1},PI-0.5],K4:[{akimbo:1},PI]}};
const WALKWAY=[[21.9,9.25],[22.0,12.65],[24.7,12.65],[25.4,13.2]];   // от комнаты смены: перед кабиной автопоезда (x 21,8), мимо рохлей у поста
/* по посту — напрямую вдоль z 13,2; к комнате смены и от неё — по линии z 9,25 севернее мест ожидания (до стоящих ≥0,8 м) */
function crewPath(a,b){ const atPost=p=>p[0]>23&&p[1]>12, RZ=9.25; if(atPost(a)&&atPost(b)) return [];
  const pts=WALKWAY.slice(); return atPost(b)?[[a[0],RZ],...pts]:[...pts.reverse(),[b[0],RZ]]; }
/* порядок выхода: на пост первым идёт тот, чьё место дальше по линии z 13,2, обратно — ближний к проходу;
   так никто не проходит сквозь уже стоящего товарища; интервал 1 с — около 1,3 м между идущими */
function crewMove(kind){ const T=S.T; let last=T;
  const ws=CREW.flat().sort((u,v)=>kind==='post'?S.hum[v].spot[0]-S.hum[u].spot[0]:S.hum[u].x-S.hum[v].x), t00=Math.max(T,...ws.map(w=>S.hum[w].free));
  ws.forEach((w,i)=>{ const h=S.hum[w], to=kind==='post'?h.spot:h.rec, [ip,iy]=IDLE_AT[kind][w];
    const t0=t00+0.4+i*1.0; h.state='wait';
    const tr=new Track().key(t0,h.x,h.z,h.yaw,h.idle||{}).key(t0+0.6,h.x,h.z,h.yaw,{}); h.tr=tr;      // сначала опустил руки, потом пошёл
    const ta=route(tr,t0+0.6,[[h.x,h.z],...crewPath([h.x,h.z],to),[to[0],to[1],iy]],1.3,{});
    finTrack(h,to[0],to[1],iy,ta); tr.key(ta+0.7,to[0],to[1],iy,ip); tr.fin(); h.idle=ip; last=Math.max(last,ta); });
  S.crewAt=kind; S.crewT=last; return last; }
/* внимание: стоящие рядом люди поворачивают голову к едущему погрузчику (ближе 7 м) */
const _att=V(0,0,0);
function attnFn(H){ if(!SIM.on||!F.fk) return null; const k=S.kinFk; if(!k||Math.abs(k.v)<0.3) return null;
  const p=F.fk.position, r=H.root.position; if(Math.hypot(p.x-r.x,p.z-r.z)>7) return null; return _att.set(p.x,1.25,p.z); }

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
  passage(px,to){ let h=this.head(); const d=(h==='E'?px-RHO:px+RHO)-this.Ap[0]; if((d>0)!==(h==='E')&&Math.abs(d)>=2.0){ this.uturn(); h=this.head(); }   // с одной магистрали на другую по проезду между секциями
    this.goX(h==='E'?px-RHO:px+RHO,VE); const hh=this.head();
    if(to==='ZN'){ this.arc(hh==='E'?L90:R90,aE); this.fwdZ(ZN-RHO,VE); this.arc(this.nextDir==='E'?R90:L90,aE); }
    else { this.arc(hh==='E'?R90:L90,aE); this.fwdZ(ZL+RHO,VE); this.arc(this.nextDir==='E'?L90:R90,aE); }
    this.close(); this.aisle=to; },
  toAisle(a,tx){ if(this.aisle===a) return;                                     // к нужной магистрали ближайшим проездом
    const px=Math.abs(this.Ap[0]-P1X)<Math.abs(this.Ap[0]-P2X)?P1X:P2X; this.nextDir=tx>=px?'E':'W'; this.passage(px,a); }
};


/* ---------- состояние ---------- */
const S={};
function rackObj(day,n,at,cl){
  const o=rackFrame(null,0,0,0,{ao:false}); S.grp.add(o);
  const tag=dayTag(o,-0.5,1.24,0.765,day);
  const r={o,day,n:0,slots:new Array(20).fill(null),hs:new Array(20).fill(null),ys:new Array(20).fill(null),res:{},tag,at,rest:[],carry:[],ring:[],id:S.racks.length,cl:cl===undefined?null:cl,free:false,items:null,pack:null};
  S.racks.push(r);
  if(n){ const sk=rackSkus(cl), ys=slotYs(sk.map(si=>SKUS[si].h)); for(let i=0;i<n;i++){ const b=mkBox(sk[i]); putRack(b,r,i,ys[i]); } }
  return r;
}
/* стойка «по слотам» (клиент: 20 коробов по раскладке RSLOT) или «как легли» (поддон образцов: Pack) */
function slotRack(r){ r.free=false; r.pack=null; r.items=null; r.slots.fill(null); r.hs.fill(null); r.ys.fill(null); r.res={}; r.n=0; return r; }
function freeRack(r){ r.free=true; r.pack=new Pack(); r.items=r.pack.items; r.slots.fill(null); r.hs.fill(null); r.ys.fill(null); r.res={}; r.n=0; r.cl=null; return r; }
function jit(b){ const ax=R()<0.5; return {jx:(R()-.5)*0.008,jz:(R()-.5)*0.008,jy:(R()-.5)*0.02,h:0.035+R()*0.035,th:(R()<.5?-1:1)*(0.03+R()*0.035),ax,half:(ax?b.w:b.l)/2}; }
function mkBox(si){ const K=SKUS[si], o=skuBox(si); S.grp.add(o);
  const b={o,si,ti:K.ti,cl:K.cl,l:K.l,w:K.w,h:K.h,kg:K.kg,hv:heavyKg(K.kg),mode:'free',id:S.boxes.length}; b.pl=jit(b); o.userData.simBox=b; S.boxes.push(b); return b; }
function putRack(b,r,s,y){ const q=RSLOT[s]; r.slots[s]=b; r.hs[s]=b.h; r.ys[s]=y; r.n++; b.mode='rack'; b.rack=r; b.slot=s;
  b.o.position.set(q.x+b.pl.jx,y,q.z+b.pl.jz); b.o.rotation.set(0,b.pl.jy,0); r.o.add(b.o); }      // сразу в системе стойки: едет с ней на вилах
function takeRack(b){ const r=b.rack; if(!r) return; if(r.free){ const it=r.items.find(o=>o.b===b); if(it){ it.on=false; it.gone=true; } } else { r.slots[b.slot]=null; r.hs[b.slot]=null; r.ys[b.slot]=null; }
  r.n--; S.grp.attach(b.o); b.rack=null; b.mode='free'; }
function setRest(r,x,y,z,yaw){ r.restP=V(x,y,z); r.restQ=new THREE.Quaternion().setFromAxisAngle(Yv,yaw); r.o.position.copy(r.restP); r.o.quaternion.copy(r.restQ); r.o.updateMatrixWorld(true); }
/* высота слота s по фактическим коробам под ним (уже положенным или назначенным) */
function slotY(r,s){ const sup=RSUP[s]; let v=RACK.Y0; if(sup) for(const k of sup){ if(r.ys[k]==null||r.hs[k]==null) continue; v=Math.max(v,r.ys[k]+r.hs[k]+0.004); } return v; }
const spotOf=r=>S.zs.find(z=>z.r===r);

/* ---------- сборка ---------- */
function setup(){
  rng=20261009;
  S.V=SIM.cfg.variant===2?2:1; S.rc=RCPV[S.V]; const rc=S.rc, today=SIM.cfg.today; S.nav=new Nav(rc.nav.concat(DWSZ.nav));
  /* конвейер фильма — на место варианта, сложен, пока машины нет; DWS стоят в своей зоне при любом варианте */
  F.tl2.position.set(rc.tl[0],rc.tl[1],rc.tl[2]); F.tl2.rotation.y=rc.tl[3];
  teleSet(0); S.tele={e:0,tgt:0}; rdoorSet(F.cnT,0);
  scene.updateMatrixWorld(true);   // машины только что вернулись на места (teardown): без этого проёмы кузовов считались по матрице «во дворе» — со 2-го цикла погрузчик ехал к x≈64 сквозь стену П2
  S.grp=new THREE.Group(); scene.add(S.grp); S.racks=[]; S.boxes=[]; S.belt=[]; S.jobs=[]; S.ev=[];
  S.T=0; S.cycle=(S.cycle||0)+1; S.log=[]; S.xing=0;
  /* ячейки: свои стойки вместо штатных штабелей; в ячейке — одна отправка (клиент), как в rack.js */
  S.cells=CELLS.map((c,i)=>({i,c,x:(c.x0+c.x1)/2,z:(c.z0+c.z1)/2-(c.row==='B'?0.75:0),row:c.row,yaw:c.row==='A'?PI:0,tiers:[],ok:c.row==='A'?(c.x0+c.x1)/2<44.4:(c.x0+c.x1)/2<42.5}));   // ряд B: стойка в глубине ячейки — у магистрали остаётся место для дуги; ячейки у восточной стены не используются (там стоят рохли и электротележка)
  S.hidden=[]; Object.values(CELLSTACK).forEach(o=>{ S.hidden.push([o,o.visible]); o.visible=false; });
  CELLSPEC.forEach(([i,layers,day])=>{ const cell=S.cells[i], tiers=layers>=3?2:1, fill=[1,0.7,0.55,1,0.7][i%5], cl=(i*5)%CLIENTS.length;
    for(let t=0;t<tiers;t++){ const n=t<tiers-1?20:Math.max(4,Math.round(20*fill)); const r=rackObj(day,n,{kind:'cell',cell,tier:t},cl); setRest(r,cell.x,t*PT,cell.z,cell.yaw); cell.tiers.push(r); } });
  /* запас пустых: на месте штатного запаса, штатный скрыт */
  G.equip.children.forEach(o=>{ if(/Запас пустых/.test(o.userData.nm||'')){ S.hidden.push([o,o.visible]); o.visible=false; } });
  S.eo=rc.eos.map(p=>({x:p[0],z:p[1],tiers:[]}));
  for(let k=0;k<4;k++){ const sp=S.eo[Math.min(S.eo.length-1,k>>1)], t=sp.tiers.length, r=rackObj(today,0,{kind:'eo',spot:sp,tier:t}); r.tag.visible=false; setRest(r,sp.x,t*PT,sp.z,rc.rkYaw); sp.tiers.push(r); }
  /* приёмка: два места под стойки клиентов и место поддона образцов — пустые стойки уже стоят */
  S.rp=rc.RKS.map((p,i)=>{ const P={i,x:p[0],z:p[1],r:null,next:null,cl:null,ready:false,labeling:false}; const r=rackObj(today,0,{kind:'rp'}); r.tag.visible=false; setRest(r,P.x,0,P.z,rc.rkYaw); P.r=r; return P; });
  S.spp={x:rc.SPP[0],z:rc.SPP[1],r:null,next:null}; { const r=freeRack(rackObj(today,0,{kind:'spp'})); r.tag.visible=false; setRest(r,S.spp.x,0,S.spp.z,rc.rkYaw); S.spp.r=r; }
  /* зона DWS: на месте 2 — пустой поддон, на него ложатся замеренные образцы */
  S.zs=DWSZ.spots.map((p,i)=>({i,x:p[0],z:p[1],r:null,next:null}));
  { const r=freeRack(rackObj(today,0,{kind:'zone'})); r.tag.visible=false; setRest(r,S.zs[1].x,0,S.zs[1].z,0); S.zs[1].r=r; S.dz={st:'idle',sp:null,mp:r,mpReady:false,picked:false,stored:false,tagging:false,count:0}; }
  /* машины: китайская — вне площадки, автопоезд — за воротами; второй китайский грузовик на площадке скрыт (мешает выезду) */
  if(typeof TRK_Q!=='undefined'){ S.hidden.push([TRK_Q,TRK_Q.visible]); TRK_Q.visible=false; }
  S.hidden.push([F.fork0,F.fork0.visible]); F.fork0.visible=false;                 // штатный погрузчик у северной магистрали — это и есть наш погрузчик
  [typeof JACK_Sa!=='undefined'&&JACK_Sa,typeof JACK_Sb!=='undefined'&&JACK_Sb].forEach(o=>{ if(o){ S.hidden.push([o,o.visible]); o.visible=false; } });   // рохли, припаркованные на краю магистрали у поста П2
  if(rc.hideP) PEOPLE.forEach(H=>{ if(H.root.parent!==G.people) return; const p=H.root.position; if(Math.hypot(p.x-rc.hideP[0],p.z-rc.hideP[1])<0.8){ S.hidden.push([H.root,H.root.visible]); H.root.visible=false; } });
  /* штатный груз кузова: в рабочей зоне скрыт и заменён своими коробами; груз в передней части кузова (у Л2 — и у задних дверей)
     остаётся: сборная машина везёт его дальше, другим получателям */
  S.cnCargo=[]; F.cnT.traverse(o=>{ if(o.isMesh&&isCarton(o.material)&&!o.userData.batch&&o.position.x<rc.hideX){ S.hidden.push([o,o.visible]); o.visible=false; } });
  S.kzCargo=[]; F.bod.forEach(b=>b.traverse(o=>{ if(o.isMesh&&isCarton(o.material)){ S.hidden.push([o,o.visible]); o.visible=false; } }));   // кузова приходят пустыми
  S.cn={state:'away',path:null,n:0,cargo:[],wtFree:0,busy:false}; S.kz={state:'away',path:null,n:0,lanes:null};
  S.kzT0=0;
  S.cnH=rc.home||F.cn0; { const H=S.cnH; F.cnT.position.set(H.x+(S.V===2?70:0),H.y,H.z-(S.V===2?0:70)); F.cnT.rotation.set(0,H.r,0); } F.cnT.visible=false;
  F.kzT.position.set(F.kz0.x+40,F.kz0.y,F.kz0.z); F.kzT.visible=false;
  doorSet(DOOR.L2,0); doorSet(DOOR.P2,0); if(S.V===2) doorSet(DOOR.P1,0); CHOCKS.visible=false; F.bod.forEach(b=>curtainSet(b,0)); F.WTr.visible=false;
  /* погрузчик: у запаса, курсом на восток */
  S.fk=new FkPlan(rc.fk0[0],rc.fk0[1],rc.fk0[2]); S.fk.aisle=rc.fk0[3]; S.fk.free=0; S.fkTask=null; S.fkE=[]; S.car=null; S.spr={fkP:new Spring(2.2,0.32,0.014),rkP:new Spring(1.25,0.10,0.016),rkR:new Spring(1.55,0.12,0.016),
    cnB:new Spring(1.7,0.30,0.010),cnC:new Spring(1.1,0.22,0.028),kzB:new Spring(1.6,0.32,0.008),kzC:new Spring(1.05,0.22,0.024)};
  S.fkPitch=0; S.sw={r:0,p:0};
  /* люди */
  const beltEnd=F.boom.localToWorld(V(F.bBase+0.28,F.yBase,0)); S.beltEnd=beltEnd;
  const faceTo=(x,z,tx,tz)=>Math.atan2(tx-x,tz-z);
  S.pyP=faceTo(rc.PK[0],rc.PK[1],beltEnd.x,beltEnd.z); S.pyC=faceTo(rc.CT[0],rc.CT[1],beltEnd.x,beltEnd.z);
  S.hum={};
  const mkH=(key,H,x,z,yaw)=>{ const tr=new Track().key(0,x,z,yaw,{}).fin(); S.hum[key]={H,tr,free:0,x,z,yaw,local:null,loc:'rec'}; };
  if(!F.PW&&!S.pwH){ S.pwH=HUM.build({role:'ГРУЗЧИК-УПАКОВЩИК',rnd:R}); } if(S.pwH){ S.grp.add(S.pwH.root); }
  mkH('PW',F.PW||S.pwH,rc.PK[0],rc.PK[1],S.pyP); mkH('CT',F.CT,rc.CT[0],rc.CT[1],S.pyC);
  mkH('W3',F.W3,46.5,7.5,0); mkH('W5',F.W5,47.0,13.0,-2.2); S.hum.W5.H.root.visible=true;
  F.W4.root.visible=false; F.W4box.visible=false;
  S.bw=F.bod.map(b=>{ b.updateMatrixWorld(true); const p=b.localToWorld(V(RB.x,0,RB.z)); return [p.x,p.z]; });
  S.kPos={K1:[0.45,-0.8],K2:[-0.45,-0.8],K3:[0.45,-0.8],K4:[-0.45,-0.8]}; S.kIdle={K1:-0.3,K2:0.3,K3:-0.3,K4:0.3};   // ждут у дальнего борта за стойкой: на x ±1,9 стояли внутри будущих стопок (14.10)
  CREW.forEach((cw,r)=>{ const bx=S.bw[r][0]; const spot={[cw[0]]:[bx+1.5,13.2],[cw[1]]:[bx+4.75,13.2]};
    cw.forEach(w=>{ const rp=REC_SPOT[w], [ip,iy]=IDLE_AT.rec[w]; mkH(w,F.KH[w],rp[0],rp[1],iy); const h=S.hum[w]; h.tr=new Track().key(0,rp[0],rp[1],iy,ip).fin(); h.idle=ip;
      h.spot=spot[w]; h.rec=rp; h.body=r; h.state='wait'; }); });
  S.phase='unload'; S.cnDone=false; S.kzGone=false; S.crewAt='rec'; S.crewT=0;
  { const C=F.bod[0].userData.curt, n=C.strips.length; S.cEdge=[C.x0+0.05+(n-1)*C.pitch,C.x0+C.w*(n-0.5)]; }
  S.kzE=[[],[]]; S.kzB0=[[0,0],[0,0]]; S.ringA=[];
  S.done=false; S.endT=null; S.inLeft=SIM.cfg.inTrucks; S.outN=0; S.loaded=0; S.placed=0; loadReset();
  S.wt={H:F.WT,tr:null,free:0}; F.WT.root.visible=false;
  /* аппараты DWS: в покое */
  S.gsJobs=[]; S.ptJobs=[]; S.gsUntil=0; S.ptUntil=0; dwsIdle();
}
S.cfg=()=>SIM.cfg;
const isCarton=m=>LOOK.cartons.includes(m)||(Array.isArray(m)&&LOOK.ctypeM.includes(m[0]))||LOOK.ctypeM.includes(m);
function dwsIdle(){ const G2=F.gs&&F.gs.userData.gs; if(G2){ G2.setBelt(0); G2.setRoll(0,0); G2.setCurtain(0); G2.setScan(0,'idle'); G2.setFlash(0); G2.screen({state:'idle'}); G2.weight(0); }
  F.lasers.forEach(l=>l.visible=false); F.lm.opacity=0; if(F.scan) F.scan.visible=false; if(F.dwsScr&&F.ptMat){ F.dwsScr.material=F.ptMat; F.ptDraw({state:'idle'}); } }
function teardown(){
  (S.boxes||[]).forEach(b=>{ if(b.o&&b.o.parent) b.o.parent.remove(b.o); });   // короба процесса — и те, что в кузовах машин, на DWS и в стойках (иначе остаются в обычном виде и копятся)
  (S.racks||[]).forEach(r=>{ if(r.o&&r.o.parent) r.o.parent.remove(r.o); });
  if(S.grp) scene.remove(S.grp);
  (S.hidden||[]).forEach(([o,v])=>o.visible=v); S.hidden=[];
  F.cnT.position.set(F.cn0.x,F.cn0.y,F.cn0.z); F.cnT.rotation.set(0,F.cn0.r,0); F.cnT.visible=true; F.kzT.position.set(F.kz0.x,F.kz0.y,F.kz0.z); F.kzT.visible=true;
  F.WTr.visible=false; F.W4.root.visible=true; rdoorSet(F.cnT,0);
  { const rc=RCPV[1]; F.tl2.position.set(rc.tl[0],rc.tl[1],rc.tl[2]); F.tl2.rotation.y=rc.tl[3]; teleSet(TELE_EXT); }
  dwsIdle();
}

/* ---------- короба: где и как ---------- */
function beltPlace(b,T){ const Lb=F.bTip-F.bBase, f=Math.min(1,b.x/Lb), tu=T-b.t0;
  let dy=0, th=0; if(tu<0.6){ const st=settle(tu,{h:0.03,th:b.pl.th*0.5,half:0.2}); dy=st.dy; th=st.th; }
  for(const ts of b.stops){ const ua=T-ts; if(ua>0&&ua<1.2) th+=0.035*Math.exp(-ua*7)*Math.sin(ua*15); }
  b.o.position.copy(F.boom.localToWorld(_v.set(lerp(F.bTip,F.bBase+0.34,f),lerp(F.yTip,F.yBase,f)-0.17+dy,0)));
  F.boom.getWorldQuaternion(_q); if(th) _q.multiply(_q2.setFromAxisAngle(Zv,th)); b.o.quaternion.copy(_q); }
function rackSlotPut(b,r,s,dt){ const q=RSLOT[s]; putSlot(b.o,r.o,q.x+b.pl.jx,r.ys[s],q.z+b.pl.jz,b.pl.jy,dt,b.pl); }
function putFree(b,r,it,dt){ putSlot(b.o,r.o,it.x+b.pl.jx,it.y,it.z+b.pl.jz,(it.rot?PI/2:0)+b.pl.jy,dt,b.pl); }
function putRackLater(b,r,slot){ r.slots[slot]=b; r.n++; b.rack=r; b.slot=slot; b.mode='rack'; r.o.attach(b.o); delete r.res[slot]; }
function freeDone(b,r,it){ b.mode='rack'; b.rack=r; r.n++; it.placed=true; r.o.attach(b.o); }
function laneFree(body,ti){ const L=KZLANE[ti], lanes=S.kz.lanes[body], cap=Math.floor(3.6/L.d)*L.n; return (cap-lanes.S[ti])+(cap-lanes.N[ti]); }   // дорожки растут от торцов к проёму (±1,25 м свободны)
/* место в дорожке кузова: высота стопки — по фактическим коробам (SKU одного класса разной высоты) */
function laneSlot2(body,side,ti,h){ const L=KZLANE[ti], lanes=S.kz.lanes[body];
  const cap=Math.floor(3.6/L.d)*L.n; if(lanes[side][ti]>=cap) side=side==='S'?'N':'S'; if(lanes[side][ti]>=cap) return null;
  const n=lanes[side][ti]++, st=Math.floor(n/L.n), lv=n%L.n, X0=side==='S'?-4.85:4.85, sg=side==='S'?1:-1, hy=lanes.hy[side][ti], y=lv?(hy[st]||0):0; hy[st]=y+h+0.004;
  const xc=X0+sg*L.d*(st+0.5), xf=X0+sg*L.d*(st+1), sx=L.z>-0.61?(side==='S'?Math.min(xf+0.42,-KSTRIP):Math.max(xf-0.42,KSTRIP)):xf+sg*0.42;   // напротив стойки в проёме — не ближе полосы x ±1,03
  return {lp:V(xc,BEDY+y,L.z),stand:[sx,L.z],yaw:side==='S'?-PI/2:PI/2,y}; }
/* по кузову — в обход стойки в проёме (x ±0,81, z −0,31…1,31): ждут у дальнего борта, работают в полосе x ±1,03 между стойкой
   и стопками (полоса 0,44 м); переход между ними — через точку у угла стойки, а не сквозь неё */
const KSTRIP=1.03;
function bodyGo(trk,t,from,to,yaw,pose,v){ const low=p=>Math.abs(p[0])<KSTRIP-0.02&&p[1]<-0.35, W=[], sf=Math.sign(from[0])||1, st=Math.sign(to[0])||1;
  if(!low(from)&&!low(to)&&sf!==st&&Math.abs(from[0])>0.6&&Math.abs(to[0])>0.6) W.push([sf*KSTRIP,-0.62],[st*KSTRIP,-0.62]);   // ряд на другой стороне (свой заполнен) — за стойкой
  else if(low(from)!==low(to)) W.push([(Math.sign((low(from)?to:from)[0])||1)*KSTRIP,-0.62]);
  for(const w of W){ t+=Math.max(0.3,hyp2(from,w)/v); trk.key(t,w[0],w[1],Math.atan2(w[0]-from[0],w[1]-from[1]),pose); from=w; }
  t+=Math.max(0.4,hyp2(from,to)/v); trk.key(t,to[0],to[1],yaw,pose); return t; }
/* задание «из рук — в место»: до grab — src, потом в руках, в rel — дуга в dst, затем оседание */
function job(b,who,grab,rel,src,dst,fin){ const j={b,who,grab,rel,src,dst,fin,done:false}; b.mode='job'; b.job=j; S.jobs.push(j); return j; }
function boxFrame(b,T){
  if(b.mode==='belt') beltPlace(b,T);
  else if(b.mode==='job'){ const j=b.job;
    if(T<j.grab){ j.src(T); return; }
    if(T<j.rel){ if(!handFrom(b.o,j.who.H,T,j.grab,()=>j.src(T),dt=>j.dst(dt))) handTo(b.o,j.who.H,T,j.rel,dt=>j.dst(dt)); return; }
    j.dst(T-j.rel); if(T>j.rel+1.4){ b.mode='free'; b.job=null; j.done=true; j.fin&&j.fin(); } }
  else if(b.mode==='gs') gsPlace(b.o,b.gj,T,b.pl);
  else if(b.mode==='pt') ptPlace(b.o,b.pj,T,b.pl);
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
   (с северной — на юг), приёмка, запас пустых, проёмы кузовов и места поддонов в зоне DWS (с южной — на юг) */
/* стойка на вилах при дуге у кармана описывает круг ~2,5 м вокруг внутреннего колеса. Защита колонн (x 16,05 / 32,05; z 14,1) и
   стойки ограждений у проездов (x 20,38 / 36,38) не должны попасть в него — отсюда курс подъезда (need) и запрет курса выезда (outBad) */
const COLS=[16.05,32.05], RAILW=[20.38,36.38], colIn=(a,b)=>COLS.some(x=>x>a&&x<b);
function sRule(x){ const hE=colIn(x-1.25,x+2.5), hW=colIn(x-2.5,x+1.25), oE=colIn(x+0.1,x+3.2), oW=colIn(x-3.2,x-0.1);
  return {need:hE?(hW?null:'W'):hW?'E':null,outBad:oE?'E':oW?'W':null}; }
function locCell(cell){ const xc=COLS.find(c=>Math.abs(c-cell.x)<2.6), tight=RAILW.some(rx=>cell.x>rx&&cell.x-0.75-rx<0.35), wall=cell.x<4.6?'W':cell.x>44.4?'E':null;
  const need=tight?'E':xc?(xc>cell.x?'E':'W'):null, outBad=need?(need==='E'?'W':'E'):null;   // у ограждения проезда — только с восточной стороны; у колонны — с той стороны, где корма при дуге уходит от колонны
  return cell.row==='A'?{aisle:'ZL',side:'N',rho:RC,x:cell.x,zIn:cell.z-FR+AX,back:ZL+RC,lowZ:ZL+RC,wall,yaw:cell.yaw,need,outBad}
                      :{aisle:'ZN',side:'S',rho:RC,x:cell.x,zIn:cell.z+FR-AX,back:ZN-RC,lowZ:ZN-RC,wall,yaw:cell.yaw,need,outBad}; }
function locS(x,z){ const q=sRule(x); return {aisle:'ZL',side:'S',rho:RHO,x,rz:z,zIn:z+FR-AX,back:ZL-RHO,lowZ:ZL-RHO,wall:null,yaw:0,need:q.need,outBad:q.outBad}; }
function locN(x,z){ const q=sRule(x); return {aisle:'ZN',side:'N',rho:RHO,x,rz:z,zIn:z-FR+AX,back:ZN+RHO,lowZ:ZN+RHO,wall:null,yaw:PI,need:q.need,outBad:q.outBad}; }   // карман севернее северной магистрали (приёмка на полосе Л1–П1)
const locRP=p=>S.rc.rkYaw?locN(p.x,p.z):locS(p.x,p.z);
const locSPP=()=>locRP(S.spp);
const locEO=sp=>S.rc.rkYaw?locN(sp.x,sp.z):locS(sp.x,sp.z);
/* место поддона в зоне DWS: далеко от магистрали — по прямой едет быстрее, медленно — последние 2 м */
const locSpot=z=>Object.assign(locS(z.x,z.z),{fast:z.z+FR-AX+2.2,backV:1.0});
/* подъезд по магистрали к x кармана: если цель позади — сначала разворот, потом подъезд (точка подъезда зависит от курса) */
function approach(P,x,rho,v,need){ let h=P.head(); const d=x-P.Ap[0];
  if(need&&(h!==need||(d>0)!==(need==='E'))){                                   // подъезжать нужно определённым курсом: встать за точкой подъезда, развернуться
    const sx=need==='E'?x-rho-3.6:x+rho+3.6; const go=()=>{ const dd=sx-P.Ap[0]; if(Math.abs(dd)<0.05) return; if((dd>0)===(P.head()==='E')) P.fwdX(sx,v); else P.line(Math.abs(dd),VR,true); };
    const dd=sx-P.Ap[0]; if(Math.abs(dd)>6&&(dd>0)!==(h==='E')){ P.uturn(); } go(); if(P.head()!==need) P.uturn(); h=P.head(); }
  else { const dd=(h==='E'?x-rho:x+rho)-P.Ap[0]; if((dd>0)!==(h==='E')&&Math.abs(dd)>=2.0){ P.uturn(); h=P.head(); } }   // точка подъезда зависит от курса: сравнивать с ней, а не с x кармана (иначе разворот внутри goX и дуга на 1,2 м в сторону)
  P.goX(h==='E'?x-rho:x+rho,v); return P.head(); }
function goPocket(P,L,v,before){ P.toAisle(L.aisle,L.x); const h=approach(P,L.x,L.rho,v,L.need); if(before) before();
  const toN=L.side==='N'; P.arc(h==='E'?(toN?L90:R90):(toN?R90:L90),v>1.6?aE:aL,false,L.rho); P.close();
  if(L.fast!==undefined) P.fwdZ(L.fast,VL); P.fwdZ(L.zIn,VS); P.close(); P.pocket=L; }
/* выезд задним ходом с поворотом на курс d; у торцевой стены корма при дуге назад ушла бы в стену — там прямо назад и дуга вперёд */
function leavePocket(P,d){ const L=P.pocket; if(!L) return; const zl=L.aisle==='ZL'?ZL:ZN, toN=L.side==='N'; if(L.outBad===d) d=d==='E'?'W':'E';
  if(L.wall&&((L.wall==='W'&&d==='E')||(L.wall==='E'&&d==='W'))){ P.backZ(toN?zl-RHO:zl+RHO,0.8); P.close(); P.arc(toN?(d==='E'?R90:L90):(d==='E'?L90:R90),aL); P.close(); }
  else { P.backZ(L.back,L.backV||0.8); P.close(); P.arc(toN?(d==='E'?R90:L90):(d==='E'?L90:R90),aR,true,L.rho); P.close(); }
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
/* места для пустых стоек: запас у магистрали (по два яруса), затем свободные ячейки ряда B (с дальнего конца), затем ряда A */
function emptyTarget(){ const sp=S.eo.filter(s=>s.tiers.length<2).sort((a,b)=>(b.tiers.length-a.tiers.length)||(a.x-b.x))[0]; if(sp) return {kind:'eo',spot:sp,tier:sp.tiers.length};
  const cells=S.cells.filter(c=>c.ok&&c.tiers.length<2&&c.tiers.every(r=>r.n===0)).sort((a,b)=>(b.row>a.row?1:b.row<a.row?-1:0)||(b.x-a.x));
  const c=cells.find(c=>c.tiers.length===1)||cells[0]; return c?{kind:'cell',cell:c,tier:c.tiers.length}:null; }
function emptySource(){ const sp=S.eo.filter(s=>s.tiers.length).sort((a,b)=>b.tiers.length-a.tiers.length)[0]; if(sp) return {kind:'eo',spot:sp,tier:sp.tiers.length-1,r:sp.tiers[sp.tiers.length-1]};
  const c=S.cells.filter(c=>c.tiers.length&&c.tiers[c.tiers.length-1].n===0).sort((a,b)=>a.x-b.x)[0]; return c?{kind:'cell',cell:c,tier:c.tiers.length-1,r:c.tiers[c.tiers.length-1]}:null; }
function takeFrom(src){ if(src.kind==='eo') src.spot.tiers.pop(); else src.cell.tiers.pop(); return src.kind==='eo'?locEO(src.spot):locCell(src.cell); }
function putTo(P,dst,c,r){ if(dst.kind==='eo'){ const sp=dst.spot; placeAt(P,locEO(sp),c,r,dst.tier,sp.x,dst.tier*PT,sp.z,S.rc.rkYaw); r.at={kind:'eo',spot:sp,tier:dst.tier}; sp.tiers.push(r); }
  else { const cell=dst.cell; placeAt(P,locCell(cell),c,r,dst.tier,cell.x,dst.tier*PT,cell.z,cell.yaw); r.at={kind:'cell',cell,tier:dst.tier}; cell.tiers.push(r); } }
/* какой ячейке отдать стойку: на тот же день и того же клиента — вторым ярусом; иначе ближайшая свободная (на другой магистрали —
   дороже: ехать через проезд); иначе вторым ярусом к другому клиенту того же дня */
function cellFor(r,src,aisle){ let best=null;
  for(const c of S.cells){ if(!c.ok) continue; const d=Math.abs(c.x-src[0]), ca=c.row==='A'?'ZL':'ZN'; let cost;
    const base=d+(ca!==aisle?20:0);
    if(c.tiers.length===1&&c.tiers[0].day===r.day&&c.tiers[0].n>0) cost=c.tiers[0].cl!==null&&c.tiers[0].cl===r.cl?base-100:base+60;
    else if(c.tiers.length===0) cost=base;
    else continue;
    if(!best||cost<best.cost) best={c,cost}; }
  return best?best.c:null; }
const recAisle=()=>S.rc.rkYaw?'ZN':'ZL';
/* стойка клиента с приёмки → ячейка */
function taskRpToCell(p,cell){ const P=S.fk, r=p.r, tier=cell.tiers.length; P.tc=Math.max(P.tc,S.T);
  const c=pickAt(P,locRP(p),r,0,cell.x>p.x?'E':'W'); p.r=null; p.cl=null; p.ready=false;
  putTo(P,{kind:'cell',cell,tier},c,r);
  const L=P.pocket; P.backZ(L.back,0.8); P.close(); P.outFn=d=>leavePocket(P,d); P.aisle=L.aisle;
  S.placed++; S.log.push((r.cl!==null?CLIENTS[r.cl].code+' · ':'')+'стойка '+DAYN[r.day]+' → ячейка '+cell.c.id+(tier?' · ярус 2':''));
  return {name:'стойка '+(r.cl!==null?CLIENTS[r.cl].code+' ':'')+'→ ячейка '+cell.c.id}; }
/* пустая стойка → место на приёмке (под стойку клиента или поддон образцов) */
function taskEoToPlace(dst){ const P=S.fk, src=emptySource(); if(!src) return null; const r=src.r; P.tc=Math.max(P.tc,S.T);
  const spp=dst===S.spp, L=takeFrom(src), c=pickAt(P,L,r,src.tier,dst.x>L.x?'E':'W');
  placeAt(P,spp?locSPP():locRP(dst),c,r,0,dst.x,0,dst.z,S.rc.rkYaw); r.at={kind:spp?'spp':'rp'}; r.tag.visible=false; r.cl=null;
  if(spp) freeRack(r); else slotRack(r); dst.next=r;
  leavePocket(P,'E');                                                          // у приёмки не стоим: вилы были бы там, где работают люди
  return {name:'пустая стойка → '+(spp?'поддон образцов':'приёмка'),done:()=>{ dst.r=dst.next; dst.next=null; }}; }
/* поддон образцов → место в зоне DWS */
function taskSpToZone(spot){ const P=S.fk, r=S.spp.r; P.tc=Math.max(P.tc,S.T);
  const c=pickAt(P,locSPP(),r,0,'E'); S.spp.r=null;
  placeAt(P,locSpot(spot),c,r,0,spot.x,0,spot.z,0); r.at={kind:'zone'}; spot.next=r;
  leavePocket(P,'W');
  S.log.push('поддон образцов ('+r.items.length+' шт.) → зона DWS, место '+(spot.i+1));
  return {name:'поддон образцов → зона DWS',done:()=>{ spot.r=spot.next; spot.next=null; S.dz.sp=spot.r; }}; }
/* поддон замеренных образцов → ячейка */
function taskMpToCell(spot,cell){ const P=S.fk, r=spot.r, tier=cell.tiers.length; P.tc=Math.max(P.tc,S.T);
  const c=pickAt(P,locSpot(spot),r,0,cell.x>spot.x?'E':'W'); spot.r=null; S.dz.picked=true;
  putTo(P,{kind:'cell',cell,tier},c,r);
  const L=P.pocket; P.backZ(L.back,0.8); P.close(); P.outFn=d=>leavePocket(P,d); P.aisle=L.aisle;
  S.placed++; S.log.push('образцы после DWS ('+r.items.length+' шт., бирка '+DAYN[r.day]+') → ячейка '+cell.c.id+(tier?' · ярус 2':''));
  return {name:'образцы после DWS → ячейка '+cell.c.id,done:()=>{ S.dz.stored=true; }}; }
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
/* пустая стойка из проёма → на приёмку (если там место пусто и машины ещё будут), иначе в запас / свободную ячейку */
function taskBodyToEo(){ const P=S.fk, h=S.hold, r=h.rack, c=h.c, Lb=P.pocket; P.tc=Math.max(P.tc,S.T);
  S.fkE.push([P.tc,-0.75]); r.tag.visible=false; slotRack(r); r.cl=null;
  P.Tl(-0.02,0.8); P.backZ(ZL-RHO,0.7); P.close(); P.Lf(0.25,2.4); P.hold(0.2); P.pocket=null;
  const more=S.cn.state!=='away'||S.inLeft>0, outDir=want=>Lb&&Lb.outBad===want?(want==='E'?'W':'E'):want;
  const rp=more?S.rp.find(p=>!p.r&&!p.next&&!pocketBusy(locRP(p))):null, sp=!rp&&more&&!S.spp.r&&!S.spp.next&&!pocketBusy(locSPP())?S.spp:null;
  let name;
  if(rp||sp){ const dst=rp||sp; P.arc(outDir('W')==='E'?L90:R90,aR,true); P.close(); P.aisle='ZL';
    placeAt(P,rp?locRP(rp):locSPP(),c,r,0,dst.x,0,dst.z,S.rc.rkYaw); r.at={kind:rp?'rp':'spp'}; if(sp) freeRack(r); dst.next=r; leavePocket(P,'E'); name=rp?'приёмка':'поддон образцов';
    S.hold=null; return {name:'пустая стойка → '+name,done:()=>{ dst.r=dst.next; dst.next=null; }}; }
  const dst=emptyTarget(), tx=dst.kind==='eo'?dst.spot.x:dst.cell.x; P.arc(outDir(tx>P.Ap[0]?'E':'W')==='E'?L90:R90,aR,true); P.close(); P.aisle='ZL';
  putTo(P,dst,c,r); const L=P.pocket; P.backZ(L.back,0.8); P.close(); P.outFn=d=>leavePocket(P,d); P.aisle=L.aisle; name=dst.kind==='eo'?'запас':'свободная ячейка '+dst.cell.c.id;
  S.hold=null; return {name:'пустая стойка → '+name};
}
function fkLeavePocket(tx){ const P=S.fk; if(!P.pocket) return; if(P.aisle==='ZN') tx=Math.abs(P.Ap[0]-P1X)<Math.abs(P.Ap[0]-P2X)?P1X:P2X;   // с северной магистрали — к ближайшему проезду
  const d=tx>=P.Ap[0]?'E':'W'; P.tc=Math.max(P.tc,S.T); if(P.outFn) P.outFn(d); else leavePocket(P,d); P.outFn=null; }

/* ---------- люди и погрузчик: кто кому уступает ----------
   Погрузчик не начинает заезд в карман, если по плану человека тот будет в коридоре кармана или там, где стойка на вилах
   описывает дугу у магистрали. Человек не начинает переход, если на его пути по плану окажется погрузчик (план погрузчика
   известен до конца задания, потом он стоит). Переход людей через магистрали (П1 ↔ зона DWS) — погрузчик в это время задания
   не начинает. */
function fkPoseAt(T){ const P=S.fk; if(P.S.length){ const e=P.S[P.S.length-1]; return pathAt(P.S,Math.min(T,e.t1)); } return {x:P.Ap[0]-Math.sin(P.yw)*AX,z:P.Ap[1]-Math.cos(P.yw)*AX,yaw:P.yw}; }
function fkHit(x,z,T){ const p=fkPoseAt(T), s=Math.sin(p.yaw), c=Math.cos(p.yaw), bx=x-p.x, bz=z-p.z, dl=Math.abs(bx*c-bz*s), df=bx*s+bz*c;
  return Math.max(dl-0.75,df-2.72,-1.45-df)<0.3; }                 // корпус −1,45…+0,9, вилы со стойкой до 2,72, полуширина со стойкой 0,75
function fkEnd(){ const P=S.fk; return P.S.length?P.S[P.S.length-1].t1:S.T; }
function trackSafe(tr,t0,t1){ const tE=Math.max(t1,fkEnd()); for(let t=t0;t<=tE+1e-6;t+=0.1){ const p=tr.at(Math.min(t,t1)); if(fkHit(p.x,p.z,t)) return false; } return true; }
function humIn(x0,x1,z0,z1){ const T=S.T; for(const key of ['PW','CT']){ const h=S.hum[key], tE=Math.max(T,h.free);
    for(let t=T;t<=tE+0.01;t+=0.25){ const p=h.tr.at(t); if(p.x>x0&&p.x<x1&&p.z>z0&&p.z<z1) return true; } } return false; }
function pocketBusy(L){ const zl=L.aisle==='ZL'?ZL:ZN;
  const a=L.side==='S'?[L.x-1.05,L.x+1.05,L.rz-0.95,zl+0.9]:[L.x-1.05,L.x+1.05,zl-0.9,L.rz+0.95];
  const b=L.side==='S'?[L.x-2.6,L.x+2.6,zl-2.6,zl+0.9]:[L.x-2.6,L.x+2.6,zl-0.9,zl+2.6];
  return humIn(...a)||humIn(...b); }

/* ---------- планирование: кто что делает ---------- */
const ageOf=r=>(SIM.cfg.today-r.day+7)%7;                                  // возраст по бирке дня: сегодня ЧТ → ПТ/СБ/ВС — прошлая неделя, они старше ПН
function oldestRack(){ let best=null; for(const cell of S.cells){ const r=cell.tiers[cell.tiers.length-1]; if(!r||!r.n) continue;   // самая старая бирка; ячейка уходит целиком
    if(!best||ageOf(r)>ageOf(best)||(ageOf(r)===ageOf(best)&&cell.i<best.at.cell.i)) best=r; } return best; }
function rackNeed(r){ const need={0:0,1:0,2:0,3:0}; if(r.free) r.items.forEach(it=>{ if(!it.gone&&it.b) need[it.b.ti]++; }); else r.slots.forEach(b=>{ if(b) need[b.ti]++; }); return need; }
function bodyFits(body,r){ if(!S.kz.lanes) return false; const need=rackNeed(r); for(const ti in need) if(need[ti]&&laneFree(body,+ti)<need[ti]) return false; return true; }
function crewReady(body){ return CREW[body].every(w=>S.hum[w].state==='in'&&S.hum[w].free<=S.T); }
function planFk(){ const P=S.fk; if(S.fkTask) return; if(S.T<S.xing) return;
  const kzIn=S.kz.state==='in', dz=S.dz;
  /* 1. собранная стойка клиента — в ячейку */
  for(const p of S.rp){ if(p.r&&p.ready&&!pocketBusy(locRP(p))){ const cell=cellFor(p.r,[p.x,p.z],recAisle()); if(cell){ fkLeavePocket(p.x); S.fkTask=taskRpToCell(p,cell); S.fkTask.t1=P.tc; return; } } }
  /* 2. автопоезд ждёт стойку */
  if(kzIn){ const r=oldestRack(); for(const body of [0,1]){ if(S.kzDone[body]) continue; if(!crewReady(body)) continue;
      if(!r||!bodyFits(body,r)){ S.kzDone[body]=true; continue; }
      fkLeavePocket(r.at.cell.x); S.fkTask=taskCellToBody(r,body); S.fkTask.t1=P.tc; return; } }
  /* 3. замер образцов: поддон образцов — в зону DWS; замеренные — в ячейку (только пока автопоезда на посту нет) */
  if(S.phase==='dws'&&S.kz.state==='away'){
    const sp=S.spp.r; if(dz.st==='go'&&!dz.sp&&sp&&sp.items.length&&sp.items.every(it=>it.placed)){ const spot=S.zs.find(z=>!z.r&&!z.next);
      if(spot&&!pocketBusy(locSPP())&&!pocketBusy(locSpot(spot))){ fkLeavePocket(S.spp.x); S.fkTask=taskSpToZone(spot); S.fkTask.t1=P.tc; return; } }
    if(dz.st==='store'&&dz.mpReady&&!dz.picked){ const spot=spotOf(dz.mp); if(spot&&!pocketBusy(locSpot(spot))){ const cell=cellFor(dz.mp,[spot.x,spot.z],'ZL');
        if(cell){ fkLeavePocket(spot.x); S.fkTask=taskMpToCell(spot,cell); S.fkTask.t1=P.tc; return; } } } }
  /* 4. на приёмке пусто место — привезти пустую стойку (если машины ещё будут); не во время погрузки автопоезда */
  const more=S.cn.state!=='away'||S.inLeft>0;
  if(S.phase!=='load'&&S.T>=(S.crewT||0)&&more&&emptySource()){
    const p=S.rp.find(p=>!p.r&&!p.next&&!pocketBusy(locRP(p)));
    const dst=p||(!S.spp.r&&!S.spp.next&&!(S.phase==='dws'&&dz.st==='go')&&!pocketBusy(locSPP())?S.spp:null);
    if(dst){ fkLeavePocket(dst.x); const t=taskEoToPlace(dst); if(t){ S.fkTask=t; S.fkTask.t1=P.tc; return; } } }
}
function tickFk(){ const P=S.fk; if(S.fkTask){ if(S.fkTask.hold){ if(S.T>=S.fkTask.t1&&!S.unload) startUnload(); if(S.unload&&S.unload.done){ S.unload=null; S.fkTask=taskBodyToEo(); S.fkTask.t1=P.tc; } }
    else if(S.T>=S.fkTask.t1+0.3){ const d=S.fkTask.done; S.fkTask=null; if(d) d(); } }
  if(!S.fkTask) planFk();
  if(S.jobs.length>40) S.jobs=S.jobs.filter(j=>!j.done);
  if(P.S.length>60){ const cut=P.S.findIndex(s=>s.t1>S.T-20); if(cut>1){ const d=P.S.splice(0,cut); d.forEach(s=>{ P.rollBase+=s.run.L*(s.rev?-1:1); }); } }
  while(P.LK.length>8&&P.LK[2][0]<S.T-30) P.LK.splice(0,2); while(P.TK.length>8&&P.TK[2][0]<S.T-30) P.TK.splice(0,2);
  S.fkE=S.fkE.filter(e=>e[0]>S.T-30);
}

/* ---------- разбор стойки в проёме (по фильму: двое, по одному коробу, своя дорожка) ----------
   Стойка клиента — по слотам (что на чём лежит — DEP); поддон образцов — «как легли»: снимают только то, на чём ничего нет.
   Короб с плюсовой стороны стойки берёт грузчик со своей стороны проёма, с минусовой — второй; верхние — первыми. */
function startUnload(){ const h=S.hold, r=h.rack, body=h.body, t0=S.T+0.6, wn=CREW[body][0], ws=CREW[body][1];
  const items=[];
  if(r.free) r.items.forEach(it=>{ if(!it.gone&&it.b) items.push({b:it.b,x:it.x,z:it.z,y:it.y,it}); });
  else r.slots.forEach((b,s)=>{ if(b) items.push({b,x:RSLOT[s].x,z:RSLOT[s].z,y:r.ys[s],s}); });
  items.forEach(o=>{ o.deps=r.free?r.pack.over(o.it).map(x=>items.find(y=>y.it===x)).filter(Boolean):(DEP[o.s]||[]).map(d=>items.find(y=>y.s===d)).filter(Boolean); });
  const sideOf={[wn]:'N',[ws]:'S'}, seq={[wn]:items.filter(o=>o.x>0.05).sort((a,b)=>b.y-a.y),[ws]:items.filter(o=>o.x<=0.05).sort((a,b)=>b.y-a.y)}, free={[wn]:t0+0.6,[ws]:t0}, g=new Map(), cur={};
  for(const w of CREW[body]){ const hh=S.hum[w]; cur[w]=[hh.x,hh.z]; }
  let guard=0, tEnd=t0, left=items.length;
  while(left>0&&guard++<200){
    const cand=CREW[body].filter(w=>seq[w].some(o=>!o.done)).sort((p,q)=>free[p]-free[q]);
    let w=null, o=null; for(const c of cand){ const x=seq[c].find(y=>!y.done&&y.deps.every(d=>g.has(d))); if(x){ w=c; o=x; break; } }
    if(!w) break;
    o.done=true; left--;
    const b=o.b, cw=b.w, hv=b.hv, side=sideOf[w], H=S.hum[w], trk=H.tr;
    const ps=[RB.x+(side==='S'?-1:1)*KSTRIP,Math.max(-0.05,Math.min(0.95,RB.z+o.z))], pyaw=side==='S'?PI/2:-PI/2;
    let t=bodyGo(trk,free[w],cur[w],ps,pyaw,{},1.35);
    let tw=t; o.deps.forEach(d=>{ tw=Math.max(tw,g.get(d)+0.7); }); if(tw>t+0.05){ trk.key(tw,ps[0],ps[1],pyaw,{}); t=tw; }
    trk.key(t+0.42,ps[0],ps[1],pyaw,o.y<0.6?{reach:1,bend:0.5,squat:0.3}:o.y<1.0?{reach:1,bend:0.28}:{reach:1,bend:0.08});
    const grab=t+0.48; g.set(o,grab);
    trk.key(t+0.86,ps[0],ps[1],pyaw,{carry:1,cw,heavy:hv});
    const L=laneSlot2(body,side,b.ti,b.h); if(!L){ cur[w]=ps; free[w]=t+0.9; continue; }       // места нет — короб остаётся в стойке (bodyFits этого не допускает)
    const t1=bodyGo(trk,t+0.86,ps,L.stand,L.yaw,{carry:1,cw,heavy:hv},1.2-0.25*hv);
    trk.key(t1+0.42,L.stand[0],L.stand[1],L.yaw,Object.assign({cw,heavy:hv*0.5},placePose(L.y)));
    const rel=t1+0.5; trk.key(t1+0.9,L.stand[0],L.stand[1],L.yaw,{bend:0.05});
    const bd=F.bod[body], src=r.free?(()=>{ const it=o.it; return ()=>putFree(b,r,it,9); })():(()=>{ const s=o.s, y=r.ys[s]; return ()=>{ const q=RSLOT[s]; putSlot(b.o,r.o,q.x+b.pl.jx,y,q.z+b.pl.jz,b.pl.jy,9,b.pl); }; })();
    S.ev.push({T:grab-0.01,f:()=>{ takeRack(b); job(b,H,grab,rel,src,dt=>{ putSlot(b.o,bd,L.lp.x+b.pl.jx,L.lp.y,L.lp.z+b.pl.jz,PI/2+b.pl.jy,dt,b.pl); },()=>{ b.mode='body'; b.body=body; bd.attach(b.o); S.loaded++; }); }});
    S.kzE[body].push([rel,-7e-6*b.kg,2.0e-5*b.kg*L.lp.z]);                           // подвеска: ≈7 мм на тонну груза; крен — от плеча короба до оси кузова (тяжёлые D у правого борта)
    S.ev.push({T:rel,f:()=>loadAdd(body,b.kg,L.lp.x)});
    free[w]=t1+0.92; cur[w]=L.stand; tEnd=Math.max(tEnd,rel+0.5);
  }
  for(const w of CREW[body]){ const p=S.kPos[w], t=bodyGo(S.hum[w].tr,free[w],cur[w],p,S.kIdle[w],{},1.35); S.hum[w].tr.fin(); S.hum[w].free=t; S.hum[w].x=p[0]; S.hum[w].z=p[1]; }
  S.unload={tEnd:tEnd+0.6,done:false};
}

/* ---------- перенос коробов людьми: план считается целиком (трек), применяется, только если путь свободен от погрузчика ---------- */
function newTrack(h,T){ h.tr=new Track().key(T,h.x,h.z,h.yaw,{}); return h.tr; }
function finTrack(h,x,z,yaw,T){ h.tr.key(T,x,z,yaw,{}); h.tr.fin(); h.x=x; h.z=z; h.yaw=yaw; h.free=T; }
/* двое не проходят друг сквозь друга: новый трек сверяется с треком второго (он стоит на месте после конца своего трека) */
function humClear(h,tr,t0,t1){ for(const k of ['PW','CT']){ const o=S.hum[k]; if(o===h) continue; const tE=Math.max(t1,o.free);
    for(let t=t0;t<=tE+1e-6;t+=0.15){ const p=tr.at(Math.min(t,t1)), q=o.tr.at(t); if(Math.hypot(p.x-q.x,p.z-q.z)<0.45) return false; } } return true; }
const planOK=(h,tr,t1)=>trackSafe(tr,S.T,t1)&&humClear(h,tr,S.T,t1);
/* маршрут человека h: по дорожкам, в обход места, где стоит (или будет стоять) второй */
function hRoute(h,a,b){ const av=[]; for(const k of ["PW","CT"]){ const o=S.hum[k]; if(o!==h) av.push([o.x,o.z]); } return S.nav.route(a,b,av); }
const homeOf=h=>h===S.hum.PW?[S.rc.PK[0],S.rc.PK[1],S.pyP]:[S.rc.CT[0],S.rc.CT[1],S.pyC];
/* короба под местом укладки на поддоне «как легли»: класть не раньше, чем они легли */
function packUnderRel(P,c){ let t=0; for(let a=c.i;a<c.i+c.fx;a++) for(let k=c.j;k<c.j+c.fz;k++){ const q=a*P.nz+k, id=P.id[q]; if(id>=0&&P.h[q]>=c.base-0.012){ const it=P.items[id]; if(it.rel) t=Math.max(t,it.rel+0.45); } } return t; }
/* план замера: порядок снятия с поддона образцов (сверху вниз, мелкие и крупные по очереди) и места на поддоне замеренных —
   считаются сразу для всех образцов, чтобы все поместились; каждый берёт свои образцы по этому порядку (тогда никто не ждёт
   короб, который ещё лежит под другим) */
function zonePlan(){ const dz=S.dz, sp=dz.sp, mp=dz.mp, items=sp.items.filter(it=>!it.gone), ov=(o,it)=>o.base>=it.top-0.012&&o.i<it.i+it.fx&&it.i<o.i+o.fx&&o.j<it.j+it.fz&&it.j<o.j+o.fz;
  const unstack=pick=>{ const on=new Set(items), ord=[]; let k=0; while(on.size){ const L=[...on], free=L.filter(it=>!L.some(o=>o!==it&&ov(o,it))), p=pick(free,k++); on.delete(p); ord.push(p); } return ord; };
  const fill=ord=>{ const M=new Pack(); for(const it of ord){ const c=packFind(M,it.b); if(!c) return null; M.put(c); } return M; };
  const top=f=>f.sort((a,b)=>b.top-a.top)[0];
  const rules=[(f,k)=>top(f.filter(i=>(i.b.ti<2)===(k%2===0)))||top(f),f=>top(f)];
  for(let n=0;n<60;n++) rules.push(f=>f[Math.floor(R()*f.length)]);
  for(const rule of rules){ const ord=unstack(rule), M=fill(ord); if(!M) continue;
    mp.pack=M; mp.items=M.items; M.items.forEach((m,k)=>{ m.b=ord[k].b; m.rel=Infinity; ord[k].mpIt=m; }); dz.order=ord; return true; }
  S.log.push('план замера: образцы не помещаются на один поддон'); dz.order=items; return false; }

/* ---------- приёмка: грузчик в кузове, лента, упаковщик (стойки клиентов), контролёр (образцы, бирки) ---------- */
/* груз машины: три клиента, у каждого — образец и короба в стойку по каждому SKU (clientBelt). Уложен «стенками» от места
   грузчика вглубь кузова: что выгружают первым — ближе и сверху (места считаются в обратном порядке, Pack с правилом «дальше — раньше»). */
function cnCargoBuild(){ const cn=S.cn, cls=TRUCK_CL[(cn.n-1)%TRUCK_CL.length], seq=[];
  cls.forEach(cl=>clientBelt(cl).forEach(e=>seq.push(e))); cn.cl=cls;
  const boxes=seq.map((e,k)=>{ const b=mkBox(e.si); b.sample=e.sample; b.k=k; return b; });
  const rc=S.rc, W=rc.wt; let maxTop=1.35, spots=null;
  for(let tries=0;tries<6;tries++){ const packs=rc.blocks.map(B=>new Pack({c:0.06,x0:B.x0,z0:B.z0,nx:Math.floor((B.x1-B.x0)/0.06),nz:Math.floor((B.z1-B.z0)/0.06),y0:1.30}));
    const sc=(x,z,base,rot)=>-Math.abs(x-W.x)*10+base*0.5+rot*0.001; spots=new Array(boxes.length); let ok=true;
    for(let k=boxes.length-1;k>=0&&ok;k--){ const b=boxes[k]; let best=null, bp=-1;
      packs.forEach((P,pi)=>{ const c=P.find(b.l,b.w,b.h,maxTop,sc); if(c&&(!best||c.sc<best.sc)){ best=c; bp=pi; } });
      if(!best){ ok=false; break; } spots[k]=packs[bp].put(best); }
    if(ok) break; maxTop+=0.15; }
  boxes.forEach((b,k)=>{ const it=spots[k]; b.cp=it; b.mode='cargo';
    b.o.position.set(it.x+(R()-.5)*0.016,it.y,it.z+(R()-.5)*0.016); b.o.rotation.set(0,(it.rot?PI/2:0)+(R()-.5)*0.04,0); F.cnT.add(b.o); });
  return boxes;
}
/* цикл грузчика в кузове: дошёл до короба (стенка груза ближе к месту у носа ленты), взял, вернулся к носу ленты, положил */
function wtTake(b){ const T=S.T, W=S.rc.wt, it=b.cp, yawH=Math.atan2(W.hx,W.hz), hx=(it.rot?b.w:b.l)/2, sg=Math.sign(W.x-it.x)||1;
  let sx=it.x+sg*(hx+0.42), sz=Math.max(-0.85,Math.min(0.85,it.z)); const d1=Math.hypot(sx-W.x,sz-W.z), near=d1<0.45; if(near){ sx=W.x; sz=W.z; }
  const yawB=Math.atan2(it.x-sx,it.z-sz), base=it.y-1.30, low=Math.max(0.05,Math.min(0.75,(0.95-base)/1.1)), cw=b.w, hv=b.hv, side=Math.sign(wrapA(yawB-yawH))||1;
  const WT=new Track(); WT.key(T,W.x,W.z,yawH,{});
  let t=T+0.2; if(!near){ t+=0.25+d1/1.25; WT.key(t,sx,sz,yawB,{}); }
  WT.key(t+0.3,sx,sz,yawB,{twist:0.2*side}); WT.key(t+0.65,sx,sz,yawB,{reach:1,bend:0.25+low*0.6,squat:low*0.35});
  const grab=t+0.72; WT.key(t+0.95,sx,sz,yawB,{reach:0.6,carry:0.5,bend:0.2+low*0.5,squat:low*0.3,cw,heavy:hv});
  WT.key(t+1.25,sx,sz,yawLerp(yawB,yawH,0.5),{carry:1,cw,heavy:hv,twist:-0.2*side}); t+=1.25;
  if(!near) t+=0.15+d1/1.05; WT.key(t,W.x+W.hx*0.06,W.z+W.hz*0.06,yawH,{carry:1,cw,heavy:hv});
  WT.key(t+0.38,W.x+W.hx*0.10,W.z+W.hz*0.10,yawH,{reach:0.9,carry:0.3,bend:0.3,cw}); const e=t+0.45;
  WT.key(e+0.35,W.x+W.hx*0.05,W.z+W.hz*0.05,yawH,{bend:0.05}); WT.fin();
  S.wt.tr=WT; S.wt.free=e+0.35; S.wt.job=b;
  S.ev.push({T:grab,f:()=>{ b.p0=new THREE.Vector3(); b.q0=new THREE.Quaternion(); b.o.getWorldPosition(b.p0); b.o.getWorldQuaternion(b.q0); S.grp.attach(b.o); b.mode='wt'; b.g0=grab; b.e=e; }});
  S.ev.push({T:e,f:()=>{ b.mode='belt'; b.x=0; b.v=0; b.t0=e; b.stops=[]; S.belt.push(b); S.wt.job=null; }});
}
/* какому месту приёмки отдать короб клиента: его стойка уже собирается — туда; иначе — пустая стойка на свободном месте */
function placeFor(cl){ let p=S.rp.find(p=>p.cl===cl&&p.r&&!p.ready&&!p.labeling); if(p) return p;
  if(S.rp.some(p=>p.cl===cl)) return null;
  p=S.rp.find(p=>p.cl===null&&p.r&&p.r.n===0&&!p.next&&p.r.carry.every(c=>c.tb<S.T));
  if(p){ p.cl=cl; slotRack(p.r); p.r.cl=cl; S.log.push('клиент '+CLIENTS[cl].code+' ('+CLIENTS[cl].ru+') → место '+(p.i+1)+' приёмки'); }
  return p||null; }
function freeSlot(r,ti){ for(let s=0;s<20;s++){ const q=RSLOT[s]; if(q.ti!==ti||r.slots[s]||r.res[s]) continue; if((PLACE_REQ[s]||[]).every(d=>r.slots[d]||r.res[d])) return s; } return null; }
function beltPick(h,b,pl){ b.taken=true; S.ev.push({T:pl.grab-0.05,f:()=>{ const i=S.belt.indexOf(b); if(i>=0) S.belt.splice(i,1); }}); }
/* короб клиента: с ленты — в слот его стойки */
function planToRack(h,b,p){ const r=p.r, s=freeSlot(r,b.ti); if(s===null) return false;
  const q=RSLOT[s], y=slotY(r,s), home=homeOf(h);
  for(const st of faceCands(p.x,p.z,S.rc.rkYaw,q.x,q.z,S.rc.faces&&S.rc.faces[h===S.hum.PW?'PW':'CT'],S.rc.nogo)){ const tr=new Track().key(S.T,h.x,h.z,h.yaw,{});
    const c=carrySeg(tr,S.T+0.05,b,{pick:[h.x,h.z,home[2]],pickPose:{reach:1,bend:0.3},toPlace:hRoute(h,[h.x,h.z],[st.x,st.z]),place:[st.x,st.z,st.yaw],placeY:y});
    const tE=walkSeg(tr,c.t,hRoute(h,[st.x,st.z],home),home[2]); tr.fin();
    if(!planOK(h,tr,tE)) continue;
    r.res[s]=b; r.hs[s]=b.h; r.ys[s]=y; h.tr=tr; h.free=tE; h.x=home[0]; h.z=home[1]; h.yaw=home[2]; beltPick(h,b,c);
    job(b,h,c.grab,c.rel,()=>beltPlace(b,S.T),dt=>rackSlotPut(b,r,s,dt),()=>{ putRackLater(b,r,s); });
    return true; }
  return false; }
/* образец: с ленты — в поддон образцов, «как ляжет» (Pack) */
function planToSP(h,b){ const sp=S.spp.r; if(!sp||!sp.free) return false; const cand=packFind(sp.pack,b); if(!cand) return false;
  const pos=packPos(sp.pack,cand), home=homeOf(h);
  for(const st of faceCands(S.spp.x,S.spp.z,S.rc.rkYaw,pos.x,pos.z,null,S.rc.nogo)){ const tr=new Track().key(S.T,h.x,h.z,h.yaw,{});
    const c=carrySeg(tr,S.T+0.05,b,{pick:[h.x,h.z,home[2]],pickPose:{reach:1,bend:0.3},toPlace:hRoute(h,[h.x,h.z],[st.x,st.z]),place:[st.x,st.z,st.yaw],placeY:pos.y,relAt:packUnderRel(sp.pack,cand)});
    const tE=walkSeg(tr,c.t,hRoute(h,[st.x,st.z],home),home[2]); tr.fin();
    if(!planOK(h,tr,tE)) continue;
    const it=sp.pack.put(cand); it.b=b; it.rel=c.rel; h.tr=tr; h.free=tE; h.x=home[0]; h.z=home[1]; h.yaw=home[2]; beltPick(h,b,c);
    job(b,h,c.grab,c.rel,()=>beltPlace(b,S.T),dt=>putFree(b,sp,it,dt),()=>{ freeDone(b,sp,it); });
    return true; }
  return false; }
/* бирка дня и этикетка: контролёр со стороны петель (оттуда заезжает погрузчик, поэтому он ждёт бирку) */
function planLabel(p){ const h=S.hum.CT, r=p.r, m=S.rc.rkYaw?-1:1, L=[p.x-0.5*m,p.z+1.12*m,S.rc.rkYaw?0:PI], home=homeOf(h), T=S.T, tr=new Track().key(T,h.x,h.z,h.yaw,{});
  let t=walkSeg(tr,T+0.3,hRoute(h,[h.x,h.z],[L[0],L[1]]),L[2]);
  tr.key(t+0.45,L[0],L[1],L[2],{reach:0.85,bend:0.1}); const tTag=t+0.45; tr.key(t+0.95,L[0],L[1],L[2],{scan:1,scanner:true}); tr.key(t+1.45,L[0],L[1],L[2],{scan:1,scanner:true}); t+=1.65;
  t=walkSeg(tr,t,hRoute(h,[L[0],L[1]],home),home[2]); tr.fin();
  if(!planOK(h,tr,t)) return false;
  h.tr=tr; h.free=t; h.x=home[0]; h.z=home[1]; h.yaw=home[2]; p.labeling=true;
  S.ev.push({T:tTag,f:()=>{ const today=SIM.cfg.today; if(r.day!==today||!r.tag.visible){ r.o.remove(r.tag); r.tag=dayTag(r.o,-0.5,1.24,0.765,today); } r.tag.visible=true; r.day=today; p.labeling=false; p.ready=true;
    S.log.push('стойка '+(r.cl!==null?CLIENTS[r.cl].code:'')+' собрана: бирка '+DAYN[today]); }});
  return true; }
function tickReception(){ const cn=S.cn, T=S.T;
  /* грузчик в кузове: по одному коробу на ленту, пока лента не переполнена */
  if(cn.state==='in'&&cn.cargo.length&&S.belt.length<SIM.cfg.maxBelt&&S.wt.free<=T&&!S.wt.job) wtTake(cn.cargo.shift());
  const b0=S.belt[0], pw=S.hum.PW, ct=S.hum.CT, ready=h=>h.loc==='rec'&&h.free<=T;
  /* конец ленты: образец берёт контролёр (занят — упаковщик), короб клиента — упаковщик */
  if(b0&&!b0.taken&&b0.x>=F.bTip-F.bBase-0.01){
    if(b0.sample){ if(ready(ct)) planToSP(ct,b0); else if(ready(pw)&&ct.free>T+3) planToSP(pw,b0); }
    else if(ready(pw)||ready(ct)){ const p=placeFor(b0.cl); if(p&&!(ready(pw)&&planToRack(pw,b0,p))&&ready(ct)&&!S.rp.some(q=>q.r&&q.cl!==null&&!q.ready&&!q.labeling&&q.r.n>=20)) planToRack(ct,b0,p); } }
  /* стойка клиента собрана — бирка */
  for(const p of S.rp){ const r=p.r; if(r&&p.cl!==null&&!p.ready&&!p.labeling&&r.n>=20&&r.slots.every(b=>b&&b.mode==='rack')&&ready(ct)){ if(planLabel(p)) break; } }
}

/* ---------- зона DWS: замер образцов ----------
   Упаковщик — мелкие (A, B) на ленточном Goodscan: короб на весовой стол → статический замер 3D-камерой → лента 0,5 м/с через
   рамку светового занавеса (фото) → выходной рольганг до упора; берёт у упора и кладёт на поддон замеренных. Контролёр — крупные
   (C, D) на портальном DWS: ставит на платформу, сканирует штрихкод, смотрит на экран, пока портал меряет; снимает и кладёт туда же.
   Своих не осталось — помогает с чужими. С поддона образцов снимают то, на чём ничего не лежит. */
function zoneNext(h,small){ const dz=S.dz, sp=dz.sp, mp=dz.mp; if(!sp||!mp||!dz.order) return false;
  const it=dz.order.find(it=>!it.taken&&(it.b.ti<2)===small); if(!it||!it.mpIt) return false;
  if(!sp.pack.over(it).every(o=>o.taken)) return false;
  return small?planGs(h,it):planPt(h,it); }
const zFaces=h=>h===S.hum.PW?DWSZ.FPW:DWSZ.FCT;
function takeFromSP(h,it){ const sp=S.dz.sp, s=spotOf(sp);
  return {sts:faceCands(s.x,s.z,0,it.x,it.z,zFaces(h)),grabAt:Math.max(0,...sp.pack.over(it).map(o=>(o.grab||0)+0.7))}; }
function putOnMP(h,it){ const mp=S.dz.mp, s=spotOf(mp), m=it.mpIt; let relAt=0;
  for(const id of m.under){ const u=mp.pack.items[id]; if(!u.rel||u.rel===Infinity) return null; relAt=Math.max(relAt,u.rel+0.45); }   // то, на что он ляжет, ещё не положено — ждать
  return {it2:m,pos:{x:m.x,z:m.z,y:m.y},sts:faceCands(s.x,s.z,0,m.x,m.z,zFaces(h)),relAt}; }
function planGs(h,it){ const T=S.T, Z=DWSZ, b=it.b, sp=S.dz.sp, mp=S.dz.mp, isPW=h===S.hum.PW, w=isPW?Z.wPW:Z.wCT;
  if(S.gsUntil>T+25) return false;
  const a=takeFromSP(h,it), m=putOnMP(h,it); if(!m) return false;
  for(const s1 of a.sts) for(const s2 of m.sts){ if(gsTry(h,it,a,m,s1,s2)) return true; } return false; }
function gsTry(h,it,a,m,s1,s2){ const T=S.T, Z=DWSZ, b=it.b, sp=S.dz.sp, mp=S.dz.mp, isPW=h===S.hum.PW, w=isPW?Z.wPW:Z.wCT, tr=new Track().key(T,h.x,h.z,h.yaw,{});
  const c1=carrySeg(tr,T+0.05,b,{toPick:hRoute(h,[h.x,h.z],[s1.x,s1.z]),pick:[s1.x,s1.z,s1.yaw],pickY:it.y,grabAt:a.grabAt,toPlace:hRoute(h,[s1.x,s1.z],[Z.TS[0],Z.TS[1]]),place:Z.TS,placeY:GS.TOP,relAt:S.gsUntil});
  /* стол: статический замер 3D-камерой (смотрит на монитор), пуск ленты кнопкой на пульте, идёт к выходу */
  const tPut=c1.rel, tS0=tPut+0.55, tS1=tS0+1.6, tB0=tS1+0.55, mon=Math.atan2(Z.gs[0]-0.16-Z.TS[0],Z.gs[1]-0.16-Z.TS[1]), btn=Math.atan2(Z.gs[0]+GS.L0+0.2-Z.TS[0],Z.gs[1]+GS.BW/2+0.13-Z.TS[1]);
  tr.key(tS0,Z.TS[0],Z.TS[1],mon,{look:0.15}); tr.key(tS1,Z.TS[0],Z.TS[1],mon,{look:0.1}); tr.key(tS1+0.3,Z.TS[0],Z.TS[1],btn,{reach:0.6,push:0.5}); tr.key(tB0,Z.TS[0],Z.TS[1],btn,{});
  const j=gsJobMake(b,tPut,tS0,tS1,tB0);
  let t=walkSeg(tr,tB0+0.15,hRoute(h,[Z.TS[0],Z.TS[1]],[Z.OS[0],Z.OS[1]]),Math.atan2(Z.gs[0]+GS.ARCH-Z.OS[0],Z.gs[1]-Z.OS[1]),1.2);     // смотрит, как короб проходит рамку
  const c2=carrySeg(tr,t,b,{pick:Z.OS,pickY:GS.TOP-0.02,grabAt:j.tO1+0.35,toPlace:hRoute(h,[Z.OS[0],Z.OS[1]],[s2.x,s2.z]),place:[s2.x,s2.z,s2.yaw],placeY:m.pos.y,relAt:m.relAt});
  const tE=walkSeg(tr,c2.t,hRoute(h,[s2.x,s2.z],[w[0],w[1]]),w[2]); tr.fin();
  if(!planOK(h,tr,tE)) return false;
  j.m=dwsMeas(b,R); j.n=++S.dz.count; it.taken=true; it.grab=c1.grab; S.gsUntil=c2.grab+0.3; j.grab2=c2.grab; S.gsJobs.push(j);
  const it2=m.it2; it2.rel=c2.rel; h.tr=tr; h.free=tE; h.x=w[0]; h.z=w[1]; h.yaw=w[2];
  S.ev.push({T:c1.grab-0.01,f:()=>{ takeRack(b); job(b,h,c1.grab,c1.rel,()=>putFree(b,sp,it,9),dt=>gsPlace(b.o,j,c1.rel+dt,b.pl),()=>{ b.mode='gs'; b.gj=j; }); }});
  S.ev.push({T:c2.grab-0.01,f:()=>{ job(b,h,c2.grab,c2.rel,()=>gsPlace(b.o,j,S.T,b.pl),dt=>putFree(b,mp,it2,dt),()=>{ freeDone(b,mp,it2); }); }});
  return true; }
function planPt(h,it){ const T=S.T, b=it.b;
  if(S.ptUntil>T+25) return false;
  const a=takeFromSP(h,it), m=putOnMP(h,it); if(!m) return false;
  for(const s1 of a.sts) for(const s2 of m.sts){ if(ptTry(h,it,a,m,s1,s2)) return true; } return false; }
function ptTry(h,it,a,m,s1,s2){ const T=S.T, Z=DWSZ, b=it.b, sp=S.dz.sp, mp=S.dz.mp, isPW=h===S.hum.PW, w=isPW?Z.wPW:Z.wCT, tr=new Track().key(T,h.x,h.z,h.yaw,{});
  const c1=carrySeg(tr,T+0.05,b,{toPick:hRoute(h,[h.x,h.z],[s1.x,s1.z]),pick:[s1.x,s1.z,s1.yaw],pickY:it.y,grabAt:a.grabAt,toPlace:hRoute(h,[s1.x,s1.z],[Z.PS[0],Z.PS[1]]),place:Z.PS,placeY:Z.PT[1],relAt:S.ptUntil});
  /* отступил, сканер — штрихкод, смотрит на экран шкафа, пока портал меряет */
  const tPut=c1.rel, cab=[Z.big[0]-1.22,Z.big[1]-0.62], scr=Math.atan2(cab[0]-Z.PS[0],cab[1]-Z.PS[1]-0.15), px=Z.PS[0], pz=Z.PS[1]+0.15;
  tr.key(tPut+0.75,px,pz,Z.PS[2],{scan:1,scanner:true}); tr.key(tPut+1.5,px,pz,Z.PS[2],{scan:1,scanner:true});
  const tS0=tPut+1.6, tS1=tS0+2.2; tr.key(tS0+0.35,px,pz,scr,{look:0.2}); tr.key(tS1+0.4,px,pz,scr,{look:0.1});
  const j={b,tPut,tS0,tS1,m:null,n:0,grab2:Infinity};
  const c2=carrySeg(tr,tS1+0.4,b,{pick:Z.PS,pickY:Z.PT[1],grabAt:tS1+0.9,toPlace:hRoute(h,[Z.PS[0],Z.PS[1]],[s2.x,s2.z]),place:[s2.x,s2.z,s2.yaw],placeY:m.pos.y,relAt:m.relAt});
  const tE=walkSeg(tr,c2.t,hRoute(h,[s2.x,s2.z],[w[0],w[1]]),w[2]); tr.fin();
  if(!planOK(h,tr,tE)) return false;
  j.m=dwsMeas(b,R); j.n=++S.dz.count; it.taken=true; it.grab=c1.grab; S.ptUntil=c2.grab+0.3; j.grab2=c2.grab; S.ptJobs.push(j);
  const it2=m.it2; it2.rel=c2.rel; h.tr=tr; h.free=tE; h.x=w[0]; h.z=w[1]; h.yaw=w[2];
  S.ev.push({T:c1.grab-0.01,f:()=>{ takeRack(b); job(b,h,c1.grab,c1.rel,()=>putFree(b,sp,it,9),dt=>ptPlace(b.o,j,c1.rel+dt,b.pl),()=>{ b.mode='pt'; b.pj=j; }); }});
  S.ev.push({T:c2.grab-0.01,f:()=>{ job(b,h,c2.grab,c2.rel,()=>ptPlace(b.o,j,S.T,b.pl),dt=>putFree(b,mp,it2,dt),()=>{ freeDone(b,mp,it2); }); }});
  return true; }
/* бирка дня на поддон замеренных — со стороны петель */
function planZoneTag(){ const h=S.hum.CT, mp=S.dz.mp, s=spotOf(mp), L=[s.x-0.5,s.z+1.12,PI], T=S.T, w=DWSZ.wCT, tr=new Track().key(T,h.x,h.z,h.yaw,{});
  let t=walkSeg(tr,T+0.2,hRoute(h,[h.x,h.z],[L[0],L[1]]),L[2]);
  tr.key(t+0.45,L[0],L[1],L[2],{reach:0.85,bend:0.1}); const tTag=t+0.45; tr.key(t+0.95,L[0],L[1],L[2],{scan:1,scanner:true}); tr.key(t+1.45,L[0],L[1],L[2],{scan:1,scanner:true}); t+=1.65;
  t=walkSeg(tr,t,hRoute(h,[L[0],L[1]],[w[0],w[1]]),w[2]); tr.fin();
  if(!planOK(h,tr,t)) return false;
  h.tr=tr; h.free=t; h.x=w[0]; h.z=w[1]; h.yaw=w[2]; S.dz.tagging=true;
  S.ev.push({T:tTag,f:()=>{ const today=SIM.cfg.today; mp.o.remove(mp.tag); mp.tag=dayTag(mp.o,-0.5,1.24,0.765,today); mp.tag.visible=true; mp.day=today;
    S.dz.mpReady=true; S.dz.tagging=false; S.dz.st='store'; S.log.push('замеренные образцы ('+mp.items.length+' шт.) — бирка '+DAYN[today]+', ждут погрузчик'); }});
  return true; }
/* переход упаковщика и контролёра между приёмкой и зоной DWS: друг за другом (не ближе 0,5 м), по свободному от погрузчика пути */
const walkTgt=(h,to)=>to==='zone'?(h===S.hum.PW?DWSZ.wPW:DWSZ.wCT):homeOf(h);
function walkPlan(h,to,delay){ const o=h===S.hum.PW?S.hum.CT:S.hum.PW, tgt=walkTgt(h,to), ot=walkTgt(o,to), tr=new Track().key(S.T,h.x,h.z,h.yaw,{});
  if(delay) tr.key(S.T+delay,h.x,h.z,h.yaw,{}); const t=walkSeg(tr,S.T+delay+0.3,S.nav.route([h.x,h.z],[tgt[0],tgt[1]],[[ot[0],ot[1]]]),tgt[2],1.35); tr.fin();   // в обход места, где встанет второй
  return {tr,t1:t,end:[tgt[0],tgt[1],tgt[2]]}; }
function apart(A,B,t0,t1){ for(let t=t0;t<=t1;t+=0.2){ const p=A.at(t), q=B.at(t); if(Math.hypot(p.x-q.x,p.z-q.z)<0.5) return false; } return true; }
function walkPair(to){ const pw=S.hum.PW, ct=S.hum.CT; let a=null, b=null;
  /* первым идёт тот, кто не проходит вплотную мимо второго (пробуем оба порядка) */
  for(const [h1,h2] of [[pw,ct],[ct,pw]]){ const x=walkPlan(h1,to,0); for(let d=0.6;d<8;d+=0.6){ const y=walkPlan(h2,to,d); if(apart(x.tr,y.tr,S.T,Math.max(x.t1,y.t1))){ a=h1===pw?x:y; b=h1===pw?y:x; break; } } if(a) break; }
  if(!a||!trackSafe(a.tr,S.T,a.t1)||!trackSafe(b.tr,S.T,b.t1)) return false;
  [[pw,a],[ct,b]].forEach(([h,w])=>{ h.tr=w.tr; h.free=w.t1; h.x=w.end[0]; h.z=w.end[1]; h.yaw=w.end[2]; h.loc='walk'; S.ev.push({T:w.t1,f:()=>{ h.loc=to; }}); });
  if(S.V===2) S.xing=Math.max(S.xing,a.t1,b.t1);                       // идут через магистрали: погрузчик ждёт
  S.log.push(to==='zone'?'упаковщик и контролёр идут в зону DWS':'упаковщик и контролёр возвращаются на приёмку'); return true; }
function tickZone(){ const T=S.T, dz=S.dz, pw=S.hum.PW, ct=S.hum.CT; if(S.phase!=='dws') return;
  if(dz.st==='go'){
    if(pw.loc==='rec'&&ct.loc==='rec'&&pw.free<=T&&ct.free<=T) walkPair('zone');
    if(dz.sp&&spotOf(dz.sp)&&pw.loc==='zone'&&ct.loc==='zone'&&pw.free<=T&&ct.free<=T){ dz.st='measure'; zonePlan(); S.log.push('замер образцов: мелкие — Goodscan, крупные — портальный DWS'); } }
  else if(dz.st==='measure'){
    if(pw.free<=T) zoneNext(pw,true); if(ct.free<=T) zoneNext(ct,false);
    if(dz.sp.items.every(it=>it.gone)&&dz.mp.items.every(it=>it.placed)&&pw.free<=T&&ct.free<=T) dz.st='tag'; }
  else if(dz.st==='tag'){ if(ct.free<=T&&!dz.tagging) planZoneTag(); }
  else if(dz.st==='store'){
    if(pw.loc==='zone'&&ct.loc==='zone'&&pw.free<=T&&ct.free<=T) walkPair('rec');
    if(dz.stored&&pw.loc==='rec'&&ct.loc==='rec'&&pw.free<=T&&ct.free<=T){ dz.st='done';
      const old=dz.sp; freeRack(old); dz.mp=old; dz.sp=null; dz.mpReady=false; dz.picked=false; dz.stored=false;     // опустевший поддон образцов — следующий поддон для замеренных
      S.log.push('образцы замерены и лежат в ячейке — зона DWS свободна'); } }
}

/* ---------- машины ---------- */
function tickTrucks(){ const T=S.T, cn=S.cn, kz=S.kz;
  /* фазы: выгрузка → замер образцов → погрузка → выгрузка … */
  const cellsCargo=S.cells.some(c=>c.tiers.some(r=>r.n>0));
  if(S.phase==='unload'&&S.cnDone&&cn.state==='away'&&!S.belt.length&&!S.wt.job&&S.rp.every(p=>p.cl===null||p.ready)&&S.spp.r&&S.spp.r.items.every(it=>it.placed)&&S.hum.PW.free<=T&&S.hum.CT.free<=T){
    S.phase='dws'; S.cnDone=false; S.dz.st='go'; S.log.push('машина выгружена — поддон образцов везут в зону DWS'); }
  if(S.phase==='dws'&&S.dz.st==='done'&&!S.fkTask){ S.dz.st='idle';
    if(cellsCargo){ S.phase='load'; S.kzGone=false; const ta=crewMove('post'); S.kzNext=Math.max(T+3,ta+1); S.log.push('бригада переходит на погрузку автопоезда'); }
    else S.phase='unload'; }
  if(S.phase==='load'&&S.kzGone&&kz.state==='away'){ S.kzGone=false;
    if(S.inLeft>0){ S.phase='unload'; const ta=crewMove('rec'); S.cnNext=Math.max(T+3,ta-3); S.log.push('автопоезд ушёл — бригада возвращается на приёмку'); }
    else if(cellsCargo) crewMove('post'); }
  if(S.phase==='unload'&&cn.state==='away'&&S.inLeft>0&&!S.cnNext&&!S.cnDone){ S.cnNext=T+(cn.n?25:3); }   // в фазе выгрузки — одна машина; следующая только после погрузки
  const v2=S.V===2, H=S.cnH, cnDoor=v2?DOOR.P1:DOOR.L2;
  if(cn.state==='away'&&S.cnNext&&T>=S.cnNext){
    cn.path=v2?mkPath([{t0:T+0.8,t1:T+13,pts:[[H.x+44,H.z],[H.x+14,H.z],[H.x,H.z]],ease:'brake',u0:0.5,rev:true}])      // задним ходом через П1
              :mkPath([{t0:T,t1:T+9,pts:[[H.x,H.z-58],[H.x,H.z-20],[H.x,H.z]],ease:'brake',u0:0.5}]);
    cn.state='arrive'; cn.n++; S.inLeft--; S.cnNext=null; F.cnT.visible=true; cn.cargo=cnCargoBuild(); cn.t0=T; cn.tag=null; cn.rd=null; cn.tDock=T+(v2?13.3:9.3);
    S.log.push('машина из Китая №'+cn.n+(v2?' — задним ходом через П1 на полосу Л1–П1':' — к Л2')+': '+cn.cl.map(c=>CLIENTS[c].code).join(', ')+' · '+cn.cargo.length+' коробов, из них образцов '+cn.cargo.filter(b=>b.sample).length); }
  /* стыковка: машина встала → (во 2-м варианте открывают задние двери) → конвейер выдвигается в кузов → выгрузка;
     кузов пуст и лента пуста → конвейер складывается → (двери закрывают) → машина уезжает */
  if(cn.state==='arrive'||cn.state==='dock'||cn.state==='in'||cn.state==='undock'){ const t0=cn.t0;
    doorSet(cnDoor,v2?kv(T,[[t0,0],[t0+2.6,1],[t0+14.6,1],[t0+17.2,0]]):kv(T,[[t0+5.5,0],[t0+8.0,0.97]])); }
  if(cn.state==='arrive'&&T>=cn.tDock){ cn.state='dock'; if(v2){ cn.rd={t0:T+0.3,t1:T+2.6,open:true}; S.tele.at=T+2.8; } else S.tele.at=T+0.3; S.log.push('машина встала — конвейер выдвигается в кузов'); }
  if(cn.state==='dock'){ if(S.tele.at!==undefined&&T>=S.tele.at){ S.tele.tgt=TELE_EXT; S.tele.at=undefined; }
    if(S.tele.e>=TELE_EXT-1e-4){ cn.state='in'; F.WTr.visible=true; S.wt.free=T+1.2; } }
  if(cn.state==='in'&&!cn.cargo.length&&!S.wt.job&&!S.belt.length){ cn.state='undock'; S.tele.tgt=0; S.log.push('машина из Китая №'+cn.n+' выгружена — конвейер складывается'); }
  if(cn.state==='undock'&&S.tele.e<=1e-4){
    if(v2&&!(cn.rd&&cn.rd.closing)) cn.rd={t0:T,t1:T+2.3,open:false,closing:true};
    else if(!v2||T>=cn.rd.t1){ cn.state='leave'; cn.t1=T+(v2?3.6:1.5);
      cn.path=v2?mkPath([{t0:cn.t1,t1:cn.t1+12,pts:[[H.x,H.z],[H.x+16,H.z],[H.x+62,H.z]],ease:'go',u0:0.45}])
                :mkPath([{t0:cn.t1,t1:cn.t1+10,pts:[[H.x,H.z],[H.x,H.z+16],[H.x,H.z+60]],ease:'go',u0:0.45}]);
      S.ev.push({T:cn.t1-0.2,f:()=>{ F.WTr.visible=false; }}); S.log.push('машина из Китая №'+cn.n+' уезжает'+(v2?' через П1':'')); } }
  if(cn.state==='leave'){ const t1=cn.t1; doorSet(cnDoor,v2?kv(T,[[t1-3.4,0],[t1-0.8,1],[t1+12,1],[t1+14.5,0]]):kv(T,[[t1+1.5,0.97],[t1+4.0,0]]));
    if(T>=t1+(v2?12.5:10.5)){ cn.state='away'; S.cnDone=true; F.cnT.visible=false; F.cnT.position.set(H.x+(v2?70:0),H.y,H.z-(v2?0:70)); } }
  /* автопоезд: пока есть что грузить */
  const haveCargo=cellsCargo||S.rp.some(p=>p.r&&p.r.n>0)||cn.state!=='away'||S.inLeft>0;
  if(S.phase==='load'&&kz.state==='away'&&!S.kzNext&&haveCargo) S.kzNext=Math.max(T+(kz.n?30:40),(S.crewT||0)+1);
  if(S.phase==='load'&&kz.state==='away'&&S.kzNext&&T>=S.kzNext&&cellsCargo){ const k0=F.kz0; kz.t0=T; kz.path=mkPath([{t0:T+3.2,t1:T+14.2,pts:[[k0.x+34,k0.z],[k0.x+14,k0.z],[k0.x,k0.z]],ease:'brake',u0:0.5}]);
    kz.state='arrive'; kz.n++; S.kzNext=null; F.kzT.visible=true; kz.lanes=[0,1].map(()=>({S:{0:0,1:0,2:0,3:0},N:{0:0,1:0,2:0,3:0},hy:{S:{0:[],1:[],2:[],3:[]},N:{0:[],1:[],2:[],3:[]}}})); S.kzDone=[false,false]; S.kzE=[[],[]]; S.kzB0=[[0,0],[0,0]]; loadReset();
    { const gone=[]; F.bod.forEach(b=>b.traverse(o=>{ if(o.userData.simBox&&o.userData.simBox.mode==='body') gone.push(o); })); gone.forEach(o=>{ S.grp.attach(o); o.visible=false; o.userData.simBox.mode='gone'; }); }   // груз прошлого рейса уехал
    S.log.push('автопоезд №'+kz.n+' — через П2 на пост'); }
  if(kz.state==='arrive'){ doorSet(DOOR.P2,kv(T,[[kz.t0,0],[kz.t0+2.6,1],[kz.t0+15.4,1],[kz.t0+18.2,0]]));
    if(T>=kz.t0+14.4){ kz.state='in'; kz.tIn=T; CHOCKS.visible=false; S.ev.push({T:T+1.4,f:()=>{ CHOCKS.visible=true; }});
      CREW.forEach((cw,r)=>{ const t=Math.max(T+1.8,Math.max(...cw.map(w=>S.hum[w].free))+0.3)+r*0.3; planCrewIn(cw,r,t); }); } }   // бригада сначала дошла до поста
  if(kz.state==='in'){ const allDone=S.kzDone&&S.kzDone[0]&&S.kzDone[1]&&!S.fkTask&&!S.hold;
    if(allDone&&!kz.finishing){ kz.finishing=true; planCrewOut(); } }
  if(kz.state==='leave'){ doorSet(DOOR.P2,kv(T,[[kz.t1-3.4,0],[kz.t1-0.8,1],[kz.t1+12,1],[kz.t1+14.5,0]])); if(T>=kz.t1+12.5){ kz.state='away'; kz.finishing=false; S.kzGone=true; F.kzT.visible=false; F.kzT.position.x=F.kz0.x+40; } }
}
function inBody(r,x,z){ const p=F.bod[r].localToWorld(V(x,0,z)); return [p.x,p.z]; }
function planCrewIn(cw,r,t){ cw.forEach(w=>{ S.hum[w].idle={}; }); const [wn,ws]=cw, byaw=F.kz0.r, yAlong=d=>byaw+(d>0?PI/2:-PI/2), [XO,XC]=S.cEdge, xin={[wn]:0.45,[ws]:-0.45};
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
    CREW.flat().forEach(w=>{ S.hum[w].state='wait'; }); }});
}

/* ---------- шаг времени ---------- */
function substep(dt){ const T=S.T+dt;
  /* события */
  S.ev.sort((a,b)=>a.T-b.T); while(S.ev.length&&S.ev[0].T<=T){ const e=S.ev.shift(); e.f(); }
  /* лента: накопление */
  const Lb=F.bTip-F.bBase, LW=Lb-0.34, kS=Lb/LW;
  for(let i=0;i<S.belt.length;i++){ const b=S.belt[i]; let lim=Lb; if(i>0){ const p=S.belt[i-1]; lim=Math.min(lim,p.x-((p.l+b.l)/2+0.04)*kS); }
    const vf=b.v+(BELTV-b.v)*(1-Math.exp(-dt/SLIP)); let xn=b.x+(b.v+vf)/2*dt;
    if(xn>=lim){ if(b.x<lim-1e-4&&vf>0.2&&b.stops.length<6) b.stops.push(T); xn=Math.max(b.x,lim); b.v=0; } else b.v=vf; b.x=xn; }
  S.T=T;
  /* конвейер: выдвижение и складывание ≈0,38 м/с (0,0425 доли хода в секунду) */
  { const tl=S.tele; if(tl&&tl.e!==tl.tgt){ const st=0.0425*dt, d=tl.tgt-tl.e; tl.e=Math.abs(d)<=st?tl.tgt:tl.e+Math.sign(d)*st; teleSet(tl.e); } }
  tickReception(); tickZone(); tickTrucks(); tickFk();
  if(S.unload&&!S.unload.done&&T>=S.unload.tEnd) S.unload.done=true;
  /* пружины: погрузчик и стойка на вилах (вход — кинематика пути), машины */
  const P=S.fk, on=P.S.length&&T<P.S[P.S.length-1].t1+1; const k=on?kin(P.S,T):{v:0,w:0,af:0}; S.kinFk=k;
  S.fkPitch=S.spr.fkP.step(-k.af*0.0042,dt); S.sw.p=S.spr.rkP.step(-k.af*0.0048,dt); S.sw.r=S.spr.rkR.step(-k.v*k.w*0.007,dt);
  const acc=(path)=>{ if(!path) return 0; const s=path[0]; if(T<s.t0+0.45||T>s.t1+0.05) return 0; return accSm(path,T)*(s.rev?-1:1); };
  const ca=S.cn.path&&(S.cn.state==='arrive'||S.cn.state==='leave')?acc(S.cn.path):0, ka=S.kz.path&&(S.kz.state==='arrive'||S.kz.state==='leave')?acc(S.kz.path):0;
  S.cnB=S.spr.cnB.step(-ca*0.0011,dt); S.cnC=S.spr.cnC.step(-ca*0.0055,dt); S.kzB=S.spr.kzB.step(-ka*0.0010,dt); S.kzC=S.spr.kzC.step(-ka*0.0050,dt);
  /* конец цикла: груза нет, машин нет — через 12 с всё заново */
  if(!S.done){ const empty=!S.cells.some(c=>c.tiers.some(r=>r.n>0))&&!S.rp.some(p=>p.r&&p.r.n>0)&&S.phase!=='dws'&&S.inLeft<=0&&S.cn.state==='away'&&S.kz.state==='away'&&!S.fkTask&&!S.belt.length;
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
  { const cn=S.cn, H=S.cnH||F.cn0; if(cn.path&&(cn.state==='arrive'||cn.state==='leave')){ const p=pathAt(cn.path,T); F.cnT.position.set(p.x,H.y,p.z); const r=roll(cn.path,T); F.cnW.forEach(w=>w.rotation.z=r/w.userData.r); }
    F.cnT.rotation.set(0,H.r,S.cnB||0); if(F.cnCab) F.cnCab.rotation.z=S.cnC||0;
    if(cn.rd){ const rd=cn.rd; rdoorSet(F.cnT,rd.open?kv(T,[[rd.t0,0],[rd.t1,1]]):kv(T,[[rd.t0,1],[rd.t1,0]])); }
    const kz=S.kz; if(kz.path&&(kz.state==='arrive'||kz.state==='leave')){ const p=pathAt(kz.path,T); F.kzT.position.set(p.x,F.kz0.y,p.z); const r=roll(kz.path,T); F.kzW.forEach(w=>w.rotation.z=r/w.userData.r); }
    F.kzT.rotation.set(0,F.kz0.r,S.kzB||0); if(F.kzCab) F.kzCab.rotation.z=S.kzC||0;
    F.bod.forEach((b,i)=>{ const E=S.kzE[i], B0=(S.kzB0||[[0,0],[0,0]])[i]; let rl=B0[1], y=B0[0]; for(const e of E){ if(T>e[0]&&T<e[0]+6){ rl+=e[2]*stepR(T-e[0],7.6,0.22); y+=e[1]*stepR(T-e[0],8.8,0.24); } else if(T>=e[0]+6){ rl+=e[2]; y+=e[1]; } } b.position.y=y; b.rotation.x=rl;
      const C=S.kzCurt&&S.kzCurt[i]; if(C){ const d=C.t1-C.t0, edge=(s,dur)=>trap(c01(s),Math.min(0.45,0.35/dur+0.05)); const yv=C.open?edge((T-C.t0)/d,d):1-edge((T-C.t0)/d,d); curtainSet(b,0.5-Math.sin(Math.asin(1-2*yv)/3)); } });
    F.kzT.updateMatrixWorld(true);
    if(!S.kzB0) S.kzB0=[[0,0],[0,0]];                             // старые (отыгравшие) события — в базу, чтобы просадка и крен от всего груза не терялись
    S.kzE.forEach((E,i)=>{ while(E.length>40&&E[0][0]+6<T){ const e=E.shift(); S.kzB0[i][0]+=e[1]; S.kzB0[i][1]+=e[2]; } }); }
  /* грузчик в кузове, лента */
  if(F.boom){ F.boom.updateMatrixWorld(true); if(S.cn.state==='in') F.tlRuns.forEach(b=>{ b.tex.offset.x=(((-Math.sign(b.sp||1)*0.55*T)%1)+1)%1; }); }
  if(F.WTr.visible){ const st=S.wt.tr?S.wt.tr.at(T):{x:S.rc.wt.x,z:S.rc.wt.z,yaw:0,pose:{},walk:0,phase:0}; F.WTr.position.set(st.x,F.WTy,st.z); F.WTr.rotation.y=st.yaw; HUM.pose(F.WT,Object.assign({t:T,walk:st.walk*0.8,phase:st.phase},st.pose)); }
  /* стойки (сначала — чтобы короба в них встали на место) */
  for(const r of S.racks) rackFrame2(r,T);
  /* аппараты DWS (до коробов: короб на ленте Goodscan считается по её положению) */
  F.gs.updateMatrixWorld(true); F.dws.updateMatrixWorld(true); gsVisAt(S.gsJobs,T); ptVisAt(S.ptJobs,T);
  /* люди */
  for(const key in S.hum){ const h=S.hum[key], H=h.H; if(!H) continue;
    if(h.state==='in'||h.state==='inJump'){ const r=h.body, b=F.bod[r]; b.getWorldQuaternion(_q); _eu.setFromQuaternion(_q,'YXZ'); const byaw=_eu.y; const st=h.tr.at(T);
      b.localToWorld(_v.set(st.x,BEDY,st.z)); H.root.position.copy(_v); H.root.rotation.y=st.yaw+byaw; HUM.pose(H,Object.assign({t:T,walk:st.walk,phase:st.phase},st.pose)); }
    else if(h.state==='walkIn'){ const ci=h.ci, r=h.body, b=F.bod[r]; b.getWorldQuaternion(_q); _eu.setFromQuaternion(_q,'YXZ'); const byaw=_eu.y;
      if(T<ci.t) drive(H,h.tr.at(T),T); else { const u=c01((T-ci.t)/0.9); b.localToWorld(_v.set(ci.x,BEDY*ez(Math.min(1,u*1.3)),lerp(1.62,0.95,ez(c01(u*1.5-0.4))))); H.root.position.copy(_v); H.root.rotation.y=byaw+PI; HUM.pose(H,{t:T,reach:0.85*(1-u),bend:0.1+0.55*Math.sin(u*PI),squat:0.6*Math.sin(u*PI)}); } }
    else if(h.state==='jump'){ const J=h.J, r=h.body, b=F.bod[r]; b.getWorldQuaternion(_q); _eu.setFromQuaternion(_q,'YXZ'); const byaw=_eu.y; const u=c01((T-J.tj)/J.tf), tt=T-J.tj;
      H.root.position.set(lerp(J.s.x,J.e.x,u),Math.max(0,J.s.y+0.225*tt-4.905*tt*tt),lerp(J.s.z,J.e.z,u)); H.root.rotation.y=byaw; HUM.pose(H,{t:T,squat:0.3-0.12*Math.sin(u*PI),reach:0.4,bend:0.12}); }
    else drive(H,h.tr.at(T),T); }
  if(F.SUP){ const s=S.rc.SUP; F.SUP.root.position.set(s[0],0,s[1]); F.SUP.root.rotation.y=s[2]; HUM.pose(F.SUP,{t:T,tablet:1,look:Math.sin(T*0.4)*0.5}); }
  /* короба */
  for(const b of S.boxes){ if(b.mode==='wt'){ inHands(F.WT,b.o); const g=(T-b.g0)/0.25;
      if(g<1&&b.p0){ _p0.copy(b.o.position); _q0.copy(b.o.quaternion); b.o.position.lerpVectors(b.p0,_p0,ez(g)); b.o.quaternion.copy(b.q0).slerp(_q0,ez(g)); }   // со стенки груза — в руки
      const u=(T-(b.e-0.32))/0.32; if(u>0){ _p0.copy(b.o.position); _q0.copy(b.o.quaternion); b.x=0; b.stops=b.stops||[]; b.t0=b.t0||b.e; beltPlace(b,b.e); b.o.position.lerpVectors(_p0,b.o.position,ez(u)); b.o.position.y+=0.10*Math.sin(PI*c01(u)); b.o.quaternion.copy(_q0.slerp(b.o.quaternion,ez(u))); } }
    else boxFrame(b,T); }
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
  const ph=S.phase==='unload'?'ВЫГРУЗКА машины из Китая':S.phase==='dws'?'ЗАМЕР ОБРАЗЦОВ на DWS':'ПОГРУЗКА автопоезда';
  return `цикл ${S.cycle} · ${mm}:${String(ss).padStart(2,'0')}${S.V===2?' · приёмка через П1':''} · ${ph} · в ячейках ${racks} стоек / ${boxes} коробов · машин из Китая осталось ${S.inLeft+(S.cn.state!=='away'?1:0)} · автопоездов загружено ${S.outN} · погружено ${S.loaded}${(()=>{ const A=axleInfo(); return A&&(A.m1+A.m2)>0?` · в кузовах ${tt(A.m1)} + ${tt(A.m2)} т (оси грузовика +${tt(A.front)} / +${tt(A.rear)} т)`:''; })()} · ${now}`; }
SIM.enter=function(){ if(SIM.on) return; if(F.on) exit(); prepScene(true); HUM.attn=attnFn;
  const keep=new Set([F.fk,F.CT.root,F.W3.root,F.W5.root,F.W4.root,F.tl2,F.dws,F.gs].concat(Object.values(F.KH).map(H=>H.root)));
  S.filmVis=F.grp.children.map(o=>[o,o.visible]); F.grp.children.forEach(o=>{ o.visible=keep.has(o); });
  setup(); SIM.on=true; SIM.T=0; applyVis(0); if(SIM.onChange) SIM.onChange(); };
SIM.exit=function(){ if(!SIM.on) return; SIM.on=false; HUM.attn=null; teardown(); (S.filmVis||[]).forEach(([o,v])=>o.visible=v); unprepScene(); if(SIM.onChange) SIM.onChange(); };
SIM.state=()=>S; SIM.log=()=>S.log;
SIM._dbg={Track,carrySeg,freeSlot,slotY,placeFor,putOnMP,takeFromSP,gsTry,ptTry,walkPlan,walkPair,trackSafe,apart,fkPoseAt,fkHit,fkEnd,pocketBusy,humIn,locSpot,locRP,locSPP,cellFor,zoneNext,humClear,planOK,homeOf,walkSeg,faceCands};   // для проверок
SIM.owns=H=>SIM.on&&(H===F.PW||H===F.WP||H===F.SUP);
/* ---------- вариант приёмки и в обычном виде (14.10) ----------
   Кнопка варианта переставляет и обычную сцену (без живого процесса): машина из Китая, конвейер, запас пустых стоек и люди
   приёмки переезжают к П1 (места — из RCPV[2]) или обратно к Л2. Правка пользователя у Л2 не трогается: если он двигает эти
   объекты, пока выбран П1, правка пишется отдельно (edStore.v2 = {eid:{p,r,o}}). Выбранный вариант хранится в edStore.v. */
const RCV={v:1,applied:1};                                           // v — выбранный вариант, applied — какой сейчас расставлен в обычной сцене
function rcvDef(){ find(); const rc=RCPV[2], D={}, yawTo=(a,b)=>Math.atan2(b[0]-a[0],b[1]-a[1]);
  const add=(o,p,r)=>{ if(o&&o.userData&&o.userData.eid) D[o.userData.eid]={o,p,r}; };
  D['t-l2']={lib:true,p:[rc.tl[0],0,rc.tl[2]],r:rc.tl[3],o:{lift:0.0,tilt:3,ext:TELE_EXT,dir:-1}};     // как конвейер живого процесса у П1
  add(F.cnT,[rc.home.x,rc.home.y,rc.home.z],rc.home.r);                                               // машина задним ходом на полосе Л1–П1
  add(G.equip.children.find(o=>/Запас пустых/.test(o.userData.nm||'')),[15.0,0,30.65],PI/2);       // два штабеля у западного конца полосы (x 11,0 и 12,7)
  add(F.PW&&F.PW.root,[rc.PK[0],0,rc.PK[1]],yawTo(rc.PK,[27.9,32.8]));                                 // упаковщик — у хвоста ленты
  add(F.WP&&F.WP.root,[25.3,0,31.78],PI);                                                             // второй упаковщик — у места стойки клиента
  add(F.SUP&&F.SUP.root,[rc.SUP[0],0,rc.SUP[1]],rc.SUP[2]);                                           // старший смены
  return D; }
/* конвейер — объект каталога: другая высота и уклон, поэтому пересобирается (запись правки у Л2 остаётся как была) */
function rcvRespawn(id,opts,p,r){ const o=edMap.get(id); if(!o) return null; const kind=o.userData.libKind, vis=o.visible;
  const rec=edStore.a.find(c=>c.i===id), keep=rec?JSON.parse(JSON.stringify(rec)):null;
  libRemove(o); const g=libSpawn(kind,opts,p,r,id); if(keep&&!edStore.a.some(c=>c.i===id)) edStore.a.push(keep); if(g&&!vis) edHide(g); return g; }
/* груз машины у П1: короба рабочей зоны (там, куда заходит конвейер и где стоит грузчик) убраны — машину уже начали разгружать */
function rcvCargo(v){ const T=F.cnT; if(!T) return; if(!T.userData.rcvHid) T.userData.rcvHid=[];
  if(v===2){ if(T.userData.rcvHid.length) return; T.traverse(o=>{ if(o.isMesh&&isCarton(o.material)&&!o.userData.batch&&o.position.x<RCPV[2].hideX&&o.visible){ o.visible=false; T.userData.rcvHid.push(o); } }); }
  else { T.userData.rcvHid.forEach(o=>o.visible=true); T.userData.rcvHid=[]; } }
function rcvApply(v){ v=v===2?2:1; const D=rcvDef(), V2=edStore.v2||{};
  if(typeof ED!=='undefined'&&ED.sel&&D[ED.sel.userData.eid]) edDeselect();
  for(const id in D){ const d=D[id], e=V2[id];
    if(d.lib){ const o=edMap.get(id); if(!o||o.userData.rcvV===v) continue; const rec=edStore.a.find(c=>c.i===id);
      const w=v===2?{p:(e&&e.p)||d.p,r:e&&e.r!==undefined?e.r:d.r,o:Object.assign({},d.o,(e&&e.o)||{})}:rec?{p:rec.p,r:rec.r,o:rec.o}:null;
      if(!w) continue; const g=rcvRespawn(id,w.o,w.p,w.r); if(g) g.userData.rcvV=v; continue; }
    const o=d.o, b=o.userData.base, m=edStore.m[id];
    const P=v===2?(e?e.p:d.p):(m?m.slice(0,3):b?b.slice(0,3):null), R=v===2?(e?e.r:d.r):(m?m[3]:b?b[3]:o.rotation.y);
    if(P){ o.position.set(P[0],P[1],P[2]); o.rotation.y=R; } }
  if(F.cnT){ rdoorSet(F.cnT,v===2?1:0); F.cnT.userData.rdU=v===2?1:0; rcvCargo(v); }
  if(typeof DOOR!=='undefined'&&DOOR.L2){ if(RCV.l2Open===undefined) RCV.l2Open=DOOR.L2.open; doorSet(DOOR.L2,v===2?0:RCV.l2Open); }   // у Л2 машины нет — ворота закрыты
  RCV.v=v; RCV.applied=v; edStore.v=v; edSave();
  scene.updateMatrixWorld(true); renderer.shadowMap.needsUpdate=true; }
/* правка в редакторе, пока выбран П1: для этих объектов — в edStore.v2, остальное — как обычно */
{ const recO=edRecord, rebO=libRebuild;
  edRecord=function(o){ const id=o&&o.userData&&o.userData.eid;
    if(RCV.v===2&&id&&rcvDef()[id]){ const s2=edStore.v2||(edStore.v2={}), e=s2[id]||(s2[id]={});
      e.p=[+o.position.x.toFixed(3),+o.position.y.toFixed(3),+o.position.z.toFixed(3)]; e.r=+o.rotation.y.toFixed(4); edSave(); return; }
    recO(o); };
  libRebuild=function(o,key,val){ const id=o&&o.userData&&o.userData.eid;
    if(RCV.v===2&&id==='t-l2'&&edMap.get(id)===o){ const s2=edStore.v2||(edStore.v2={}), e=s2[id]||(s2[id]={});
      e.o=Object.assign({},o.userData.libOpts,{[key]:val}); e.p=[o.position.x,o.position.y,o.position.z]; e.r=o.rotation.y;
      const g=rcvRespawn(id,e.o,e.p,e.r); if(g) g.userData.rcvV=2; edSave(); if(g){ ED.sel=g; edUI(); libPanel(true); } return; }
    rebO(o,key,val); }; }
F.rcv={apply:rcvApply,cargo:rcvCargo,get v(){ return RCV.v; },get applied(){ return RCV.applied; }};          // для prepScene/unprepScene фильма (они во внешнем модуле)
if(SIM.cfg.variant!==2&&(edStore.v|0)===2) SIM.cfg.variant=2;              // выбранный вариант — из сохранённой расстановки
if(SIM.cfg.variant===2) rcvApply(2);
/* ---------- кнопки: запуск, скорость, строка состояния ---------- */
{ const bt=mkBtn('▶ Живой процесс · непрерывно',true,()=>{ if(SIM.on) SIM.exit(); else SIM.enter(); });
  bt.title='Склад работает сам, в реальном времени: выгрузка машин из Китая (три клиента, свои SKU), образцы в отдельный поддон, замер образцов на двух DWS, стойки в ячейки, автопоезд грузится по FIFO до полного и уезжает — пока ячейки не опустеют; затем всё заново. Зайдите в режим обхода и смотрите изнутри.';
  const sp=document.createElement('div'); sp.style.cssText='display:none;gap:4px;margin:2px 0 6px'; sp.id='simspeed';
  [1,4,16].forEach(k=>{ const b=document.createElement('button'); b.textContent='×'+k; b.style.flex='1'; b.onclick=()=>{ SIM.speed=k; sp.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); }; if(k===1) b.className='on'; sp.appendChild(b); });
  bt.parentNode.insertBefore(sp,bt.nextSibling);
  /* вариант приёмки: у Л2 (площадка) или через П1 (машина заезжает задним ходом на полосу Л1–П1) */
  const vbTxt=()=>SIM.cfg.variant===2?'Приёмка: машина через П1 · переключить на Л2':'Приёмка: машина у Л2 · переключить на П1';
  const vb=mkBtn(vbTxt(),true,()=>{ const on=SIM.on; if(on) SIM.exit(); SIM.cfg.variant=SIM.cfg.variant===2?1:2; vb.textContent=vbTxt();
    if(!F.on) rcvApply(SIM.cfg.variant); else { RCV.v=SIM.cfg.variant; edStore.v=RCV.v; edSave(); }            // в фильме — после выхода (unprepScene)
    if(on){ SIM.enter(); if(typeof walk!=='undefined'&&walk&&typeof WALKP!=='undefined') WALKP.build(); }
    else if(typeof walk!=='undefined'&&walk&&typeof WALKP!=='undefined') WALKP.build(); });
  vb.title='Вариант 2: машина из Китая задним ходом заезжает через П1 и встаёт на полосе Л1–П1 кабиной к воротам; конвейер заходит в кузов через задние двери, стойки собираются южнее полосы и уходят в ячейки с северной магистрали. Зона DWS — одна для обоих вариантов. Переключение перезапускает живой процесс.';
  bt.parentNode.insertBefore(vb,sp.nextSibling);
  const st=document.createElement('div'); st.id='simstat'; st.style.cssText='display:none;position:absolute;left:50%;bottom:40px;transform:translateX(-50%);max-width:88%;z-index:25;background:rgba(10,14,20,.78);color:#e9ecef;border:1px solid rgba(242,183,5,.5);border-radius:6px;padding:6px 12px;font:500 12px/1.4 system-ui,sans-serif;pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
  view.appendChild(st);
  SIM.onChange=()=>{ bt.classList.toggle('on',SIM.on); bt.textContent=SIM.on?'■ Остановить живой процесс':'▶ Живой процесс · непрерывно'; sp.style.display=SIM.on?'flex':'none'; st.style.display=SIM.on?'block':'none'; };
  SIM.ui=()=>{ if(SIM.on) st.textContent=SIM.stat; };
}
})();
