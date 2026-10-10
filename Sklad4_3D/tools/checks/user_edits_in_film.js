(()=>{ const st=o=>[o.position.x,o.position.y,o.position.z,o.rotation.y,o.visible?1:0].map(x=>+x.toFixed(3)).join(',');
  const snap=()=>{ const o={}; edMap.forEach((v,k)=>{ o[k]=st(v); }); [TRK_IN.userData.b1,TRK_IN.userData.b2,CHOCKS].forEach((m,i)=>{ o['x'+i]=st(m); });
    o.cu=TRK_IN.userData.b1.userData.curt.u+','+TRK_IN.userData.b2.userData.curt.u; o.doors=Object.keys(DOOR).map(k=>DOOR[k].open).join(','); return o; };
  /* правка пользователя: автопоезд сдвинут и повёрнут, машина из Китая сдвинута, копия стойки поставлена на магистраль, конвейер убран, DWS передвинут, тележка сдвинута в сторону */
  TRK_IN.position.set(26,0,44); TRK_IN.rotation.y=0.4; TRK_L2.position.z+=6;
  const src=CELLSTACK[Object.keys(CELLSTACK)[0]].userData.eid; const c=edClone(src,[27,0,15.6],0.3,'ctest');
  const tl=edMap.get('t-l2'); edHide(tl); const dw=edMap.get('dws-3'); dw.position.set(20,0,9);
  JACK_P2a.position.set(40,0,7.5);
  const a=snap(); FILM.enter({size:[640,360],paused:true}); const F=FILM;
  const inFilm={trk:st(TRK_IN),cn:st(TRK_L2),cloneVis:c.visible,userTl:tl.visible,userDws:dw.visible,jack:st(JACK_P2a),warn:F.warn,warnShown:F.wn.style.display,
    filmTl:F.tl2.visible&&F.grp.visible, boom:!!F.boom, filmDwsAt:[F.dws.position.x,F.dws.position.z]};
  [10,60,80,100,138,170].forEach(t=>F._apply(t)); F.exit(); const b=snap();
  const diff=[]; for(const k in a) if(a[k]!==b[k]) diff.push([k,a[k],b[k]]);
  return {keys:Object.keys(a).length,diff,inFilm}; })()
