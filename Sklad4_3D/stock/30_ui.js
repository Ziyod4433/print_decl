/* ---------------------------------------------------------------- панель «Учёт груза», плашка на сцене, загрузка данных */
const css=document.createElement('style'); css.textContent=`
  #stkq{left:14px;top:12px;display:flex;gap:5px;align-items:center;padding:5px 7px;z-index:11} #stkq button{padding:5px 9px;font-size:13px}
  #stkq .m{display:none} #app.stock #stkq .m{display:inline-block} #stkq i{font-style:normal;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 2px 0 6px;display:none} #app.stock #stkq i{display:inline}
  #stkhud{left:14px;top:58px;display:none;line-height:1.6;max-width:560px} #app.stock #stkhud{display:block} #stkhud b{color:var(--ink);font-weight:500} #stkhud u{text-decoration:none;color:var(--yellow);cursor:pointer;pointer-events:auto}
  #app.film #stkq,#app.film #stkhud{display:none!important}
  #app.stock #hover{white-space:pre-line;max-width:380px;line-height:1.45;text-align:left;font-size:12px}
  @media (max-width:640px){ #stkq button{padding:4px 6px;font-size:11px} #stkhud{max-width:92%;font-size:10.5px} }
  #stksec input[type=text],#stksec input[type=date],#stksec textarea{width:100%;box-sizing:border-box;background:var(--panel2);border:1px solid var(--line);color:var(--ink);font:inherit;font-size:12px;padding:6px 8px;border-radius:2px;margin-top:6px}
  #stksec textarea{height:88px;resize:vertical} #stksec input[type=date]{width:auto;margin:0}
  .stknote{font-size:10.5px;line-height:1.5;color:var(--muted);margin-top:7px} .stknote b{color:var(--ink);font-weight:500} .stkerr{color:#ff8a8a}
  .stkk{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:9px} .stkk div{background:var(--panel2);border:1px solid var(--line);padding:6px 7px;border-radius:2px}
  .stkk b{display:block;font-family:var(--disp);font-size:19px;font-weight:700;line-height:1.1} .stkk span{font-size:9.5px;color:var(--muted);letter-spacing:.04em} .stkk .bad b{color:#ff6b6b} .stkk .ok b{color:#5fd07a}
  .stkh{color:#9aa4ae;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;margin:13px 0 5px;border-top:1px dashed var(--line);padding-top:8px}
  .stkrow{display:grid;grid-template-columns:1fr auto;gap:1px 8px;padding:6px 7px;border:1px solid var(--line);border-radius:2px;margin-top:4px;cursor:pointer;font-size:11.5px;line-height:1.4}
  .stkrow:hover{border-color:#4a5562} .stkrow.on{border-color:#35e0ff;background:rgba(53,224,255,.07)} .stkrow b{font-weight:600} .stkrow small{color:var(--muted);font-size:10.5px;grid-column:span 2}
  .stkd{display:inline-block;min-width:38px;text-align:center;padding:1px 6px;border-radius:9px;font-size:10.5px;font-weight:600;color:#10151a}
  .stkset{display:grid;grid-template-columns:1fr auto;gap:6px 8px;align-items:center;font-size:11px;margin-top:9px;color:var(--muted)} .stkset input[type=range]{grid-column:span 2;width:100%;accent-color:#f5c518;margin:0}
  .stkset b{color:var(--ink);font-weight:500} #stkmode{display:flex;gap:4px;margin-top:8px} #stkmode button{flex:1;padding:6px 2px;font-size:12px}
  .stkbars{display:flex;align-items:flex-end;gap:2px;height:46px;margin-top:6px;border-bottom:1px solid var(--line)} .stkbars i{flex:1;min-width:3px;background:#3fae5a;display:block} .stkbars i.l{background:#e5484d} .stkbars i.m{background:#f2b705}
  table.stkt{width:100%;border-collapse:collapse;font-size:11.5px;margin-top:6px} .stkt td{padding:4px 5px;border-bottom:1px solid var(--line);vertical-align:top} .stkt td:last-child{text-align:right;color:#c3c9d0;white-space:nowrap}
  .stkn{font-size:10.5px;color:var(--muted);margin-top:7px;line-height:1.5}`;
