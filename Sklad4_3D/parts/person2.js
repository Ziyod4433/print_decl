/* человек на площадке — прежняя сигнатура person(x,z,rot,pose,role,p) */
const PEOPLE=[];
function person(x,z,rot,pose,role,p){
  const H=HUM.build({role:role||'ГРУЗЧИК',rnd:LOOK.R});
  const g=H.root; g.position.set(x,0,z); g.rotation.y=rot||0; (p||G.people).add(g);
  g.userData.nm=role||'Человек'; g.userData.role=role||'';
  /* в покое — занятие по роли (раньше «в работе» стояли с вытянутыми вперёд руками, как манекены) */
  const n=PEOPLE.length, IDLE={'ОХРАННИК':[{behind:1}],'СТАРШИЙ СМЕНЫ':[{tablet:1}],'БРИГАДИР':[{tablet:1},{talk:1}],'КЛАДОВЩИК':[{tablet:1}],
    'КОНТРОЛЁР':[{tablet:1}],'ОПЕРАТОР':[{tablet:1}],'ВОДИТЕЛЬ ПОГРУЗЧИКА':[{phone:1},{akimbo:1}],'ВОДИТЕЛЬ':[{phone:1},{cross:1}],
    'ГРУЗЧИК-УПАКОВЩИК':[{akimbo:1},{cross:1}],'ГРУЗЧИК':[{cross:1},{talk:1},{akimbo:1}]}, FREE=[{behind:1},{},{akimbo:1}];
  H.base=Object.assign({},pose?(IDLE[role]||IDLE['ГРУЗЧИК'])[n%(IDLE[role]||IDLE['ГРУЗЧИК']).length]:role==='ОХРАННИК'?{behind:1}:FREE[n%FREE.length]);
  HUM.pose(H,Object.assign({t:LOOK.R()*2},H.base));
  PEOPLE.push(H);
  if(role) label(role,x,2.35,z,'#f2b705',38,0.85,G.roles);
  return g;
}
function rigSit(g){ const H=g.userData.H; if(!H) return; H.base={sit:1,drive:1}; HUM.pose(H,{t:0,sit:1,drive:1}); if(H.root.userData.ao) H.root.userData.ao.visible=false; }
function rigPose(g,ph,amp,work,t){ const H=g.userData.H; if(!H) return; HUM.pose(H,{t:t||0,walk:amp>0.05?1:0,phase:ph/(Math.PI*2),reach:work?0.5:0,bend:work?0.2:0}); }
