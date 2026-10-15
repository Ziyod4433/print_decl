// Физика обхода: тело не проходит сквозь колонну, стойки, решётку; с платформы Л2 спрыгивает, обратно — только по лестнице; прыжок ~0,5 м.
// node tools/ev.js Sklad4_realistic_film.html tools/checks/walk_phys.js
// Норма: column x≈15,3 (колонна 16,05); padWest feet −1,06 (спрыгнул); backEast — x не изменился (борт платформы);
//        stairsUp feet 0 (поднялся по лестнице); jump — максимум 0,45…0,5; fence z≈35,1 (решётка 35,5); info.ms — время построения сетки;
//        gs z≈2,9…3,3 (не прошёл сквозь Goodscan); pt z≈5,0…5,4 (не прошёл сквозь портальный DWS). С 15.10 зона DWS на 1 м восточнее.
(()=>{ const out={}; toggleWalk(); out.info=WALKP.info();
 const run=(sec,k)=>{ for(const q in keys) keys[q]=false; Object.assign(keys,k||{}); for(let i=0;i<sec*60;i++){ if(SIM.on) SIM.tick(1/60); WALKP.step(1/60);} for(const q in keys) keys[q]=false; return [+wPos.x.toFixed(2),+WALKP.S.feet.toFixed(2),+wPos.z.toFixed(2)]; };
 const at=(x,z,yaw)=>{ wPos.set(x,1.7,z); wYaw=yaw; WALKP.S.feet=WALKP.ground(x,z); WALKP.S.vx=WALKP.S.vz=0; };
 at(14,14.05,-Math.PI/2); out.column=run(3,{KeyW:true});           // в колонну 16,05 / 14,05 с запада
 at(4,15.0,Math.PI); out.rackA=run(3,{KeyS:true});                  // назад (на север) к ячейкам ряда A
 at(-1.5,10.58,Math.PI/2); out.padWest=run(2.5,{KeyW:true});        // с платформы Л2 на запад — спрыгнуть
 out.backEast=run(2,{KeyS:true});                                    // обратно на восток — борт платформы не пускает
 at(-1.0,4.2,Math.PI); out.stairsUp=run(3,{KeyW:true});              // по лестнице на север — на платформу
 at(20,15.6,0); run(0.2); const f0=WALKP.S.feet; let mx=0; keys.Space=true; for(let i=0;i<60;i++){ WALKP.step(1/60); mx=Math.max(mx,WALKP.S.feet); } keys.Space=false; out.jump=[+f0.toFixed(2),+mx.toFixed(2),+WALKP.S.feet.toFixed(2)];
 at(38.4,4.2,0); out.gs=run(3,{KeyW:true});                         // в зоне DWS: на юг в стол Goodscan (оператор стоит у стола z≈2,96)
 at(44.6,6.2,0); out.pt=run(3,{KeyW:true});                         // на юг в портальный DWS (платформа и рама до z≈4,9)
 at(20,30.5,Math.PI); out.fence=run(4,{KeyW:true});                   // на север в решётку (z 35,5)
 out.units=WALKP.units().map(u=>u.kind).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{});
 return out; })()
