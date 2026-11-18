/* ==========================================================================
   УЧЁТ ГРУЗА (18.11): что лежит на складе, чей груз, когда прибыл и сколько дней стоит.
   Данные — из таблиц Google (по ссылке), из вставленной таблицы или демо. Модель их только читает.
   Один модуль STOCK: 00_data (чтение и разбор) → 10_alloc (стойки и ячейки) → 20_view (3D) → 30_ui (панель).
   ========================================================================== */
const STOCK=window.STOCK=(()=>{
const KEY='sklad4.stock.v1', DAY=86400000;
/* настройки: норма хранения (дней), объём одной стойки (м³), штабелей в ячейке, ярусов, раскраска, автообновление (с) */
const CFG={norm:7,rackM3:3.0,stacks:2,tiers:2,mode:'days',refresh:120,placeKg:1000};
/* рабочие таблицы Buraq: листы и строки шапок (ищем столбцы по названиям — порядок столбцов можно менять) */
const BL={fs:'Fura statuslari',fsRows:[6,5,7,1,2,3,4,8],of:'Ortilgan furalar',ofRows:[2,1,3]};
const S={on:false,src:{kind:'none',url:'',id:'',gid:''},data:null,at:0,err:'',busy:false,date:null,sel:null,q:'',today:null};

const pad=n=>String(n).padStart(2,'0');
const day0=d=>new Date(d.getFullYear(),d.getMonth(),d.getDate());
const fmtD=d=>d?pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear():'—';
const fmtDs=d=>d?pad(d.getDate())+'.'+pad(d.getMonth()+1):'—';
const fmtN=(v,k)=>(+v||0).toLocaleString('ru-RU',{maximumFractionDigits:k===undefined?1:k});
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dDiff=(a,b)=>Math.round((day0(a)-day0(b))/DAY);
const today=()=>day0(S.today||new Date());
const viewDate=()=>S.date?day0(S.date):today();
const plural=(n,a,b,c)=>{ n=Math.abs(n)%100; const k=n%10; return n>10&&n<20?c:k===1?a:k>=2&&k<=4?b:c; };
const daysTxt=n=>n+' '+plural(n,'день','дня','дней');

/* ==== ОБЩЕЕ: разбор таблиц (берёт и система управления складом wms/, build.py --wms) — начало ==== */
function num(v){
  if(typeof v==='number') return isFinite(v)?v:0;
  if(v==null) return 0;
  let s=String(v).replace(/[\s  ]/g,'');
  if(s.indexOf(',')>=0&&s.indexOf('.')>=0) s=s.replace(/\./g,'');
  const x=parseFloat(s.replace(',','.')); return isFinite(x)?x:0;
}
const MON={янв:0,фев:1,мар:2,апр:3,мая:4,май:4,июн:5,июл:6,авг:7,сен:8,окт:9,ноя:10,дек:11,jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
function date(v){
  if(v instanceof Date) return isNaN(v)?null:day0(v);
  if(v==null||v==='') return null;
  const s=String(v).trim(); let m;
  if((m=s.match(/^Date\((\d+),(\d+),(\d+)/))) return new Date(+m[1],+m[2],+m[3]);
  if((m=s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/))){ let y=+m[3]; if(y<100) y+=2000; const d=new Date(y,+m[2]-1,+m[1]); return isNaN(d)?null:d; }
  if((m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return new Date(+m[1],+m[2]-1,+m[3]);
  if((m=s.match(/^(\d{1,2})[\s.-]*([a-zа-яё]{3})/i))){ const mo=MON[m[2].toLowerCase()]; if(mo===undefined) return null;
    const r=today(); let d=new Date(r.getFullYear(),mo,+m[1]); if(d-r>60*DAY) d=new Date(r.getFullYear()-1,mo,+m[1]); return d; }
  return null;
}

/* ---------------------------------------------------------------- чтение таблицы Google: JSONP (работает и из файла на диске) */
let seq=0;
function gviz(id,params){
  return new Promise((res,rej)=>{
    const cb='__stk'+(++seq)+'_'+Date.now(), s=document.createElement('script'); let done=false;
    const fin=(f,v)=>{ if(done) return; done=true; clearTimeout(tm); window[cb]=()=>{}; s.remove(); f(v); };
    window[cb]=r=>{ if(r&&r.status==='ok'&&r.table) fin(res,r.table);
      else fin(rej,new Error((r&&r.errors&&r.errors[0]&&(r.errors[0].detailed_message||r.errors[0].message))||'таблица ответила ошибкой')); };
    const tm=setTimeout(()=>fin(rej,new Error('таблица не ответила — проверьте интернет и доступ по ссылке')),20000);
    s.onerror=()=>fin(rej,new Error('таблица недоступна: нет сети или доступ «всем, у кого есть ссылка» закрыт'));
    const q=Object.assign({tqx:'out:json;responseHandler:'+cb},params);
    s.src='https://docs.google.com/spreadsheets/d/'+id+'/gviz/tq?'+Object.keys(q).map(k=>k+'='+encodeURIComponent(q[k])).join('&');
    document.head.appendChild(s);
  });
}
const cellV=c=>c==null?null:(c.v!=null?c.v:(c.f!=null?c.f:null));
const cellS=c=>c==null?'':String(c.f!=null?c.f:(c.v!=null?c.v:'')).trim();
function parseUrl(u){
  u=String(u||'').trim(); const m=u.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]{20,})/); if(!m) return /^[A-Za-z0-9_-]{30,}$/.test(u)?{id:u,gid:''}:null;
  const g=u.match(/[#?&]gid=(\d+)/); return {id:m[1],gid:g?g[1]:''};
}
/* шапка листа: строка row целиком как текст → {название: буква столбца} */
async function headerRow(id,sheet,row){
  const t=await gviz(id,{sheet,range:'A'+row+':AZ'+row,headers:0}); const out=[];
  if(t.rows&&t.rows[0]) t.rows[0].c.forEach((c,i)=>{ const s=cellS(c).replace(/\s+/g,' '); if(s) out.push({id:t.cols[i].id,label:s}); });
  return out;
}
async function findCols(id,sheet,rows,want,need){
  let best=null;
  for(const r of rows){
    let hs; try{ hs=await headerRow(id,sheet,r); }catch(e){ if(r===rows[0]) throw e; continue; }
    const got={}; for(const k in want){ const h=hs.find(h=>want[k].test(h.label)&&!Object.values(got).includes(h.id)); if(h) got[k]=h.id; }
    if(need.every(k=>got[k])) return {row:r,cols:got};
    if(!best||Object.keys(got).length>Object.keys(best.cols).length) best={row:r,cols:got};
  }
  const miss=need.filter(k=>!(best&&best.cols[k]));
  throw new Error('в листе «'+sheet+'» не нашёл столбцы: '+miss.join(', '));
}
const FS_WANT={reys:/^REYS NOMERI$/i,loaded:/^ORTILGAN SANA$/i,cn:/FURA RAQAMI HITOY/i,arr:/^HORGOS SANA$/i,out:/^QOZOQ FURA SANA$/i,kz:/FURA RAQAMI QOZOQ/i,tash:/^TOSHKENT SANA$/i};
const OF_WANT={mark:/SHIPPING MARK$/i,cargo:/YUK NOMI$/i,pack:/PACKING TYPE$/i,ctn:/(^|\s)CTN$/i,cbm:/(^|\s)CBM$/i,kg:/G\.?W\.?$/i,dest:/PUNKT NAZNACHENIYA$/i,reys:/REYS RAQAMI$/i};

/* рабочие таблицы Buraq: рейсы с датами (Fura statuslari) + состав рейсов (Ortilgan furalar). Берём только нужные столбцы. */
async function loadBL(id){
  const fs=await findCols(id,BL.fs,BL.fsRows,FS_WANT,['reys','arr','out']);
  const fk=Object.keys(fs.cols), ft=await gviz(id,{sheet:BL.fs,range:'A'+fs.row+':AZ6000',headers:1,tq:'select '+fk.map(k=>fs.cols[k]).join(',')+' where '+fs.cols.reys+' is not null'});
  const reys=[];
  ft.rows.forEach(r=>{ const o={}; fk.forEach((k,i)=>o[k]=r.c[i]); const code=cellS(o.reys); if(!/\d{4}/.test(code)) return;
    reys.push({code,loaded:date(cellV(o.loaded)),cn:cellS(o.cn).replace(/^-$/,''),arr:date(cellV(o.arr)),out:date(cellV(o.out)),kz:cellS(o.kz),tash:date(cellV(o.tash)),lots:[]}); });
  /* состав: только рейсы последних 150 дней и те, что ещё не уехали из Хоргоса */
  const t0=today(), need=reys.filter(r=>(r.arr&&dDiff(t0,r.arr)<=150)||(!r.out&&((r.loaded&&dDiff(t0,r.loaded)<=60)||r.arr)));
  const of=await findCols(id,BL.of,BL.ofRows,OF_WANT,['mark','cbm','reys']);
  const ok=Object.keys(of.cols), byCode={}; need.forEach(r=>byCode[r.code]=r);
  for(let i=0;i<need.length;i+=30){
    const part=need.slice(i,i+30), where=part.map(r=>of.cols.reys+" = '"+r.code.replace(/'/g,'')+"'").join(' or ');
    const ot=await gviz(id,{sheet:BL.of,headers:of.row,tq:'select '+ok.map(k=>of.cols[k]).join(',')+' where '+where});
    ot.rows.forEach(r=>{ const o={}; ok.forEach((k,j)=>o[k]=r.c[j]); const g=byCode[cellS(o.reys)]; if(!g) return;
      const cbm=num(cellV(o.cbm)), mark=cellS(o.mark); if(!mark&&!cbm) return;
      g.lots.push({mark:mark||'без метки',cargo:cellS(o.cargo),pack:cellS(o.pack),ctn:num(cellV(o.ctn)),cbm,kg:num(cellV(o.kg)),dest:cellS(o.dest),cell:''}); });
  }
  return {kind:'bl',name:'рабочие таблицы Buraq',reys:reys.filter(r=>r.lots.length||!r.out||(r.arr&&dDiff(t0,r.arr)<=150))};
}

/* простая таблица (шаблон): одна строка — один груз; столбцы находим по названиям на русском, английском или узбекском */
const ALIAS=[['cell',/ЯЧЕЙК|CELL|YACHEYKA|^АДРЕС/i],['mark',/SHIPPING\s*MARK|МАРК|КЛИЕНТ|MIJOZ|BELGI/i],['cargo',/CARGO\s*NAME|YUK NOMI|^ГРУЗ|НАИМЕН|ТОВАР/i],
  ['pack',/PACK|УПАК|ТАРА/i],['ctn',/CTN|件|МЕСТ|КОЛ-?ВО|QUANTITY|SONI/i],['cbm',/CBM|М3|М³|ОБЪ[ЕЁ]М|HAJM/i],
  ['kg',/^(T\/)?KG$|G\.?W\.?$|^ВЕС|^КГ|OG.?IRLIK/i],['out',/ОТГРУЖ|ДАТА ОТГ|УШ[ЁЕ]Л|ВЫБЫЛ|QOZOQ FURA SANA|JO.?NA/i],
  ['arr',/DATE OF ARRIV|ПРИБЫ|ПРИХОД|ДАТА ПРИ|HORGOS SANA|KELGAN/i],['reys',/PARTIYA|РЕЙС|REYS|ПАРТИЯ/i],
  ['dest',/НАЗНАЧ|PUNKT|^КУДА|MANZIL/i],['kz',/ФУРА|TRUCK|МАШИН/i],['note',/ПРИМЕЧ|NOTE|IZOH/i]];
function mapCols(labels){
  const got={}; ALIAS.forEach(([k,re])=>{ const i=labels.findIndex((l,i)=>l&&re.test(l)&&!/IN 1 CBM/i.test(l)&&!Object.values(got).includes(i)); if(i>=0) got[k]=i; });
  return got;
}
function fromRows(labels,rows,name){
  const c=mapCols(labels.map(l=>String(l||'').replace(/\s+/g,' ').trim()));
  if(c.mark===undefined||(c.cbm===undefined&&c.ctn===undefined)) throw new Error('в таблице нужны хотя бы столбцы SHIPPING MARK (клиент) и CBM (объём) — их названия не найдены в первой строке');
  const g=new Map(), get=(r,k)=>c[k]===undefined?null:r[c[k]];
  rows.forEach(r=>{ const mark=String(get(r,'mark')==null?'':get(r,'mark')).trim(), cbm=num(get(r,'cbm')), ctn=num(get(r,'ctn')); if(!mark||(!cbm&&!ctn)) return;
    const arr=date(get(r,'arr')), out=date(get(r,'out')), code=String(get(r,'reys')==null?'':get(r,'reys')).trim()||(arr?'приход '+fmtD(arr):'без даты');
    if(!g.has(code)) g.set(code,{code,loaded:null,cn:'',arr:null,out:null,kz:'',tash:null,lots:[],own:true});
    const G=g.get(code), s=k=>String(get(r,k)==null?'':get(r,k)).trim();
    G.lots.push({mark,cargo:s('cargo'),pack:s('pack'),ctn,cbm,kg:num(get(r,'kg')),dest:s('dest'),cell:s('cell').toUpperCase(),arr,out,kz:s('kz'),note:s('note')}); });
  g.forEach(G=>{ const a=G.lots.map(l=>l.arr).filter(Boolean); if(a.length) G.arr=new Date(Math.min.apply(null,a));
    if(G.lots.length&&G.lots.every(l=>l.out)) G.out=new Date(Math.max.apply(null,G.lots.map(l=>l.out))); G.kz=(G.lots.find(l=>l.kz)||{}).kz||''; });
  return {kind:'simple',name:name||'таблица',reys:[...g.values()]};
}
async function loadSimple(id,gid){
  const p={headers:1}; if(gid) p.gid=gid;
  const t=await gviz(id,p);
  return fromRows(t.cols.map(c=>c.label),t.rows.map(r=>r.c.map(cellV)),'таблица Google');
}
function fromText(txt){
  const lines=String(txt||'').replace(/\r/g,'').split('\n').filter(l=>l.trim());
  if(lines.length<2) throw new Error('вставьте таблицу вместе со строкой заголовков');
  const sep=lines[0].indexOf('\t')>=0?'\t':(lines[0].split(';').length>lines[0].split(',').length?';':',');
  const split=l=>{ if(sep==='\t') return l.split('\t'); const o=[]; let cur='',q=false;
    for(const ch of l){ if(ch==='"') q=!q; else if(ch===sep&&!q){ o.push(cur); cur=''; } else cur+=ch; } o.push(cur); return o; };
  return fromRows(split(lines[0]),lines.slice(1).map(split),'вставленная таблица');
}
/* ссылка: сначала пробуем рабочие таблицы Buraq (два листа), иначе — простая таблица */
async function loadUrl(url){
  const p=parseUrl(url); if(!p) throw new Error('это не ссылка на таблицу Google');
  let bl=false; try{ const h=await headerRow(p.id,BL.fs,BL.fsRows[0]); bl=h.some(x=>FS_WANT.reys.test(x.label)); }catch(e){ if(/недоступна|не ответила/.test(e.message)) throw e; }
  return bl?loadBL(p.id):loadSimple(p.id,p.gid);
}

/* демо-данные: три рейса на складе, один в пути, несколько уехавших — чтобы посмотреть, как это выглядит */
function demo(){
  let q=20261118; const R=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; };
  const t=today(), ago=n=>new Date(t.getTime()-n*DAY), code=d=>'DEMO'+pad(d.getDate())+pad(d.getMonth()+1);
  const cargo=['Светильники','Люстры','Прожекторы','Кабель','Посуда','Игрушки','Текстиль','Инструмент','Автозапчасти','Мебель разборная','Электроника','Обувь'];
  const mk=(arrAgo,outAgo,n,loadAgo)=>{ const arr=arrAgo==null?null:ago(arrAgo), g={code:code(ago(loadAgo)),loaded:ago(loadAgo),cn:'CN'+(1000+(R()*8999|0)),arr,out:outAgo==null?null:ago(outAgo),
      kz:outAgo==null&&R()<0.5?'':(100+(R()*899|0))+'KZA'+pad(1+(R()*18|0)),tash:null,lots:[]};
    for(let i=0;i<n;i++){ const big=R()<0.2, cbm=big?12+R()*22:0.3+R()*7, ctn=Math.max(1,Math.round(cbm*(6+R()*30)));
      g.lots.push({mark:'DEMO-'+(10+(R()*60|0)),cargo:cargo[R()*cargo.length|0],pack:R()<0.85?'KOROBKA':(R()<0.5?'YASHIK':'PALLET'),ctn,cbm:+cbm.toFixed(2),kg:Math.round(cbm*(90+R()*220)),dest:R()<0.7?'Ташкент':'Самарканд',cell:''}); }
    return g; };
  const reys=[mk(11,null,9,17),mk(5,null,14,10),mk(1,null,12,6),mk(null,null,13,3)];
  [[20,13],[26,22],[33,27],[41,35],[47,44],[55,46],[62,57]].forEach(p=>reys.push(mk(p[0],p[1],8+(R()*8|0),p[0]+5)));
  return {kind:'demo',name:'демо-данные',reys};
}

/* ключ груза для размещения по ячейкам (одинаковый в 3D-модели и в системе управления складом) и общее хранилище мест */
const lotKey=l=>[l.reys,l.mark,l.cargo||'',(+l.cbm||0).toFixed(2)].join('|');
const PLACE_KEY='buraq.wms.place.v1';
function placeMap(){ try{ return JSON.parse(localStorage.getItem(PLACE_KEY)||'{}')||{}; }catch(e){ return {}; } }
/* ==== ОБЩЕЕ — конец ==== */

/* в браузере храним только простые поля (без вычисленных ссылок) — и не в файле модели */
const plain=d=>({kind:d.kind,name:d.name,reys:d.reys.map(r=>({code:r.code,loaded:r.loaded,cn:r.cn,arr:r.arr,out:r.out,kz:r.kz,tash:r.tash,
  lots:r.lots.map(l=>({mark:l.mark,cargo:l.cargo,pack:l.pack,ctn:l.ctn,cbm:l.cbm,kg:l.kg,dest:l.dest,cell:l.cell,arr:l.arr0,out:l.out0,kz:l.kz0,note:l.note}))}))});
function store(){ try{ localStorage.setItem(KEY,JSON.stringify({cfg:CFG,src:S.src,at:S.at,data:S.data?plain(S.data):null})); }catch(e){} }
function prep(d){
  d.reys.forEach(r=>{ r.cbm=0; r.kg=0; r.ctn=0; r.lots.forEach((l,i)=>{ l.reys=r.code; l.id=r.code+'#'+i;
    if(!('arr0' in l)){ l.arr0=l.arr||null; l.out0=l.out||null; l.kz0=l.kz||''; }
    l.arr=l.arr0||r.arr; l.out=l.out0||r.out; l.kz=l.kz0||r.kz; r.cbm+=l.cbm; r.kg+=l.kg; r.ctn+=l.ctn; }); });
  return d;
}
function restore(){
  try{ const o=JSON.parse(localStorage.getItem(KEY)||'null'); if(!o) return;
    Object.assign(CFG,o.cfg||{}); if(o.src) S.src=o.src; S.at=o.at||0;
    if(o.data&&o.data.reys){ const rd=v=>v?new Date(v):null;
      o.data.reys.forEach(r=>{ ['loaded','arr','out','tash'].forEach(k=>r[k]=rd(r[k])); r.lots.forEach(l=>{ l.arr=rd(l.arr); l.out=rd(l.out); }); }); S.data=prep(o.data); }
  }catch(e){}
}
function setData(d,src){ S.data=prep(d); S.at=Date.now(); S.err=''; if(src) S.src=src; S.sel=null; store(); }
