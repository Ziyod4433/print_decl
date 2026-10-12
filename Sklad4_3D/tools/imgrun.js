// node tools/imgrun.js <html> <js> <outdir>: выполнить в странице скрипт, вернувший {info,imgs:[dataURL]}, сохранить кадры f00.jpg… и напечатать info
const puppeteer=require('puppeteer-core'); const fs=require('fs'); const path=require('path');
const [FILE,JS,OUT]=process.argv.slice(2); const threeSrc=fs.readFileSync(require.resolve('three/build/three.min.js'));
fs.mkdirSync(OUT,{recursive:true});
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:900000,
 args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-dev-shm-usage','--hide-scrollbars'],defaultViewport:{width:1620,height:900}});
 const p=await b.newPage(); await p.evaluateOnNewDocument(()=>{ let q=12345; Math.random=()=>{ q=(q*1664525+1013904223)>>>0; return q/4294967296; }; });
 await p.setRequestInterception(true);
 p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
 p.on('pageerror',e=>console.log('PAGEERROR',e.message)); p.on('console',m=>{ if(m.type()==='error'&&!/ERR_FAILED/.test(m.text())) console.log('CONSOLE',m.text().slice(0,300)); });
 await p.goto(require('url').pathToFileURL(path.resolve(FILE)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000}); await new Promise(r=>setTimeout(r,500));
 const res=await p.evaluate(js=>{ window.requestAnimationFrame=()=>0; try{ return (0,eval)(js); }catch(e){ return {err:e.message+' '+(e.stack||'').split('\n').slice(0,5).join(' | ')}; } },fs.readFileSync(JS,'utf8'));
 if(res.err){ console.log('ERR',res.err); } else { (res.imgs||[]).forEach((d,i)=>fs.writeFileSync(`${OUT}/f${String(i).padStart(2,'0')}.jpg`,Buffer.from(d.split(',')[1],'base64'))); console.log(JSON.stringify(res.info)); }
 await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
