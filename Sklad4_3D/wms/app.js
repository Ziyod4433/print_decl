/* ==========================================================================
   BURAQ · СКЛАД №4 · УПРАВЛЕНИЕ СКЛАДОМ (WMS) — отдельный лёгкий файл без 3D.
   Данные — из таблиц Google (те же, что у режима «Учёт груза» в 3D-модели), размещение по ячейкам — здесь,
   в браузере (общий ключ с 3D-моделью: место, заданное здесь, видно и в 3D).
   Сборка: python3 build.py --wms → Buraq_WMS.html (общий разбор таблиц берётся из stock/00_data.js).
   ========================================================================== */
(()=>{
'use strict';
const DAY=86400000, KEY='buraq.wms.v1', VER='18.11.2026';
const S={today:null};
const BL={fs:'Fura statuslari',fsRows:[6,5,7,1,2,3,4,8],of:'Ortilgan furalar',ofRows:[2,1,3]};
const pad=n=>String(n).padStart(2,'0');
const day0=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const fmtD=d=>d?pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear():'—';
const fmtDs=d=>d?pad(d.getDate())+'.'+pad(d.getMonth()+1):'—';
const fmtN=(v,k)=>(+v||0).toLocaleString('ru-RU',{maximumFractionDigits:k===undefined?1:k});
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dDiff=(a,b)=>Math.round((day0(a)-day0(b))/DAY);
const today=()=>day0(S.today||new Date());
const plural=(n,a,b,c)=>{ n=Math.abs(n)%100; const k=n%10; return n>10&&n<20?c:k===1?a:k>=2&&k<=4?b:c; };
const daysTxt=n=>n+' '+plural(n,'день','дня','дней');

/*__CORE__*/

/* ---------------------------------------------------------------- склад: ячейки и план (те же размеры, что в 3D-модели) */
const W=48.05, H=35.5;
const SEC=[[1.2,15.3],[16.85,31.25],[32.85,46.85]], ROWS=[{k:'A',z0:17.5,z1:20.9},{k:'B',z0:21.5,z1:26.0}];
const CELLS=[]; ROWS.forEach(r=>{ let n=0; SEC.forEach(sec=>{ const w=(sec[1]-sec[0])/5; for(let i=0;i<5;i++){ n++;
  CELLS.push({id:r.k+n,x0:sec[0]+i*w+0.09,x1:sec[0]+(i+1)*w-0.09,z0:r.z0,z1:r.z1,row:r.k,n}); } }); });
const CELL=Object.fromEntries(CELLS.map(c=>[c.id,c]));
const CELL_ORDER=(()=>{ const o=[]; for(let n=15;n>=1;n--){ o.push('A'+n); o.push('B'+n); } return o; })();
function cellList(s){
  const out=[]; String(s||'').toUpperCase().replace(/А/g,'A').replace(/В/g,'B').split(/[\s,;+]+/).forEach(p=>{ if(!p) return;
    const m=p.match(/^([AB])(\d{1,2})(?:[-–—]([AB])?(\d{1,2}))?$/); if(!m) return;
    const a=+m[2], b=m[4]?+m[4]:a; for(let n=Math.min(a,b);n<=Math.max(a,b);n++){ const id=m[1]+n; if(CELL[id]&&!out.includes(id)) out.push(id); } });
  return out;
}

/* ---------------------------------------------------------------- настройки и состояние */
const CFG={norm:7,rackM3:3,stacks:2,tiers:2,refresh:120,theme:'',placeKg:1000};
const A={src:{kind:'none',url:''},data:null,at:0,err:'',busy:false,date:null,page:'dash',color:'days',selCell:null,pick:null,
  lf:{st:'here',late:false,unplaced:false,mark:'',q:''},sort:{k:'days',d:-1},lim:300,undo:null};
const capCell=()=>CFG.stacks*CFG.tiers*CFG.rackM3, capAll=()=>capCell()*CELLS.length;
let PL={};
function loadPL(){ PL=placeMap(); }
function savePL(){ try{ localStorage.setItem(PLACE_KEY,JSON.stringify(PL)); }catch(e){} }
const plain=d=>({kind:d.kind,name:d.name,reys:d.reys.map(r=>({code:r.code,loaded:r.loaded,cn:r.cn,arr:r.arr,out:r.out,kz:r.kz,tash:r.tash,
  lots:r.lots.map(l=>({mark:l.mark,cargo:l.cargo,pack:l.pack,ctn:l.ctn,cbm:l.cbm,kg:l.kg,dest:l.dest,cell:l.cell,arr:l.arr0!==undefined?l.arr0:l.arr,out:l.out0!==undefined?l.out0:l.out,kz:l.kz0!==undefined?l.kz0:l.kz,note:l.note}))}))});
function store(){ try{ localStorage.setItem(KEY,JSON.stringify({cfg:CFG,src:A.src,at:A.at,data:A.data?plain(A.data):null,color:A.color})); }catch(e){} }
function restore(){
  try{ const o=JSON.parse(localStorage.getItem(KEY)||'null');
    if(o){ Object.assign(CFG,o.cfg||{}); if(o.src) A.src=o.src; A.at=o.at||0; if(o.color) A.color=o.color; if(o.data) A.data=revive(o.data); }
    else { const s=JSON.parse(localStorage.getItem('sklad4.stock.v1')||'null');   /* первый запуск: источник и данные из режима «Учёт груза» 3D-модели */
      if(s){ if(s.src&&s.src.kind==='url') A.src={kind:'url',url:s.src.url}; if(s.cfg&&s.cfg.norm) CFG.norm=s.cfg.norm; if(s.data) { A.data=revive(s.data); A.at=s.at||0; } } }
  }catch(e){}
  loadPL();
}
function revive(d){ const rd=v=>v?new Date(v):null;
  d.reys.forEach(r=>{ ['loaded','arr','out','tash'].forEach(k=>r[k]=rd(r[k])); r.lots.forEach(l=>{ l.arr=rd(l.arr); l.out=rd(l.out); }); }); return d; }
/* грузы плоским списком: у каждого — свой рейс, даты, ключ размещения */
let LOTS=[], TRIPS=[];
function prep(){
  LOTS=[]; TRIPS=[]; if(!A.data) return;
  A.data.reys.forEach(r=>{ const t={code:r.code,r,loaded:r.loaded,cn:r.cn,arr:r.arr,out:r.out,kz:r.kz,lots:[],cbm:0,kg:0,ctn:0};
    r.lots.forEach((l,i)=>{ if(l.arr0===undefined){ l.arr0=l.arr||null; l.out0=l.out||null; l.kz0=l.kz||''; }
      const L={i:LOTS.length,reys:r.code,t,mark:l.mark,cargo:l.cargo||'',pack:l.pack||'',ctn:+l.ctn||0,cbm:+l.cbm||0,kg:+l.kg||0,dest:l.dest||'',cellT:l.cell||'',
        arr:l.arr0||r.arr,out:l.out0||r.out,kz:l.kz0||r.kz||'',note:l.note||''};
      L.key=lotKey(L); t.lots.push(L); LOTS.push(L); t.cbm+=L.cbm; t.kg+=L.kg; t.ctn+=L.ctn; });
    TRIPS.push(t); });
}
function setData(d,src){ A.data=d; A.at=Date.now(); A.err=''; if(src) A.src=src; prep(); store(); calc(); render(); }

/* ---------------------------------------------------------------- состояние на дату */
let ST=null;
const viewDate=()=>A.date?day0(A.date):today();
function calc(){
  const D=viewDate(), st={D,here:[],trips:{here:[],transit:[],gone:[]},cells:{},unplaced:[],marks:{},k:{}};
  CELLS.forEach(c=>st.cells[c.id]={c,lots:[],m3:0,tbl:false});
  const hist=TRIPS.filter(t=>t.loaded&&t.arr&&t.arr<=D).sort((a,b)=>a.arr-b.arr).slice(-12).map(t=>dDiff(t.arr,t.loaded)).filter(x=>x>=0&&x<40);
  st.transit=hist.length?Math.round(hist.reduce((a,b)=>a+b,0)/hist.length):6;
  TRIPS.forEach(t=>{ const here=t.lots.filter(l=>l.arr&&l.arr<=D&&(!l.out||l.out>=D));
    t.hereLots=here; t.status=''; t.days=null; t.eta=null;
    if(here.length){ t.status='here'; t.arrH=new Date(Math.min.apply(null,here.map(l=>l.arr))); t.days=dDiff(D,t.arrH); t.outToday=!!(t.out&&dDiff(t.out,D)===0); st.trips.here.push(t); }
    else if(t.arr&&t.out&&t.out<D){ t.status='gone'; t.dwell=dDiff(t.out,t.arr); st.trips.gone.push(t); }
    else if((t.loaded&&t.loaded<=D&&(!t.arr||t.arr>D))||(!t.loaded&&t.arr&&t.arr>D)){ t.status='transit';
      t.eta=t.arr||(t.loaded?new Date(t.loaded.getTime()+st.transit*DAY):null); t.plan=!t.arr; t.inD=t.eta?dDiff(t.eta,D):null; st.trips.transit.push(t); } });
  st.trips.here.sort((a,b)=>a.arrH-b.arrH||(a.code<b.code?-1:1)); st.trips.transit.sort((a,b)=>(a.eta||0)-(b.eta||0)); st.trips.gone.sort((a,b)=>b.out-a.out);
  st.trips.here.forEach((t,i)=>t.q=i+1);
  st.trips.here.forEach(t=>t.hereLots.forEach(l=>{ l.days=dDiff(D,l.arr); st.here.push(l);
    const ids=cellList(l.cellT); l.cellsT=ids.length>0; l.cells=ids.length?ids:(PL[l.key]||[]).filter(id=>CELL[id]);
    if(!l.cells.length) st.unplaced.push(l);
    else l.cells.forEach(id=>{ const cs=st.cells[id]; cs.lots.push(l); if(ids.length) cs.tbl=true; });
    const m=st.marks[l.mark]||(st.marks[l.mark]={mark:l.mark,lots:[],cbm:0,kg:0,ctn:0,maxDays:0,trips:new Set()});
    m.lots.push(l); m.cbm+=l.cbm; m.kg+=l.kg; m.ctn+=l.ctn; m.maxDays=Math.max(m.maxDays,l.days); m.trips.add(l.reys); }));
  /* объём по ячейкам: груз в нескольких ячейках заполняет их по очереди (как при размещении), последняя берёт остаток */
  const capc=capCell();
  st.here.filter(l=>l.cells.length).sort((a,b)=>(a.t.arrH-b.t.arrH)||(a.reys<b.reys?-1:a.reys>b.reys?1:0)||(a.mark<b.mark?-1:a.mark>b.mark?1:0)||(b.cbm-a.cbm)).forEach(l=>{ let rem=l.cbm; l.share={};
    l.cells.forEach((id,i)=>{ const cs=st.cells[id], v=i===l.cells.length-1?rem:Math.min(rem,Math.max(0,capc-cs.m3)); cs.m3+=v; l.share[id]=v; rem-=v; }); });
  /* предложение для груза без ячейки: рейсы по очереди от поста погрузки П2, каждый рейс — с новой свободной ячейки */
  const free=CELL_ORDER.filter(id=>!st.cells[id].lots.length), fill={}; st.sug={}; st.sugLeft=0;
  st.trips.here.forEach(t=>{ const ls=st.unplaced.filter(l=>l.reys===t.code).sort((a,b)=>a.mark<b.mark?-1:a.mark>b.mark?1:b.cbm-a.cbm); let cur=null;
    ls.forEach(l=>{ let rem=l.cbm; const ids=[];
      while(rem>1e-6){ if(!cur||fill[cur]>=capc-1e-6){ if(!free.length) break; cur=free.shift(); fill[cur]=0; }
        const v=Math.min(rem,capc-fill[cur]); fill[cur]+=v; rem-=v; if(!ids.includes(cur)) ids.push(cur); const cs=st.cells[cur]; cs.vm3=(cs.vm3||0)+v; (cs.vlots=cs.vlots||[]).includes(l)||cs.vlots.push(l); }
      if(ids.length) st.sug[l.key]=ids; l.vcells=ids; if(rem>0.05) st.sugLeft+=rem; }); });
  const K=st.k, sum=(a,f)=>a.reduce((x,y)=>x+f(y),0);
  K.trips=st.trips.here.length; K.lots=st.here.length; K.cbm=sum(st.here,l=>l.cbm); K.kg=sum(st.here,l=>l.kg); K.ctn=sum(st.here,l=>l.ctn);
  K.marks=Object.keys(st.marks).length; K.cap=capAll(); K.fill=K.cap?K.cbm/K.cap:0;
  K.maxDays=st.here.length?Math.max.apply(null,st.here.map(l=>l.days)):0;
  K.avgDays=K.cbm?sum(st.here,l=>l.days*l.cbm)/K.cbm:0;
  K.late=st.here.filter(l=>l.days>CFG.norm); K.lateM3=sum(K.late,l=>l.cbm);
  K.unplacedM3=sum(st.unplaced,l=>l.cbm);
  K.heavy=st.here.filter(l=>l.ctn>0&&l.kg/l.ctn>CFG.placeKg);
  K.over=Object.values(st.cells).filter(c=>c.m3>capCell()+0.05);
  K.usedCells=Object.values(st.cells).filter(c=>c.lots.length).length;
  const g10=st.trips.gone.slice(0,10); K.avgDwell=g10.length?sum(g10,t=>t.dwell)/g10.length:null; K.maxDwell=g10.length?Math.max.apply(null,g10.map(t=>t.dwell)):null;
  K.lateShare=g10.length?g10.filter(t=>t.dwell>CFG.norm).length/g10.length:null;
  K.inToday=st.trips.transit.filter(t=>t.inD===0); K.outToday=st.trips.here.filter(t=>t.outToday);
  K.soon=st.trips.transit.filter(t=>t.inD!=null&&t.inD<=3); K.soonM3=sum(K.soon,t=>t.cbm);
  ST=st; alerts(); return st;
}
/* ---------------------------------------------------------------- что требует внимания */
function alerts(){
  const st=ST, K=st.k, out=[];
  const add=(lvl,t,p,go)=>out.push({lvl,t,p,go});
  st.trips.here.filter(t=>t.days>CFG.norm).forEach(t=>add(2,'Рейс '+t.code+' стоит '+daysTxt(t.days),'дольше нормы ('+CFG.norm+' дн.) · '+fmtN(sum2(t.hereLots,'cbm'))+' м³'+(t.kz?' · фура '+t.kz:' · фура не назначена'),()=>openTrip(t)));
  if(K.fill>0.85) add(K.fill>1?2:1,'Буфер заполнен на '+Math.round(K.fill*100)+' %',fmtN(K.cbm,0)+' из '+fmtN(K.cap,0)+' м³',()=>go('plan'));
  const free=Math.max(0,K.cap-K.cbm);
  if(K.soonM3>free+0.5) add(2,'Приходящий груз не поместится','в ближайшие 3 дня ждём '+fmtN(K.soonM3,0)+' м³, свободно '+fmtN(free,0)+' м³ — нужна отгрузка раньше',()=>go('trips'));
  st.trips.transit.filter(t=>t.plan&&t.inD<0).forEach(t=>add(1,'Рейс '+t.code+' задерживается','ждали '+fmtDs(t.eta)+' (выехал '+fmtDs(t.loaded)+', в пути обычно '+st.transit+' дн.)',()=>openTrip(t)));
  st.trips.here.filter(t=>!t.out&&!t.kz&&t.days>=Math.max(1,CFG.norm-2)).forEach(t=>add(1,'Рейсу '+t.code+' пора назначить фуру','на складе '+daysTxt(t.days)+', казахская фура не указана',()=>openTrip(t)));
  if(K.over.length) add(2,'Ячейки переполнены: '+K.over.map(c=>c.c.id).join(', '),'в ячейке помещается '+fmtN(capCell())+' м³',()=>{ A.selCell=K.over[0].c.id; go('plan'); });
  if(st.unplaced.length) add(0,'Без ячейки: '+st.unplaced.length+' поз. · '+fmtN(K.unplacedM3)+' м³','на схеме склада — предложение, куда поставить; перетащите груз на ячейку или примите предложение целиком',()=>go('plan'));
  if(K.heavy.length) add(1,'Тяжёлые места: '+K.heavy.length,'больше '+fmtN(CFG.placeKg,0)+' кг на место — не в стоечный поддон: '+K.heavy.slice(0,4).map(l=>l.mark).join(', '),()=>{ A.lf.q=K.heavy[0].mark; go('lots'); });
  K.inToday.forEach(t=>add(0,'Сегодня прибывает '+t.code,fmtN(t.cbm,0)+' м³ · '+t.lots.length+' поз.',()=>openTrip(t)));
  K.outToday.forEach(t=>add(0,'Сегодня отгрузка '+t.code,(t.kz?'фура '+t.kz+' · ':'')+fmtN(sum2(t.hereLots,'cbm'))+' м³',()=>openTrip(t)));
  out.sort((a,b)=>b.lvl-a.lvl); ST.alerts=out;
}
const sum2=(a,k)=>a.reduce((x,y)=>x+(+y[k]||0),0);
const dcls=d=>d>CFG.norm?'d2':d>CFG.norm/2?'d1':'d0';
const chip=(d,t)=>'<span class="chip '+dcls(d)+'">'+(t||d+' дн.')+'</span>';
const dayCol=d=>d>CFG.norm?'var(--bad)':d>CFG.norm/2?'var(--warn)':'var(--ok)';
const PAL=['#4c8bf5','#e8a317','#2fae66','#e5484d','#9b6ef3','#18b3c4','#f07b39','#d65db1','#7ab51d','#5c6cfa','#c46a4a','#0f9d8a'];
const hashC=s=>{ let h=0; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))>>>0; return PAL[h%PAL.length]; };

