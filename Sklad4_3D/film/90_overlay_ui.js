function rr(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
const DF='"Barlow Condensed","Roboto Condensed","Arial Narrow",sans-serif', MF='"IBM Plex Mono",ui-monospace,Menlo,monospace';
function overlay(t){
  const c=F.ov, g=F.ovg, w=c.width, h=c.height, k=h/1080;
  g.clearRect(0,0,w,h); g.textBaseline='alphabetic';
  g.fillStyle='rgba(12,16,21,.55)'; rr(g,36*k,34*k,400*k,70*k,6*k); g.fill();
  g.fillStyle='#f2b705'; g.fillRect(36*k,34*k,6*k,70*k);
  g.font=`700 ${29*k}px ${DF}`; g.fillStyle='#f2b705'; g.fillText('BURAQ LOGISTICS',58*k,66*k);
  g.font=`500 ${16*k}px ${MF}`; g.fillStyle='#c9d1d9'; g.fillText('Склад №4 · блок 4-1 · Хоргос',58*k,92*k);
  const mm=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
  g.font=`500 ${18*k}px ${MF}`; g.textAlign='right'; g.fillStyle='rgba(233,236,239,.8)';
  g.fillText(mm(t)+' / '+mm(F.T),w-40*k,64*k); g.textAlign='left';
  if(F.recording){ g.fillStyle='#e0412f'; g.beginPath(); g.arc(w-240*k,58*k,8*k,0,7); g.fill(); }
  const fr=FAST.find(r=>t>r[0]&&t<r[1]);
  if(fr){ g.font=`700 ${20*k}px ${DF}`; const tx='▶▶  УСКОРЕНО '+fr[2], tw=g.measureText(tx).width+36*k;
    g.fillStyle='rgba(12,16,21,.6)'; rr(g,w/2-tw/2,36*k,tw,40*k,20*k); g.fill(); g.fillStyle='#e9ecef'; g.textAlign='center'; g.fillText(tx,w/2,63*k); g.textAlign='left'; }
  const cp=CAPS.find(q=>t>=q.t0&&t<=q.t1);
  if(cp){ const a=c01(Math.min((t-cp.t0)/0.4,(cp.t1-t)/0.4)); g.globalAlpha=a; const dx=(1-sst(a))*-40*k;
    if(cp.no==='T'||cp.no==='O'){
      g.fillStyle='rgba(10,13,17,.5)'; g.fillRect(0,h*0.40,w,h*0.21);
      g.textAlign='center'; g.font=`700 ${(cp.no==='T'?64:58)*k}px ${DF}`; g.fillStyle='#ffffff'; g.fillText(cp.a,w/2,h*0.40+96*k);
      g.fillStyle='#f2b705'; g.fillRect(w/2-60*k,h*0.40+122*k,120*k,4*k);
      g.font=`500 ${23*k}px ${MF}`; g.fillStyle='#d7dde3'; g.fillText(cp.b,w/2,h*0.40+170*k); g.textAlign='left';
    } else {
      const x0=64*k+dx, y0=h-200*k;
      g.font=`700 ${48*k}px ${DF}`; const tw=g.measureText(cp.a).width;
      g.font=`500 ${21*k}px ${MF}`; const sw=g.measureText(cp.b).width;
      const bw=Math.max(tw,sw)+146*k;
      g.fillStyle='rgba(12,16,21,.7)'; rr(g,x0,y0,bw,122*k,6*k); g.fill();
      g.fillStyle='#f2b705'; rr(g,x0,y0,100*k,122*k,6*k); g.fill();
      g.font=`700 ${74*k}px ${DF}`; g.fillStyle='#10151b'; g.textAlign='center'; g.fillText(cp.no,x0+50*k,y0+88*k); g.textAlign='left';
      g.font=`700 ${48*k}px ${DF}`; g.fillStyle='#ffffff'; g.fillText(cp.a,x0+124*k,y0+58*k);
      g.font=`500 ${21*k}px ${MF}`; g.fillStyle='#cfd6dd'; g.fillText(cp.b,x0+124*k,y0+96*k);
    }
    g.globalAlpha=1; }
  const cd=CARDS.find(q=>t>=q.t0&&t<=q.t1);
  if(cd){ const a=c01(Math.min((t-cd.t0)/0.3,(cd.t1-t)/0.3)); g.globalAlpha=a;
    g.font=`700 ${30*k}px ${DF}`; const tw=g.measureText(cd.a).width; g.font=`500 ${18*k}px ${MF}`; const sw=g.measureText(cd.b).width;
    const bw=Math.max(tw,sw)+44*k, x0=w-bw-40*k+(1-sst(a))*30*k, y0=110*k;
    g.fillStyle='rgba(12,16,21,.72)'; rr(g,x0,y0,bw,88*k,6*k); g.fill(); g.fillStyle=cd.c; g.fillRect(x0,y0,5*k,88*k);
    g.font=`700 ${30*k}px ${DF}`; g.fillStyle=cd.c; g.fillText(cd.a,x0+22*k,y0+40*k);
    g.font=`500 ${18*k}px ${MF}`; g.fillStyle='#e3e8ed'; g.fillText(cd.b,x0+22*k,y0+70*k); g.globalAlpha=1; }
  const tp=tfOf(F.MK.photo);
  if(t>tp&&t<tp+0.75){ g.fillStyle=`rgba(255,255,255,${Math.exp(-(t-tp)*9)*0.85})`; g.fillRect(0,0,w,h); }
  if(t>tp+0.05&&t<tp+3.2){ const a=c01(Math.min((t-tp-0.05)/0.3,(tp+3.2-t)/0.3)); g.globalAlpha=a;
    g.font=`700 ${24*k}px ${DF}`; const tx='ФОТО КУЗОВА ДО ЗАКРЫТИЯ · ОТПРАВЛЕНО КЛИЕНТУ', tw=g.measureText(tx).width+40*k;
    g.fillStyle='rgba(83,209,111,.92)'; rr(g,w-tw-40*k,210*k,tw,46*k,6*k); g.fill(); g.fillStyle='#0c1a12'; g.fillText(tx,w-tw-20*k,241*k); g.globalAlpha=1; }
  g.fillStyle='rgba(255,255,255,.12)'; g.fillRect(0,h-4*k,w,4*k); g.fillStyle='#f2b705'; g.fillRect(0,h-4*k,w*t/F.T,4*k);
  const fade=Math.max(1-t/0.8,(t-(F.T-1.3))/1.3,0);
  if(fade>0){ g.fillStyle=`rgba(0,0,0,${c01(fade)})`; g.fillRect(0,0,w,h); }
}
function composite(){ const g=F.rcg; g.drawImage(renderer.domElement,0,0,F.W,F.H); g.drawImage(F.ov,0,0); }

/* ===================== воспроизведение и запись ===================== */
const _build=build; build=function(){ _build(); mkShots(); };
F.tick=function(dt){
  if(F.play){ F.t+=dt; if(F.t>=F.T){ F.t=F.T; F.play=false; if(F.recording) setTimeout(stopRec,120); } }
  frame(F.t); if(F.recording) composite(); ui();
};
F.frameAt=function(t,q){ frame(t); composite(); return F.rc.toDataURL('image/jpeg',q||0.94); };
F.enter=enter; F.exit=exit; F._apply=apply; F._overlay=overlay; F._composite=composite; F.tau=tau; F.tfOf=tfOf;
F._camShot=function(t,si,out){ const r=camShot(t,si,out||pcam); return {s:r.s,look:r.look}; };
F._camInfo=function(t){ const si=shotAt(t); const r=camShot(t,si,camera); camera.updateProjectionMatrix();
  return {si,fov:r.s.fov,ext:!!r.s.ext,ev:r.s.ev,mb:r.s.mb||0,dof:r.s.dof?r.s.dof.k:0,focus:focusDist(r.s,r.look),p:camera.position.toArray(),q:camera.quaternion.toArray()}; };
F._shotAt=shotAt;
let mr=null, chunks=[];
function startRec(){
  if(!window.MediaRecorder||!F.rc.captureStream){ alert('Этот браузер не умеет записывать видео с холста. Откройте в Chrome или Edge.'); return; }
  const types=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
  const mime=types.find(m=>MediaRecorder.isTypeSupported(m))||'';
  F.t=0; F.play=true; composite();
  chunks=[]; mr=new MediaRecorder(F.rc.captureStream(30),mime?{mimeType:mime,videoBitsPerSecond:16e6}:{});
  mr.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data); };
  mr.onstop=()=>{ const ext=(mr.mimeType||mime).includes('mp4')?'mp4':'webm';
    const b=new Blob(chunks,{type:mr.mimeType||'video/webm'}), a=document.createElement('a');
    a.href=URL.createObjectURL(b); a.download='sklad4-process.'+ext; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); ui(); };
  mr.start(250); F.recording=true; ui();
}
function stopRec(){ if(mr&&mr.state!=='inactive') mr.stop(); F.recording=false; ui(); }
const bar=document.createElement('div'); bar.id='filmbar';
bar.innerHTML='<button data-a="play">⏸</button><button data-a="rew">⟲</button>'+
  '<input type="range" min="0" max="'+F.T+'" step="0.01" value="0"><span class="tc">00:00</span>'+
  '<button data-a="rec">● Записать видео</button><button data-a="exit">✕ Выйти</button>';
