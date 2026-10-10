(()=>{ const snap=()=>{ const o={}; edMap.forEach((v,k)=>{ const m=v.obj||v.o||v; if(!m||!m.position) return; o[k]=[m.position.x,m.position.y,m.position.z,m.rotation.x,m.rotation.y,m.rotation.z,m.visible?1:0].map(x=>+x.toFixed(4)).join(','); });
   [TRK_IN,TRK_IN.userData.b1,TRK_IN.userData.b2,FORK0,MAN_N1,MAN_N2,CHOCKS].forEach((m,i)=>{ o['x'+i]=[m.position.x,m.position.y,m.position.z,m.rotation.x,m.rotation.y,m.rotation.z,m.visible?1:0].map(x=>+x.toFixed(4)).join(','); });
   o.cu=TRK_IN.userData.b1.userData.curt.u+','+TRK_IN.userData.b2.userData.curt.u; o.st=TRK_IN.userData.b1.userData.curt.strips.map(s=>s.position.x.toFixed(3)+':'+s.rotation.y.toFixed(3)).join('|');
   let n=0; scene.traverse(()=>n++); o.n=n; return o; };
  const a=snap(); FILM.enter({size:[640,360],paused:true}); [10,60,100,138,150].forEach(t=>FILM._apply(t)); FILM.exit(); const b=snap();
  const diff=[]; for(const k in a) if(a[k]!==b[k]) diff.push([k,String(a[k]).slice(0,80),String(b[k]).slice(0,80)]);
  return {keys:Object.keys(a).length,diff}; })()