/* ---------------------------------------------------------------- данные: загрузка */
function reload(silent){
  if(A.src.kind!=='url'||!A.src.url){ if(!silent) toast('Подключите таблицу в «Настройках»'); return Promise.resolve(false); }
  if(A.busy) return Promise.resolve(false);
  A.busy=true; syncUI();
  return loadUrl(A.src.url).then(d=>{ A.busy=false; setData(d); if(!silent) toast('Данные обновлены: '+d.reys.length+' рейсов'); return true; })
    .catch(e=>{ A.busy=false; A.err=e.message||String(e); syncUI(); if(!silent) toast('Не получилось: '+A.err); return false; });
}

/* ---------------------------------------------------------------- навигация */
const ICON={
  dash:'<path d="M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z"/>',
  plan:'<path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9M15 21V9"/>',
  lots:'<path d="M21 8 12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  trips:'<path d="M1 6h13v10H1zM14 10h4l3 3v3h-7"/><circle cx="5" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  clients:'<circle cx="9" cy="8" r="4"/><path d="M1 21c0-4 4-6 8-6s8 2 8 6"/><path d="M17 4a4 4 0 0 1 0 8M23 21c0-3-2-5-5-6"/>',
  stats:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-7"/>',
  set:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'};
const PAGES=[['dash','Сводка'],['plan','Схема склада'],['lots','Грузы'],['trips','Рейсы'],['clients','Клиенты'],['stats','Аналитика'],['set','Настройки']];
const svgI=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICON[k]+'</svg>';
const $=id=>document.getElementById(id);
function navUI(){
  $('nav').innerHTML='<div id="brand"><i>B</i><div><b>Buraq · Склад №4</b><span>Хоргос · управление складом</span></div></div>'
    +PAGES.map(([k,t])=>'<button class="nv'+(A.page===k?' on':'')+'" data-p="'+k+'">'+svgI(k)+t+(k==='dash'?'<em id="nbad"></em>':'')+'</button>').join('')
    +'<div id="navfoot">Данные — из таблиц Google, только чтение.<br>Места в ячейках хранятся в этом браузере и видны в 3D-модели.<br>Версия '+VER+'</div>';
  $('mnav').innerHTML=PAGES.filter(p=>p[0]!=='clients').map(([k,t])=>'<button class="'+(A.page===k?'on':'')+'" data-p="'+k+'">'+svgI(k)+t.split(' ')[0]+'</button>').join('');
  document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>go(b.dataset.p));
  const n=ST&&ST.alerts?ST.alerts.filter(a=>a.lvl===2).length:0; const e=$('nbad'); if(e) e.textContent=n||'';
}
function go(p){ if(!PAGES.some(x=>x[0]===p)) p='dash'; A.page=p; if(location.hash!=='#'+p) history.replaceState(null,'','#'+p); closeDrawer(); render(); $('main').scrollTop=0; }

/* ---------------------------------------------------------------- отрисовка страниц */
function render(){
  navUI(); syncUI();
  $('ttl').textContent=PAGES.find(p=>p[0]===A.page)[1];
  const m=$('main');
  if(!A.data&&A.page!=='set'){ m.innerHTML=onboard(); bindOnboard(); return; }
  if(!ST) calc();
  const f={dash:pDash,plan:pPlan,lots:pLots,trips:pTrips,clients:pClients,stats:pStats,set:pSet}[A.page];
  m.innerHTML='<div class="page on">'+f()+'</div>';
  ({dash:bDash,plan:bPlan,lots:bLots,trips:bTrips,clients:bClients,stats:()=>{},set:bSet}[A.page])();
}
function syncUI(){
  const s=$('sync'); s.className=A.busy?'busy':A.err?'err':'';
  const when=A.at?new Date(A.at):null;
  $('synct').textContent=A.busy?'читаю таблицу…':A.err?'ошибка чтения':(A.data?(A.data.kind==='demo'?'демо-данные':(when?'обновлено '+pad(when.getHours())+':'+pad(when.getMinutes()):'данные из таблицы')):'нет данных');
  s.title=A.err||(A.data?A.data.name:'');
  const d=$('date'); d.value=A.date?A.date.getFullYear()+'-'+pad(A.date.getMonth()+1)+'-'+pad(A.date.getDate()):''; $('datebox').classList.toggle('past',!!A.date);
  $('reload').disabled=A.busy||A.src.kind!=='url';
}
function onboard(){
  return '<div class="page on"><div class="card" style="max-width:640px;margin:6vh auto">'
    +'<h2 style="margin:0 0 6px;font-size:22px">Подключите учёт груза</h2><p class="note">Система читает те же таблицы Google, в которых сейчас ведётся учёт, и показывает: что лежит на складе, когда прибыло, сколько дней стоит, что в пути и что отгружать первым. В таблицах ничего не меняется.</p>'
    +'<div style="display:flex;gap:8px;margin:14px 0"><input class="inp" id="obu" style="flex:1" placeholder="Ссылка на таблицу Google"><button class="btn pri" id="obgo">Подключить</button></div>'
    +'<p class="note">Таблица должна быть открыта «всем, у кого есть ссылка — читатель». Рабочие таблицы Buraq (листы «Fura statuslari» и «Ortilgan furalar») распознаются сами; подойдёт и простая таблица — одна строка на груз (клиент, груз, мест, м³, кг, дата прибытия, рейс, ячейка).</p>'
    +'<div style="display:flex;gap:8px;margin-top:12px"><button class="btn" id="obdemo">Посмотреть на демо-данных</button><button class="btn" id="obpaste">Вставить таблицу вручную</button></div></div></div>';
}
function bindOnboard(){
  $('obgo').onclick=()=>connect($('obu').value); $('obu').onkeydown=e=>{ if(e.key==='Enter') connect($('obu').value); };
  $('obdemo').onclick=()=>setData(demo(),{kind:'demo',url:''}); $('obpaste').onclick=()=>go('set');
}
function connect(u){ u=String(u||'').trim(); if(!parseUrl(u)){ toast('Это не ссылка на таблицу Google'); return; }
  A.src={kind:'url',url:u}; store(); reload().then(ok=>{ if(ok&&A.page==='set') go('dash'); }); }