document.head.appendChild(css);
const $=id=>document.getElementById(id), view=$('view'), app=$('app');
const sec=document.createElement('section'); sec.id='stksec';
sec.innerHTML=`<h2>Учёт груза <span>— что лежит, когда прибыло, сколько дней стоит</span></h2>
  <div class="grid2" id="stkbtn"></div><div id="stksrc"></div><div id="stkkpi"></div><div id="stkmode"></div><div class="stkset" id="stkset"></div>
  <div id="stkqueue"></div><div id="stklist"></div><div id="stkwarn"></div>`;
{ const sc=document.querySelector('#panel .scroll'); sc.insertBefore(sec,sc.firstChild); }
const hud=document.createElement('div'); hud.className='bar'; hud.id='stkhud'; view.appendChild(hud);
const qb=document.createElement('div'); qb.className='bar'; qb.id='stkq'; view.appendChild(qb);
const mkb=(par,t,fn,cls)=>{ const b=document.createElement('button'); b.textContent=t; if(cls) b.className=cls; b.onclick=()=>fn(b); par.appendChild(b); return b; };
const MODES=[['days','Простой'],['mark','Клиент'],['reys','Рейс']];
const qOn=mkb(qb,'📦 Учёт груза',()=>toggle()); { const i=document.createElement('i'); i.textContent='цвет'; qb.appendChild(i); }
const qM={}; MODES.forEach(([k,t])=>{ qM[k]=mkb(qb,t,()=>set({mode:k}),'m'); });
const bOn=mkb($('stkbtn'),'▶ Показать груз на складе',()=>toggle(),'wide'), bRe=mkb($('stkbtn'),'Обновить',()=>reload()), bDemo=mkb($('stkbtn'),'Демо-данные',()=>{ setData(demo(),{kind:'demo',url:'',id:'',gid:''}); if(!S.on) enter(); else refresh(); });
const pM={}; MODES.forEach(([k,t])=>{ pM[k]=mkb($('stkmode'),t==='Простой'?'Цвет: простой':t,()=>set({mode:k})); });
/* источник */
$('stksrc').innerHTML=`<div class="stknote" id="stkstat"></div>
  <input type="text" id="stkurl" placeholder="ссылка на таблицу Google (доступ: все, у кого есть ссылка — читатель)">
  <div class="grid2" style="margin-top:6px"><button id="stkgo">Подключить таблицу</button><button id="stkpaste">Вставить таблицу</button></div>
  <div id="stkpbox" style="display:none"><textarea id="stktxt" placeholder="Скопируйте строки из Google Sheets или Excel вместе с заголовками (SHIPPING MARK, CARGO NAME, CTN, CBM, KG, DATE OF ARRIVE, ЯЧЕЙКА…) и вставьте сюда"></textarea>
    <button id="stkload" class="wide" style="margin-top:6px;width:100%">Загрузить вставленное</button></div>
  <div class="stknote">Ссылка и загруженные данные хранятся только в этом браузере, в файл модели не записываются. Модель таблицу только читает.</div>`;
$('stkgo').onclick=()=>{ const u=$('stkurl').value.trim(); if(!parseUrl(u)){ S.err='это не ссылка на таблицу Google'; ui(); return; } S.src={kind:'url',url:u,id:parseUrl(u).id,gid:parseUrl(u).gid}; store(); reload().then(()=>{ if(!S.on&&S.data) enter(); }); };
$('stkpaste').onclick=()=>{ const b=$('stkpbox'); b.style.display=b.style.display==='none'?'block':'none'; };
$('stkload').onclick=()=>{ try{ setData(fromText($('stktxt').value),{kind:'paste',url:'',id:'',gid:''}); $('stkpbox').style.display='none'; if(!S.on) enter(); else refresh(); }catch(e){ S.err=e.message; ui(); } };
/* настройки */
$('stkset').innerHTML=`<span>Норма хранения, дней — дольше считается простоем</span><b id="stknv"></b><input type="range" id="stknorm" min="1" max="30" step="1">
  <span style="grid-column:span 2;margin-top:4px">Показать склад на дату: <input type="date" id="stkdate"> <button id="stktoday" style="padding:4px 8px;font-size:11px">Сегодня</button></span>`;
