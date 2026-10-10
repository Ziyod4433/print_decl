const puppeteer=require('puppeteer-core'); const fs=require('fs');
const FILE=require('path').resolve(process.argv[2]||require('path').join(__dirname,'..','Sklad4_realistic_film.html')); const threeSrc=fs.readFileSync(require.resolve('three/build/three.min.js'));
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:600000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:1280,height:720}});
 const p=await b.newPage(); await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message));
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000}); await new Promise(r=>setTimeout(r,1500));
 // обход без запущенного процесса: процесс должен включиться сам
 const r1=await p.evaluate(()=>{ toggleWalk(); wPos.set(14,1.72,15.6); wYaw=-Math.PI/2; return {walk,simOn:SIM.on,tip:document.getElementById('tip').innerHTML.slice(-60),btn:[...document.querySelectorAll('button')].find(b=>/живой процесс/i.test(b.textContent)).textContent}; });
 console.log('walk-start',JSON.stringify(r1));
 const t0=Date.now(); let frames0=await p.evaluate(()=>frame);
 await new Promise(r=>setTimeout(r,5000));
 const r2=await p.evaluate(()=>({T:+SIM.T.toFixed(1),stat:SIM.stat.slice(0,60),fk:FILM.fk.position.toArray().map(v=>+v.toFixed(2)),frames:frame}));
 console.log('after 5s',JSON.stringify(r2),'fps≈',((r2.frames-frames0)/5).toFixed(1));
 const img=await p.evaluate(()=>renderer.domElement.toDataURL('image/jpeg',0.85)); fs.mkdirSync(require('path').join(__dirname,'..','out'),{recursive:true}); fs.writeFileSync(require('path').join(__dirname,'..','out','walk.jpg'),Buffer.from(img.split(',')[1],'base64'));
 await p.evaluate(()=>{ keys.KeyW=true; }); await new Promise(r=>setTimeout(r,2000)); const r3=await p.evaluate(()=>{ keys.KeyW=false; return {cam:camera.position.toArray().map(v=>+v.toFixed(2))}; }); console.log('moved',JSON.stringify(r3));
 await p.evaluate(()=>{ toggleWalk(); }); await new Promise(r=>setTimeout(r,500));
 const r4=await p.evaluate(()=>({walk,simOn:SIM.on}));
 console.log('walk-exit (процесс должен остаться включённым)',JSON.stringify(r4));
 await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