/* ---------- Сводка ---------- */
function pDash(){
  const st=ST, K=st.k, fillPct=Math.round(K.fill*100), free=Math.max(0,K.cap-K.cbm);
  const kp=(cls,title,val,sub,bar,go)=>'<div class="card kpi'+(go?' click':'')+'"'+(go?' data-go="'+go+'"':'')+'><span>'+title+'</span><b class="'+cls+'">'+val+'</b><span>'+sub+'</span>'+(bar!=null?'<div class="bar"><i style="width:'+Math.min(100,bar)+'%;background:'+(bar>90?'var(--bad)':bar>75?'var(--warn)':'var(--ok)')+'"></i></div>':'')+'</div>';
  const al=st.alerts;
  return '<div class="ph"><div><h2>'+(A.date?'Склад на '+fmtD(st.D):'Сегодня, '+fmtD(st.D))+'</h2><p>'+esc(A.data.name)+(A.data.kind==='demo'?' — пример, не ваш груз':'')+'</p></div>'
    +'<div class="tb"><button class="btn" data-go="plan">Схема склада</button><button class="btn pri" data-go="lots">Все грузы</button></div></div>'
    +'<div class="grid g4">'
    +kp('','На складе',fmtN(K.cbm,0)+' <small>м³</small>',fmtN(K.kg/1000)+' т · '+fmtN(K.ctn,0)+' мест · '+fillPct+' % буфера',fillPct,'plan')
    +kp('','Рейсов · позиций · клиентов',K.trips+' · '+K.lots+' · '+K.marks,'свободно '+fmtN(free,0)+' м³ · ячеек занято '+K.usedCells+' из 30',null,'trips')
    +kp(K.maxDays>CFG.norm?'bad':'','Простой: дольше всего',daysTxt(K.maxDays),'в среднем по объёму '+fmtN(K.avgDays)+' дн. · норма '+CFG.norm,null,'lots')
    +kp(K.late.length?'bad':'ok','Дольше нормы',fmtN(K.lateM3,0)+' <small>м³</small>',K.late.length?K.late.length+' поз. · '+new Set(K.late.map(l=>l.reys)).size+' рейс(а)':'всё в норме',null,'lots')
    +'</div>'
    +'<div class="grid g21" style="margin-top:14px">'
    +'<div class="card"><h3>Требует внимания <small>'+(al.length?al.length+' '+plural(al.length,'пункт','пункта','пунктов'):'')+'</small></h3>'
      +(al.length?al.slice(0,9).map((a,i)=>'<div class="al" data-al="'+i+'"><i style="background:'+['var(--blue)','var(--warn)','var(--bad)'][a.lvl]+'"></i><div><b>'+esc(a.t)+'</b><p>'+esc(a.p)+'</p></div></div>').join(''):'<div class="empty">Всё спокойно — ничего не горит.</div>')+'</div>'
    +'<div class="card"><h3>Очередь на отгрузку <small>FIFO</small></h3>'+(st.trips.here.length?st.trips.here.slice(0,6).map(t=>'<div class="al" data-trip="'+esc(t.code)+'"><i style="background:'+dayCol(t.days)+'"></i><div style="flex:1"><b>'+t.q+'. '+esc(t.code)+'</b><p>'+fmtN(sum2(t.hereLots,'cbm'))+' м³ · прибыл '+fmtDs(t.arrH)+(t.outToday?' · <span class="ok">отгрузка сегодня</span>':t.kz?' · фура '+esc(t.kz):'')+'</p></div>'+chip(t.days)+'</div>').join(''):'<div class="empty">Склад пуст</div>')
      +'<h3 style="margin-top:14px">В пути <small>'+st.trips.transit.length+'</small></h3>'+(st.trips.transit.length?st.trips.transit.slice(0,4).map(t=>'<div class="al" data-trip="'+esc(t.code)+'"><i style="background:var(--blue)"></i><div style="flex:1"><b>'+esc(t.code)+'</b><p>'+(t.lots.length?fmtN(t.cbm,0)+' м³ · ':'')+'выехал '+fmtDs(t.loaded)+'</p></div><span class="chip b">'+(t.inD==null?'—':t.inD<0?'опаздывает':t.inD===0?'сегодня':'через '+t.inD+' дн.')+'</span></div>').join(''):'<div class="empty">Нет рейсов в пути</div>')+'</div>'
    +'</div>'
    +'<div class="grid g2" style="margin-top:14px"><div class="card"><h3>Склад сейчас <small>клик — схема</small></h3><div data-go="plan" style="cursor:pointer">'+planSVG(true)+'</div></div>'
    +'<div class="card"><h3>Заполнение буфера за 60 дней <small>м³</small></h3>'+occChart(60,180)
      +(K.avgDwell!=null?'<p class="note" style="margin:8px 0 0">Последние '+Math.min(10,st.trips.gone.length)+' уехавших рейсов стояли в среднем <b>'+fmtN(K.avgDwell)+' дн.</b>, дольше всего — <b>'+K.maxDwell+' дн.</b>; дольше нормы — <b>'+Math.round(K.lateShare*100)+' %</b>.</p>':'')+'</div></div>';
}
function bDash(){
  document.querySelectorAll('#main [data-go]').forEach(e=>e.onclick=()=>go(e.dataset.go));
  document.querySelectorAll('#main [data-al]').forEach(e=>e.onclick=()=>ST.alerts[+e.dataset.al].go());
  bindTrips();
}
function bindTrips(){ document.querySelectorAll('#main [data-trip]').forEach(e=>e.onclick=()=>openTrip(TRIPS.find(t=>t.code===e.dataset.trip))); }