$('stknorm').oninput=e=>set({norm:+e.target.value});
$('stkdate').onchange=e=>{ const v=e.target.value; set({date:v?new Date(v+'T00:00:00'):null}); };
$('stktoday').onclick=()=>set({date:null});

function reload(silent){
  if(S.src.kind!=='url'||!S.src.url){ if(!silent){ S.err='сначала подключите таблицу: вставьте ссылку и нажмите «Подключить таблицу»'; ui(); } return Promise.resolve(false); }
  if(S.busy) return Promise.resolve(false);
  S.busy=true; ui();
  return loadUrl(S.src.url).then(d=>{ S.busy=false; setData(d,S.src); refresh(); return true; })
    .catch(e=>{ S.busy=false; S.err=e.message||String(e); ui(); return false; });
}
function refresh(){ compute(); if(S.on) render3d(); ui(); }
function set(o){
  if(o.mode) CFG.mode=o.mode; if(o.norm) CFG.norm=Math.max(1,Math.round(o.norm)); if('date' in o) S.date=o.date; if('q' in o) S.q=o.q||''; if('sel' in o) S.sel=o.sel;
  ['rackM3','stacks','tiers'].forEach(k=>{ if(o[k]) CFG[k]=o[k]; });
  store(); if(Object.keys(o).every(k=>k==='mode'||k==='q'||k==='sel')){ if(S.on) paint(); ui(); } else refresh();
}
function select(sel,fly){
  S.sel=sel&&S.sel&&S.sel.t===sel.t&&S.sel.v===sel.v?null:sel; if(S.on) paint(); ui();
  if(fly&&S.sel&&S.on&&ST){ const rs=ST.racks.filter(rk=>rk.items.some(it=>selHas(it.l))); if(rs.length){ const x=rs.reduce((a,r)=>a+r.x,0)/rs.length, z=rs.reduce((a,r)=>a+r.z,0)/rs.length;
    flyTo({t:[x,1.6,z],r:Math.max(13,Math.min(30,8+rs.length*0.9)),phi:Math.min(desired.phi,1.05),th:desired.th}); } }
}
function enter(){
  if(S.on) return;
  if(typeof FILM!=='undefined'&&FILM.on&&FILM.exit) FILM.exit();
  if(typeof SIM!=='undefined'&&SIM.on) SIM.exit();
  if(!S.data){ if(S.src.kind==='url'&&S.src.url) reload(true); else setData(demo(),{kind:'demo',url:'',id:'',gid:''}); }
  S.on=true; app.classList.add('stock'); show3d(true); refresh();
  if(S.src.kind==='url'&&Date.now()-S.at>CFG.refresh*1000) reload(true);
}
function exit(){ if(!S.on) return; S.on=false; app.classList.remove('stock'); show3d(false); ui(); }
function toggle(){ if(S.on) exit(); else { enter(); if(typeof tglSet==='function'&&app.classList.contains('max')&&innerWidth>900) tglSet(false,true); } }
setInterval(()=>{ if(S.on&&S.src.kind==='url'&&!S.busy&&!document.hidden&&!S.date) reload(true); },CFG.refresh*1000);

