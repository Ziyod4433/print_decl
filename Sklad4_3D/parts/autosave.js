/* ===================== АВТОСОХРАНЕНИЕ ПРАВКИ В САМ ФАЙЛ =====================
   Правка всегда пишется в браузер (localStorage). Если файл привязан кнопкой «Автосохранение в файл», после каждого изменения
   она дописывается и в сам HTML-файл — в блок script#sklad4-saved: файл можно переслать, расстановка откроется у получателя.
   Браузер не даёт странице писать на диск без разрешения, поэтому файл нужно один раз указать (Chrome, Edge). Там, где это
   недоступно, кнопка «Скачать» сохраняет копию файла с правкой. При открытии берётся более свежая запись: из файла или из браузера. */
const FS={h:null,on:false,busy:false,dirty:false,t:0,last:0,err:'',ask:false,name:''};
const FS_API=!!(window.showOpenFilePicker&&window.indexedDB);
const FS_SELF=(()=>{ try{ return decodeURIComponent(location.pathname.split('/').pop()||''); }catch(err){ return ''; } })();
const fsJson=()=>JSON.stringify({ver:LAYOUT_VER,store:edStore}).replace(/</g,'\\u003c');
function fsPatch(src,json){                                // вписать правку в текст файла; null — это не файл модели
  const re=/(<script id="sklad4-saved" type="application\/json">)([\s\S]*?)(<\/script>)/;
  return re.test(src)?src.replace(re,(m,a,b,c)=>a+json+c):null; }
const fsBtn=document.getElementById('edfile'), fsDl=document.getElementById('eddl'), fsSt=document.getElementById('edsaved');
function fsUI(){
  const hm=t=>{ const d=new Date(t); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')+':'+String(d.getSeconds()).padStart(2,'0'); };
  if(fsBtn){ fsBtn.style.display=FS_API?'':'none';
    fsBtn.textContent=FS.on?'Файл: запись включена':FS.ask?'Продолжить запись в файл':'Автосохранение в файл';
    fsBtn.classList.toggle('on',FS.on);
    fsBtn.title=FS.on?'Правка записывается в «'+FS.name+'» после каждого изменения. Нажмите, чтобы отключить.'
      :'Укажите один раз этот же файл ('+(FS_SELF||'HTML модели')+') — дальше каждое изменение будет записываться в него само'; }
  if(fsSt) fsSt.textContent=FS.err?('⚠ '+FS.err):FS.on?(FS.last?'в файле · '+hm(FS.last):'запись в файл включена'):(edStore.ts?'в браузере · '+hm(edStore.ts):'');
}
function idb(mode,fn){ return new Promise(res=>{ try{ const rq=indexedDB.open('sklad4',1);
    rq.onupgradeneeded=()=>rq.result.createObjectStore('kv');
    rq.onsuccess=()=>{ try{ const tx=rq.result.transaction('kv',mode), r=fn(tx.objectStore('kv')); tx.oncomplete=()=>res(r&&r.result); tx.onerror=()=>res(null); }catch(err){ res(null); } };
    rq.onerror=()=>res(null); }catch(err){ res(null); } }); }
async function fsWrite(){
  if(!FS.h||!FS.on) return; if(FS.busy){ FS.dirty=true; return; } FS.busy=true; FS.dirty=false;
  try{ const src=await (await FS.h.getFile()).text(), out=fsPatch(src,fsJson());
    if(out===null) throw new Error('в выбранном файле нет блока правки');
    const w=await FS.h.createWritable(); await w.write(out); await w.close(); FS.last=Date.now(); FS.err=''; }
  catch(err){ FS.err='не записано в файл: '+(err&&err.message||err); FS.on=false; FS.ask=!!FS.h; }
  FS.busy=false; fsUI(); if(FS.dirty&&FS.on) fsQueue(); }
function fsQueue(){ fsUI(); if(!FS.on) return; clearTimeout(FS.t); FS.t=setTimeout(fsWrite,600); }
async function fsLink(){
  if(FS.on){ FS.on=false; FS.ask=!!FS.h; FS.err=''; fsUI(); return; }
  try{
    if(!FS.h){ const [h]=await showOpenFilePicker({multiple:false,types:[{description:'Модель склада (HTML)',accept:{'text/html':['.html','.htm']}}]});
      if(FS_SELF&&h.name!==FS_SELF){ FS.err='выберите тот же файл, что открыт: '+FS_SELF; fsUI(); return; }
      if(fsPatch(await (await h.getFile()).text(),'{}')===null){ FS.err='это не файл модели склада'; fsUI(); return; }
      FS.h=h; FS.name=h.name; }
    if((await FS.h.requestPermission({mode:'readwrite'}))!=='granted'){ FS.err='нет разрешения на запись'; FS.ask=true; fsUI(); return; }
    FS.on=true; FS.ask=false; FS.err=''; idb('readwrite',s=>s.put(FS.h,'file')); if(!edStore.ts) edStore.ts=Date.now(); await fsWrite();
  }catch(err){ if(!err||err.name!=='AbortError') FS.err='не удалось: '+(err&&err.message||err); }
  fsUI(); }
function fsDownload(){                                      // копия файла с правкой: для браузеров без записи на диск и для пересылки
  const out=fsPatch(window.__SKLAD_SRC||'',fsJson());
  if(out===null){ FS.err='не удалось собрать файл'; fsUI(); return; }
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([out],{type:'text/html'})); a.download=FS_SELF||'Sklad4_realistic_film.html';
  document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }
if(fsBtn) fsBtn.onclick=fsLink;
if(fsDl) fsDl.onclick=fsDownload;
if(FS_API) idb('readonly',s=>s.get('file')).then(async h=>{                // файл уже привязывали: продолжить без вопросов, если браузер помнит разрешение
  if(!h||(FS_SELF&&h.name!==FS_SELF)) return fsUI();
  FS.h=h; FS.name=h.name;
  try{ const p=await h.queryPermission({mode:'readwrite'}); if(p==='granted'){ FS.on=true; if(edStore.ts&&FILE_TS!==edStore.ts) fsQueue(); } else FS.ask=true; }catch(err){ FS.ask=true; }
  fsUI(); });
fsUI();
var FS_READY=true;                                         // до этой строки edSave пишет только в браузер