/* ---------- Схема склада ---------- */
const VB0={x:-4,y:-3.5,w:56.05,h:42.5};
let VB=Object.assign({},VB0);
function cellColor(cs){
  if(!cs.lots.length&&cs.vlots&&cs.vlots.length) return cellColor({lots:cs.vlots,m3:cs.vm3});
  if(!cs.lots.length) return null;
  if(A.color==='fill'){ const f=Math.min(1,cs.m3/capCell()); return f>1?'var(--bad)':'hsl('+(140-f*120)+' 62% 46%)'; }
  if(A.color==='mark'){ const big={}; cs.lots.forEach(l=>big[l.mark]=(big[l.mark]||0)+l.cbm); return hashC(Object.keys(big).sort((a,b)=>big[b]-big[a])[0]); }
  if(A.color==='trip'){ const t=cs.lots[0].reys, i=ST.trips.here.findIndex(x=>x.code===t); return PAL[(i<0?0:i)%PAL.length]; }
  return dayCol(Math.max.apply(null,cs.lots.map(l=>l.days)));
}
function planSVG(mini){
  const st=ST, cap=capCell();
  let s='<svg id="'+(mini?'mplan':'plan')+'" viewBox="'+(mini?'-1 -1 50.05 37.5':VB.x+' '+VB.y+' '+VB.w+' '+VB.h)+'" '+(mini?'style="width:100%;display:block"':'')+'>';
  s+='<defs><pattern id="hatch" width="0.8" height="0.8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="0.8" stroke="var(--line2)" stroke-width="0.25"/></pattern></defs>';
  s+='<rect x="0" y="0" width="'+W+'" height="'+H+'" fill="var(--surf2)" stroke="var(--ink2)" stroke-width="0.25"/>';
  /* здание охраны, проходная, зона DWS, пост П2, приёмка Л2, полоса Л1–П1 */
  s+='<rect x="0.36" y="0.45" width="31.19" height="6.12" fill="url(#hatch)" stroke="var(--line2)" stroke-width="0.1"/><rect x="31.55" y="0.45" width="4" height="3.1" fill="url(#hatch)" stroke="var(--line2)" stroke-width="0.1"/>';
  s+='<rect x="35.9" y="0.9" width="9.7" height="5.6" fill="color-mix(in srgb,var(--cyan) 10%,transparent)" stroke="var(--cyan)" stroke-width="0.08" stroke-dasharray="0.4 0.25"/>';
  s+='<rect x="21.6" y="9.3" width="22.4" height="2.6" rx="0.3" fill="color-mix(in srgb,var(--blue) 8%,transparent)" stroke="var(--blue)" stroke-width="0.08" stroke-dasharray="0.4 0.25"/>';
  s+='<rect x="1.2" y="9.2" width="12.2" height="3.9" fill="color-mix(in srgb,var(--acc2) 10%,transparent)" stroke="var(--acc)" stroke-width="0.08" stroke-dasharray="0.4 0.25"/>';
  s+='<rect x="0.6" y="30.65" width="46.9" height="4.5" fill="none" stroke="var(--line2)" stroke-width="0.08" stroke-dasharray="0.4 0.25"/>';
  [15.6,26.3].forEach(z=>s+='<line x1="0.8" y1="'+z+'" x2="47.2" y2="'+z+'" stroke="var(--acc)" stroke-width="0.12" stroke-dasharray="0.8 0.6" opacity=".55"/>');
  /* колонны */
  [16.05,32.05].forEach(x=>[7.05,14.05,21.05,28.05,35.05].forEach(z=>s+='<rect x="'+(x-0.25)+'" y="'+(z-0.25)+'" width="0.5" height="0.5" fill="var(--ink2)"/>'));
  /* ворота */
  const gate=(x,z,w,t,side)=>{ s+='<rect x="'+(x-0.25)+'" y="'+(z-w/2)+'" width="0.5" height="'+w+'" fill="var(--acc2)"/>';
    if(!mini) s+='<text x="'+(side<0?x-0.6:x+0.6)+'" y="'+(z+0.45)+'" font-size="1.25" font-weight="700" fill="var(--ink)" text-anchor="'+(side<0?'end':'start')+'">'+t+'</text>'; };
  gate(0,10.58,3.5,'Л2',-1); gate(0,32.8,3.5,'Л1',-1); gate(W,10.55,6,'П2',1); gate(W,31.55,6,'П1',1);
  if(!mini){ const lb=(x,z,t,c)=>s+='<text x="'+x+'" y="'+z+'" font-size="0.9" fill="'+(c||'var(--muted)')+'" text-anchor="middle">'+t+'</text>';
    lb(16,3.8,'Здание охраны'); lb(40.75,3.9,'Зона DWS','var(--cyan)'); lb(32.8,10.9,'Пост погрузки П2 · казахская фура','var(--blue)'); lb(7.3,11.4,'Приёмка Л2','var(--acc)');
    lb(24,33.2,'Полоса Л1–П1'); lb(24,15.25,'южная магистраль'); lb(24,27.2,'северная магистраль'); }
  /* ячейки */
  CELLS.forEach(c=>{ const cs=st.cells[c.id], col=cellColor(cs), w=c.x1-c.x0, h=c.z1-c.z0, virt=!cs.lots.length&&!!col, m3=virt?cs.vm3:cs.m3, f=Math.min(1,m3/cap), over=cs.m3>cap+0.05;
    const dim='';
    s+='<g class="cell'+(A.selCell===c.id?' sel':'')+'" data-cell="'+c.id+'">';
    s+='<rect class="bg" x="'+c.x0+'" y="'+c.z0+'" width="'+w+'" height="'+h+'" rx="0.18" fill="'+(col?'color-mix(in srgb,'+col+' '+(virt?10:22)+'%,var(--surf))':'var(--surf)')+'" stroke="'+(over?'var(--bad)':col?col:'var(--line2)')+'" stroke-width="'+(over?0.25:virt?0.12:0.08)+'"'+(virt?' stroke-dasharray="0.35 0.22"':'')+'/>';
    if(col&&!virt){ const fh=(h-0.3)*f, y=c.row==='A'?c.z1-0.15-fh:c.z0+0.15;
      s+='<rect x="'+(c.x0+0.15)+'" y="'+y+'" width="'+(w-0.3)+'" height="'+fh+'" rx="0.1" fill="'+col+'" opacity=".82" pointer-events="none"/>'; }
    if(!mini){ s+='<text x="'+(c.x0+w/2)+'" y="'+(c.row==='A'?c.z0+1.05:c.z1-0.45)+'" font-size="0.9" font-weight="700" fill="var(--ink)" text-anchor="middle">'+c.id+dim+'</text>';
      if(col) s+='<text x="'+(c.x0+w/2)+'" y="'+(c.row==='A'?c.z0+1.95:c.z1-1.3)+'" font-size="0.62" fill="var(--ink2)" text-anchor="middle">'+(virt?'≈':'')+fmtN(m3)+' м³</text>'; }
    s+='</g>'; });
  s+='</svg>';
  return s;
}
function legend(){
  if(A.color==='days') return '<span><i style="background:var(--ok)"></i>до '+Math.floor(CFG.norm/2)+' дн.</span><span><i style="background:var(--warn)"></i>до '+CFG.norm+' дн.</span><span><i style="background:var(--bad)"></i>дольше нормы</span><span><i style="background:var(--surf);border:1px solid var(--line2)"></i>свободно</span>'+(Object.keys(ST.sug||{}).length?'<span><i style="border:1.5px dashed var(--muted)"></i>предложено, не размещено</span>':'');
  if(A.color==='fill') return '<span><i style="background:hsl(140 62% 46%)"></i>почти пусто</span><span><i style="background:hsl(80 62% 46%)"></i>половина</span><span><i style="background:hsl(20 62% 46%)"></i>полная ('+fmtN(capCell())+' м³)</span>';
  if(A.color==='trip') return ST.trips.here.slice(0,6).map((t,i)=>'<span><i style="background:'+PAL[i%PAL.length]+'"></i>'+esc(t.code)+'</span>').join('');
  return '<span>цвет — клиент, у которого в ячейке больше всего груза</span>';
}
function pPlan(){
  const st=ST, cs=A.selCell?st.cells[A.selCell]:null;
  return '<div class="ph"><div><h2>Схема склада</h2><p>Ячейки A1–B15 · в ячейке до '+fmtN(capCell())+' м³ ('+CFG.stacks+' штабеля × '+CFG.tiers+' яруса стоечных поддонов) · колесо — масштаб, перетаскивание — сдвиг</p></div>'
    +'<div class="tb"><span class="mut" style="font-size:12.5px">Цвет:</span><div class="seg" id="pcol">'+[['days','Простой'],['fill','Заполнение'],['mark','Клиент'],['trip','Рейс']].map(([k,t])=>'<button data-c="'+k+'" class="'+(A.color===k?'on':'')+'">'+t+'</button>').join('')+'</div></div></div>'
    +'<div id="planwrap"><div class="card" id="plancard">'+planSVG(false)+'<div class="pctl"><button class="btn" id="zin" title="Крупнее">+</button><button class="btn" id="zout" title="Мельче">−</button><button class="btn" id="zfit" title="Весь склад" style="font-size:12px">⤢</button></div>'
    +'<div class="legend">'+legend()+'</div><div class="ptip" id="ptip"></div></div>'
    +'<div id="tiles">'+[[1,5],[6,10],[11,15]].map(([a,b])=>['A','B'].map(r=>{ let o=''; for(let n=a;n<=b;n++){ const id=r+n, cs=st.cells[id], col=cellColor(cs), v=!cs.lots.length&&!!col, m3=v?cs.vm3:cs.m3;
      o+='<div class="tile'+(A.selCell===id?' sel':'')+(v?' v':'')+'" data-tile="'+id+'" style="'+(col?'background:color-mix(in srgb,'+col+' '+(v?12:30)+'%,var(--surf));border-color:'+col:'')+'"><b>'+id+'</b><span class="sub">'+(col?(v?'≈':'')+fmtN(m3)+' м³':'свободна')+'</span></div>'; } return o; }).join('')).join('')+'</div>'
    +'<div id="side">'+(cs?cellPanel(cs):'<div class="card"><h3>Ячейка</h3><p class="note">Нажмите на ячейку — здесь появится, что в ней лежит. Чтобы разместить груз, перетащите его из списка ниже на ячейку или нажмите на груз, а потом на ячейку.</p></div>')
    +'<div class="card" style="flex:1"><h3>Без ячейки <small>'+st.unplaced.length+' поз. · '+fmtN(st.k.unplacedM3)+' м³</small></h3>'
    +(st.unplaced.length?'<p class="note" style="margin:0 0 6px">Пунктиром на схеме — куда их предлагается поставить: старый рейс ближе к посту погрузки П2, каждый рейс в своих ячейках.</p>':'')
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:4px"><button class="btn sm pri" id="autop"'+(st.unplaced.length?'':' disabled')+'>Принять предложение</button>'+(A.undo?'<button class="btn sm" id="undop">Отменить</button>':'')+'</div>'
    +(A.pick?'<div class="warnbox" style="margin:6px 0">Выбран груз <b>'+esc((LOTS[A.pick]||{}).mark)+'</b> — нажмите на ячейку. <a href="#" id="pickx">Отмена</a></div>':'')
    +(st.unplaced.length?st.unplaced.slice().sort((a,b)=>b.days-a.days).slice(0,120).map(l=>lotChip(l)).join(''):'<div class="empty">Весь груз на своих местах.</div>')+'</div></div></div>';
}
function lotChip(l,inCell){
  return '<div class="lot'+(A.pick===l.i?' on':'')+'" draggable="true" data-lot="'+l.i+'"><div class="row"><b>'+esc(l.mark)+'</b><span class="sub">'+esc(l.cargo)+'</span>'+chip(l.days)+'</div>'
    +'<div class="sub">'+esc(l.reys)+' · '+fmtN(l.cbm)+' м³ · '+fmtN(l.ctn,0)+' мест · '+fmtN(l.kg,0)+' кг'+(inCell&&l.cells.length>1?' · ячейки '+l.cells.join(', '):'')+(l.cellsT&&inCell?' · <span class="chip n">из таблицы</span>':'')
    +(inCell&&!l.cellsT?' · <a href="#" data-unp="'+l.i+'">убрать</a>':'')+'</div></div>';
}
function cellPanel(cs){
  const c=cs.c, cap=capCell();
  return '<div class="card"><h3>Ячейка '+c.id+' <small>ряд '+c.row+' · '+(c.n<=5?'западная':c.n<=10?'средняя':'восточная')+' секция</small></h3>'
    +'<div class="kv"><span>Занято</span><b class="'+(cs.m3>cap+0.05?'bad':'')+'">'+fmtN(cs.m3)+' из '+fmtN(cap)+' м³ ('+Math.round(100*cs.m3/cap)+' %)</b>'
    +'<span>Грузов</span><b>'+cs.lots.length+(cs.lots.length?' · '+new Set(cs.lots.map(l=>l.reys)).size+' рейс(а)':'')+'</b></div>'
    +(new Set(cs.lots.map(l=>l.reys)).size>1?'<div class="warnbox">В одной ячейке грузы разных рейсов — правило «одна ячейка — одна отправка» нарушено.</div>':'')
    +(cs.lots.length?cs.lots.slice().sort((a,b)=>b.days-a.days).map(l=>lotChip(l,true)).join(''):'<div class="empty">Ячейка свободна</div>')+'</div>';
}
function bPlan(){
  document.querySelectorAll('#pcol button').forEach(b=>b.onclick=()=>{ A.color=b.dataset.c; store(); render(); });
  const svg=$('plan'), card=$('plancard'), tip=$('ptip');
  const setVB=()=>svg.setAttribute('viewBox',VB.x+' '+VB.y+' '+VB.w+' '+VB.h);
  const zoom=(k,cx,cy)=>{ const r=svg.getBoundingClientRect(); const px=cx==null?0.5:(cx-r.left)/r.width, py=cy==null?0.5:(cy-r.top)/r.height;
    const nw=Math.max(8,Math.min(120,VB.w*k)), nh=nw*VB.h/VB.w; VB.x+= (VB.w-nw)*px; VB.y+=(VB.h-nh)*py; VB.w=nw; VB.h=nh; setVB(); };
  svg.addEventListener('wheel',e=>{ e.preventDefault(); zoom(e.deltaY>0?1.12:1/1.12,e.clientX,e.clientY); },{passive:false});
  $('zin').onclick=()=>zoom(1/1.25); $('zout').onclick=()=>zoom(1.25); $('zfit').onclick=()=>{ VB=Object.assign({},VB0); setVB(); };
  let drag=null; const ptr=new Map();
  svg.addEventListener('pointerdown',e=>{ ptr.set(e.pointerId,{x:e.clientX,y:e.clientY}); drag={x:e.clientX,y:e.clientY,vb:Object.assign({},VB),moved:0,pd:null};
    if(ptr.size===2){ const p=[...ptr.values()]; drag.pd=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); } });
  svg.addEventListener('pointermove',e=>{
    if(drag&&ptr.has(e.pointerId)){ ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(ptr.size===2&&drag.pd){ const p=[...ptr.values()], d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); zoom(drag.pd/d,(p[0].x+p[1].x)/2,(p[0].y+p[1].y)/2); drag.pd=d; drag.moved=99; return; }
      const r=svg.getBoundingClientRect(), dx=(e.clientX-drag.x)*VB.w/r.width, dy=(e.clientY-drag.y)*VB.h/r.height; drag.moved=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);
      if(drag.moved>4){ svg.classList.add('drag'); VB.x=drag.vb.x-dx; VB.y=drag.vb.y-dy; setVB(); tip.style.display='none'; return; } }
    const g=e.target.closest&&e.target.closest('.cell'); if(!g){ tip.style.display='none'; return; }
    const cs=ST.cells[g.dataset.cell], cr=card.getBoundingClientRect();
    if(!cs.lots.length&&cs.vlots){ tip.innerHTML='<b>'+g.dataset.cell+'</b> · свободна<br><span class="mut">предложено: '+cs.vlots.slice(0,4).map(l=>esc(l.mark)).join(', ')+' — ≈'+fmtN(cs.vm3)+' м³ (рейс '+esc(cs.vlots[0].reys)+')</span>'; }
    else tip.innerHTML='<b>'+g.dataset.cell+'</b> · '+fmtN(cs.m3)+' из '+fmtN(capCell())+' м³'+(cs.lots.length?'<br>'+cs.lots.slice(0,5).map(l=>esc(l.mark)+' · '+esc(l.cargo)+' · '+l.days+' дн.').join('<br>')+(cs.lots.length>5?'<br>… ещё '+(cs.lots.length-5):''):'<br><span class="mut">свободна</span>');
    tip.style.display='block'; tip.style.left=Math.min(cr.width-290,e.clientX-cr.left+14)+'px'; tip.style.top=(e.clientY-cr.top+14)+'px'; });
  svg.addEventListener('pointerleave',()=>tip.style.display='none');
  const up=e=>{ ptr.delete(e.pointerId); svg.classList.remove('drag'); if(!drag) return; const moved=drag.moved; if(ptr.size===0) drag=null;
    if(moved>4) return; const g=e.target.closest&&e.target.closest('.cell'); if(!g) return; const id=g.dataset.cell;
    if(A.pick!=null){ place(LOTS[A.pick],id); A.pick=null; A.selCell=id; render(); return; }
    A.selCell=A.selCell===id?null:id; render(); };
  svg.addEventListener('pointerup',up); svg.addEventListener('pointercancel',e=>{ ptr.delete(e.pointerId); drag=null; svg.classList.remove('drag'); });
  /* перетаскивание груза на ячейку */
  document.querySelectorAll('#side .lot').forEach(el=>{
    el.addEventListener('dragstart',e=>{ e.dataTransfer.setData('text/plain',el.dataset.lot); e.dataTransfer.effectAllowed='move'; });
    el.addEventListener('click',e=>{ if(e.target.closest('a')) return; const i=+el.dataset.lot; A.pick=A.pick===i?null:i; render(); }); });
  svg.querySelectorAll('.cell').forEach(g=>{
    g.addEventListener('dragover',e=>{ e.preventDefault(); g.classList.add('drop'); });
    g.addEventListener('dragleave',()=>g.classList.remove('drop'));
    g.addEventListener('drop',e=>{ e.preventDefault(); g.classList.remove('drop'); const i=+e.dataTransfer.getData('text/plain'); if(LOTS[i]){ place(LOTS[i],g.dataset.cell); A.selCell=g.dataset.cell; render(); } }); });
  document.querySelectorAll('[data-tile]').forEach(t=>t.onclick=()=>{ const id=t.dataset.tile; if(A.pick!=null){ place(LOTS[A.pick],id); A.pick=null; A.selCell=id; render(); return; } A.selCell=A.selCell===id?null:id; render(); const sd=$('side'); if(sd&&A.selCell) sd.scrollIntoView({behavior:'smooth'}); });
  document.querySelectorAll('[data-unp]').forEach(a=>a.onclick=e=>{ e.preventDefault(); const l=LOTS[+a.dataset.unp]; delete PL[l.key]; savePL(); calc(); render(); toast('«'+l.mark+'» убран из ячейки'); });
  const ap=$('autop'); if(ap) ap.onclick=autoPlace; const un=$('undop'); if(un) un.onclick=()=>{ PL=A.undo; A.undo=null; savePL(); calc(); render(); toast('Размещение отменено'); };
  const px=$('pickx'); if(px) px.onclick=e=>{ e.preventDefault(); A.pick=null; render(); };
}
function place(l,id){
  if(l.cellsT){ toast('Ячейка груза «'+l.mark+'» записана в таблице — меняйте её там'); return; }
  const cs=ST.cells[id], free=capCell()-cs.m3, others=new Set(cs.lots.filter(x=>x.reys!==l.reys).map(x=>x.reys));
  A.undo=JSON.parse(JSON.stringify(PL)); PL[l.key]=[id]; savePL(); calc();
  toast('«'+l.mark+'» → '+id+(l.cbm>free+0.05?' · ячейка переполнена на '+fmtN(l.cbm-free)+' м³':'')+(others.size?' · в ячейке другой рейс':''));
}
/* авторазмещение: рейсы по очереди (FIFO) от поста погрузки к приёмке, каждый рейс — с новой ячейки, до заполнения ячейки */
function autoPlace(){
  const st=ST, n=Object.keys(st.sug).length; if(!n){ toast('Нечего размещать'); return; }
  A.undo=JSON.parse(JSON.stringify(PL)); Object.assign(PL,st.sug); const left=st.sugLeft;
  savePL(); calc(); render(); toast('Размещено '+n+' поз.'+(left>0.05?' · не хватило места на '+fmtN(left)+' м³':''));
}

