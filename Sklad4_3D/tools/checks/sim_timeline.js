(()=>{ SIM.enter(); const S=SIM.state(); const ev=[]; let last=null, cn=null, kz=null, nlog=0, cyc=S.cycle;
 for(let i=0;i<70000;i++){ SIM.tick(0.1); if(S.cycle!==cyc) break; const n=S.fkTask&&S.fkTask.name; if(n!==last){ ev.push([+S.T.toFixed(0),'fk',n]); last=n; }
   if(S.cn.state!==cn){ ev.push([+S.T.toFixed(0),'cn',S.cn.state]); cn=S.cn.state; } if(S.kz.state!==kz){ ev.push([+S.T.toFixed(0),'kz',S.kz.state]); kz=S.kz.state; }
   while(nlog<S.log.length){ ev.push([+S.T.toFixed(0),'log',S.log[nlog++]]); } }
 return ev; })()
