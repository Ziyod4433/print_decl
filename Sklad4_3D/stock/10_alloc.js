/* ---------------------------------------------------------------- состояние склада на дату и расстановка по ячейкам */
/* порядок ячеек: от поста погрузки П2 (восток) к приёмке (запад), парами A–B: самый старый груз — ближе к отгрузке */
const CELL_ORDER=(()=>{ const o=[]; for(let n=15;n>=1;n--){ o.push('A'+n); o.push('B'+n); } return o; })();
const cellById=id=>CELLS.find(c=>c.id===id);
function cellList(s){
  /* «A6», «A6, A7», «A6-A9» → список ячеек */
  const out=[]; String(s||'').toUpperCase().replace(/А/g,'A').replace(/В/g,'B').split(/[\s,;+]+/).forEach(p=>{ if(!p) return;
    const m=p.match(/^([AB])(\d{1,2})(?:[-–—]([AB])?(\d{1,2}))?$/); if(!m) return;
    const a=+m[2], b=m[4]?+m[4]:a; for(let n=Math.min(a,b);n<=Math.max(a,b);n++){ const id=m[1]+n; if(cellById(id)&&!out.includes(id)) out.push(id); } });
  return out;
}
/* место стойки в ячейке: штабель k (0 — в глубине ячейки), ярус t */
function rackPos(c,k,t){
  const cx=(c.x0+c.x1)/2, z=c.row==='A'?c.z1-1.05-k*1.62:c.z0+1.05+k*1.62;
  return {x:cx,y:t*RACK.PITCH,z,rot:c.row==='A'?Math.PI:0};
}
let ST=null;
function compute(){
  const D=viewDate(), d=S.data, st={D,here:[],groups:[],coming:[],gone:[],racks:[],cells:{},over:[],warn:[],auto:false,k:{}};
  ST=st; if(!d) return st;
  d.reys.forEach(r=>{
    const lots=r.lots.filter(l=>l.arr&&l.arr<=D&&(!l.out||l.out>=D));
    if(lots.length){ const arr=new Date(Math.min.apply(null,lots.map(l=>l.arr)));
      st.groups.push({r,lots,arr,days:dDiff(D,arr),cbm:lots.reduce((a,l)=>a+l.cbm,0),kg:lots.reduce((a,l)=>a+l.kg,0),ctn:lots.reduce((a,l)=>a+l.ctn,0),
        outToday:!!(r.out&&dDiff(r.out,D)===0),out:r.out,cells:[]}); }
    else if(r.arr&&r.out&&r.out<D) st.gone.push({r,days:dDiff(r.out,r.arr)});
    else if((r.loaded&&r.loaded<=D&&(!r.arr||r.arr>D))||(!r.loaded&&r.arr&&r.arr>D)) st.coming.push({r});
  });
  st.groups.sort((a,b)=>a.arr-b.arr||(a.r.code<b.r.code?-1:1));
  st.gone.sort((a,b)=>a.r.out-b.r.out);
  st.groups.forEach(g=>g.lots.forEach(l=>{ l.days=dDiff(D,l.arr); l.g=g; l.cells=[]; st.here.push(l); }));
  /* средняя дорога Китай → Хоргос по последним рейсам — для прогноза прибытия */
  const tr=d.reys.filter(r=>r.loaded&&r.arr&&r.arr<=D).slice(-12).map(r=>dDiff(r.arr,r.loaded)).filter(x=>x>=0&&x<40);
  st.transit=tr.length?Math.round(tr.reduce((a,b)=>a+b,0)/tr.length):6;
  st.coming.forEach(c=>{ c.eta=c.r.arr||(c.r.loaded?new Date(c.r.loaded.getTime()+st.transit*DAY):null); c.plan=!c.r.arr; c.in=c.eta?dDiff(c.eta,D):null; });
  st.coming.sort((a,b)=>(a.eta||0)-(b.eta||0));

  /* --- расстановка: сначала грузы с ячейкой из таблицы, потом остальные — по рейсам в свободные ячейки --- */
  const cap=CFG.stacks*CFG.tiers, used={};
  const cellOf=id=>st.cells[id]||(st.cells[id]={id,c:cellById(id),racks:[],lots:[],m3:0,auto:false});
  const newRack=cs=>{ if(cs.racks.length>=cap) return null; const i=cs.racks.length, k=Math.floor(i/CFG.tiers), t=i%CFG.tiers, p=rackPos(cs.c,k,t);
    const rk={cell:cs.id,k,t,x:p.x,y:p.y,z:p.z,rot:p.rot,items:[],used:0,i:st.racks.length}; cs.racks.push(rk); st.racks.push(rk); return rk; };
  const full=cs=>cs.racks.length>=cap&&cs.racks[cs.racks.length-1].used>=CFG.rackM3-1e-6;
  const add=(cs,l,left)=>{ let rk=cs.racks[cs.racks.length-1]; if(!rk||rk.used>=CFG.rackM3-1e-6) rk=newRack(cs);
    const v=Math.min(left,CFG.rackM3-rk.used); rk.items.push({l,m3:v}); rk.used+=v; cs.m3+=v; used[cs.id]=1;
    if(!cs.lots.includes(l)) cs.lots.push(l); if(!l.cells.includes(cs.id)) l.cells.push(cs.id); return left-v; };
  const autoLots=[];
  const PM=placeMap();   /* места, заданные в системе управления складом, — если в таблице ячейки нет */
  st.here.forEach(l=>{ const ids=cellList(l.cell||(PM[lotKey(l)]||[]).join(',')); if(!ids.length){ autoLots.push(l); return; }
    /* несколько ячеек в таблице — груз делится между ними поровну (сколько в какой — таблица не говорит) */
    let left=Math.max(l.cbm,0.05);
    ids.forEach((id,i)=>{ const cs=cellOf(id); let part=left/(ids.length-i); while(part>1e-6&&!full(cs)){ const r=add(cs,l,part); left-=part-r; part=r; } });
    for(const id of ids){ const cs=cellOf(id); while(left>1e-6&&!full(cs)) left=add(cs,l,left); }
    if(left>0.05) st.warn.push('В ячейк'+(ids.length>1?'ах ':'е ')+ids.join(', ')+' записано больше, чем помещается: «'+l.mark+'» — не вошло '+fmtN(left)+' м³'); });
  if(autoLots.length){ st.auto=true; const free=CELL_ORDER.filter(id=>!used[id]);
    st.groups.forEach(g=>{ const ls=autoLots.filter(l=>l.g===g).sort((a,b)=>a.mark<b.mark?-1:a.mark>b.mark?1:b.cbm-a.cbm); if(!ls.length) return;
      /* одна ячейка — одна отправка: каждый рейс начинает с новой ячейки */
      let cs=null;
      ls.forEach(l=>{ let left=Math.max(l.cbm,0.05);
        while(left>1e-6){ if(!cs||full(cs)){ if(!free.length) break; cs=cellOf(free.shift()); cs.auto=true; } left=add(cs,l,left); }
        if(left>0.05) st.over.push({l,m3:left}); }); }); }
  st.groups.forEach(g=>{ const ids=[]; g.lots.forEach(l=>l.cells.forEach(id=>{ if(!ids.includes(id)) ids.push(id); })); g.cells=ids; });
  /* тяжёлые места: стойка рассчитана на 1000 кг, место тяжелее — под вилы на пол, не в стойку */
  st.here.forEach(l=>{ l.heavy=l.ctn>0&&l.kg/l.ctn>CFG.placeKg; });

  /* --- показатели --- */
  const K=st.k, sum=(a,f)=>a.reduce((x,y)=>x+f(y),0);
  K.reys=st.groups.length; K.lots=st.here.length; K.ctn=sum(st.here,l=>l.ctn); K.cbm=sum(st.here,l=>l.cbm); K.kg=sum(st.here,l=>l.kg);
  K.marks=new Set(st.here.map(l=>l.mark)).size;
  K.cells=Object.keys(st.cells).length; K.racks=st.racks.length; K.capRacks=CELLS.length*cap; K.capM3=K.capRacks*CFG.rackM3;
  K.maxDays=st.here.length?Math.max.apply(null,st.here.map(l=>l.days)):0;
  K.lateLots=st.here.filter(l=>l.days>CFG.norm); K.lateM3=sum(K.lateLots,l=>l.cbm);
  K.overM3=sum(st.over,o=>o.m3); K.heavy=st.here.filter(l=>l.heavy);
  const last=st.gone.slice(-10); K.avgDwell=last.length?sum(last,g=>g.days)/last.length:null; K.maxDwell=last.length?Math.max.apply(null,last.map(g=>g.days)):null;
  K.lateShare=last.length?last.filter(g=>g.days>CFG.norm).length/last.length:null;
  if(K.overM3>0.05) st.warn.unshift('Не поместилось в ячейки: '+fmtN(K.overM3)+' м³ — буфер из 30 ячеек (стойки в '+CFG.tiers+' яруса, '+CFG.stacks+' штабеля в ячейке) вмещает '+fmtN(K.capM3,0)+' м³');
  if(K.heavy.length) st.warn.push('Тяжёлые места (больше '+fmtN(CFG.placeKg,0)+' кг на одно место, не для стойки): '+K.heavy.slice(0,6).map(l=>l.mark).join(', ')+(K.heavy.length>6?' и ещё '+(K.heavy.length-6):''));
  const nd=d.reys.reduce((a,r)=>a+r.lots.filter(l=>!l.arr&&!r.loaded).length,0);
  if(nd) st.warn.push('Строк без даты прибытия: '+nd+' — в учёт простоя не попали');
  return st;
}
const dayColor=d=>d>CFG.norm?0xe5484d:(d>CFG.norm/2?0xf2b705:0x3fae5a);
const PAL=[0x4c9be8,0xf2b705,0x3fae5a,0xe5484d,0xb07ce8,0x2ec4b6,0xff8c42,0xd65db1,0x8ac926,0x5c7cfa,0xe07a5f,0x00a8cc];
const hashC=s=>{ let h=0; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))>>>0; return PAL[h%PAL.length]; };
const lotColor=l=>CFG.mode==='mark'?hashC(l.mark):(CFG.mode==='reys'?PAL[Math.max(0,ST.groups.indexOf(l.g))%PAL.length]:dayColor(l.days));
const hex=c=>'#'+('00000'+c.toString(16)).slice(-6);
