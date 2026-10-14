// Планы камеры и подписи фильма: каждый план длиннее нуля, планы идут подряд без разрывов и перекрытий, подписи по порядку.
// node tools/ev.js Sklad4_realistic_film.html tools/checks/film_shots.js
// Норма: "bad":[], "capsBad":[]; end — длина фильма, с. (14.10: из-за номера в F.CAR план «подход к прицепу» тянулся до конца фильма.)
(()=>{ FILM.enter({size:[640,360],paused:true}); const F=FILM, sh=F.shots, bad=[];
 for(let i=0;i<sh.length;i++){ const s=sh[i]; if(!(s.t1>s.t0)) bad.push(['len',i,+s.t0.toFixed(2),+s.t1.toFixed(2)]); if(i&&Math.abs(s.t0-sh[i-1].t1)>0.05) bad.push(['gap',i,+sh[i-1].t1.toFixed(2),+s.t0.toFixed(2)]); }
 const caps=F.caps, cb=[]; for(let i=1;i<caps.length;i++) if(caps[i].t0<caps[i-1].t1-0.01||!(caps[i].t1>caps[i].t0)) cb.push([caps[i].no,+caps[i].t0.toFixed(1),+caps[i].t1.toFixed(1)]);
 const out={n:sh.length,bad,capsBad:cb,end:+sh[sh.length-1].t1.toFixed(2)}; F.exit(); return out; })()
