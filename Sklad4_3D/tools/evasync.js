// node evasync.js <html> <js-file> [W H outdir] — выполнить в странице код (может вернуть Promise), напечатать JSON;
// если код вернул {imgs:[dataURL]} — кадры пишутся в outdir/f00.jpg… (с постобработкой — как у пользователя)
const puppeteer=require('puppeteer-core'); const fs=require('fs');
const [FILE,JS,Ws,Hs,OUT]=process.argv.slice(2);
const threeSrc=fs.readFileSync(require.resolve('three/build/three.min.js'));
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:3600000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:1620,height:900}});
 const p=await b.newPage(); await p.evaluateOnNewDocument((nb)=>{ if(nb) window.__NOBATCH=true; window.__still=true; let q=12345; Math.random=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; }; },!!process.env.NOBATCH);
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message,(e.stack||'').split('\n').slice(0,4).join(' / '))); p.on('console',m=>{ const t=m.text(); if((m.type()==='error'&&!/ERR_FAILED/.test(t))||t.startsWith('LOG ')) console.log('CONSOLE',t.slice(0,600)); });
 await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000});
 if(Ws) await p.evaluate((W,H)=>{ renderer.setPixelRatio(1); renderer.setSize(W,H,false); camera.aspect=W/H; camera.updateProjectionMatrix(); },+Ws,+Hs);
 const res=await p.evaluate(async js=>{ window.requestAnimationFrame=()=>0; try{ const r=await (0,eval)(js); return r; }catch(e){ return {err:e.message+' '+(e.stack||'').split('\n').slice(0,6).join(' | ')}; } },fs.readFileSync(JS,'utf8'));
 if(res&&res.imgs&&OUT){ fs.mkdirSync(OUT,{recursive:true}); res.imgs.forEach((d,i)=>fs.writeFileSync(`${OUT}/f${String(i).padStart(2,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'))); res.imgs=res.imgs.length; }
 console.log(JSON.stringify(res)); await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
