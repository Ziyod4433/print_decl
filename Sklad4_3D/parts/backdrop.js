/* горы на горизонте: к северу — Джунгарский Алатау со снежными вершинами, по кругу — низкие гряды в дымке */
{
  const Wc=4096, Hc=256, c=cnv(Wc,Hc), g=c.getContext('2d'), R=LOOK.R;
  const oct=[]; for(let k=0;k<6;k++) oct.push({f:2+k*k*3+R()*3,a:1/(1+k*0.9),p:R()*6.28});
  const H=u=>{ const th=u*Math.PI*2, north=Math.max(0,-Math.cos(th));
    let h=0; for(const o of oct) h+=Math.sin(u*o.f*Math.PI*2+o.p)*o.a;
    h=(h*0.5+0.6); return (0.10+0.22*north+0.55*north*north*Math.max(0,h))*Math.max(0.15,h); };
  for(let layer=0;layer<2;layer++){
    g.beginPath(); g.moveTo(0,Hc);
    for(let x=0;x<=Wc;x+=4){ const u=x/Wc; const h=layer?H(u)*0.55+0.05*Math.sin(u*90):H(u); g.lineTo(x,Hc-h*Hc*0.95); }
    g.lineTo(Wc,Hc); g.closePath();
    const gr=g.createLinearGradient(0,0,0,Hc);
    if(layer===0){ gr.addColorStop(0,'rgba(236,241,247,1)'); gr.addColorStop(.28,'rgba(176,192,210,1)'); gr.addColorStop(.6,'rgba(150,166,184,1)'); gr.addColorStop(1,'rgba(166,178,190,1)'); }
    else { gr.addColorStop(0,'rgba(128,142,150,1)'); gr.addColorStop(1,'rgba(150,160,166,1)'); }
    g.fillStyle=gr; g.fill();
  }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.wrapS=THREE.RepeatWrapping;
  const m=new THREE.Mesh(new THREE.CylinderGeometry(1800,1800,210,128,1,true),
    new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.BackSide,fog:false,depthWrite:false}));
  m.material.color.setScalar(0.92); m.position.set(24,95,20); m.renderOrder=-1; scene.add(m);
}
