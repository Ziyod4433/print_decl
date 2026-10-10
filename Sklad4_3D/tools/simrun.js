// длинный прогон живого процесса кусками: node simrun.js <html> <Tend>
const puppeteer=require('puppeteer-core'); const fs=require('fs');
const [FILE,TEND]=process.argv.slice(2); const threeSrc=fs.readFileSync(require.resolve('three/build/three.min.js'));
const setup=fs.readFileSync(require('path').join(__dirname,'simcoll.js'),'utf8');
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:3600000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:640,height:360}});
 const p=await b.newPage(); await p.evaluateOnNewDocument(()=>{ window.__NOBATCH=true; let q=12345; Math.random=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; }; });
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message));
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000});
 // инициализация: тот же код, что в simcoll.js, но цикл вынесен — запускаем setup до 'while', остальное по кускам
 const head=setup.slice(0,setup.indexOf(' while(S.T<T1)')).replace('(()=>{ SIM.enter();','window.__init=()=>{ window.requestAnimationFrame=()=>0; SIM.enter();')+' window.__C={obs,G2,key,hits,test,racksBox,humans,hum,P}; };';
 await p.evaluate(head); await p.evaluate(()=>window.__init());
 const chunk=fs.readFileSync(require('path').join(__dirname,'simchunk.js'),'utf8');
 let T=0, cyc=1; const t0=Date.now();
 while(T<+TEND){ const r=await p.evaluate(chunk); T=r.T; console.log(Math.round((Date.now()-t0)/1000)+'s',JSON.stringify(r)); if(r.err) break; if(r.cycle>cyc){ cyc=r.cycle; console.log('=== НОВЫЙ ЦИКЛ',cyc); if(cyc>=2){ break; } } }
 const fin=await p.evaluate(()=>{ const C=window.__C; const out=Object.entries(C.hits).map(([k,h])=>[k,+h.pen.toFixed(2),+h.T0.toFixed(1),+h.T1.toFixed(1),h.at]).sort((a,b)=>b[1]-a[1]); return {hits:out.slice(0,30),hum:C.hum,log:SIM.log().slice(-40)}; });
 console.log('HITS'); fin.hits.forEach(h=>console.log(JSON.stringify(h))); console.log('HUM',JSON.stringify(fin.hum)); console.log('LOG'); fin.log.forEach(l=>console.log(' ',l));
 await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
