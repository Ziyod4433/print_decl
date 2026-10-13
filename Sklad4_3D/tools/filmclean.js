// node filmclean.js <html> <outdir> <W> <H> t1,t2,...  — кадры фильма без надписей (чистый рендер, для image-to-video)
const puppeteer = require('puppeteer-core'); const fs=require('fs');
const [FILE,OUT,Ws,Hs,LIST]=process.argv.slice(2); const W=+Ws,H=+Hs;
const threeSrc = fs.readFileSync(require.resolve('three/build/three.min.js'));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:900000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:1620,height:900}});
 const p=await b.newPage(); await p.evaluateOnNewDocument(() => { let q = 12345; Math.random = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; }; });
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message)); p.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE',m.text().slice(0,300)); });
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000}); await new Promise(r=>setTimeout(r,500));
 const err=await p.evaluate((W,H)=>{ window.requestAnimationFrame=()=>0; const l=document.getElementById('load'); if(l&&l.style.zIndex==='99') return l.innerText;
   try{ FILM.enter({size:[W,H],paused:true}); window.__FT=FILM.T; }catch(e){ return 'enter: '+e.message+' '+(e.stack||'').split('\n').slice(0,4).join(' | '); } return ''; },W,H);
 if(err){ console.log('ERR',err); await b.close(); process.exit(2); }
 for(const t of LIST.split(',').map(Number)){
   const a=Date.now();
   const res=await p.evaluate(t=>{ try{ FILM.frameAt(t); return renderer.domElement.toDataURL('image/jpeg',0.94); }catch(e){ return 'ERR '+e.message+' '+(e.stack||'').split('\n').slice(0,4).join(' | '); } },t);
   if(res.startsWith('ERR')){ console.log(t,res); break; }
   fs.writeFileSync(`${OUT}/t${String(t).replace('.','_')}.jpg`,Buffer.from(res.split(',')[1],'base64'));
   console.log(t,(Date.now()-a)+'ms');
 }
 await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
