// Стоп-кадры с постобработкой: node still.js <html> <outdir> <W> <H> <shots.json>
const puppeteer = require('puppeteer-core'); const fs=require('fs');
const [FILE,OUT,Ws,Hs,SHOTS]=process.argv.slice(2); const W=+Ws,H=+Hs;
const shots=JSON.parse(fs.readFileSync(SHOTS,'utf8'));
const threeSrc = fs.readFileSync(require.resolve('three/build/three.min.js'));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:600000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:1620,height:900}});
 const p=await b.newPage(); await p.evaluateOnNewDocument((nb) => { if(nb) window.__NOBATCH=true; window.__still=true; let q = 12345; Math.random = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; }; }, !!process.env.NOBATCH);
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message)); p.on('console',m=>{ if(m.type()==='error'||m.type()==='warning'||m.text().startsWith('RPM')) console.log('CONSOLE',m.text().slice(0,600)); });
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000}); await new Promise(r=>setTimeout(r,500));
 const err=await p.evaluate((W,H)=>{ window.requestAnimationFrame=()=>0; const l=document.getElementById('load'); if(l&&l.style.zIndex==='99') return l.innerText;
   renderer.setPixelRatio(1); renderer.setSize(W,H,false); camera.aspect=W/H; camera.updateProjectionMatrix();
   Object.values(G).forEach(g=>{}); ['labels','addr','roles','dims','flow'].forEach(k=>{ if(G[k]) G[k].visible=false; }); return ''; },W,H);
 if(err){ console.log('ERR',err); process.exit(2); }
 for(const s of shots){
   const t0=Date.now();
   const res=await p.evaluate(s=>{ try{
     if(s.layers) for(const [k,on] of Object.entries(s.layers)){ if(G[k]) G[k].visible=on; }
     if(s.roof!==undefined){ G.roof.visible=s.roof; interior.intensity=s.roof?LIGHT.inRoof:LIGHT.inOpen; }
     if(s.js) (0,eval)(s.js);
     camera.fov=s.fov||45; camera.position.set(...s.pos); camera.lookAt(...s.look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
     if(s.post!==undefined) POST.P.on=s.post;
     Object.assign(POST.P,s.P||{});
     renderer.shadowMap.needsUpdate=true;
     const gl=renderer.getContext(), px=new Uint8Array(4);
     const a=performance.now();
     if(POST.P.on) POST.render(scene,camera); else renderer.render(scene,camera);
     gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);
     return {ms:Math.round(performance.now()-a), calls:renderer.info.render.calls, tris:renderer.info.render.triangles, fl:POST.floatOK};
   }catch(e){ return {err:e.message+' '+(e.stack||'').split('\n').slice(0,3).join(' | ')}; } },s);
   const data=await p.evaluate(()=>renderer.domElement.toDataURL('image/jpeg',0.92));
   fs.writeFileSync(`${OUT}/${s.name}.jpg`,Buffer.from(data.split(',')[1],'base64'));
   console.log(s.name,JSON.stringify(res),(Date.now()-t0)+'ms');
 }
 await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
