/* ---------------------------------------------------------------- 3D: стойки и короба (инстансы), плитки ячеек, подписи рейсов, выделение */
let V=null;
function buildView(){
  if(V) return V;
  const root=new THREE.Group(); root.name='stock'; scene.add(root);
  /* запас инстансов: до 3 штабелей × 3 ярусов в каждой ячейке */
  const max=CELLS.length*9, I=THREE.InstancedMesh;
  const fr=new I(RACKGEO.or,M.rackOr,max), gv=new I(RACKGEO.gv,M.rackGalv,max);
  const bg=new THREE.BoxGeometry(1,1,1); bg.translate(0,0.5,0);
  /* светлый «нейтральный» короб: цвет задаёт раскраска (простой, клиент, рейс), текстура — только лента, кромки и этикетка */
  const tc=cnv(256,256), tx=tc.getContext('2d'); tx.fillStyle='#efece4'; tx.fillRect(0,0,256,256);
  let rq=7; const rr=()=>{ rq=(rq*1664525+1013904223)>>>0; return rq/4294967296; };
  for(let i=0;i<500;i++){ tx.fillStyle='rgba(120,100,70,'+(0.02+rr()*0.05)+')'; tx.fillRect(rr()*256,rr()*256,2+rr()*10,1+rr()*2); }
  tx.fillStyle='rgba(205,190,160,.75)'; tx.fillRect(108,0,40,256); tx.fillStyle='rgba(255,255,255,.25)'; tx.fillRect(108,0,9,256);
  const eg0=tx.createLinearGradient(0,0,256,0); eg0.addColorStop(0,'rgba(40,30,20,.34)'); eg0.addColorStop(.07,'rgba(40,30,20,0)'); eg0.addColorStop(.93,'rgba(40,30,20,0)'); eg0.addColorStop(1,'rgba(40,30,20,.34)');
  tx.fillStyle=eg0; tx.fillRect(0,0,256,256);
  const eg1=tx.createLinearGradient(0,0,0,256); eg1.addColorStop(0,'rgba(40,30,20,.30)'); eg1.addColorStop(.07,'rgba(40,30,20,0)'); eg1.addColorStop(.93,'rgba(40,30,20,0)'); eg1.addColorStop(1,'rgba(40,30,20,.36)');
  tx.fillStyle=eg1; tx.fillRect(0,0,256,256);
  tx.fillStyle='rgba(250,250,246,.96)'; tx.fillRect(160,150,76,58); tx.fillStyle='#16181c'; for(let x=166;x<230;x+=2+(rr()*3|0)) tx.fillRect(x,172,1+(rr()*2|0),28); tx.fillRect(166,158,40,5);
  const bt=new THREE.CanvasTexture(tc); bt.encoding=THREE.sRGBEncoding; bt.anisotropy=ANISO;
  const bm=new THREE.MeshStandardMaterial({map:bt,roughness:.86,metalness:0,envMapIntensity:.4});
  const bx=new I(bg,bm,max*RSLOT.length);
  /* цвета — сразу на весь запас: иначе three создаёт буфер по текущему числу коробов, и при росте склада новым не хватает места */
  bx.instanceColor=new THREE.BufferAttribute(new Float32Array(max*RSLOT.length*3).fill(1),3);
  [fr,gv,bx].forEach(m=>{ m.castShadow=m.receiveShadow=true; m.frustumCulled=false; m.count=0; root.add(m); });
  const tiles={}, tg=new THREE.Group(); root.add(tg);
  CELLS.forEach(c=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(c.x1-c.x0-0.12,c.z1-c.z0-0.12),
      new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.34,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,toneMapped:false}));
    m.rotation.x=-Math.PI/2; m.position.set((c.x0+c.x1)/2,0.021,(c.z0+c.z1)/2); m.visible=false; tg.add(m); tiles[c.id]=m; });
  const prox=new THREE.Group(); root.add(prox);
  const pg=new THREE.BoxGeometry(1.5,RACK.H,1.5); pg.translate(0,RACK.H/2,0);
  const lab=new THREE.Group(); G.labels.add(lab);
  const selG=new THREE.Group(); root.add(selG);
  const eg=new THREE.EdgesGeometry(new THREE.BoxGeometry(1.58,RACK.H+0.06,1.58)); eg.translate(0,RACK.H/2,0);
  V={root,fr,gv,bx,tiles,prox,pg,pm:new THREE.MeshBasicMaterial(),lab,labels:{},pool:[],selG,eg,em:new THREE.LineBasicMaterial({color:0x35e0ff,depthTest:false,transparent:true}),ray:new THREE.Raycaster()};
  return V;
}
const _m=new THREE.Matrix4(), _q=new THREE.Quaternion(), _p=new THREE.Vector3(), _s=new THREE.Vector3(), _c=new THREE.Color(), _w=new THREE.Color(0xffffff), UP=new THREE.Vector3(0,1,0);
const selHas=l=>{ const s=S.sel; return !s||(s.t==='lot'?l.id===s.v:s.t==='reys'?l.reys===s.v:l.mark===s.v); };
const qHas=l=>{ const q=S.q.trim().toLowerCase(); return !q||(l.mark+' '+l.cargo+' '+l.reys+' '+l.cells.join(' ')+' '+l.dest).toLowerCase().includes(q); };
const shown=l=>selHas(l)&&qHas(l);

