// node close.js <html> <outdir> <W> <H> <shots.json> — крупные планы фильма у объектов: [{name,T,tgt,off:[x,y,z],la:[x,y,z],fov,post}]
const puppeteer = require('puppeteer-core'); const fs=require('fs');
const [FILE,OUT,Ws,Hs,SH]=process.argv.slice(2); const W=+Ws,H=+Hs; const shots=JSON.parse(fs.readFileSync(SH,'utf8'));
const threeSrc = fs.readFileSync(require.resolve('three/build/three.min.js'));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:900000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:1620,height:900}});
 const p=await b.newPage(); await p.evaluateOnNewDocument((nb) => { if(nb) window.__NOBATCH=true; let q = 12345; Math.random = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; }; },!!process.env.NOBATCH);
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_FAILED/.test(m.text())) console.log('CONSOLE',m.text().slice(0,300)); });
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000}); await new Promise(r=>setTimeout(r,500));
 const err=await p.evaluate((W,H)=>{ window.requestAnimationFrame=()=>0; try{ FILM.enter({size:[W,H],paused:true}); }catch(e){ return 'enter: '+e.message; } return ''; },W,H);
 if(err){ console.log('ERR',err); await b.close(); process.exit(2); }
 for(const s of shots){
   const res=await p.evaluate(s=>{ try{ const F=FILM; F._apply(F.tfOf(s.T));
     if(s.js) (0,eval)(s.js);
     let o=s.tgt? s.tgt.split('.').reduce((a,k)=>a[k],F) : null; if(o&&o.root) o=o.root;
     const c=o?o.getWorldPosition(new THREE.Vector3()):new THREE.Vector3();
     camera.position.set(c.x+s.off[0],c.y+s.off[1],c.z+s.off[2]); camera.up.set(0,1,0); camera.lookAt(c.x+s.la[0],c.y+s.la[1],c.z+s.la[2]);
     camera.fov=s.fov||40; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
     G.roof.visible=true; interior.intensity=LIGHT.inRoof; const P=POST.P; P.mblur=0; P.dof=0; P.grain=0.01; P.exposure=s.exp||1.05;
     renderer.shadowMap.needsUpdate=true; if(s.post!==false&&P.on) POST.render(scene,camera,null); else renderer.render(scene,camera);
     return renderer.domElement.toDataURL('image/jpeg',0.9); }catch(e){ return 'ERR '+e.message+' '+(e.stack||'').split('\n').slice(0,4).join(' | '); } },s);
   if(res.startsWith('ERR')){ console.log(s.name,res); continue; }
   fs.writeFileSync(`${OUT}/${s.name}.jpg`,Buffer.from(res.split(',')[1],'base64')); console.log(s.name);
 }
 await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
