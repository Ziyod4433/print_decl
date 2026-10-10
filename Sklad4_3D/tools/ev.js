// node ev.js <html> <js-file> — выполнить выражение в странице и напечатать результат
const puppeteer=require('puppeteer-core'); const fs=require('fs');
const [FILE,JS]=process.argv.slice(2);
const threeSrc=fs.readFileSync(require.resolve('three/build/three.min.js'));
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:900000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:1620,height:900}});
 const p=await b.newPage(); await p.evaluateOnNewDocument((nb)=>{ if(nb) window.__NOBATCH=true; let q=12345; Math.random=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; }; },!!process.env.NOBATCH);
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message,(e.stack||'').split('\n').slice(0,3).join(' / '))); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_FAILED/.test(m.text())) console.log('CONSOLE',m.text().slice(0,400)); });
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000});
 const res=await p.evaluate(js=>{ window.requestAnimationFrame=()=>0; try{ return JSON.stringify((0,eval)(js)); }catch(e){ return 'ERR '+e.message+' '+(e.stack||'').split('\n').slice(0,5).join(' | '); } },fs.readFileSync(JS,'utf8'));
 console.log(res); await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
