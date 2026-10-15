// node uishot.js <html> <steps.json> <outdir> — снимки всего окна (панель + 3D) по шагам: [{name, js, wait}] (js может вернуть Promise)
const puppeteer=require('puppeteer-core'); const fs=require('fs');
const [FILE,STEPS,OUT]=process.argv.slice(2); const steps=JSON.parse(fs.readFileSync(STEPS,'utf8'));
const threeSrc=fs.readFileSync(require.resolve('three/build/three.min.js'));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:1800000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:1600,height:900}});
 const p=await b.newPage(); await p.evaluateOnNewDocument(()=>{ let q=12345; Math.random=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; }; });
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_FAILED/.test(m.text())) console.log('CONSOLE',m.text().slice(0,300)); });
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000});
 for(const s of steps){ const r=await p.evaluate(async js=>{ try{ return JSON.stringify(await (0,eval)(js||'0')); }catch(e){ return 'ERR '+e.message; } },s.js||'');
   if(s.wait) await new Promise(res=>setTimeout(res,s.wait)); await p.screenshot({path:`${OUT}/${s.name}.jpg`,type:'jpeg',quality:85}); console.log(s.name,r&&r.slice(0,300)); }
 await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