/* ---------- Грузы ---------- */
function lotRows(){
  const f=A.lf, D=ST.D, q=f.q.trim().toLowerCase();
  let rows=f.st==='here'?ST.here:LOTS.filter(l=>{ const t=l.t; if(f.st==='all') return true; if(f.st==='transit') return t.status==='transit'; if(f.st==='gone') return l.out&&l.out<D; return true; });
  rows=rows.filter(l=>(!f.late||(l.days!=null&&l.t.status==='here'&&l.days>CFG.norm))&&(!f.unplaced||(l.t.status==='here'&&!(l.cells||[]).length))&&(!f.mark||l.mark===f.mark)
    &&(!q||(l.mark+' '+l.cargo+' '+l.reys+' '+(l.cells||[]).join(' ')+' '+l.dest+' '+l.kz).toLowerCase().includes(q)));
  const k=A.sort.k, d=A.sort.d, val=l=>k==='days'?(l.t.status==='here'?l.days:-1):k==='arr'?(l.arr?+l.arr:0):k==='cell'?((l.cells||[])[0]||'~'):l[k];
  rows=rows.slice().sort((a,b)=>{ const x=val(a), y=val(b); return (x<y?-1:x>y?1:0)*d||(b.cbm-a.cbm); });
  return rows;
}
const COLS=[['mark','Клиент'],['cargo','Груз'],['reys','Рейс'],['arr','Прибыл'],['days','Дней',1],['ctn','Мест',1],['cbm','м³',1],['kg','кг',1],['cell','Ячейка'],['out','Отгрузка'],['dest','Куда']];
function pLots(){
  const f=A.lf, rows=lotRows(), marks=Object.keys(ST.marks).sort();
  const tot={cbm:sum2(rows,'cbm'),kg:sum2(rows,'kg'),ctn:sum2(rows,'ctn')};
  return '<div class="ph"><div><h2>Грузы</h2><p>'+rows.length+' поз. · '+fmtN(tot.cbm)+' м³ · '+fmtN(tot.kg/1000)+' т · '+fmtN(tot.ctn,0)+' мест</p></div><div class="tb"><button class="btn" id="csv">Выгрузить в CSV</button></div></div>'
    +'<div class="filters"><div class="seg" id="lst">'+[['here','На складе'],['transit','В пути'],['gone','Отгружено'],['all','Все']].map(([k,t])=>'<button data-v="'+k+'" class="'+(f.st===k?'on':'')+'">'+t+'</button>').join('')+'</div>'
    +'<input class="inp" id="lq" placeholder="Поиск: клиент, груз, рейс, ячейка, фура" value="'+esc(f.q)+'" style="flex:1;min-width:200px">'
    +'<select class="inp" id="lm"><option value="">Все клиенты</option>'+marks.map(m=>'<option'+(f.mark===m?' selected':'')+'>'+esc(m)+'</option>').join('')+'</select>'
    +'<label class="btn sm"><input type="checkbox" id="ll"'+(f.late?' checked':'')+'> Дольше нормы</label><label class="btn sm"><input type="checkbox" id="lu"'+(f.unplaced?' checked':'')+'> Без ячейки</label></div>'
    +'<div class="tw"><table class="t"><thead><tr>'+COLS.map(([k,t,r])=>'<th data-s="'+k+'" class="'+(r?'r ':'')+(A.sort.k===k?(A.sort.d>0?'asc':'desc'):'')+'">'+t+'</th>').join('')+'</tr></thead><tbody>'
    +rows.slice(0,A.lim).map(l=>'<tr data-i="'+l.i+'"><td><b>'+esc(l.mark)+'</b></td><td class="w">'+esc(l.cargo)+'<div class="sub">'+esc(l.pack)+'</div></td><td>'+esc(l.reys)+'</td><td>'+fmtD(l.arr)+'</td>'
      +'<td class="r">'+(l.t.status==='here'?chip(l.days):l.t.status==='transit'?'<span class="chip b">в пути</span>':'<span class="chip n">'+(l.arr&&l.out?dDiff(l.out,l.arr)+' дн.':'—')+'</span>')+'</td>'
      +'<td class="r">'+fmtN(l.ctn,0)+'</td><td class="r">'+fmtN(l.cbm,2)+'</td><td class="r">'+fmtN(l.kg,0)+(l.ctn&&l.kg/l.ctn>CFG.placeKg?' <span class="chip d2" title="место тяжелее '+CFG.placeKg+' кг">тяж.</span>':'')+'</td>'
      +'<td>'+((l.cells||[]).length?esc(l.cells.join(', ')):(l.t.status==='here'?'<span class="warn">нет</span>':'—'))+'</td><td>'+(l.out?fmtDs(l.out):'—')+(l.kz?'<div class="sub">'+esc(l.kz)+'</div>':'')+'</td><td>'+esc(l.dest)+'</td></tr>').join('')
    +'</tbody></table>'+(rows.length>A.lim?'<div style="padding:10px;text-align:center"><button class="btn" id="more">Показать ещё '+Math.min(300,rows.length-A.lim)+'</button></div>':'')+(rows.length?'':'<div class="empty">Ничего не найдено</div>')+'</div>';
}
function bLots(){
  const f=A.lf, re=()=>{ A.lim=300; render(); };
  document.querySelectorAll('#lst button').forEach(b=>b.onclick=()=>{ f.st=b.dataset.v; re(); });
  const q=$('lq'); let tm=0; q.oninput=()=>{ clearTimeout(tm); tm=setTimeout(()=>{ f.q=q.value; const pos=q.selectionStart; re(); const n=$('lq'); n.focus(); n.setSelectionRange(pos,pos); },160); };
  $('lm').onchange=e=>{ f.mark=e.target.value; re(); }; $('ll').onchange=e=>{ f.late=e.target.checked; re(); }; $('lu').onchange=e=>{ f.unplaced=e.target.checked; re(); };
  document.querySelectorAll('th[data-s]').forEach(th=>th.onclick=()=>{ const k=th.dataset.s; A.sort=A.sort.k===k?{k,d:-A.sort.d}:{k,d:k==='mark'||k==='cargo'||k==='reys'||k==='cell'||k==='dest'?1:-1}; render(); });
  document.querySelectorAll('tbody tr[data-i]').forEach(tr=>tr.onclick=()=>openLot(LOTS[+tr.dataset.i]));
  const m=$('more'); if(m) m.onclick=()=>{ A.lim+=300; render(); };
  $('csv').onclick=()=>{ const rows=lotRows(); const H=['Клиент','Груз','Упаковка','Рейс','Прибыл','Дней на складе','Мест','м3','кг','Ячейка','Отгрузка','Фура KZ','Куда'];
    const L=[H].concat(rows.map(l=>[l.mark,l.cargo,l.pack,l.reys,fmtD(l.arr),l.t.status==='here'?l.days:'',l.ctn,String(l.cbm).replace('.',','),l.kg,(l.cells||[]).join(' '),l.out?fmtD(l.out):'',l.kz,l.dest]));
    download('грузы_'+fmtD(ST.D)+'.csv',L.map(r=>r.map(v=>{ v=String(v==null?'':v); return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }).join(';')).join('\r\n')); };
}
function download(name,txt){ const b=new Blob(['﻿'+txt],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); }

