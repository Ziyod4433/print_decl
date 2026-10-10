// проверка автосохранения: правка → текст файла с правкой → открыть этот файл в чистом браузере → правка на месте
const puppeteer=require('puppeteer-core'); const fs=require('fs');
const path=require('path'), FILE=path.resolve(process.argv[2]||path.join(__dirname,'..','Sklad4_realistic_film.html')), OUT=path.join(require('os').tmpdir(),'sklad4_saved_copy.html');
const threeSrc=fs.readFileSync(require.resolve('three/build/three.min.js'));
async function open(b,file){ const ctx=await b.createIncognitoBrowserContext?.()||await b.createBrowserContext(); const p=await ctx.newPage();
  await p.setRequestInterception(true);
  p.on('request',r=>{const u=r.url(); if(u.includes('three')&&u.endsWith('.js')) r.respond({status:200,contentType:'application/javascript',body:threeSrc}); else if(u.startsWith('file:')||u.startsWith('data:')||u.startsWith('blob:')) r.continue(); else r.abort();});
  p.on('pageerror',e=>console.log('PAGEERROR',e.message));
  await p.goto(require('url').pathToFileURL(require('path').resolve(file)).href,{waitUntil:'load',timeout:180000}); await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready',{timeout:120000}); return p; }
(async()=>{ const b=await puppeteer.launch({executablePath:require('./_chrome.js'),headless:true,protocolTimeout:900000,
  args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
  const p=await open(b,FILE);
  const r1=await p.evaluate(async()=>{ window.requestAnimationFrame=()=>0;
    const o=edMap.get('b10'), x0=o.position.x; o.position.x+=1.25; o.rotation.y+=0.3; edRecord(o);            // сдвиг объекта
    const c=edClone('b12',[20,0,29],0.5,'c0'); edStore.c.push({i:'c0',s:'b12',p:[20,0,29],r:0.5}); edSave();   // копия
    /* запись через «файл»: подставной дескриптор с тем же интерфейсом, что даёт браузер */
    let disk=window.__SKLAD_SRC, writes=0;
    FS.h={name:'work.html',getFile:async()=>({text:async()=>disk}),createWritable:async()=>({write:async t=>{ disk=t; writes++; },close:async()=>{}}),requestPermission:async()=>'granted'};
    FS.name='work.html'; FS.on=true; await fsWrite();
    const o2=edMap.get('b11'); o2.position.z+=0.5; edRecord(o2); await new Promise(r=>setTimeout(r,1200));        // автозапись после изменения
    return {x0,x1:o.position.x,writes,err:FS.err,last:FS.last>0,len:disk.length,src:window.__SKLAD_SRC.length,disk,status:document.getElementById('edsaved').textContent,btn:document.getElementById('edfile').textContent,api:FS_API,self:FS_SELF}; });
  fs.writeFileSync(OUT,r1.disk); const info=Object.assign({},r1); delete info.disk; console.log('шаг 1',JSON.stringify(info));
  const q=await open(b,OUT);
  const r2=await q.evaluate(()=>{ window.requestAnimationFrame=()=>0; const o=edMap.get('b10'), o2=edMap.get('b11'), c=edMap.get('c0');
    return {x:o.position.x,ry:+o.rotation.y.toFixed(3),base:o.userData.base.slice(0,4).map(v=>+v.toFixed(3)),z11moved:Math.abs(o2.position.z-o2.userData.base[2])>0.4,clone:!!c&&[c.position.x,c.position.z],fileTs:FILE_TS>0,n:edMap.size,
      film:(()=>{ try{ FILM.enter({size:[640,360],paused:true}); const w=FILM.warn; FILM.exit(); return {T:FILM.T,warn:w}; }catch(e){ return 'ERR '+e.message; } })(),
      ls:Object.keys(localStorage)}; });
  console.log('шаг 2 (файл с правкой открыт в чистом браузере)',JSON.stringify(r2));
  await b.close(); })().catch(e=>{ console.error('FATAL',e.message); process.exit(1); });
