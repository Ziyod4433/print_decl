// node simshot.js <html> <outdir> <W> <H> <shots.json>: живой процесс — кадры в моменты T с камерой {name,T,pos,look,fov,tgt,off,la}
// Кадры идут в порядке списка. Вместо T можно задать until (JS-условие, например "SIM.state().kz.finishing") и dT —
// смещение от момента, когда условие стало истинным; следующие кадры с одним dT отсчитываются от того же момента.
const puppeteer = require('puppeteer-core'); const fs=require('fs');
const [FILE,OUT,Ws,Hs,SH]=process.argv.slice(2); const W=+Ws,H=+Hs; const shots=JSON.parse(fs.readFileSync(SH,'utf8'));
const threeSrc = fs.readFileSync(require.resolve('three/build/three.min.js'));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:1800000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:1620,height:900}});
 const p=await b.newPage(); await p.evaluateOnNewDocument((v) => { window.__SIMV=v; let q = 12345; Math.random = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; }; },+(process.env.SIMV||0));
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_FAILED/.test(m.text())) console.log('CONSOLE',m.text().slice(0,300)); });
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000}); await new Promise(r=>setTimeout(r,500));
 const err=await p.evaluate((W,H)=>{ window.requestAnimationFrame=()=>0; try{ renderer.setPixelRatio(1); renderer.setSize(W,H,false); camera.aspect=W/H; camera.updateProjectionMatrix(); if(window.__SIMV) SIM.cfg.variant=window.__SIMV; SIM.enter(); }catch(e){ return 'enter: '+e.message; } return ''; },W,H);
 if(err){ console.log('ERR',err); await b.close(); process.exit(2); }
 let base=0;
 for(const s of shots){
   const res=await p.evaluate((s,base)=>{ try{ const S=SIM.state(); if(s.until){ let n=0; while(!(0,eval)(s.until)&&n++<400000) SIM.tick(1/30); window.__base=S.T; }
     const tT=s.until?window.__base+(s.dT||0):(s.dT!==undefined?window.__base+s.dT:s.T); while(S.T<tT) SIM.tick(1/30);
     if(s.js) (0,eval)(s.js);
     let c=new THREE.Vector3(); if(s.tgt){ let o=s.tgt.split('.').reduce((a,k)=>a&&a[k],{F:FILM,S}); if(o&&o.root) o=o.root; if(o&&o.o) o=o.o; if(o) o.getWorldPosition(c); }
     if(s.pos) camera.position.set(...s.pos); else camera.position.set(c.x+s.off[0],c.y+s.off[1],c.z+s.off[2]);
     camera.up.set(0,1,0); if(s.look) camera.lookAt(...s.look); else camera.lookAt(c.x+s.la[0],c.y+s.la[1],c.z+s.la[2]);
     camera.fov=s.fov||45; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
     G.roof.visible=s.roof!==false; interior.intensity=G.roof.visible?LIGHT.inRoof:LIGHT.inOpen; renderer.shadowMap.needsUpdate=true; if(typeof POST!=='undefined'&&POST.P.on){ POST.P.exposure=(typeof EXPO!=='undefined'&&EXPO.at)?EXPO.at(camera,false):1; POST.P.time=S.T; POST.render(scene,camera); } else renderer.render(scene,camera);   // как видит пользователь: с постобработкой
     return {img:renderer.domElement.toDataURL('image/jpeg',0.9),stat:SIM.stat,T:S.T}; }catch(e){ return {err:'ERR '+e.message+' '+(e.stack||'').split('\n').slice(0,4).join(' | ')}; } },s,base);
   if(res.err){ console.log(s.name,res.err); continue; }
   fs.writeFileSync(`${OUT}/${s.name}.jpg`,Buffer.from(res.img.split(',')[1],'base64')); console.log(s.name,'T='+res.T.toFixed(1),res.stat.slice(0,80));
 }
 await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
