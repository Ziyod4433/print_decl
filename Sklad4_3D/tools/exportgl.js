// Экспорт сцены фильма в glTF (GLB) с анимацией + метаданные камеры/света для Blender/Cycles.
// node exportgl.js <html> <outdir> <fps> [nframes]
const puppeteer = require('puppeteer-core'); const fs = require('fs');
const [FILE, OUT, FPSs, NFs] = process.argv.slice(2);
const FPS = +FPSs;
const threeSrc = fs.readFileSync(require.resolve('three/build/three.min.js'));
const exporterSrc = fs.readFileSync(require.resolve('three/examples/js/exporters/GLTFExporter.js'), 'utf8')
  .replace('cache.attributes.set( this.getUID( baseAttribute ), target[ gltfAttributeName ] );', 'cache.attributes.set( this.getUID( attribute ), target[ gltfAttributeName ] );');   // ошибка r128: кэш морф-цели под ключом базовой позиции
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await puppeteer.launch({ executablePath: require('./_chrome.js'), headless: true, protocolTimeout: 3600000,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=6000'],
    defaultViewport: { width: 1620, height: 900 } });
  const p = await b.newPage();
  await p.evaluateOnNewDocument(() => { let q = 12345; Math.random = () => { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; }; });
  await p.setRequestInterception(true);
  p.on('request', r => { const u = r.url(); if (u.includes('three') && u.endsWith('.js')) r.respond({ status: 200, contentType: 'application/javascript', body: threeSrc });
    else if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) r.continue(); else r.abort(); });
  p.on('pageerror', e => console.log('PAGEERROR', e.message));
  p.on('console', m => { const t = m.text(); if (m.type() === 'error' || t.startsWith('EXP')) console.log('C', t.slice(0, 400)); });
  await p.goto(require('url').pathToFileURL(require('path').resolve(FILE)).href, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction('typeof HUM!=="undefined"&&HUM.RP.ready', { timeout: 120000 });
  await p.addScriptTag({ content: exporterSrc });
  const t0 = Date.now();
  const info = await p.evaluate(async (FPS, NFa) => {
    window.requestAnimationFrame = () => 0;
    const F = FILM; F.enter({ size: [1280, 720], paused: true, t: 0 }); G.roof.visible = true;
    const NF = NFa || Math.round(F.T * FPS);
    const log = (...a) => console.log('EXP', ...a);
    /* ---------- что не экспортируем ---------- */
    const UI = [G.flow, G.labels, G.roles, G.addr, G.dims, marker, edSelBox].filter(Boolean);
    const fake = m => m === aoMat || (m.blending === THREE.AdditiveBlending && m !== F.lm);
    const isSky = o => o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.side === THREE.BackSide && o.geometry.type === 'SphereGeometry';
    function excluded(o) {
      if (UI.includes(o)) return true; if (o.userData && o.userData.noExport) return true;
      if (o.isLight || o.isSprite || o.isLine || o.isLineSegments || o.isPoints || o.isCamera) return true;
      if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material]; if (ms.every(fake)) return true; if (isSky(o)) return true; }
      return false;
    }
    /* ---------- InstancedMesh → обычные сетки ---------- */
    const ims = []; scene.traverse(o => { if (o.isInstancedMesh) ims.push(o); });
    ims.forEach(im => { if (excluded(im)) return; const g = new THREE.Group(); g.position.copy(im.position); g.quaternion.copy(im.quaternion); g.scale.copy(im.scale);
      const m4 = new THREE.Matrix4();
      for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); const m = new THREE.Mesh(im.geometry, im.material); m4.decompose(m.position, m.quaternion, m.scale); g.add(m); }
      g.visible = im.visible; im.parent.add(g); im.parent.remove(im); });
    /* ---------- экран DWS: три состояния — три копии с видимостью ---------- */
    const scr = F.dwsScr; let scrC = null;
    if (scr) { scrC = F.scr.map((m, i) => { if (i === 0) return scr; const c = new THREE.Mesh(scr.geometry, m); c.position.copy(scr.position); c.quaternion.copy(scr.quaternion); c.scale.copy(scr.scale); scr.parent.add(c); c.visible = false; return c; }); }
    const fixScr = () => { if (!scrC) return; const k = Math.max(0, F.scr.indexOf(scr.material)); scr.material = F.scr[0]; scrC.forEach((c, i) => c.visible = i === k); };
    /* ---------- имена материалов — подсказки для Blender ---------- */
    const mname = new Map();
    for (const k in M) { const m = M[k]; if (m && m.isMaterial && !mname.has(m)) mname.set(m, 'M_' + k); }
    LOOK.cartons.forEach(m => mname.set(m, 'CARTON'));
    F.scr.forEach(m => mname.set(m, 'SCREEN')); mname.set(F.lm, 'LASER');
    scene.traverse(o => { if (!o.isMesh || Array.isArray(o.material)) return; const m = o.material, im = m.map && m.map.image;
      if (mname.has(m)) return;
      if (im === LOOK.concDetail && (o.geometry.type === 'PlaneGeometry' || (o.userData.batch && (() => { o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox; return b.max.y - b.min.y < 0.05; })()))) mname.set(m, 'FLOOR');
      else if (im === LOOK.asphDetail) mname.set(m, 'ASPHALT');
      else if (typeof corrCanvas !== 'undefined' && im === corrCanvas) mname.set(m, 'WALLCORR'); });
    const mountains = []; scene.children.forEach(o => { if (o.isMesh && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.radiusTop > 1000) mountains.push(o); });
    mountains.forEach(o => mname.set(o.material, 'MOUNTAINS'));
    /* ---------- сбор узлов ---------- */
    const nodes = [], exl = [];
    (function walk(o) { for (const c of o.children) { if (excluded(c)) { exl.push(c); continue; } nodes.push(c); walk(c); } })(scene);
    nodes.forEach(o => { if (o.isMesh) { const ms = Array.isArray(o.material) ? o.material : [o.material];
      ms.forEach(m => { if (!mname.has(m)) { let h = m.name || '';
        if (m.emissive && m.emissiveIntensity >= 1.2 && m.emissive.r > 0.9 && m.emissive.g > 0.85) h = 'LAMP';
        else if (m.emissive && m.transparent && m.opacity > 0.8 && m.emissive.b > 0.8 && m.emissiveIntensity > 0.2 && m.emissiveIntensity < 0.5) h = 'SKYLIGHT';
        else if (m.isMeshBasicMaterial && m.color && m.color.b > m.color.r * 1.5 && m.opacity > 0.5 && m.transparent) h = h || 'BLUESPOT';
        mname.set(m, h || (m.isMeshBasicMaterial ? 'BASIC' : 'X')); } }); } });
    let mi = 0; mname.forEach((n, m) => { m.name = n + '#' + (mi++); });
    nodes.forEach(o => { o.name = 'N' + o.id; });
    /* читаемые имена и разделы для проекта Blender (до переподвешивания узлов) */
    const gkey = new Map(); Object.entries(G).forEach(([k, g]) => { if (g && g.isObject3D) gkey.set(g, k); });
    const lab = o => { for (let p = o; p; p = p.parent) { const u = p.userData || {}; if (u.info && (u.info.t || u.info.n)) return u.info.t || u.info.n; if (u.nm) return u.nm; if (u.role) return u.role; if (u.isHuman) return 'Человек'; if (u.rack) return 'Стойка'; } return ''; };
    const cat = o => { for (let p = o; p; p = p.parent) { if (gkey.has(p)) return gkey.get(p); } return 'film'; };
    const NAMES = {}; nodes.forEach(o => { NAMES[o.name] = [String(lab(o)).slice(0, 48), cat(o), o.isMesh ? (o.userData.batch ? 'batch' : 'mesh') : (o.isBone ? 'bone' : 'grp')]; });
    log('nodes', nodes.length, 'excluded', exl.length, 'materials', mname.size);
    /* ---------- запись анимации ---------- */
    const N = nodes.length, par0 = nodes.map(o => o.parent), K = 11;
    const cur = new Float32Array(N * K), base = new Float32Array(N * K);
    const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
    const rep = new Uint8Array(N);
    function read(arr, i, world) { const o = nodes[i], k = i * K;
      if (world) { o.updateWorldMatrix(true, false); o.matrixWorld.decompose(_p, _q, _s); } else { _p.copy(o.position); _q.copy(o.quaternion); _s.copy(o.scale); }
      arr[k] = _p.x; arr[k + 1] = _p.y; arr[k + 2] = _p.z; arr[k + 3] = _q.x; arr[k + 4] = _q.y; arr[k + 5] = _q.z; arr[k + 6] = _q.w;
      arr[k + 7] = _s.x; arr[k + 8] = _s.y; arr[k + 9] = _s.z; arr[k + 10] = o.visible ? 1 : 0; }
    const at = f => { F._apply(f / FPS); fixScr(); };
    at(0); for (let i = 0; i < N; i++) read(base, i, false);
    const dyn = new Uint8Array(N);
    for (let f = 1; f < NF; f++) { at(f);
      for (let i = 0; i < N; i++) { if (nodes[i].parent !== par0[i]) { rep[i] = 1; dyn[i] = 1; continue; } if (dyn[i]) continue; read(cur, i, false); const k = i * K;
        for (let j = 0; j < K; j++) if (Math.abs(cur[k + j] - base[k + j]) > 1e-5) { dyn[i] = 1; break; } } }
    const D = []; for (let i = 0; i < N; i++) if (dyn[i]) D.push(i);
    log('dynamic', D.length, 'reparented', rep.reduce((a, b) => a + b, 0));
    const rec = new Float32Array(D.length * NF * K), cam = [];
    for (let f = 0; f < NF; f++) { at(f); const t = f / FPS;
      D.forEach((i, j) => { const o = nodes[i]; const k = (j * NF + f) * K; read(cur, i, !!rep[i]); for (let a = 0; a < K; a++) rec[k + a] = cur[i * K + a]; });
      const ci = F._camInfo(t); const si = ci.si;
      const pc = new THREE.PerspectiveCamera(); const a = F._camShot(t - 0.25 / FPS, si, pc); const pa = pc.position.toArray(), qa = pc.quaternion.toArray();
      F._camShot(t + 0.25 / FPS, si, pc); const pb = pc.position.toArray(), qb = pc.quaternion.toArray();
      cam.push({ f, si, fov: ci.fov, ext: ci.ext, ev: ci.ev, mb: ci.mb, dof: ci.dof, focus: +ci.focus.toFixed(3), p: ci.p, q: ci.q, pa, qa, pb, qb }); }
    /* ---------- дорожки: ключи только там, где есть движение; скачки — ступенькой на полкадра ---------- */
    const tracks = [];
    const qdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    D.forEach((i, j) => { const o = nodes[i]; const V = f => { const k = (j * NF + f) * K; return rec.subarray(k, k + K); };
      const chan = (get, len, jump) => { const vals = []; for (let f = 0; f < NF; f++) vals.push(Array.from(get(V(f))));
        let same = true; for (let f = 1; f < NF && same; f++) for (let a = 0; a < len; a++) if (Math.abs(vals[f][a] - vals[0][a]) > 1e-5) { same = false; break; }
        if (same && !rep[i]) return null;
        if (len === 4) for (let f = 1; f < NF; f++) if (qdot(vals[f], vals[f - 1]) < 0) vals[f] = vals[f].map(x => -x);
        const eq = (a, b) => { for (let k = 0; k < len; k++) if (Math.abs(a[k] - b[k]) > 1e-6) return false; return true; };
        const T = [], Vv = [];
        for (let f = 0; f < NF; f++) {
          if (f > 0 && jump(vals[f - 1], vals[f])) { T.push((f - 0.5) / FPS); Vv.push(...vals[f - 1]); T.push((f - 0.5) / FPS + 0.0005); Vv.push(...vals[f]); }
          const keep = f === 0 || f === NF - 1 || !eq(vals[f], vals[f - 1]) || !eq(vals[f], vals[f + 1]);
          if (keep) { T.push(f / FPS); Vv.push(...vals[f]); } }
        return [T, Vv]; };
      const pj = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) > 0.35;
      const qj = (a, b) => Math.abs(qdot(a, b)) < Math.cos(0.3);
      const sj = (a, b) => { for (let k = 0; k < 3; k++) { const r = (Math.abs(a[k]) + 1e-9) / (Math.abs(b[k]) + 1e-9); if (r > 1.6 || r < 0.62) return true; } return false; };
      const P = chan(v => v.slice(0, 3), 3, pj), Q = chan(v => v.slice(3, 7), 4, qj),
            S = chan(v => { const k = v[10] ? 1 : 1e-4; return [v[7] * k, v[8] * k, v[9] * k]; }, 3, sj);
      if (P) tracks.push(new THREE.VectorKeyframeTrack(o.name + '.position', P[0], P[1]));
      if (Q) tracks.push(new THREE.QuaternionKeyframeTrack(o.name + '.quaternion', Q[0], Q[1]));
      if (S) tracks.push(new THREE.VectorKeyframeTrack(o.name + '.scale', S[0], S[1])); });
    const nKeys = tracks.reduce((a, t) => a + t.times.length, 0);
    log('tracks', tracks.length, 'keys', nKeys);
    /* ---------- исходное состояние (кадр 0) и корень экспорта ---------- */
    at(0);
    const R = new THREE.Group(); R.name = 'EXPORT';
    const tops = scene.children.filter(o => !excluded(o)); tops.forEach(o => R.add(o));
    scene.add(R); scene.updateMatrixWorld(true);
    exl.forEach(o => { if (o.parent && o.parent !== scene) o.parent.remove(o); });
    for (let i = 0; i < N; i++) if (rep[i]) R.attach(nodes[i]);
    /* вечно скрытые — не экспортируем */
    let hid = 0; for (let i = 0; i < N; i++) { const o = nodes[i]; if (!o.visible && !dyn[i] && o.parent) { o.parent.remove(o); hid++; } }
    log('hidden-removed', hid);
    /* ---------- рельефные карты → карты нормалей (в glTF нет bump) ---------- */
    const nmCache = new Map();
    function bumpToNormal(tex, k) { const key = tex.uuid + k; if (nmCache.has(key)) return nmCache.get(key);
      const img = tex.image; const w = Math.min(img.width, 1024), h = Math.min(img.height, 1024);
      const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.drawImage(img, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h).data, o = g.createImageData(w, h), od = o.data;
      const H = (x, y) => { x = (x + w) % w; y = (y + h) % h; const i = (y * w + x) * 4; return (d[i] + d[i + 1] + d[i + 2]) / 765; };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * k, dy = (H(x, y + 1) - H(x, y - 1)) * k;
        const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4; od[i] = (-dx / l * 0.5 + 0.5) * 255; od[i + 1] = (dy / l * 0.5 + 0.5) * 255; od[i + 2] = (1 / l * 0.5 + 0.5) * 255; od[i + 3] = 255; }
      g.putImageData(o, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = tex.wrapS; t.wrapT = tex.wrapT; t.repeat.copy(tex.repeat); t.offset.copy(tex.offset); t.flipY = tex.flipY;
      nmCache.set(key, t); return t; }
    let nb = 0; mname.forEach((n, m) => { if (m.bumpMap && !m.normalMap && m.bumpMap.image && m.bumpMap.image.width) { m.normalMap = bumpToNormal(m.bumpMap, Math.min(6, Math.max(0.6, m.bumpScale * 60))); nb++; } });
    log('bump->normal', nb);
    /* ---------- метаданные ---------- */
    const lamps = [], sky = []; R.updateMatrixWorld(true);
    R.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material)) { const n = o.material.name || ''; const wp = new THREE.Vector3(); o.getWorldPosition(wp);
      if (n.startsWith('LAMP#')) lamps.push(wp.toArray().map(v => +v.toFixed(3))); } });
    const sunDir = sun.position.clone().sub(sun.target.position).normalize().toArray();
    const meta = { fps: FPS, nf: NF, T: F.T, W: F.W, H: F.H, lamps, sunDir, cam, humans: HUM.ALL.map(H => H.root.name), shots: F.shots.map(s => ({ t0: s.t0, t1: s.t1, fov: s.fov, ext: !!s.ext, mb: s.mb || 0, dof: s.dof ? s.dof.k : 0 })), names: NAMES, caps: (F.caps || []).map(c => ({ t0: c.t0, t1: c.t1, no: c.no, a: c.a, b: c.b })) };
    /* ---------- экспорт ---------- */
    { const bad = []; const byName = new Map(nodes.map((o, i) => [o.name, i]));
      for (const t of tracks) { const nm = t.name.split('.')[0]; if (!THREE.PropertyBinding.findNode(R, nm)) { if (!bad.includes(nm)) bad.push(nm); } }
      log('tracks-missing-node', bad.length);
      bad.slice(0, 12).forEach(nm => { const i = byName.get(nm); let o = nodes[i], ch = []; while (o) { ch.push((o.name || o.type) + (o.visible ? '' : '(hid)') + (o.userData && o.userData.nm ? '[' + o.userData.nm + ']' : '') + (byName.has(o.name) && dyn[byName.get(o.name)] ? '*' : '')); o = o.parent; } log('  miss', ch.join(' < ')); }); }
    const tracksOk = tracks.filter(t => THREE.PropertyBinding.findNode(R, t.name.split('.')[0]));   // узлы под скрытым родителем в экспорт не попали — их дорожки не нужны
    const clip = new THREE.AnimationClip('film', NF / FPS, tracksOk);
    const glb = await new Promise(res => new THREE.GLTFExporter().parse(R, res, { binary: true, onlyVisible: false, animations: [clip], maxTextureSize: 2048, truncateDrawRange: true, embedImages: true }));
    window.__GLB = new Uint8Array(glb); window.__META = JSON.stringify(meta);
    return { nodes: N, dyn: D.length, tracks: tracks.length, keys: nKeys, bytes: glb.byteLength, lamps: lamps.length };
  }, FPS, NFs ? +NFs : 0);
  console.log('export', JSON.stringify(info), ((Date.now() - t0) / 1000).toFixed(0) + 's');
  const n = info.bytes, CH = 8 << 20; const fd = fs.openSync(OUT + '/scene.glb', 'w');
  for (let o = 0; o < n; o += CH) { const s = await p.evaluate((o, CH) => { const a = window.__GLB.subarray(o, o + CH); let s = ''; for (let i = 0; i < a.length; i += 32768) s += String.fromCharCode.apply(null, a.subarray(i, i + 32768)); return btoa(s); }, o, CH);
    fs.writeSync(fd, Buffer.from(s, 'base64')); }
  fs.closeSync(fd);
  fs.writeFileSync(OUT + '/meta.json', await p.evaluate(() => window.__META));
  console.log('written', n);
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
