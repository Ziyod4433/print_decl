// Падение в обходе: человек на южной магистрали перед едущим погрузчиком — удар, падение, подъём.
// node tools/ev.js Sklad4_realistic_film.html tools/checks/walk_knock.js
// Норма: hits 1; в seq (время, W.down.t или -1, высота камеры, x, z) камера опускается до ~0,23 и через ~3,5 с снова 1,66; fx — «Вас сбил погрузчик…».
(()=>{ toggleWalk(); const S=SIM.state(), W=WALKP.S, out={seq:[]};
 // ставим человека на пути погрузчика: ищем момент, когда погрузчик едет по южной магистрали
 let tries=0; for(;tries<4000;tries++){ SIM.tick(0.25); const k=S.kinFk||{v:0}; const p=FILM.fk.position; if(Math.abs(k.v)>1.2&&Math.abs(p.z-15.6)<0.2&&p.x>9&&p.x<40) break; }
 const p=FILM.fk.position, yaw=FILM.fk.rotation.y, dirx=Math.sin(yaw)*Math.sign(S.kinFk.v), dirz=Math.cos(yaw)*Math.sign(S.kinFk.v);
 wPos.set(p.x+dirx*4.2,1.7,p.z+dirz*4.2); wYaw=Math.atan2(dirx,dirz); W.feet=0; W.vx=W.vz=0; WALKP.step(0.016);
 out.fk0=[+p.x.toFixed(2),+p.z.toFixed(2),+S.kinFk.v.toFixed(2)]; out.me0=[+wPos.x.toFixed(2),+wPos.z.toFixed(2)];
 for(let i=0;i<60*7;i++){ SIM.tick(1/60); WALKP.step(1/60); if(i%15===0) out.seq.push([+(i/60).toFixed(2),W.down?+W.down.t.toFixed(2):-1,+camera.position.y.toFixed(2),+wPos.x.toFixed(2),+wPos.z.toFixed(2)]); }
 out.hits=W.hits; out.fx=document.getElementById('walkhit')?document.getElementById('walkhit').innerText.slice(0,40):null; out.tries=tries;
 return out; })()