/* ---------- Рейсы ---------- */
function tripCard(t){
  const st=t.status, here=st==='here', m3=here?sum2(t.hereLots,'cbm'):t.cbm, marks=new Set(t.lots.map(l=>l.mark)).size;
  const right=here?chip(t.days):st==='transit'?'<span class="chip b">'+(t.inD==null?'в пути':t.inD<0?'опаздывает':t.inD===0?'сегодня':'через '+t.inD+' дн.')+'</span>':'<span class="chip '+(t.dwell>CFG.norm?'d2':'n')+'">стоял '+t.dwell+' дн.</span>';
  const prog=st==='transit'&&t.loaded&&t.eta?Math.max(0,Math.min(1,dDiff(ST.D,t.loaded)/Math.max(1,dDiff(t.eta,t.loaded)))):null;
  return '<div class="tc" data-trip="'+esc(t.code)+'"><div class="h"><b>'+esc(t.code)+'</b>'+right+'</div>'
    +'<div class="m">'+(t.lots.length?fmtN(m3)+' м³ · '+fmtN((here?sum2(t.hereLots,'kg'):t.kg)/1000)+' т · '+t.lots.length+' поз. · '+marks+' '+plural(marks,'клиент','клиента','клиентов'):'состав ещё не внесён')+'</div>'
    +'<div class="s">'+(st==='transit'?'выехал из Китая '+fmtDs(t.loaded)+(t.cn?' · '+esc(t.cn):'')+' · ожидаем '+fmtDs(t.eta)+(t.plan?' (по средней дороге '+ST.transit+' дн.)':''):
      here?'прибыл '+fmtDs(t.arrH)+' · '+(t.out?'отгрузка '+fmtDs(t.out):'отгрузка не назначена')+(t.kz?' · фура '+esc(t.kz):''):'прибыл '+fmtDs(t.arr)+' · уехал '+fmtDs(t.out)+(t.kz?' · '+esc(t.kz):''))+'</div>'
    +(prog!=null?'<div class="pb"><i style="width:'+Math.round(prog*100)+'%"></i></div>':'')+'</div>';
}
function pTrips(){
  const T=ST.trips, gone=T.gone.filter(t=>dDiff(ST.D,t.out)<=30);
  const col=(t,list,sub)=>'<div class="kcol"><h4>'+t+' <small>'+sub+'</small></h4>'+(list.length?list.map(tripCard).join(''):'<div class="empty">—</div>')+'</div>';
  return '<div class="ph"><div><h2>Рейсы</h2><p>Китай → Хоргос (склад) → казахская фура. Порядок на складе — по дате прибытия: первым отгружается самый старый.</p></div></div>'
    +'<div class="kan">'+col('В пути',T.transit,T.transit.length+' · '+fmtN(sum2(T.transit,'cbm'),0)+' м³')+col('На складе',T.here,T.here.length+' · '+fmtN(ST.k.cbm,0)+' м³')+col('Отгружены за 30 дней',gone,gone.length+(gone.length?' · в среднем '+fmtN(gone.reduce((a,t)=>a+t.dwell,0)/gone.length)+' дн.':''))+'</div>';
}
function bTrips(){ bindTrips(); }
function openTrip(t){
  if(!t) return; const here=t.status==='here', D=ST.D;
  const steps=[['Выехал из Китая',t.loaded,t.cn?'машина '+t.cn:''],['Прибыл в Хоргос',t.arr,t.arr&&here?'на складе '+daysTxt(t.days):''],['Погружен в казахскую фуру',t.out,t.kz?'фура '+t.kz:'']];
  const tl='<ul class="tl">'+steps.map(([n,d,s])=>'<li class="'+(d&&d<=D?'done':'')+'">'+n+' — <b>'+(d?fmtD(d):t.status==='transit'&&n.startsWith('Прибыл')&&t.eta?'ожидаем '+fmtD(t.eta):'—')+'</b>'+(s?'<small>'+esc(s)+'</small>':'')+'</li>').join('')+'</ul>';
  const ls=t.lots.slice().sort((a,b)=>b.cbm-a.cbm);
  openDrawer('Рейс '+t.code,
    '<div class="kv"><span>Статус</span><b>'+({here:'на складе, '+t.q+'-й в очереди',transit:'в пути',gone:'отгружен'}[t.status]||'—')+'</b><span>Объём</span><b>'+fmtN(t.cbm)+' м³ · '+fmtN(t.kg/1000)+' т · '+fmtN(t.ctn,0)+' мест</b>'
    +'<span>Позиций / клиентов</span><b>'+t.lots.length+' / '+new Set(t.lots.map(l=>l.mark)).size+'</b>'+(t.arr&&t.loaded?'<span>Дорога Китай → Хоргос</span><b>'+dDiff(t.arr,t.loaded)+' дн.</b>':'')
    +(t.status==='gone'?'<span>Стоял на складе</span><b class="'+(t.dwell>CFG.norm?'bad':'')+'">'+daysTxt(t.dwell)+'</b>':'')+'</div>'+tl
    +'<h3 style="font-size:13px;margin:6px 0">Состав</h3><table class="t">'+ls.map(l=>'<tr data-i="'+l.i+'"><td><b>'+esc(l.mark)+'</b><div class="sub">'+esc(l.cargo)+'</div></td><td class="r">'+fmtN(l.cbm)+' м³<div class="sub">'+fmtN(l.ctn,0)+' мест · '+fmtN(l.kg,0)+' кг</div></td><td>'+((l.cells||[]).join(', ')||'')+'</td></tr>').join('')+'</table>');
  document.querySelectorAll('#dbody tr[data-i]').forEach(tr=>tr.onclick=()=>openLot(LOTS[+tr.dataset.i]));
}
function openLot(l){
  if(!l) return; const t=l.t, here=t.status==='here'&&l.days!=null;
  openDrawer(l.mark+' · '+(l.cargo||'груз'),
    '<div class="kv"><span>Рейс</span><b><a href="#" id="dtrip">'+esc(l.reys)+'</a></b><span>Прибыл</span><b>'+fmtD(l.arr)+'</b>'
    +(here?'<span>На складе</span><b>'+chip(l.days,daysTxt(l.days))+'</b>':'')+'<span>Мест · объём · вес</span><b>'+fmtN(l.ctn,0)+' · '+fmtN(l.cbm,2)+' м³ · '+fmtN(l.kg,0)+' кг</b>'
    +'<span>Упаковка</span><b>'+esc(l.pack||'—')+'</b><span>Куда</span><b>'+esc(l.dest||'—')+'</b>'
    +'<span>Ячейка</span><b>'+((l.cells||[]).length?esc(l.cells.join(', '))+(l.cellsT?' (из таблицы)':''):'не размещён')+'</b>'
    +'<span>Отгрузка</span><b>'+(l.out?fmtD(l.out):'не назначена')+(l.kz?' · фура '+esc(l.kz):'')+'</b></div>'
    +(l.ctn&&l.kg/l.ctn>CFG.placeKg?'<div class="warnbox">Место тяжелее '+fmtN(CFG.placeKg,0)+' кг (≈'+fmtN(l.kg/l.ctn,0)+' кг) — не в стоечный поддон, только на пол под вилы.</div>':'')
    +(here&&!l.cellsT?'<div style="display:flex;gap:8px;margin-top:6px"><button class="btn pri" id="dplace">Указать ячейку на схеме</button>'+((l.cells||[]).length?'<button class="btn" id="dunp">Убрать из ячейки</button>':'')+'</div>':''));
  $('dtrip').onclick=e=>{ e.preventDefault(); openTrip(t); };
  const dp=$('dplace'); if(dp) dp.onclick=()=>{ A.pick=l.i; go('plan'); toast('Нажмите на ячейку для «'+l.mark+'»'); };
  const du=$('dunp'); if(du) du.onclick=()=>{ delete PL[l.key]; savePL(); calc(); closeDrawer(); render(); toast('Убран из ячейки'); };
}

/* ---------- Клиенты ---------- */
function pClients(){
  const D=ST.D, by={};
  LOTS.forEach(l=>{ const b=by[l.mark]||(by[l.mark]={mark:l.mark,here:null,n90:0,cbm90:0,dw:[]});
    if(l.arr&&dDiff(D,l.arr)<=90&&l.arr<=D){ b.n90++; b.cbm90+=l.cbm; if(l.out&&l.out<=D) b.dw.push(dDiff(l.out,l.arr)); } });
  Object.values(ST.marks).forEach(m=>(by[m.mark]||(by[m.mark]={mark:m.mark,n90:0,cbm90:0,dw:[]})).here=m);
  const rows=Object.values(by).filter(b=>b.here||b.n90).sort((a,b)=>((b.here?b.here.cbm:0)-(a.here?a.here.cbm:0))||(b.cbm90-a.cbm90));
  return '<div class="ph"><div><h2>Клиенты</h2><p>'+rows.filter(r=>r.here).length+' клиентов с грузом на складе · за 90 дней — '+rows.length+'</p></div></div>'
    +'<div class="tw"><table class="t"><thead><tr><th>Клиент (метка)</th><th class="r">На складе, м³</th><th class="r">т</th><th class="r">Мест</th><th class="r">Поз.</th><th class="r">Дольше всего</th><th>Рейсы на складе</th><th class="r">За 90 дн., м³</th><th class="r">Средний простой</th></tr></thead><tbody>'
    +rows.map(b=>{ const h=b.here, av=b.dw.length?b.dw.reduce((a,x)=>a+x,0)/b.dw.length:null;
      return '<tr data-m="'+esc(b.mark)+'"><td><span class="chip" style="background:'+hashC(b.mark)+';color:#fff;margin-right:6px">&nbsp;</span><b>'+esc(b.mark)+'</b></td><td class="r">'+(h?fmtN(h.cbm):'—')+'</td><td class="r">'+(h?fmtN(h.kg/1000):'—')+'</td><td class="r">'+(h?fmtN(h.ctn,0):'—')+'</td><td class="r">'+(h?h.lots.length:'—')+'</td>'
        +'<td class="r">'+(h?chip(h.maxDays):'—')+'</td><td>'+(h?esc([...h.trips].join(', ')):'')+'</td><td class="r">'+fmtN(b.cbm90)+'</td><td class="r">'+(av==null?'—':fmtN(av)+' дн.')+'</td></tr>'; }).join('')
    +'</tbody></table></div>';
}
function bClients(){ document.querySelectorAll('tbody tr[data-m]').forEach(tr=>tr.onclick=()=>{ A.lf={st:'all',late:false,unplaced:false,mark:tr.dataset.m,q:''}; A.sort={k:'arr',d:-1}; go('lots'); }); }

/* ---------- Аналитика: графики на SVG ---------- */
function occSeries(days){ const D=ST.D, out=[];
  for(let i=days-1;i>=0;i--){ const d=new Date(D.getTime()-i*DAY); let v=0; LOTS.forEach(l=>{ if(l.arr&&l.arr<=d&&(!l.out||l.out>=d)) v+=l.cbm; }); out.push({d,v}); }
  return out; }
