/* ===================== движение людей: ключи → позиция, поворот, поза ===================== */
/* ===================== движение людей: ключи → позиция, поворот, поза ===================== */
function Track(){ this.k=[]; }
Track.prototype.key=function(T,x,z,yaw,pose){ this.k.push({T,x,z,yaw,pose:pose||{}}); return this; };
Track.prototype.fin=function(){ this.k.sort((a,b)=>a.T-b.T); let d=0; this.k.forEach((k,i)=>{ if(i){ const p=this.k[i-1]; d+=Math.hypot(k.x-p.x,k.z-p.z)+Math.abs(wrapA(k.yaw-p.yaw))*0.22; } k.d=d; }); return this; };
Track.prototype.at=function(T){
  const k=this.k; let i=0; if(T<=k[0].T) return {x:k[0].x,z:k[0].z,yaw:k[0].yaw,pose:Object.assign({},k[0].pose),walk:0,phase:0};
  if(T>=k[k.length-1].T){ const e=k[k.length-1]; return {x:e.x,z:e.z,yaw:e.yaw,pose:Object.assign({},e.pose),walk:0,phase:e.d/HUM.CYC.walk.len}; }
  while(i<k.length-2&&T>=k[i+1].T) i++;
  const a=k[i], b=k[i+1], dur=b.T-a.T, u=(T-a.T)/dur, dist=Math.hypot(b.x-a.x,b.z-a.z);
  const pose={}; const keys=new Set([...Object.keys(a.pose),...Object.keys(b.pose)]);
  keys.forEach(p=>{ const va=a.pose[p], vb=b.pose[p];
    if(typeof va==='boolean'||typeof vb==='boolean') pose[p]=u<0.5?!!va:!!vb; else pose[p]=lerp(va||0,vb||0,ez(u)); });
  let x,z,yaw,walk=0,phase;
  if(dist>0.12){                                        // шаги
    const e=trap(u,Math.min(0.45,0.35/dur+0.05)); x=lerp(a.x,b.x,e); z=lerp(a.z,b.z,e);
    const md=Math.atan2(b.x-a.x,b.z-a.z), tt=Math.min(0.3,dur*0.3);
    yaw=(T-a.T)<tt?yawLerp(a.yaw,md,ez((T-a.T)/tt)):(b.T-T)<tt?yawLerp(b.yaw,md,ez((b.T-T)/tt)):md;
    walk=Math.min(1,(T-a.T)/0.22,(b.T-T)/0.22); phase=(a.d+dist*e)/HUM.CYC.walk.len;
  } else {                                              // на месте: поворот с перешагиванием
    x=lerp(a.x,b.x,ez(u)); z=lerp(a.z,b.z,ez(u)); const dy=Math.abs(wrapA(b.yaw-a.yaw));
    yaw=yawLerp(a.yaw,b.yaw,ez(u));
    if(dy>0.45||dist>0.03){ walk=0.55*Math.sin(Math.PI*c01(u)); phase=(a.d+(dy*0.22+dist)*ez(u))/HUM.CYC.walk.len; } else phase=a.d/HUM.CYC.walk.len;
  }
  return {x,z,yaw,pose,walk,phase};
};
function drive(H,st,T,par){ H.root.position.set(st.x,0,st.z); H.root.rotation.y=st.yaw;
  HUM.pose(H,Object.assign({t:T,walk:st.walk,phase:st.phase},st.pose)); }