function rackInfo(rk){
  const cs=ST.cells[rk.cell], l0=rk.items[0].l, g=l0.g, addr=rk.cell+' · штабель '+(rk.k+1)+' · ярус '+(rk.t+1);
  const ln=rk.items.map(it=>it.l.mark+(it.l.cargo?' · '+it.l.cargo:'')+' — '+fmtN(it.m3)+' м³');
  const h=addr+(cs.auto?' (место условное)':'')+'\nрейс '+l0.reys+' · прибыл '+fmtD(l0.arr)+' · на складе '+daysTxt(l0.days)+'\n'+ln.slice(0,6).join('\n')+(ln.length>6?'\n… ещё '+(ln.length-6):'');
  const rows=rk.items.map(it=>{ const l=it.l; return '<tr><td><b>'+esc(l.mark)+'</b><br>'+esc(l.cargo||'—')+'</td><td>'+fmtN(it.m3)+' из '+fmtN(l.cbm)+' м³<br>'+fmtN(l.ctn,0)+' мест · '+fmtN(l.kg,0)+' кг</td></tr>'; }).join('');
  const out=g.r.out?('отгрузка '+fmtD(g.r.out)+(g.r.kz?' · фура '+esc(g.r.kz):'')):(g.r.kz?'фура '+esc(g.r.kz):'фура ещё не назначена');
  return {t:'Стойка '+addr+' — рейс '+l0.reys, h,
    q:'прибыл '+fmtD(l0.arr)+' · на складе '+daysTxt(l0.days)+(l0.days>CFG.norm?' — дольше нормы ('+CFG.norm+')':'')+' · '+out,
    n:'<table class="stkt">'+rows+'</table>'+(cs.auto?'<div class="stkn">Место в ячейке условное: в таблице адресов нет, модель расставила рейсы сама — старый груз ближе к посту погрузки.</div>':''),
    kt:'Рейс целиком', k:esc(l0.reys)+': '+g.lots.length+' поз. · '+fmtN(g.cbm)+' м³ · '+fmtN(g.kg/1000)+' т · ячейки '+esc(g.cells.join(', '))};
}
function render3d(){
  const v=buildView(), st=ST; let nb=0;
  st.racks.forEach((rk,i)=>{
    _q.setFromAxisAngle(UP,rk.rot); _p.set(rk.x,rk.y,rk.z); _s.set(1,1,1); _m.compose(_p,_q,_s); v.fr.setMatrixAt(i,_m); v.gv.setMatrixAt(i,_m);
    let px=v.pool[i]; if(!px){ px=new THREE.Mesh(v.pg,v.pm); px.visible=false; v.pool[i]=px; }
    if(px.parent!==v.prox) v.prox.add(px);
    px.position.set(rk.x,rk.y,rk.z); px.rotation.y=rk.rot; px.userData.stk=rk; px.userData.info=rackInfo(rk); px.updateMatrixWorld(true);
    /* коробов в стойке — по занятому объёму; чей короб — по долям грузов в стойке */
    const n=Math.max(1,Math.min(RSLOT.length,Math.round(RSLOT.length*rk.used/CFG.rackM3))), cs=Math.cos(rk.rot), sn=Math.sin(rk.rot);
    let acc=0, ii=0; const cum=rk.items.map(it=>(acc+=it.m3)/rk.used); rk.b0=nb; rk.n=n; rk.own=[];
    for(let b=0;b<n;b++){ const f=(b+0.5)/n; while(ii<cum.length-1&&f>cum[ii]) ii++;
      const q=RSLOT[b], T=CTYPE[q.ti];
      _p.set(rk.x+q.x*cs+q.z*sn,rk.y+q.y,rk.z-q.x*sn+q.z*cs); _s.set(T.l,T.h,T.w); _m.compose(_p,_q,_s); v.bx.setMatrixAt(nb,_m); rk.own[b]=rk.items[ii].l; nb++; }
  });
  for(let i=st.racks.length;i<v.pool.length;i++) if(v.pool[i].parent) v.prox.remove(v.pool[i]);
  v.fr.count=v.gv.count=st.racks.length; v.bx.count=nb;
  v.fr.instanceMatrix.needsUpdate=v.gv.instanceMatrix.needsUpdate=v.bx.instanceMatrix.needsUpdate=true;
  paint();
  if(typeof walk!=='undefined'&&walk&&typeof WALKP!=='undefined') WALKP.build();
}
function paint(){
  const v=V, st=ST; if(!v||!st) return;
  const dim=!!S.sel||!!S.q.trim();
  st.racks.forEach(rk=>{ for(let b=0;b<rk.n;b++){ const l=rk.own[b];
    if(dim&&!shown(l)) _c.setHex(0x9aa0a8); else { _c.setHex(lotColor(l)); _c.lerp(_w,0.12); }
    v.bx.setColorAt(rk.b0+b,_c); } });
  if(v.bx.instanceColor) v.bx.instanceColor.needsUpdate=true;
  CELLS.forEach(c=>{ const cs=st.cells[c.id], t=v.tiles[c.id]; if(!cs){ t.visible=false; return; }
    const l=cs.lots.reduce((a,b)=>b.days>a.days?b:a,cs.lots[0]); t.material.color.setHex(lotColor(l)); t.material.opacity=dim&&!cs.lots.some(shown)?0.07:0.34; t.visible=true; });
  /* подпись — одна на рейс, над серединой его ячеек */
  const seen={};
  st.groups.forEach((g,gi)=>{ const rs=st.racks.filter(r=>r.items.some(it=>it.l.g===g)); if(!rs.length) return;
    const x=rs.reduce((a,r)=>a+r.x,0)/rs.length, z=rs.reduce((a,r)=>a+r.z,0)/rs.length;
    const txt=g.r.code+' · '+(g.days>0?daysTxt(g.days):'прибыл сегодня')+(g.outToday?' · отгрузка сегодня':''), col=hex(CFG.mode==='reys'?PAL[gi%PAL.length]:dayColor(g.days));
    let s=v.labels[g.r.code];
    if(!s){ s=makeLabel(txt,col,44,0.78); v.lab.add(s); v.labels[g.r.code]=s; }
    else if(s.userData.lp.text!==txt||s.userData.lp.color!==col){ s.userData.lp.text=txt; s.userData.lp.color=col; paintLabel(s); }
    s.position.set(x,CFG.tiers*RACK.PITCH+1.9+(gi%2)*0.9,z); s.visible=!dim||g.lots.some(shown); seen[g.r.code]=1; });
  for(const k in v.labels) if(!seen[k]){ const s=v.labels[k]; v.lab.remove(s); if(s.material.map) s.material.map.dispose(); s.material.dispose();
    const i=allLabels.indexOf(s); if(i>=0) allLabels.splice(i,1); delete v.labels[k]; }
  /* рамки вокруг стоек выбранного груза */
  const pick=S.sel?st.racks.filter(rk=>rk.items.some(it=>selHas(it.l))):[];
  while(v.selG.children.length>pick.length) v.selG.remove(v.selG.children[v.selG.children.length-1]);
  pick.forEach((rk,i)=>{ let e=v.selG.children[i]; if(!e){ e=new THREE.LineSegments(v.eg,v.em); e.renderOrder=998; v.selG.add(e); } e.position.set(rk.x,rk.y,rk.z); e.rotation.y=rk.rot; });
  renderer.shadowMap.needsUpdate=true;
}
/* наведение и клик: невидимая коробка на каждой стойке; base hitTest спрашивает нас первым */
const _n=new THREE.Vector2();
function hit(cx,cy){
  if(!S.on||!V||!ST||!ST.racks.length) return null;
  const r=canvas.getBoundingClientRect(); _n.set(((cx-r.left)/r.width)*2-1,-((cy-r.top)/r.height)*2+1);
  V.ray.setFromCamera(_n,camera); const hs=V.ray.intersectObjects(V.prox.children,false);
  return hs.length?hs[0].object:null;
}
/* что прячем на время учёта: демонстрационные стойки и всё выбираемое оборудование, стоящее внутри ячеек */
let hid=null, pickHid=null, addrY=null;
const inCell=o=>{ const p=o.position; return CELLS.some(c=>p.x>c.x0-0.15&&p.x<c.x1+0.15&&p.z>c.z0-0.15&&p.z<c.z1+0.15); };
function show3d(on){
  if(on){
    if(hid) return;
    const list=[]; Object.values(CELLSTACK).forEach(o=>{ if(o&&!list.includes(o)) list.push(o); });
    G.equip.children.forEach(o=>{ if(!list.includes(o)&&pickables.includes(o)&&inCell(o)) list.push(o); });
    hid=list.map(o=>[o,o.visible]); list.forEach(o=>o.visible=false);
    pickHid=[]; for(let i=pickables.length-1;i>=0;i--) if(list.includes(pickables[i])){ pickHid.push(pickables[i]); pickables.splice(i,1); }
    buildView().root.visible=true; V.lab.visible=true;
    /* адреса ячеек висят на 1,75 м — на время учёта поднимаем над стойками */
    addrY=[]; G.addr.children.forEach(o=>{ if(inCell(o)){ addrY.push([o,o.position.y]); o.position.y=CFG.tiers*RACK.PITCH+0.75; } });
  } else {
    if(hid){ hid.forEach(([o,vis])=>o.visible=vis); hid=null; }
    if(pickHid){ pickHid.forEach(o=>{ if(!pickables.includes(o)) pickables.push(o); }); pickHid=null; }
    if(V){ V.root.visible=false; V.lab.visible=false; }
    if(addrY){ addrY.forEach(([o,y])=>o.position.y=y); addrY=null; }
    if(typeof marker!=='undefined') marker.visible=false;
    if(typeof walk!=='undefined'&&walk&&typeof WALKP!=='undefined') WALKP.build();
  }
  scene.updateMatrixWorld(true); renderer.shadowMap.needsUpdate=true;
}
