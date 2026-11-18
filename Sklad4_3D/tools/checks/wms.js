// Система управления складом (Buraq_WMS.html): данные, состояние на дату, размещение, все разделы, общий ключ мест с 3D-моделью.
// node tools/wms_ev.js Buraq_WMS.html tools/checks/wms.js      Норма: bad [] и нет PAGEERROR.
(async()=>{ const out={bad:[]}, ok=(c,m)=>{ if(!c) out.bad.push(m); };
  localStorage.clear(); WMS.S.today=new Date(2026,10,18);
  WMS.setData(WMS.demo(),{kind:'demo',url:''}); let st=WMS.ST;
  out.demo={trips:st.k.trips,lots:st.k.lots,cbm:Math.round(st.k.cbm),transit:st.trips.transit.length,gone:st.trips.gone.length,alerts:st.alerts.length,unplaced:st.unplaced.length,sug:Object.keys(st.sug).length};
  ok(st.k.trips===3&&st.trips.transit.length===1&&st.trips.gone.length===7,'demo: рейсы по статусам');
  ok(Math.abs(st.here.reduce((a,l)=>a+l.cbm,0)-st.k.cbm)<1e-6,'объём на складе');
  ok(st.here.every(l=>l.days>=0),'дни простоя ≥ 0');
  ok(Object.keys(st.sug).length===st.unplaced.length,'предложение для каждого груза без ячейки');
  /* все разделы рисуются без ошибок */
  for(const p of ['dash','plan','lots','trips','clients','stats','set']){ WMS.go(p); ok(document.querySelector('#main .page'),'раздел '+p); }
  /* принять предложение: всё размещено, ячейки не переполнены, ячейка — один рейс */
  WMS.go('plan'); WMS.autoPlace(); st=WMS.ST;
  ok(st.unplaced.length===0,'после размещения без ячейки: '+st.unplaced.length);
  const over=Object.values(st.cells).filter(c=>c.m3>WMS.CFG.stacks*WMS.CFG.tiers*WMS.CFG.rackM3+0.01).map(c=>c.c.id); ok(!over.length,'переполнены: '+over);
  const mix=Object.values(st.cells).filter(c=>new Set(c.lots.map(l=>l.reys)).size>1).map(c=>c.c.id); ok(!mix.length,'в ячейке два рейса: '+mix);
  /* FIFO: самый старый рейс ближе к посту погрузки (восточная секция) */
  const old=st.trips.here[0], cellsOld=[...new Set(old.hereLots.flatMap(l=>l.cells))]; ok(cellsOld.includes('A15'),'старый рейс у П2: '+cellsOld);
  /* места — в общем ключе, который читает 3D-модель */
  const pm=JSON.parse(localStorage.getItem('buraq.wms.place.v1')||'{}'); ok(Object.keys(pm).length===old.hereLots.length+st.trips.here.slice(1).reduce((a,t)=>a+t.hereLots.length,0),'места в localStorage');
  /* ручное перемещение и «убрать» */
  const l=st.here[0]; WMS.place(l,'B1'); st=WMS.ST; ok(l.cells.join()==='B1','ручное размещение');
  /* вставленная таблица: ячейка из таблицы не перекрывается местом из системы */
  WMS.setData(WMS.fromText('SHIPPING MARK\tCARGO NAME\tCBM\tKG\tCTN\tDATE OF ARRIVE\tЯЧЕЙКА\tДАТА ОТГРУЗКИ\nM1\tЛюстры\t5\t500\t10\t12.11.2026\tA3\t\nM2\tКабель\t3,5\t1 200\t1\t15.11.2026\t\t\nM3\tПосуда\t2\t100\t5\t01.11.2026\tA1\t10.11.2026'),{kind:'paste',url:''});
  st=WMS.ST; const L=m=>st.here.find(x=>x.mark===m);
  ok(st.here.length===2,'paste: на складе 2'); ok(L('M1').cells.join()==='A3'&&L('M1').cellsT,'M1 в A3 из таблицы'); ok(L('M1').days===6&&L('M2').days===3,'paste: дни');
  ok(st.k.heavy.length===1&&st.k.heavy[0].mark==='M2','тяжёлое место M2'); ok(st.trips.gone.length===1,'отгруженный рейс');
  /* склад на прошлую дату */
  WMS.setDate(new Date(2026,10,5)); ok(WMS.ST.here.length===1&&WMS.ST.here[0].mark==='M3','на 05.11 — только M3'); WMS.setDate(null);
  /* поиск экранирует текст */
  WMS.setData(WMS.fromText('SHIPPING MARK\tCBM\tDATE OF ARRIVE\n<img src=x onerror=window.__x=1>\t1\t17.11.2026'),{kind:'paste',url:''}); WMS.go('lots');
  ok(!document.querySelector('#main img')&&!window.__x,'текст из таблицы экранируется');
  localStorage.clear(); return out; })()
