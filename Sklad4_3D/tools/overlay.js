// Надписи фильма (прозрачные PNG) для наложения на кадры Cycles: node overlay.js <html> <outdir> <W> <H> <fps>
const puppeteer=require('puppeteer-core'); const fs=require('fs');
const [FILE,OUT,Ws,Hs,FPSs]=process.argv.slice(2); const W=+Ws,H=+Hs,FPS=+FPSs;
const threeSrc=fs.readFileSync(require.resolve('three/build/three.min.js'));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:3600000,
  args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'],defaultViewport:{width:1620,height:900}});
 const p=await b.newPage(); await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message));
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:300000});
 await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000});
 const NF=await p.evaluate((W,H,FPS)=>{ window.requestAnimationFrame=()=>0; FILM.enter({size:[W,H],paused:true,t:0}); return Math.round(FILM.T*FPS); },W,H,FPS);
 for(let f=0;f<NF;f+=8){ const n=Math.min(8,NF-f);
   const arr=await p.evaluate((f,n,FPS)=>{ const out=[]; for(let i=0;i<n;i++){ FILM._overlay((f+i)/FPS); out.push(document.getElementById('filmov').toDataURL('image/png')); } return out; },f,n,FPS);
   arr.forEach((d,i)=>fs.writeFileSync(`${OUT}/o${String(f+i).padStart(5,'0')}.png`,Buffer.from(d.split(',')[1],'base64'))); }
 console.log('overlays',NF); await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