const selName=()=>{ const s=S.sel; if(!s) return ''; if(s.t!=='lot') return s.v; const l=ST&&ST.here.find(l=>l.id===s.v); return l?l.mark+(l.cargo?' · '+l.cargo:''):s.v; };
const chip=(d,txt)=>'<span class="stkd" style="background:'+hex(dayColor(d))+'">'+(txt||d+' дн.')+'</span>';
function ui(){
  const st=ST, K=st?st.k:null, on=S.on;
  qOn.classList.toggle('on',on); qOn.textContent=on?'■ Учёт груза':'📦 Учёт груза';
  bOn.classList.toggle('on',on); bOn.textContent=on?'■ Скрыть груз, вернуть обычный вид':'▶ Показать груз на складе';
  MODES.forEach(([k])=>{ qM[k].classList.toggle('on',CFG.mode===k); pM[k].classList.toggle('on',CFG.mode===k); });
  bRe.disabled=S.busy||S.src.kind!=='url'; bRe.style.opacity=bRe.disabled?0.45:1; bRe.textContent=S.busy?'Читаю…':'Обновить';
  if(document.activeElement!==$('stkurl')) $('stkurl').value=S.src.url||'';
  $('stknorm').value=CFG.norm; $('stknv').textContent=CFG.norm; $('stkdate').value=S.date?S.date.getFullYear()+'-'+pad(S.date.getMonth()+1)+'-'+pad(S.date.getDate()):'';
  const when=S.at?new Date(S.at):null, src=S.data?S.data.name:'нет данных';
  $('stkstat').innerHTML=(S.busy?'Читаю таблицу… ':'')+'Источник: <b>'+esc(src)+'</b>'+(when?' · прочитано '+fmtDs(when)+' '+pad(when.getHours())+':'+pad(when.getMinutes()):'')
    +(S.data&&S.data.kind==='demo'?' — это пример, не ваш груз':'')+(S.src.kind==='url'?' · обновляется каждые '+Math.round(CFG.refresh/60)+' мин':'')
    +(S.err?'<br><span class="stkerr">Не получилось: '+esc(S.err)+'</span>':'');
  if(!st||!S.data||!K||K.reys===undefined){ ['stkkpi','stkqueue','stklist','stkwarn'].forEach(id=>$(id).innerHTML=''); hud.innerHTML=''; return; }
  /* показатели */
  const fill=K.capM3?Math.round(100*K.racks/K.capRacks):0;
  $('stkkpi').innerHTML='<div class="stkk">'
    +'<div><b>'+K.reys+'</b><span>'+plural(K.reys,'рейс','рейса','рейсов')+' на складе</span></div>'
    +'<div><b>'+fmtN(K.cbm,0)+' м³</b><span>'+K.lots+' поз. · '+fmtN(K.ctn,0)+' мест</span></div>'
    +'<div><b>'+fmtN(K.kg/1000)+' т</b><span>'+K.marks+' '+plural(K.marks,'клиент','клиента','клиентов')+'</span></div>'
    +'<div class="'+(K.maxDays>CFG.norm?'bad':'ok')+'"><b>'+K.maxDays+' дн.</b><span>самый долгий простой</span></div>'
    +'<div class="'+(K.lateLots.length?'bad':'ok')+'"><b>'+fmtN(K.lateM3,0)+' м³</b><span>дольше нормы · '+K.lateLots.length+' поз.</span></div>'
    +'<div class="'+(fill>90?'bad':'')+'"><b>'+fill+' %</b><span>стоек занято · '+K.cells+' из '+CELLS.length+' ячеек</span></div></div>'
    +(K.avgDwell!=null?'<div class="stknote">Уехавшие рейсы (последние '+Math.min(10,st.gone.length)+'): в среднем стояли <b>'+fmtN(K.avgDwell)+' дн.</b>, дольше всего — <b>'+K.maxDwell+' дн.</b>'
      +(K.lateShare?'; дольше нормы — <b>'+Math.round(K.lateShare*100)+' %</b> рейсов':'')+'.</div>':'');
  /* очередь на отгрузку, в пути, история */
  let h='<div class="stkh">Очередь на отгрузку — первым уезжает самый старый (FIFO)</div>';
  if(!st.groups.length) h+='<div class="stknote">На эту дату склад пуст.</div>';
  st.groups.forEach((g,i)=>{ const sel=S.sel&&S.sel.t==='reys'&&S.sel.v===g.r.code;
    h+='<div class="stkrow'+(sel?' on':'')+'" data-reys="'+esc(g.r.code)+'"><span><b>'+(i+1)+'. '+esc(g.r.code)+'</b> · прибыл '+fmtDs(g.arr)+'</span>'+chip(g.days)
      +'<small>'+g.lots.length+' поз. · '+fmtN(g.cbm)+' м³ · '+fmtN(g.kg/1000)+' т · '+(g.r.out?(g.outToday?'<b style="color:#35e0ff">отгрузка сегодня</b>':'отгрузка '+fmtDs(g.r.out)):'дата отгрузки не назначена')
      +(g.r.kz?' · фура '+esc(g.r.kz):'')+(g.cells.length?' · ячейки '+esc(g.cells[0])+(g.cells.length>1?'…'+esc(g.cells[g.cells.length-1]):''):'')+'</small></div>'; });
  if(st.coming.length){ h+='<div class="stkh">В пути в Хоргос</div>';
    st.coming.slice(0,6).forEach(c=>{ h+='<div class="stkrow" style="cursor:default"><span><b>'+esc(c.r.code)+'</b>'+(c.r.loaded?' · выехал '+fmtDs(c.r.loaded):'')+'</span><span>'+(c.eta?(c.in<0?'ждали '+fmtDs(c.eta):c.in===0?'сегодня':'через '+c.in+' дн.'):'—')+'</span>'
      +'<small>'+(c.r.lots.length?c.r.lots.length+' поз. · '+fmtN(c.r.cbm)+' м³ · '+fmtN(c.r.kg/1000)+' т · ':'')+(c.eta?'ожидается '+fmtDs(c.eta)+(c.plan?' — по средней дороге '+st.transit+' дн.':''):'')+'</small></div>'; }); }
  if(st.gone.length){ const gs=st.gone.slice(-24), mx=Math.max(CFG.norm,Math.max.apply(null,gs.map(g=>g.days)));
    h+='<div class="stkh">Сколько дней стояли уехавшие рейсы</div><div class="stkbars">'+gs.map(g=>'<i class="'+(g.days>CFG.norm?'l':g.days>CFG.norm/2?'m':'')+'" style="height:'+Math.max(4,Math.round(100*g.days/mx))+'%" title="'+esc(g.r.code)+': '+daysTxt(g.days)+' ('+fmtDs(g.r.arr)+'–'+fmtDs(g.r.out)+')"></i>').join('')+'</div>'
      +'<div class="stknote">Слева старые, справа последние. Красные — дольше нормы.</div>'; }
  $('stkqueue').innerHTML=h;
  $('stkqueue').querySelectorAll('[data-reys]').forEach(e=>e.onclick=()=>select({t:'reys',v:e.dataset.reys},true));
  /* список грузов */
  const qv=S.q, lots=st.here.filter(qHas).sort((a,b)=>b.days-a.days||b.cbm-a.cbm);
  let hl='<div class="stkh">Грузы на складе — '+lots.length+(qv?' из '+st.here.length:'')+'</div><input type="text" id="stkq2" placeholder="поиск: клиент, груз, рейс, ячейка" value="'+esc(qv)+'">';
  lots.slice(0,250).forEach(l=>{ const sel=S.sel&&S.sel.t==='lot'&&S.sel.v===l.id;
    hl+='<div class="stkrow'+(sel?' on':'')+'" data-lot="'+esc(l.id)+'"><span><b>'+esc(l.mark)+'</b>'+(l.cargo?' · '+esc(l.cargo):'')+'</span>'+chip(l.days)
      +'<small>прибыл '+fmtD(l.arr)+' · '+fmtN(l.ctn,0)+' мест · '+fmtN(l.cbm)+' м³ · '+fmtN(l.kg,0)+' кг'+(l.pack?' · '+esc(l.pack):'')+(l.heavy?' · <b style="color:#ff8a8a">тяжёлые места</b>':'')
      +'<br>рейс '+esc(l.reys)+(l.dest?' → '+esc(l.dest):'')+' · '+(l.cells.length?'ячейк'+(l.cells.length>1?'и ':'а ')+esc(l.cells.join(', ')):'<span class="stkerr">не поместился</span>')+'</small></div>'; });
  if(lots.length>250) hl+='<div class="stknote">Показаны первые 250 — уточните поиск.</div>';
  const had=document.activeElement&&document.activeElement.id==='stkq2', pos=had?document.activeElement.selectionStart:0;
  $('stklist').innerHTML=hl;
  const q2=$('stkq2'); q2.oninput=e=>set({q:e.target.value}); if(had){ q2.focus(); try{ q2.setSelectionRange(pos,pos); }catch(e){} }
  $('stklist').querySelectorAll('[data-lot]').forEach(e=>e.onclick=()=>select({t:'lot',v:e.dataset.lot},true));
  $('stkwarn').innerHTML=(st.warn.length?'<div class="warn" style="margin-top:10px">'+st.warn.map(esc).join('<br>')+'</div>':'')
    +(st.auto?'<div class="stknote"><b>Ячейки условные.</b> В таблице нет адресов, поэтому модель расставила рейсы сама: самый старый — у поста погрузки, каждый рейс в своих ячейках. Простой, даты, объёмы и клиенты — настоящие. Чтобы видеть настоящие места, нужен столбец «ЯЧЕЙКА» (A1…B15).</div>':'')
    +'<div class="stknote">Одна стойка — до '+fmtN(CFG.rackM3)+' м³, в ячейке '+CFG.stacks+' штабеля по '+CFG.tiers+' яруса: всего '+fmtN(K.capM3,0)+' м³ на 30 ячеек.</div>';
  /* строка на сцене */
  hud.innerHTML=(S.date?'На '+fmtD(st.D)+': ':'Сейчас на складе: ')+'<b>'+K.reys+' '+plural(K.reys,'рейс','рейса','рейсов')+'</b> · '+K.lots+' поз. · <b>'+fmtN(K.cbm,0)+' м³</b> · '+fmtN(K.kg/1000)+' т'
    +' · дольше нормы ('+CFG.norm+' дн.): <b style="color:'+(K.lateLots.length?'#ff6b6b':'#5fd07a')+'">'+(K.lateLots.length?fmtN(K.lateM3,0)+' м³':'нет')+'</b>'
    +'<br>'+esc(src)+(S.data.kind==='demo'?' (пример)':'')+(st.auto?' · ячейки условные':'')+(S.sel?' · выбрано: <b>'+esc(selName())+'</b> <u id="stkx">× снять</u>':'')+(S.err?' · <span class="stkerr">таблица не прочиталась</span>':'');
  const x=$('stkx'); if(x) x.onclick=()=>select(null);
}
/* клик по стойке в 3D: выделить груз, которого в ней больше всего */
function pick(o){ const rk=o&&o.userData.stk; if(!rk) return; const it=rk.items.reduce((a,b)=>b.m3>a.m3?b:a,rk.items[0]); S.sel={t:'lot',v:it.l.id}; paint(); ui();
  const e=document.querySelector('#stklist .stkrow.on'); if(e&&e.scrollIntoView) e.scrollIntoView({block:'nearest'}); }

/* места, заданные в системе управления складом (Buraq_WMS.html) в этом же браузере, — сразу в 3D */
addEventListener('storage',e=>{ if(e.key===PLACE_KEY&&S.on) refresh(); });
restore(); compute(); ui();
return {S,CFG,BL,enter,exit,toggle,reload,refresh,set,select,pick,hit,demo,loadText:t=>{ setData(fromText(t),{kind:'paste',url:'',id:'',gid:''}); refresh(); },
  loadDemo:()=>{ setData(demo(),{kind:'demo',url:'',id:'',gid:''}); refresh(); },loadUrl:u=>{ S.src={kind:'url',url:u,id:(parseUrl(u)||{}).id||'',gid:(parseUrl(u)||{}).gid||''}; return reload(); },
  get on(){ return S.on; },get st(){ return ST; },get view(){ return V; },_:{num,date,fromText,cellList,parseUrl,compute}};
})();
