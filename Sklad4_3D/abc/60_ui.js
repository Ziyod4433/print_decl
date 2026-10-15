/* ---------------------------------------------------------------- панель: вариант, каталог F01–F20, симуляция, показатели, сравнение */
const UIX=(()=>{
  const css=document.createElement('style'); css.textContent=`
  #abcv{grid-template-columns:repeat(4,1fr)} #abcv button{padding:7px 4px;font-size:13px}
  .abct{font-family:var(--disp);font-size:17px;font-weight:700;text-transform:uppercase;line-height:1.1;margin:10px 0 3px}
  .abcs{color:var(--yellow);font-size:10.5px;letter-spacing:.06em;margin-bottom:7px}
  .abcp{font-size:11.5px;line-height:1.5;color:#c3c9d0;margin:5px 0} .abcp b{color:#9aa4ae;font-weight:500;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;display:block;margin-bottom:1px}
  .abccap{display:grid;grid-template-columns:1fr auto;gap:2px 10px;font-size:11.5px;margin:8px 0;padding:8px 9px;background:var(--panel2);border:1px solid var(--line);border-radius:2px}
  .abccap span{color:var(--muted)} .abccap b{font-weight:500;text-align:right}
  #abcspd{display:flex;gap:4px;margin-top:6px} #abcspd button{flex:1;padding:6px 2px;font-size:12px}
  .abcsl{display:grid;grid-template-columns:1fr 52px;gap:2px 8px;align-items:center;font-size:11px;margin-top:8px}
  .abcsl label{color:var(--muted)} .abcsl b{font-weight:500;text-align:right;color:var(--ink)} .abcsl input{grid-column:span 2;width:100%;accent-color:#f5c518;margin:0 0 3px}
  .abck{display:grid;grid-template-columns:1fr auto;gap:3px 10px;font-size:11.5px;margin-top:9px} .abck span{color:var(--muted)} .abck b{font-weight:500;text-align:right}
  .abch{grid-column:span 2;color:#9aa4ae;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;margin-top:7px;border-top:1px dashed var(--line);padding-top:6px}
  .abcbar{grid-column:span 2;display:grid;grid-template-columns:112px 1fr 38px;gap:6px;align-items:center;font-size:10.5px;color:var(--muted)}
  .abcbar i{display:block;height:7px;background:#29303a;border-radius:1px;overflow:hidden} .abcbar i em{display:block;height:100%;background:#f5c518}
  .abcbar b{color:var(--ink);font-weight:500;text-align:right}
  table.abccmp{width:100%;border-collapse:collapse;font-size:10.5px;margin-top:8px} .abccmp td,.abccmp th{padding:3px 4px;border-bottom:1px solid var(--line);text-align:right}
  .abccmp th{color:var(--yellow);font-family:var(--disp);font-size:13px;font-weight:700} .abccmp td:first-child,.abccmp th:first-child{text-align:left;color:var(--muted);font-weight:400}
  .abcnote{font-size:10.5px;line-height:1.5;color:var(--muted);margin-top:8px}
  #abchud{left:14px;top:58px;display:none;line-height:1.6;max-width:430px} #abchud b{color:var(--ink);font-weight:500} #abchud.on{display:block}
  #abcq{left:14px;top:12px;display:flex;gap:5px;align-items:center;padding:5px 7px;z-index:11} #abcq span{font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-right:3px}
  #abcq button{padding:5px 9px;font-size:13px} #app.film #abcq{display:none!important}
  @media (max-width:640px){ #abcq span{display:none} #abcq button{padding:4px 6px;font-size:11px} }
  #libitems .abclh{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--yellow);margin:10px 0 2px}
  #app.film #abchud{display:none!important}`;
  document.head.appendChild(css);
  const scroll=document.querySelector('#panel .scroll'), sec=document.createElement('section'), sim=document.createElement('section');
  sec.id='abcsec'; sim.id='abcsimsec';
  sec.innerHTML=`<h2>Варианты хранения <span>— Buraq 2026, концепция стр. 3–7</span></h2><div class="grid2" id="abcv"></div><div id="abcinfo"></div><div class="grid2" id="abcact"></div>`;
  sim.innerHTML=`<h2>Симуляция потока паллет <span>— техника варианта по заданиям</span></h2><div class="grid2" id="abcrun"></div><div id="abcspd"></div><div class="abcsl" id="abcsl"></div><div id="abckpi"></div><div id="abccmp"></div>`;
  scroll.insertBefore(sim,scroll.firstChild); scroll.insertBefore(sec,sim);
  const hud=document.createElement('div'); hud.className='bar'; hud.id='abchud'; document.getElementById('view').appendChild(hud);
  const qb=document.createElement('div'); qb.className='bar'; qb.id='abcq'; qb.innerHTML='<span>Вариант</span>'; document.getElementById('view').appendChild(qb);   /* всегда на сцене: панель по умолчанию свёрнута */
  const QB={};

  const $=id=>document.getElementById(id);
  const VB={}; [['cur','Текущая'],['A','A · стеллажи'],['B','B · шаттлы'],['C','C · AS/RS']].forEach(([v,t])=>{ const b=document.createElement('button'); b.textContent=t; b.title=v==='cur'?'Нынешняя планировка: стоечные поддоны, фильм и живой процесс':VAR[v].n; b.onclick=()=>{ setVariant(v); flyZone(v); }; $('abcv').appendChild(b); VB[v]=b; });
  const act=(t,fn,wide)=>{ const b=document.createElement('button'); b.textContent=t; if(wide) b.className='wide'; b.onclick=()=>fn(b); $('abcact').appendChild(b); return b; };
  const flyZone=v=>{ if(v==='cur') return; flyTo({t:[24,1.5,22],r:44,phi:0.92,th:-0.62}); };
  [['cur','Текущая'],['A','A'],['B','B'],['C','C']].forEach(([v,t])=>{ const b=document.createElement('button'); b.textContent=t; b.title=v==='cur'?'Нынешняя планировка: стоечные поддоны, фильм и живой процесс':VAR[v].n; b.onclick=()=>{ setVariant(v); flyZone(v); }; qb.appendChild(b); QB[v]=b; });
  const qRun=document.createElement('button'); qRun.textContent='▶ Симуляция'; qb.appendChild(qRun);
  act('Вид на зону',()=>flyTo({t:[24,1.5,22],r:44,phi:0.92,th:-0.62}));
  act('План сверху',()=>flyTo({t:[24,0,19],r:58,phi:0.08,th:0}));
  const bReset=act('Вернуть исходную расстановку варианта',()=>{ if(VCUR==='cur') return; if(confirm('Вернуть вариант '+VCUR+' к исходной расстановке? Правка этого варианта будет удалена.')) resetVariant(VCUR); },true);
  /* запуск */
  const run=(t,fn,wide)=>{ const b=document.createElement('button'); b.textContent=t; if(wide) b.className='wide'; b.onclick=()=>fn(b); $('abcrun').appendChild(b); return b; };
  const bRun=run('▶ Запустить',()=>{ if(SIMX.on){ SIMX.stop(); return; } if(VCUR==='cur'){ setVariant('A'); flyZone('A'); } SIMX.start(VCUR); });
  const bFast=run('⏩ Прогон 4 ч',()=>{ if(VCUR==='cur') setVariant('A'); if(!SIMX.on) SIMX.start(VCUR); SIMX.fast(SIMX.P.hours,()=>{ sync(); }); });
  const bCmp=run('Сравнить A · B · C (по 3 ч счёта)',()=>compare(),true);
  qRun.onclick=()=>bRun.onclick();
  [1,5,20,60,120].forEach(x=>{ const b=document.createElement('button'); b.textContent='×'+x; b.dataset.x=x; b.onclick=()=>{ SIMX.setSpeed(x); sync(); }; $('abcspd').appendChild(b); });
  const SL=[['inRate','Приход, паллет/ч',10,60,1,v=>v],['outRate','Отбор, паллет/ч',10,60,1,v=>v],['batch','Паллет одного SKU в партии (сред.)',1,15,1,v=>v],
    ['skus','Число SKU',10,200,5,v=>v],['fill0','Начальное заполнение',0.1,0.85,0.05,v=>Math.round(v*100)+' %'],['wrapT','Обмотка паллеты, с',0,150,5,v=>v],['rej','Брак на входном контроле C',0,0.1,0.01,v=>Math.round(v*100)+' %']];
  SL.forEach(([k,t,a,b,st,f])=>{ const l=document.createElement('label'); l.textContent=t; const o=document.createElement('b'); o.textContent=f(SIMX.P[k]);
    const i=document.createElement('input'); i.type='range'; i.min=a; i.max=b; i.step=st; i.value=SIMX.P[k];
    i.oninput=()=>{ SIMX.P[k]=+i.value; o.textContent=f(+i.value); try{ const s=ST(); s.P=Object.assign({},SIMX.P); edSave(); }catch(e){} };
    $('abcsl').append(l,o,i); });
  { const s=ST(); if(s.P) Object.assign(SIMX.P,s.P); $('abcsl').querySelectorAll('input').forEach((i,n)=>{ const k=SL[n][0]; i.value=SIMX.P[k]; i.previousSibling.textContent=SL[n][5](SIMX.P[k]); }); }
  /* каталог F01–F20 в библиотеке (кнопки обычной библиотеки строятся до этого модуля) */
  { const L=document.getElementById('libitems'), h=document.createElement('div'); h.className='abclh'; h.textContent='Каталог оборудования Buraq 2026 · F01–F20'; L.appendChild(h);
    Object.keys(KAT).forEach(k=>{ const b=document.createElement('button'); b.innerHTML=LIB[k].n+'<span>'+LIB[k].s+'</span>'; b.onclick=()=>libAdd(k); L.appendChild(b); }); }
  /* ---------- вместимость и расчёт по методике стр. 7 ---------- */
  function capOfV(){ const c={F01:0,F02:0,F03:0,F06:0,F07:0}; spawned.forEach(g=>{ const k=g.userData.libKind; if(k in c) c[k]+=capOf(g); }); return c; }
  const fmt=n=>Math.round(n).toLocaleString('ru-RU'), mmss=s=>{ s=Math.max(0,Math.round(s)); const m=(s/60)|0; return m+':'+String(s%60).padStart(2,'0'); }, hms=s=>{ s=Math.round(s); return String((s/3600)|0).padStart(2,'0')+':'+String(((s%3600)/60)|0).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };
  function calc7(v,c,res){ const P=SIMX.P, N=c.F01+c.F02+c.F03+c.F06+c.F07, use=v==='B'?c.F02*0.75+c.F01*0.85+c.F06*0.85+c.F07*0.75:N*0.85;
    const cyc=res&&res.cyc?((res.cyc.put||0)+(res.cyc.ret||0))/((res.cyc.put?1:0)+(res.cyc.ret?1:0)||1)/60:3, flow=P.inRate+P.outRate;
    const perM=cyc>0?60/cyc*0.75:15, nM=Math.ceil(flow/perM);
    const tr=P.inRate/Math.max(6,Math.min(36,Math.round(P.inRate)))+P.outRate/(v==='B'?36:42), posts=Math.ceil(tr*1/0.75-1e-9);
    return {N,use,cyc,perM,nM,inB:P.inRate*1.5,outB:P.outRate*1,tr,posts}; }
  function info(){ const v=VCUR, el=$('abcinfo');
    if(v==='cur'){ el.innerHTML=`<div class="abct">Текущая планировка</div><div class="abcs">стоечные поддоны · буфер 30 ячеек · фильм и живой процесс</div>
      <div class="abcp">Выберите A, B или C — зона хранения (z 16,8…30,65 м, весь пролёт 0,55…47,5 м), приёмка у Л2 и экспедиция перестроятся по концепции. Колонны, стены, ворота, кровля, охрана, DWS и пост П2 — как в SketchUp. Высота стеллажей — по кровле (верх груза ≤ кровля − 2,1 м).</div>`; return; }
    const V=VAR[v], c=capOfV(), N=c.F01+c.F02+c.F03+c.F06+c.F07, K=calc7(v,c,(ST().res||{})[v]);
    const parts=[c.F01&&('F01 '+fmt(c.F01)),c.F02&&('F02 '+fmt(c.F02)),c.F03&&('F03 '+fmt(c.F03)),c.F06&&('F06 '+fmt(c.F06)),c.F07&&('F07 '+fmt(c.F07))].filter(Boolean).join(' · ');
    el.innerHTML=`<div class="abct">${V.n}</div><div class="abcs">${V.s}</div>
      <div class="abccap"><span>Мест хранения (геометрически)</span><b>${fmt(N)}</b><span>${parts||'—'}</span><b></b>
        <span>Вмещает при ${v==='B'?'75 % в каналах и 85 % в зоне A':'заполнении 85 %'}</span><b>${fmt(K.use)}</b>
        <span>Пример стр. 7: 3 600 паллет → нужно мест</span><b>${v==='B'?'4 800':'4 236'}</b></div>
      <div class="abcp"><b>Когда подходит</b>${V.when}</div><div class="abcp"><b>Компромисс</b>${V.trade}</div><div class="abcp"><b>Условие выбора</b>${V.cond}</div>
      <div class="abcnote">Правка варианта — своя: редактор двигает, копирует и убирает стеллажи и технику, каталог F01–F20 добавляет новое. Изменения сохраняются в браузере и в файл (автосохранение).</div>`; }
  /* ---------- показатели ---------- */
  const TK={unl:'выгрузка',put:'размещение',ret:'отбор',feed:'подача на вход',wrap:'на обмотку',load:'погрузка',shx:'перенос шаттла',rej:'брак → карантин'};
  function kpi(){ const el=$('abckpi'); if(!SIMX.on){ el.innerHTML=''; hud.classList.remove('on'); return; }
    const r=SIMX.summary(); if(!r) return; const S=SIMX.S, P=SIMX.P;
    const cy=Object.keys(r.cyc).filter(k=>TK[k]).map(k=>`<span>Цикл: ${TK[k]}</span><b>${mmss(r.cyc[k])}</b>`).join('');
    const bars=r.ag.map(a=>`<div class="abcbar">${a.n}<i><em style="width:${Math.round(a.u*100)}%"></em></i><b>${Math.round(a.u*100)} %</b></div>`).join('')+
      r.cr.map(a=>`<div class="abcbar">${a.n}<i><em style="width:${Math.round(a.u*100)}%"></em></i><b>${Math.round(a.u*100)} %</b></div>`).join('')+
      (r.sh.length?`<div class="abcbar">Шаттлы (${r.sh.length}) ср.<i><em style="width:${Math.round(r.sh.reduce((s,a)=>s+a.u,0)/r.sh.length*100)}%"></em></i><b>${Math.round(r.sh.reduce((s,a)=>s+a.u,0)/r.sh.length*100)} %</b></div>`:'');
    const dock={docked:'у ворот, выгрузка',leave:'отъезжает',away:'нет машины',arrive:'подъезжает'}[r.trucks.dock]||r.trucks.dock;
    const out={docked:'загрузка',close:'оформление',leave:'отъезжает',gap:'ждём следующую',arrive:'подъезжает'}[r.trucks.out]||r.trucks.out;
    el.innerHTML=`<div class="abck">
      <span>Время счёта</span><b>${hms(r.T)} · ${S.fast?'прогон':'×'+S.speed}</b>
      <span>Размещено / отобрано</span><b>${r.put} / ${r.ret}</b>
      <span>Заданий хранения в час (цель ${P.inRate+P.outRate})</span><b>${r.tph.toFixed(1)}</b>
      ${cy}
      <span>Док → ячейка (среднее)</span><b>${mmss(r.d2s)}</b>
      <span>Заказ → кузов (среднее)</span><b>${r.lead?mmss(r.lead):'—'}</b>
      <div class="abch">Машины и буферы</div>
      <span>Приход ${VCUR==='B'?'Л2':'Л2'}: ${dock}</span><b>осталось ${r.trucks.inLeft} · очередь ${r.trucks.q}</b>
      <span>Отгрузка ${VCUR==='B'?'Л1':'П2'}: ${out}</span><b>${r.trucks.outN}/${r.trucks.outCap}</b>
      <span>Машин разгружено / отправлено</span><b>${r.trIn} / ${r.trOut}</b>
      <span>Буфер входа: ср. / макс. / мест</span><b>${r.bufIn[0].toFixed(1)} / ${r.bufIn[1]} / ${r.bufIn[2]}</b>
      <span>Буфер выхода: ср. / макс.</span><b>${r.bufOut[0].toFixed(1)} / ${r.bufOut[1]}</b>
      <span>Заказы в очереди: сейчас / макс.</span><b>${r.orders} / ${r.backlog[1]}</b>
      <span>Заполнение хранения</span><b>${fmt(r.used)} из ${fmt(r.cap)}</b>
      ${r.lanes?`<span>Каналов занято SKU</span><b>${r.lanesUsed} из ${r.lanes}</b><span>Использование мест в занятых каналах</span><b>${r.lanePos?Math.round(r.used/Math.max(1,r.lanePos+0)*100):0} %</b><span>Переносов шаттла</span><b>${r.shx}</b>`:''}
      ${r.cr.length?`<span>Перестановок (двойная глубина)</span><b>${r.reloc}</b><span>Паллет на конвейере (ср.)</span><b>${r.conv.toFixed(1)}</b><span>Брак на входе</span><b>${r.rej}</b>`:''}
      <span>Ожидание друг друга, всего</span><b>${mmss(r.blockS)}</b>
      <span>Вынужденных разъездов впритирку</span><b>${r.ghost||0}</b>
      <div class="abch">Загрузка техники</div>${bars}</div>
      ${r.log.length?`<div class="abcnote">${r.log.join('<br>')}</div>`:''}`;
    hud.classList.add('on');
    hud.innerHTML=`<b>${VAR[VCUR].n}</b> · ${hms(r.T)} · ${S.fast?'прогон':'×'+S.speed}<br>размещено <b>${r.put}</b> · отобрано <b>${r.ret}</b> · <b>${r.tph.toFixed(0)}</b> зад/ч · кузов ${r.trucks.outN}/${r.trucks.outCap}`; }
  function cmp(){ const el=$('abccmp'), R=ST().res||{};
    const rows=[['Мест хранения',v=>fmt(cap0(v))],['Вмещает (85 % / B: 75 %)',v=>fmt(calc7(v,capRec(v),R[v]).use)],
      ['Заданий в час',v=>R[v]?R[v].tph.toFixed(1):'—'],['Цикл размещения',v=>R[v]&&R[v].cyc.put?mmss(R[v].cyc.put):'—'],['Цикл отбора',v=>R[v]&&R[v].cyc.ret?mmss(R[v].cyc.ret):'—'],
      ['Док → ячейка',v=>R[v]?mmss(R[v].d2s):'—'],['Заказ → кузов',v=>R[v]&&R[v].lead?mmss(R[v].lead):'—'],
      ['Загрузка техники, ср.',v=>R[v]&&R[v].ag.length?Math.round(R[v].ag.filter(a=>a.u>0.01).reduce((s,a)=>s+a.u,0)/Math.max(1,R[v].ag.filter(a=>a.u>0.01).length)*100)+' %':'—'],
      ['Кранов / шаттлов загружено',v=>R[v]?(R[v].cr.length?Math.round(R[v].cr.reduce((s,a)=>s+a.u,0)/R[v].cr.length*100)+' %':R[v].sh.length?Math.round(R[v].sh.reduce((s,a)=>s+a.u,0)/R[v].sh.length*100)+' %':'—'):'—'],
      ['Переносы шаттла / перестановки',v=>R[v]?(v==='B'?R[v].shx:v==='C'?R[v].reloc:'—'):'—'],
      ['Очередь заказов, макс.',v=>R[v]?R[v].backlog[1]:'—'],['Разъездов впритирку',v=>R[v]?(R[v].ghost||0):'—'],['Буфер входа, макс.',v=>R[v]?R[v].bufIn[1]+' из '+R[v].bufIn[2]:'—'],
      ['Техники нужно по стр. 7',v=>{ const K=calc7(v,capRec(v),R[v]); return v==='C'?'краны':K.nM+' ('+K.perM.toFixed(0)+'/ч)'; }],
      ['Счёт, ч',v=>R[v]?(R[v].T/3600).toFixed(1):'—']];
    el.innerHTML=`<table class="abccmp"><tr><th></th><th>A</th><th>B</th><th>C</th></tr>${rows.map(([t,f])=>`<tr><td>${t}</td><td>${f('A')}</td><td>${f('B')}</td><td>${f('C')}</td></tr>`).join('')}</table>
      <div class="abcnote">Расчёт по методике стр. 7: вместимость = места × 85 % (B — 75 % в каналах: неполные каналы); техника = поток ${SIMX.P.inRate+SIMX.P.outRate} зад/ч ÷ (60 / цикл × 0,75); буферы — вход ${SIMX.P.inRate} × 1,5 ч = ${fmt(SIMX.P.inRate*1.5)} мест, выход ${SIMX.P.outRate} × 1 ч = ${fmt(SIMX.P.outRate)}; посты — машин в час × 1 ч ÷ 0,75 = ${calc7('A',capRec('A'),null).posts} (у нас Л1, Л2, П2). Цикл — из симуляции этого варианта (без неё — 3 мин). Числа потоков — условные, как в концепции.</div>`; }
  const capCache={};
  function capRec(v){ if(v===VCUR&&v!=='cur'){ capCache[v]=capOfV(); } if(capCache[v]) return capCache[v];
    const c={F01:0,F02:0,F03:0,F06:0,F07:0}; (ST()[v]||GEN[v]().recs).forEach(r=>{ const o=Object.assign({},LIB[r.k]&&LIB[r.k].d,r.o);
      if(r.k==='F01') c.F01+=Math.round(o.n)*3*Math.round(o.lev)*(o.dbl>0.5?2:1);
      if(r.k==='F02') c.F02+=Math.round(o.nc)*Math.round(o.nd)*Math.round(o.lev);
      if(r.k==='F03') c.F03+=Math.round(o.nb)*3*Math.round(o.lev)*2*(o.dd>1.5?2:1); }); capCache[v]=c; return c; }
  const cap0=v=>{ const c=capRec(v); return c.F01+c.F02+c.F03+c.F06+c.F07; };
  /* сравнение: по очереди A, B, C — прогон 3 ч с одинаковыми исходными данными */
  function compare(){ const order=['A','B','C']; let i=0; const H=3;
    const next=()=>{ if(i>=order.length){ sync(); return; } const v=order[i++]; setVariant(v); SIMX.start(v,{seed:7,fast:true,until:H*3600,onDone:()=>{ SIMX.stop(); setTimeout(next,50); }}); sync(); };
    next(); }
  function sync(){ Object.keys(VB).forEach(v=>{ VB[v].classList.toggle('on',VCUR===v); QB[v].classList.toggle('on',VCUR===v); }); qRun.textContent=SIMX.on?'■ Стоп':'▶ Симуляция'; qRun.classList.toggle('on',SIMX.on); bReset.disabled=VCUR==='cur'; bReset.style.opacity=VCUR==='cur'?0.45:1;
    bRun.textContent=SIMX.on?'■ Остановить':'▶ Запустить'; bRun.classList.toggle('on',SIMX.on);
    $('abcspd').querySelectorAll('button').forEach(b=>b.classList.toggle('on',SIMX.on&&!SIMX.S.fast&&+b.dataset.x===SIMX.S.speed));
    info(); kpi(); cmp(); }
  setInterval(()=>{ if(SIMX.on) kpi(); },500);
  /* фильм, живой процесс и редактор при выбранном варианте */
  { const fb=[...document.querySelectorAll('#scenebtns button')].find(b=>b.textContent.indexOf('Фильм')>=0); if(fb){ const f=fb.onclick; fb.onclick=e=>{ if(VCUR!=='cur') setVariant('cur'); f(e); }; } }
  if(typeof SIM!=='undefined'){ const se=SIM.enter; SIM.enter=function(){ if(VCUR!=='cur'){ if(!SIMX.on) SIMX.start(VCUR); return; } return se.apply(this,arguments); }; }
  { const esm=edSetMode; edSetMode=function(on){ if(on&&SIMX.on) SIMX.stop(); esm(on); }; }
  return {sync,compare,kpi};
})();
