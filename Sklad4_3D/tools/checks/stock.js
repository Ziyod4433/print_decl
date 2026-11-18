// Учёт груза (STOCK): разбор таблицы, расстановка по ячейкам, 3D, наведение, выход — без сети (демо и вставленная таблица).
// node tools/ev.js Sklad4_realistic_film.html tools/checks/stock.js
// Норма: bad [] ; demo.racks > 0 и demo.boxes > 0; paste.cells — как в таблице (A3, B7…B8), paste.days [6,1,10];
// grow.colorsOk true (цвета всех коробов заданы и после роста склада); exit.same true (обычный вид вернулся как был).
(()=>{ const out={bad:[]}, ok=(c,m)=>{ if(!c) out.bad.push(m); };
 try{ localStorage.removeItem('sklad4.stock.v1'); }catch(e){}
 const _=STOCK._; STOCK.S.today=new Date(2026,10,18);
 /* разбор чисел и дат */
 ok(_.num('2 582,00')===2582,'num nbsp'); ok(_.num('1.472,5')===1472.5,'num 1.472,5'); ok(_.num('8,30')===8.3,'num 8,30'); ok(_.num(12)===12,'num 12');
 const d=v=>{ const x=_.date(v); return x?x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate():null; };
 ok(d('30.10.2026')==='2026-10-30','date dd.mm.yyyy'); ok(d('Date(2026,9,30)')==='2026-10-30','date gviz'); ok(d('10-нояб.')==='2026-11-10','date 10-нояб.');
 ok(d('2026-11-05')==='2026-11-5','date iso'); ok(d('')===null&&d('abc')===null,'date empty');
 ok(JSON.stringify(_.cellList('a6, B7-B9; А1'))==='["A6","B7","B8","B9","A1"]','cellList '+JSON.stringify(_.cellList('a6, B7-B9; А1')));
 ok(_.parseUrl('https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789/edit#gid=42').gid==='42','parseUrl gid');
 /* обычный вид до включения */
 const before={vis:Object.values(CELLSTACK).map(o=>o.visible),pick:pickables.length,addr:G.addr.children.map(o=>o.position.y)};
 /* демо */
 STOCK.loadDemo(); STOCK.enter(); let st=STOCK.st, v=STOCK.view;
 out.demo={reys:st.k.reys,lots:st.k.lots,cbm:+st.k.cbm.toFixed(1),racks:st.k.racks,boxes:v.bx.count,cells:st.k.cells,coming:st.coming.length,gone:st.gone.length,late:st.k.lateLots.length};
 ok(STOCK.on&&document.getElementById('app').classList.contains('stock'),'enter');
 ok(st.k.racks>0&&v.bx.count>0&&v.fr.count===st.k.racks,'demo racks/boxes');
 ok(Object.values(CELLSTACK).every(o=>!o.visible),'демо-стойки модели скрыты');
 ok(Math.abs(st.racks.reduce((a,r)=>a+r.used,0)-st.k.cbm+st.k.overM3)<0.5,'объём в стойках = объём груза');
 ok(st.racks.every(r=>r.used<=STOCK.CFG.rackM3+1e-6),'стойка не переполнена');
 { const seen={}; st.racks.forEach(r=>{ const k=r.cell+'/'+r.k+'/'+r.t; ok(!seen[k],'две стойки на одном месте '+k); seen[k]=1; }); }
 /* одна ячейка — один рейс */
 ok(Object.values(st.cells).every(c=>new Set(c.lots.map(l=>l.reys)).size===1),'в ячейке один рейс');
 /* наведение: коробка первой стойки под курсором в центре экрана */
 { const rk=st.racks[0]; camera.position.set(rk.x+0.01,14,rk.z+0.01); camera.lookAt(rk.x,rk.y,rk.z); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
   const r=canvas.getBoundingClientRect(), o=STOCK.hit(r.left+r.width/2,r.top+r.height/2);
   out.hit=o?o.userData.info.h.split('\n')[0]:null; ok(o&&o.userData.stk&&o.userData.stk.cell===rk.cell,'hit '+out.hit);
   ok(o&&/прибыл \d\d\.\d\d\.\d{4}/.test(o.userData.info.h),'в подсказке дата прибытия'); }
 /* вставленная таблица: русские заголовки, свои ячейки, отгруженная строка, опасные символы */
 STOCK.loadText(['SHIPPING MARK\tCARGO NAME\tCTN/件数\tT/CBM\tKG\tKG IN 1 CBM\tDATE OF ARRIVE\tЯЧЕЙКА\tДАТА ОТГРУЗКИ',
   'BL-1 <img src=x onerror=alert(1)>\tЛюстры\t100\t4,5\t1 200,00\t266\t12.11.2026\tA3\t',
   'BL-2\tКабель\t20\t14\t9000\t642\t17.11.2026\tB7-B8\t',
   'BL-3\tПосуда\t5\t2\t100\t50\t08.11.2026\t\t',
   'BL-4\tУехал\t5\t2\t100\t50\t01.11.2026\tA1\t10.11.2026'].join('\n'));
 st=STOCK.st; const L=m=>st.here.find(l=>l.mark.indexOf(m)===0);
 out.paste={here:st.here.length,cells:st.here.map(l=>l.mark.slice(0,4)+':'+l.cells.join('+')),days:st.here.map(l=>l.days),gone:st.gone.length,auto:st.auto,warn:st.warn.length};
 ok(st.here.length===3,'paste: на складе 3 груза'); ok(L('BL-1').cells.join()==='A3','BL-1 в A3'); ok(L('BL-2').cells.join()==='B7,B8','BL-2 в B7,B8: '+L('BL-2').cells.join());
 ok(L('BL-1').days===6&&L('BL-2').days===1&&L('BL-3').days===10,'paste days'); ok(L('BL-1').kg===1200,'paste kg');
 ok(L('BL-3').cells.length===1&&!['A3','B7','B8'].includes(L('BL-3').cells[0]),'BL-3 — в свободную ячейку');
 ok(st.auto===true,'часть ячеек условная'); ok(L('BL-2').heavy===false&&L('BL-1').heavy===false,'heavy');
 ok(document.getElementById('stklist').innerHTML.indexOf('<img')<0,'текст из таблицы экранируется');
 ok(st.k.lateLots.length===1&&st.k.lateLots[0].mark==='BL-3','дольше нормы — BL-3');
 /* переполнение ячейки из таблицы — предупреждение */
 STOCK.loadText('SHIPPING MARK\tCBM\tDATE OF ARRIVE\tЯЧЕЙКА\nBIG\t40\t15.11.2026\tA5'); ok(STOCK.st.warn.some(w=>/не вошло/.test(w)),'предупреждение о переполнении');
 /* шаблон docs/шаблон_учёт_груза.csv: запятые, точка в дробях, диапазон ячеек, отгруженная строка */
 STOCK.loadText('SHIPPING MARK,CARGO NAME,TYPE OF PACKING,CTN,CBM,KG,DATE OF ARRIVE,РЕЙС,ЯЧЕЙКА,ДАТА ОТГРУЗКИ,ФУРА KZ,ПРИМЕЧАНИЕ\nПРИМЕР-1,Люстры,KOROBKA,120,8.4,960,12.11.2026,BL07112026,A6-A7,,,x\nПРИМЕР-4,Посуда,YASHIK,12,3.2,900,05.11.2026,BL31102026,B10,11.11.2026,053BXX02,y');
 { const t=STOCK.st; out.csv={here:t.here.length,cells:t.here[0]&&t.here[0].cells.join('+'),cbm:t.here[0]&&t.here[0].cbm,reys:t.here[0]&&t.here[0].reys,gone:t.gone.length,auto:t.auto};
   ok(t.here.length===1&&t.here[0].cells.join()==='A6,A7'&&t.here[0].cbm===8.4&&t.here[0].reys==='BL07112026'&&t.gone.length===1&&t.auto===false,'шаблон CSV: '+JSON.stringify(out.csv)); }
 /* рост склада после маленького: цвета у всех коробов заданы */
 STOCK.loadDemo(); STOCK.set({mode:'mark'}); st=STOCK.st; v=STOCK.view;
 { const a=v.bx.instanceColor.array; let good=true; for(let i=0;i<v.bx.count*3;i++) if(!(a[i]>0.02&&a[i]<=1.6)) { good=false; break; } out.grow={boxes:v.bx.count,colorsOk:good}; ok(good,'цвета коробов после роста'); }
 /* места из системы управления складом (общий ключ buraq.wms.place.v1) — груз встаёт в заданную ячейку */
 { STOCK.set({mode:'days'}); const l=STOCK.st.here.find(x=>!x.cell); const pm={}; pm[[l.reys,l.mark,l.cargo||'',(+l.cbm).toFixed(2)].join('|')]=['B1'];
   localStorage.setItem('buraq.wms.place.v1',JSON.stringify(pm)); STOCK.refresh(); const l2=STOCK.st.here.find(x=>x.reys===l.reys&&x.mark===l.mark&&x.cargo===l.cargo&&x.cbm===l.cbm);
   out.wms={cells:l2.cells}; ok(l2.cells[0]==='B1','место из WMS: '+l2.cells); localStorage.removeItem('buraq.wms.place.v1'); STOCK.refresh(); }
 /* на дату: 30 дней назад — другой состав */
 STOCK.set({mode:'days',date:new Date(2026,9,26)}); out.onDate={reys:STOCK.st.k.reys,D:STOCK.st.D.getDate()}; ok(STOCK.st.D.getDate()===26,'дата просмотра'); STOCK.set({date:null});
 /* живой процесс выключает учёт; выход возвращает обычный вид */
 STOCK.exit(); STOCK.enter(); SIM.enter(); ok(!STOCK.on,'живой процесс выключает учёт'); SIM.exit();
 STOCK.enter(); STOCK.exit();
 const after={vis:Object.values(CELLSTACK).map(o=>o.visible),pick:pickables.length,addr:G.addr.children.map(o=>o.position.y)};
 out.exit={same:JSON.stringify(before)===JSON.stringify(after),root:STOCK.view.root.visible,cls:document.getElementById('app').classList.contains('stock')};
 ok(out.exit.same&&!out.exit.root&&!out.exit.cls,'выход: обычный вид как был');
 try{ localStorage.removeItem('sklad4.stock.v1'); }catch(e){}
 return out; })()
