(()=>{ FILM.enter({size:[640,360],paused:true}); const F=FILM, MK=F.MK, out={jumps:[],clr:[]};
 const wrap=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
 let pp=null, maxv=0; const T1=MK.fkEnd+3;
 for(let T=MK.fk0-1;T<T1;T+=0.02){ F._apply(F.tfOf(T)); const p=F.fk.position, y=F.fk.rotation.y;
   if(pp){ const d=Math.hypot(p.x-pp.x,p.z-pp.z), dy=Math.abs(wrap(y-pp.y)); maxv=Math.max(maxv,d/0.02); if(d>0.12||dy>0.12) out.jumps.push([+T.toFixed(2),+d.toFixed(3),+dy.toFixed(3)]); }
   pp={x:p.x,z:p.z,y}; }
 out.maxv=+maxv.toFixed(2);
 // стойки: скачки положения
 const R=[F.RK,F.R14[0],F.R14[1]], last=R.map(()=>null); out.rj=[];
 for(let T=MK.fk0-1;T<T1;T+=0.02){ F._apply(F.tfOf(T)); R.forEach((o,i)=>{ const p=o.position; if(last[i]){ const d=p.distanceTo(last[i]); if(d>0.12) out.rj.push([i,+T.toFixed(2),+d.toFixed(3)]); } last[i]=p.clone(); }); }
 return out; })()