function occChart(days,h){
  const S2=occSeries(days), cap=capAll(), mx=Math.max(cap*1.1,Math.max.apply(null,S2.map(p=>p.v))*1.05), w=600, pl=36, pb=18, ph=(h||220)-pb-6;
  const X=i=>pl+(w-pl-6)*i/(S2.length-1), Y=v=>6+ph*(1-v/mx);
  let p='M'+X(0)+','+Y(0); S2.forEach((q,i)=>p+=' L'+X(i).toFixed(1)+','+Y(q.v).toFixed(1)); const area=p+' L'+X(S2.length-1)+','+Y(0)+' Z';
  let s='<svg class="chart" viewBox="0 0 '+w+' '+(h||220)+'" preserveAspectRatio="none" style="height:'+(h||220)+'px">';
  [0,0.5,1].forEach(k=>{ const v=mx*k; s+='<line class="gl" x1="'+pl+'" x2="'+(w-6)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(pl-4)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+fmtN(v,0)+'</text>'; });
  s+='<path d="'+area+'" fill="color-mix(in srgb,var(--blue) 18%,transparent)"/><path d="'+p.replace(/^M[^L]*L/,'M')+'" fill="none" stroke="var(--blue)" stroke-width="2"/>';
  s+='<line x1="'+pl+'" x2="'+(w-6)+'" y1="'+Y(cap)+'" y2="'+Y(cap)+'" stroke="var(--bad)" stroke-dasharray="5 4" stroke-width="1.5"/><text x="'+(w-8)+'" y="'+(Y(cap)-4)+'" text-anchor="end" style="fill:var(--bad)">вместимость '+fmtN(cap,0)+' м³</text>';
  for(let i=0;i<S2.length;i+=Math.ceil(S2.length/6)) s+='<text x="'+X(i)+'" y="'+((h||220)-4)+'" text-anchor="middle">'+fmtDs(S2[i].d)+'</text>';
  return s+'</svg>';
}
function barChart(items,opt){
  const w=600,h=opt.h||220,pl=36,pb=34,ph=h-pb-8, mx=Math.max(opt.line||0,Math.max.apply(null,items.map(i=>i.v).concat([1])))*1.1, bw=(w-pl-6)/Math.max(1,items.length);
  const Y=v=>8+ph*(1-v/mx);
  let s='<svg class="chart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="height:'+h+'px">';
  [0,0.5,1].forEach(k=>{ const v=mx*k; s+='<line class="gl" x1="'+pl+'" x2="'+(w-6)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(pl-4)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+fmtN(v,0)+'</text>'; });
  items.forEach((it,i)=>{ const x=pl+i*bw+bw*0.15, bh=Math.max(1,Y(0)-Y(it.v));
    s+='<rect x="'+x+'" y="'+Y(it.v)+'" width="'+(bw*0.7)+'" height="'+bh+'" rx="2" fill="'+(it.c||'var(--blue)')+'"><title>'+esc(it.t)+'</title></rect>';
    if(items.length<=24||i%2===0) s+='<text x="'+(x+bw*0.35)+'" y="'+(h-pb+14)+'" text-anchor="middle">'+esc(it.l)+'</text>'; });
  if(opt.line) s+='<line x1="'+pl+'" x2="'+(w-6)+'" y1="'+Y(opt.line)+'" y2="'+Y(opt.line)+'" stroke="var(--bad)" stroke-dasharray="5 4" stroke-width="1.5"/><text x="'+(w-8)+'" y="'+(Y(opt.line)-4)+'" text-anchor="end" style="fill:var(--bad)">'+esc(opt.lineT)+'</text>';
  return s+'</svg>';
}
function pStats(){
  const D=ST.D, gone=TRIPS.filter(t=>t.arr&&t.out&&t.out<=D).sort((a,b)=>a.out-b.out).slice(-24);
  const tr=TRIPS.filter(t=>t.arr&&t.loaded&&t.arr<=D).sort((a,b)=>a.arr-b.arr).slice(-24);
  const wk=[]; for(let i=11;i>=0;i--){ const e=new Date(D.getTime()-i*7*DAY), b=new Date(e.getTime()-6*DAY); let vin=0,vout=0;
    TRIPS.forEach(t=>{ if(t.arr&&t.arr>=b&&t.arr<=e) vin+=t.cbm; if(t.out&&t.out>=b&&t.out<=e) vout+=t.cbm; }); wk.push({b,e,vin,vout}); }
  const dw=gone.map(t=>dDiff(t.out,t.arr)), avg=dw.length?dw.reduce((a,b)=>a+b,0)/dw.length:0, med=dw.length?dw.slice().sort((a,b)=>a-b)[dw.length>>1]:0;
  const tops=Object.values(LOTS.filter(l=>l.arr&&dDiff(D,l.arr)<=90&&l.arr<=D).reduce((m,l)=>{ (m[l.mark]=m[l.mark]||{m:l.mark,v:0}).v+=l.cbm; return m; },{})).sort((a,b)=>b.v-a.v).slice(0,10);
  const occ=occSeries(90), peak=occ.reduce((a,b)=>b.v>a.v?b:a,{v:0}), overDays=occ.filter(p=>p.v>capAll()).length;
  return '<div class="ph"><div><h2>Аналитика</h2><p>По данным таблиц на '+fmtD(D)+'</p></div></div>'
    +'<div class="grid g4"><div class="card kpi"><span>Средний простой рейса</span><b>'+fmtN(avg)+' <small>дн.</small></b><span>медиана '+med+' дн. · последние '+dw.length+' рейсов</span></div>'
    +'<div class="card kpi"><span>Дольше нормы ('+CFG.norm+' дн.)</span><b class="'+(dw.filter(x=>x>CFG.norm).length?'bad':'ok')+'">'+(dw.length?Math.round(100*dw.filter(x=>x>CFG.norm).length/dw.length):0)+' <small>%</small></b><span>рейсов из '+dw.length+'</span></div>'
    +'<div class="card kpi"><span>Пик заполнения за 90 дней</span><b class="'+(peak.v>capAll()?'bad':'')+'">'+fmtN(peak.v,0)+' <small>м³</small></b><span>'+fmtD(peak.d)+' · дней сверх вместимости: '+overDays+'</span></div>'
    +'<div class="card kpi"><span>Дорога Китай → Хоргос</span><b>'+ST.transit+' <small>дн.</small></b><span>в среднем по последним рейсам</span></div></div>'
    +'<div class="grid g2" style="margin-top:14px"><div class="card"><h3>Заполнение буфера, 90 дней <small>м³ на складе по дням</small></h3>'+occChart(90,220)+'</div>'
    +'<div class="card"><h3>Сколько дней стояли рейсы <small>от прибытия до погрузки в фуру</small></h3>'+barChart(gone.map(t=>({v:dDiff(t.out,t.arr),l:fmtDs(t.out),t:t.code+': '+dDiff(t.out,t.arr)+' дн.',c:dDiff(t.out,t.arr)>CFG.norm?'var(--bad)':'var(--ok)'})),{line:CFG.norm,lineT:'норма '+CFG.norm+' дн.'})+'</div>'
    +'<div class="card"><h3>Приход и отгрузка по неделям <small>м³</small></h3>'+weekChart(wk)+'</div>'
    +'<div class="card"><h3>Дорога Китай → Хоргос <small>дней по рейсам</small></h3>'+barChart(tr.map(t=>({v:dDiff(t.arr,t.loaded),l:fmtDs(t.arr),t:t.code+': '+dDiff(t.arr,t.loaded)+' дн.',c:'var(--cyan)'})),{})+'</div>'
    +'<div class="card"><h3>Крупнейшие клиенты за 90 дней <small>м³</small></h3>'+tops.map(t=>'<div style="display:grid;grid-template-columns:120px 1fr 60px;gap:8px;align-items:center;font-size:13px;margin:5px 0"><b>'+esc(t.m)+'</b><div style="height:9px;background:var(--surf2);border-radius:5px;overflow:hidden"><i style="display:block;height:100%;width:'+Math.round(100*t.v/tops[0].v)+'%;background:'+hashC(t.m)+'"></i></div><span class="r" style="text-align:right">'+fmtN(t.v,0)+'</span></div>').join('')+'</div>'
    +'<div class="card"><h3>Что это значит</h3><p class="note">'+statsText(avg,dw,peak,overDays)+'</p></div></div>';
}
function weekChart(wk){
  const w=600,h=220,pl=36,pb=26,ph=h-pb-8, mx=Math.max(1,...wk.map(x=>Math.max(x.vin,x.vout)))*1.1, bw=(w-pl-6)/wk.length, Y=v=>8+ph*(1-v/mx);
  let s='<svg class="chart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="height:'+h+'px">';
  [0,0.5,1].forEach(k=>{ const v=mx*k; s+='<line class="gl" x1="'+pl+'" x2="'+(w-6)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(pl-4)+'" y="'+(Y(v)+4)+'" text-anchor="end">'+fmtN(v,0)+'</text>'; });
  wk.forEach((x,i)=>{ const x0=pl+i*bw+bw*0.12, b=bw*0.36;
    s+='<rect x="'+x0+'" y="'+Y(x.vin)+'" width="'+b+'" height="'+(Y(0)-Y(x.vin))+'" rx="2" fill="var(--blue)"><title>приход '+fmtN(x.vin,0)+' м³</title></rect>';
    s+='<rect x="'+(x0+b+2)+'" y="'+Y(x.vout)+'" width="'+b+'" height="'+(Y(0)-Y(x.vout))+'" rx="2" fill="var(--acc)"><title>отгрузка '+fmtN(x.vout,0)+' м³</title></rect>';
    if(i%2===0) s+='<text x="'+(x0+b)+'" y="'+(h-8)+'" text-anchor="middle">'+fmtDs(x.b)+'</text>'; });
  s+='<rect x="'+(w-150)+'" y="6" width="10" height="10" fill="var(--blue)"/><text x="'+(w-136)+'" y="15">приход</text><rect x="'+(w-80)+'" y="6" width="10" height="10" fill="var(--acc)"/><text x="'+(w-66)+'" y="15">отгрузка</text>';
  return s+'</svg>';
}
function statsText(avg,dw,peak,overDays){
  const out=[];
  if(dw.length) out.push('Рейс стоит на складе в среднем <b>'+fmtN(avg)+' дн.</b>'+(avg>CFG.norm?' — дольше нормы '+CFG.norm+' дн.: груз ждёт казахскую фуру.':'.'));
  if(peak.v>capAll()) out.push('Пиковое заполнение <b>'+fmtN(peak.v,0)+' м³</b> больше вместимости стоечного буфера ('+fmtN(capAll(),0)+' м³): в такие дни груз стоит вне ячеек. Таких дней за 90 — <b>'+overDays+'</b>.');
  else out.push('Буфер ни разу не переполнялся: пик '+fmtN(peak.v,0)+' из '+fmtN(capAll(),0)+' м³.');
  out.push('Каждый лишний день простоя рейса ≈ '+fmtN(capAll()?ST.k.cbm/Math.max(1,ST.k.trips):0,0)+' м³ занятого места: сократить простой на день — освободить место под следующий рейс.');
  return out.join('<br><br>');
}

