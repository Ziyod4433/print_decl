// Вариант приёмки в обычном виде (кнопка «Приёмка: …»): машина из Китая, конвейер, запас пустых стоек и люди приёмки
// переезжают к П1 и обратно; фильм и живой процесс их не сбивают; правка у П1 пишется отдельно (edStore.v2), у Л2 — не трогается.
// node tools/ev.js Sklad4_realistic_film.html tools/checks/variant_static.js
// Норма: same0 true (после П1 и обратно всё на исходных местах), recSame true (запись конвейера у Л2 не изменилась), at1 — у П1
// (t-l2 32,48/32,8; машина 38,52/32,8; упаковщики и старший смены у П1), film.truck у Л2 и d 0 (двери закрыты), afterFilm/afterSim
// true, v2rec — правка у П1, mHas false, tele.o.tilt 6 и recTilt 3 (настройка конвейера у П1 не трогает запись у Л2), err [].
(()=>{ const out={err:[]}; const F=FILM, f=v=>+v.toFixed(3);
 const truck=TRK_L2, people=PEOPLE.filter(H=>H.root.userData.base&&['ГРУЗЧИК-УПАКОВЩИК','СТАРШИЙ СМЕНЫ'].includes(H.root.userData.info&&H.root.userData.info.t)).map(H=>H.root);
 const stock=G.equip.children.find(o=>/Запас пустых/.test(o.userData.nm||''));
 const objs=()=>[edMap.get('t-l2'),truck,stock].concat(people).filter(Boolean);
 const st=()=>objs().map(o=>[o.userData.eid,f(o.position.x),f(o.position.y),f(o.position.z),f(o.rotation.y)].join(','));
 const doors=()=>{ const d=(truck.userData.rdoors||[])[0]; return d?f(d.rotation.y):null; };
 const btn=()=>[...document.querySelectorAll('button')].find(b=>/Приёмка: машина/.test(b.textContent));
 try{
 const rec0=JSON.stringify(edStore.a.find(c=>c.i==='t-l2'));
 const s0=st(); btn().click(); out.at1=st(); out.v=edStore.v; out.d1=doors();
 F.enter({size:[640,360],paused:true}); F._apply(F.tfOf(30)); out.film={truck:[f(truck.position.x),f(truck.position.z)],d:doors()}; F.exit();
 out.afterFilm=JSON.stringify(st())===JSON.stringify(out.at1)&&doors()===out.d1;
 SIM.enter(); for(let i=0;i<200;i++) SIM.tick(0.1); out.simV=SIM.state().V; SIM.exit(); out.afterSim=JSON.stringify(st())===JSON.stringify(out.at1);
 const p=people[0]; p.position.x+=0.5; edRecord(p); out.v2rec=edStore.v2&&edStore.v2[p.userData.eid]; out.mHas=!!edStore.m[p.userData.eid];
 libRebuild(edMap.get('t-l2'),'tilt',6); out.tele=edStore.v2&&edStore.v2['t-l2']; out.recTilt=(edStore.a.find(c=>c.i==='t-l2')||{o:{}}).o.tilt;
 btn().click(); out.recSame=JSON.stringify(edStore.a.find(c=>c.i==='t-l2'))===rec0; out.same0=JSON.stringify(st())===JSON.stringify(s0); out.vEnd=edStore.v;
 }catch(e){ out.err.push(e.message+' | '+(e.stack||'').split('\n').slice(0,3).join(' / ')); }
 return out; })()