view.appendChild(bar);
const sl=bar.querySelector('input'), tc=bar.querySelector('.tc');
bar.addEventListener('click',e=>{ const a=e.target.dataset&&e.target.dataset.a; if(!a) return;
  if(a==='play'){ if(F.t>=F.T) F.t=0; F.play=!F.play; }
  else if(a==='rew'){ F.t=0; F.play=true; }
  else if(a==='rec'){ if(F.recording) stopRec(); else startRec(); }
  else if(a==='exit') exit();
  ui(); });
sl.addEventListener('input',()=>{ F.t=parseFloat(sl.value); if(F.recording) stopRec(); });
function ui(){ if(!F.on) return; bar.querySelector('[data-a=play]').textContent=F.play?'⏸':'▶';
  sl.value=F.t; tc.textContent=String(Math.floor(F.t/60)).padStart(2,'0')+':'+String(Math.floor(F.t%60)).padStart(2,'0');
  const rb=bar.querySelector('[data-a=rec]'); rb.textContent=F.recording?'■ Остановить запись':'● Записать видео'; rb.classList.toggle('on',F.recording); }
addEventListener('keydown',e=>{ if(!F.on) return;
  if(e.code==='Escape') exit(); else if(e.code==='Space'){ e.preventDefault(); F.play=!F.play; ui(); } });
mkBtn('▶ Фильм: процесс склада',true,()=>enter());
})();
