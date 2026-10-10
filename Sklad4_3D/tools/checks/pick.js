(()=>{ renderer.setSize(1280,720,false); camera.aspect=1280/720; camera.updateProjectionMatrix();
 const r=canvas.getBoundingClientRect(); const out=[];
 const views=[[[-12.9,47.9,71.6],[24,2.5,20]],[[38.5,2.4,17.2],[33,1.7,11]],[[22,3,27.5],[30,1.5,22]],[[5,2.2,15],[8,1,10]]];
 views.forEach(([p,l])=>{ camera.position.set(...p); camera.lookAt(...l); camera.updateMatrixWorld();
   for(let i=0;i<9;i++) for(let j=0;j<6;j++){ const x=r.left+r.width*(0.06+0.11*i), y=r.top+r.height*(0.1+0.16*j); const o=hitTest(x,y); out.push(o?(o.userData.eid||o.userData.info.t):'-'); } });
 return {n:out.length,hits:out.filter(v=>v!=='-').length,sig:out.join('|')}; })()