/* ---------- Настройки ---------- */
function pSet(){
  const n=Object.keys(PL).length;
  return '<div class="ph"><div><h2>Настройки</h2><p>Источник данных, нормы, вместимость и размещение</p></div></div><div class="grid g2">'
    +'<div class="card"><h3>Источник данных</h3><div class="form"><label>Ссылка на таблицу</label><div style="display:flex;gap:6px"><input class="inp" id="su" style="flex:1" value="'+esc(A.src.url||'')+'" placeholder="https://docs.google.com/spreadsheets/d/…"><button class="btn pri" id="sgo">Подключить</button></div>'
    +'<label>Сейчас</label><div>'+(A.data?esc(A.data.name)+' · '+A.data.reys.length+' рейсов · '+LOTS.length+' позиций':'нет данных')+(A.err?'<div class="bad" style="font-size:12.5px">'+esc(A.err)+'</div>':'')+'</div>'
    +'<label>Обновлять каждые</label><select class="inp" id="srf">'+[[60,'1 мин'],[120,'2 мин'],[300,'5 мин'],[900,'15 мин'],[0,'вручную']].map(([v,t])=>'<option value="'+v+'"'+(CFG.refresh===v?' selected':'')+'>'+t+'</option>').join('')+'</select></div>'
    +'<p class="note">Таблица должна быть открыта «всем, у кого есть ссылка — читатель». Рабочие таблицы Buraq («Fura statuslari» + «Ortilgan furalar») распознаются сами; из них берутся только рейсы, даты, объёмы и названия грузов — телефоны и цены не читаются. Ссылка хранится только в этом браузере.</p>'
    +'<h3 style="margin-top:14px">Вставить таблицу</h3><textarea class="inp" id="stxt" placeholder="Скопируйте строки из Google Sheets или Excel вместе с заголовками: SHIPPING MARK, CARGO NAME, CTN, CBM, KG, DATE OF ARRIVE, РЕЙС, ЯЧЕЙКА, ДАТА ОТГРУЗКИ…"></textarea>'
    +'<div style="display:flex;gap:6px;margin-top:8px"><button class="btn" id="spaste">Загрузить вставленное</button><button class="btn" id="sdemo">Демо-данные</button></div></div>'
    +'<div class="card"><h3>Нормы и вместимость</h3><div class="form">'
    +'<label>Норма хранения, дней</label><input class="inp" type="number" min="1" max="60" id="snorm" value="'+CFG.norm+'">'
    +'<label>Объём одной стойки, м³</label><input class="inp" type="number" min="0.5" max="20" step="0.1" id="srack" value="'+CFG.rackM3+'">'
    +'<label>Штабелей в ячейке</label><input class="inp" type="number" min="1" max="6" id="sstk" value="'+CFG.stacks+'">'
    +'<label>Ярусов в штабеле</label><input class="inp" type="number" min="1" max="4" id="stier" value="'+CFG.tiers+'">'
    +'<label>Место тяжелее, кг — не в стойку</label><input class="inp" type="number" min="100" max="5000" step="50" id="skg" value="'+CFG.placeKg+'">'
    +'<label>Итого</label><b>ячейка '+fmtN(capCell())+' м³ · буфер '+fmtN(capAll(),0)+' м³ (30 ячеек)</b></div>'
    +'<h3 style="margin-top:16px">Размещение по ячейкам <small>'+n+' записей</small></h3>'
    +'<p class="note">Места, которые вы задаёте на схеме, хранятся в этом браузере и видны в 3D-модели (режим «Учёт груза»), если она открыта в этом же браузере. Чтобы перенести места в таблицу или на другой компьютер — выгрузите CSV.</p>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" id="pexp">Выгрузить места (CSV)</button><label class="btn">Загрузить места<input type="file" id="pimp" accept=".csv,.txt" hidden></label><button class="btn" id="pclean">Убрать места отгруженных</button><button class="btn" id="pclr">Очистить всё</button></div>'
    +'<h3 style="margin-top:16px">Вид</h3><div class="seg" id="sth">'+[['','Как в системе'],['light','Светлая'],['dark','Тёмная']].map(([k,t])=>'<button data-t="'+k+'" class="'+(CFG.theme===k?'on':'')+'">'+t+'</button>').join('')+'</div>'
    +'<h3 style="margin-top:16px">Клавиши</h3><p class="note"><kbd>Ctrl K</kbd> или <kbd>/</kbd> — поиск и команды · <kbd>1</kbd>…<kbd>7</kbd> — разделы · <kbd>R</kbd> — обновить · <kbd>Esc</kbd> — закрыть</p></div></div>';
}
function bSet(){
  $('sgo').onclick=()=>connect($('su').value); $('su').onkeydown=e=>{ if(e.key==='Enter') connect($('su').value); };
  $('srf').onchange=e=>{ CFG.refresh=+e.target.value; store(); armRefresh(); toast('Сохранено'); };
  $('spaste').onclick=()=>{ try{ setData(fromText($('stxt').value),{kind:'paste',url:''}); toast('Загружено '+LOTS.length+' позиций'); go('dash'); }catch(e){ toast(e.message); } };
  $('sdemo').onclick=()=>{ setData(demo(),{kind:'demo',url:''}); go('dash'); };
  const num2=(id,k,mn,mx)=>$(id).onchange=e=>{ const v=+e.target.value; if(!(v>=mn&&v<=mx)){ toast('Значение от '+mn+' до '+mx); e.target.value=CFG[k]; return; } CFG[k]=v; store(); calc(); render(); };
  num2('snorm','norm',1,60); num2('srack','rackM3',0.5,20); num2('sstk','stacks',1,6); num2('stier','tiers',1,4); num2('skg','placeKg',100,5000);
  document.querySelectorAll('#sth button').forEach(b=>b.onclick=()=>{ CFG.theme=b.dataset.t; store(); theme(); render(); });
  $('pexp').onclick=()=>{ const by={}; LOTS.forEach(l=>by[l.key]=l);
    const L=[['Рейс','Клиент','Груз','м3','Ячейка']].concat(Object.keys(PL).map(k=>{ const l=by[k], p=k.split('|'); return [p[0],p[1],p[2],p[3].replace('.',','),PL[k].join(' ')]; }));
    download('места_в_ячейках_'+fmtD(today())+'.csv',L.map(r=>r.map(v=>/[;"]/.test(v)?'"'+String(v).replace(/"/g,'""')+'"':v).join(';')).join('\r\n')); };
  $('pimp').onchange=e=>{ const f=e.target.files[0]; if(!f) return; f.text().then(t=>{ let n=0; t.replace(/^﻿/,'').split(/\r?\n/).slice(1).forEach(line=>{ const c=line.split(';').map(x=>x.replace(/^"|"$/g,'').replace(/""/g,'"'));
      if(c.length<5) return; const ids=cellList(c[4]); if(!ids.length) return; PL[[c[0],c[1],c[2],(+String(c[3]).replace(',','.')||0).toFixed(2)].join('|')]=ids; n++; }); savePL(); calc(); render(); toast('Загружено мест: '+n); }); };
  $('pclean').onclick=()=>{ const keep=new Set(ST.here.map(l=>l.key)); let n=0; Object.keys(PL).forEach(k=>{ if(!keep.has(k)&&LOTS.some(l=>l.key===k&&l.out&&l.out<ST.D)){ delete PL[k]; n++; } }); savePL(); calc(); render(); toast('Убрано записей: '+n); };
  $('pclr').onclick=()=>{ if(!confirm('Удалить все места, заданные на схеме?')) return; A.undo=JSON.parse(JSON.stringify(PL)); PL={}; savePL(); calc(); render(); toast('Места очищены'); };
}

/* ---------------------------------------------------------------- боковая панель, поиск, уведомления */
function openDrawer(t,html){ $('dttl').textContent=t; $('dbody').innerHTML=html; $('drawer').classList.add('on'); $('scrim').classList.add('on'); }
function closeDrawer(){ $('drawer').classList.remove('on'); $('scrim').classList.remove('on'); }
let tt=0; function toast(m){ const e=$('toast'); e.textContent=m; e.classList.add('on'); clearTimeout(tt); tt=setTimeout(()=>e.classList.remove('on'),2600); }
let palItems=[], palSel=0;
function palOpen(){ $('pal').classList.add('on'); const q=$('palq'); q.value=''; palFill(''); setTimeout(()=>q.focus(),0); }
function palClose(){ $('pal').classList.remove('on'); }
function palFill(q){
  q=q.trim().toLowerCase(); const it=[];
  PAGES.forEach(([k,t])=>it.push({k:'раздел',t,x:'',go:()=>go(k)}));
  it.push({k:'команда',t:'Обновить из таблицы',x:'R',go:()=>reload()},{k:'команда',t:'Разместить груз по предложению',x:'',go:()=>{ go('plan'); autoPlace(); }},{k:'команда',t:'Показать склад на сегодня',x:'',go:()=>setDate(null)});
  if(ST){ ST.trips.here.concat(ST.trips.transit,ST.trips.gone.slice(0,30)).forEach(t=>it.push({k:'рейс',t:t.code,x:{here:'на складе '+t.days+' дн.',transit:'в пути',gone:'отгружен'}[t.status],go:()=>openTrip(t)}));
    Object.values(ST.marks).forEach(m=>it.push({k:'клиент',t:m.mark,x:fmtN(m.cbm)+' м³ · '+m.lots.length+' поз.',go:()=>{ A.lf={st:'here',late:false,unplaced:false,mark:m.mark,q:''}; go('lots'); }}));
    CELLS.forEach(c=>{ const cs=ST.cells[c.id]; it.push({k:'ячейка',t:c.id,x:cs.lots.length?fmtN(cs.m3)+' м³ · '+cs.lots.length+' поз.':'свободна',go:()=>{ A.selCell=c.id; go('plan'); }}); });
    ST.here.forEach(l=>it.push({k:'груз',t:l.mark+' · '+l.cargo,x:l.reys+' · '+l.days+' дн.',go:()=>openLot(l)})); }
  palItems=(q?it.filter(i=>(i.k+' '+i.t+' '+i.x).toLowerCase().includes(q)):it.slice(0,PAGES.length+3)).slice(0,60); palSel=0; palDraw();
}
function palDraw(){ $('pall').innerHTML=palItems.map((i,n)=>'<li class="'+(n===palSel?'on':'')+'" data-n="'+n+'"><span class="k">'+i.k+'</span>'+esc(i.t)+'<span class="x">'+esc(i.x)+'</span></li>').join('')||'<li class="mut">Ничего не найдено</li>';
  document.querySelectorAll('#pall li[data-n]').forEach(li=>li.onclick=()=>{ palClose(); palItems[+li.dataset.n].go(); });
  const on=document.querySelector('#pall li.on'); if(on) on.scrollIntoView({block:'nearest'}); }
function setDate(d){ A.date=d&&dDiff(d,today())!==0?d:null; calc(); render(); }

/* ---------------------------------------------------------------- тема, клавиши, автообновление, запуск */
function theme(){ const t=CFG.theme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'); document.documentElement.dataset.theme=t; }
let rT=0; function armRefresh(){ clearInterval(rT); if(CFG.refresh>0) rT=setInterval(()=>{ if(A.src.kind==='url'&&!A.busy&&!document.hidden&&!A.date) reload(true); },CFG.refresh*1000); }
function boot(){
  restore(); theme(); prep(); if(A.data) calc();
  $('search').onclick=palOpen; $('palq').oninput=e=>palFill(e.target.value);
  $('palq').onkeydown=e=>{ if(e.key==='ArrowDown'){ palSel=Math.min(palItems.length-1,palSel+1); palDraw(); e.preventDefault(); } else if(e.key==='ArrowUp'){ palSel=Math.max(0,palSel-1); palDraw(); e.preventDefault(); }
    else if(e.key==='Enter'&&palItems[palSel]){ const i=palItems[palSel]; palClose(); i.go(); } else if(e.key==='Escape') palClose(); };
  $('pal').onclick=e=>{ if(e.target.id==='pal') palClose(); };
  $('reload').onclick=()=>reload(); $('theme').onclick=()=>{ const cur=document.documentElement.dataset.theme; CFG.theme=cur==='dark'?'light':'dark'; store(); theme(); render(); };
  $('date').onchange=e=>setDate(e.target.value?new Date(e.target.value+'T00:00:00'):null); $('dnow').onclick=()=>setDate(null);
  $('dclose').onclick=closeDrawer; $('scrim').onclick=closeDrawer;
  addEventListener('keydown',e=>{ const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){ e.preventDefault(); palOpen(); return; }
    if(e.key==='Escape'){ palClose(); closeDrawer(); if(A.pick!=null){ A.pick=null; render(); } return; }
    if(typing) return;
    if(e.key==='/'){ e.preventDefault(); palOpen(); } else if(e.key==='r'||e.key==='R'||e.key==='к'||e.key==='К'){ reload(); } else if(/^[1-7]$/.test(e.key)) go(PAGES[+e.key-1][0]); });
  addEventListener('hashchange',()=>{ const p=location.hash.slice(1); if(p&&p!==A.page) go(p); });
  addEventListener('storage',e=>{ if(e.key===PLACE_KEY){ loadPL(); if(A.data){ calc(); render(); } } });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{ if(!CFG.theme){ theme(); render(); } });
  A.page=PAGES.some(p=>p[0]===location.hash.slice(1))?location.hash.slice(1):'dash';
  render(); armRefresh();
  if(A.src.kind==='url'&&Date.now()-A.at>60000) reload(true);
}
window.WMS={get A(){ return A; },get ST(){ return ST; },get LOTS(){ return LOTS; },get PL(){ return PL; },CFG,calc,render,go,setData,demo,autoPlace,place,reload,fromText,setDate,S};
boot();
})();
