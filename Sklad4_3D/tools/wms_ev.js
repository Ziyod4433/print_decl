// node tools/wms_ev.js Buraq_WMS.html tools/checks/wms.js — выполнить проверку в системе управления складом (без сети)
const puppeteer=require('puppeteer-core'); const fs=require('fs');
const [FILE,JS]=process.argv.slice(2);
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,args:['--no-sandbox','--disable-dev-shm-usage'],defaultViewport:{width:1440,height:900}});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.setRequestInterception(true); p.on('request',r=>{ const u=r.url(); if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort(); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href,{waitUntil:'load'});
  const res=await p.evaluate(async js=>{ try{ return JSON.stringify(await (0,eval)(js)); }catch(e){ return 'ERR '+e.message+' '+(e.stack||'').slice(0,300); } },fs.readFileSync(JS,'utf8'));
  console.log(res); if(errs.length) console.log('PAGEERROR',errs.join(' | ')); await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
