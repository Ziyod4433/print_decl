// Локальный сервер проекта без зависимостей: node tools/serve.js [порт]  (npm start)
// Отдаёт папку проекта на http://localhost:8080 и открывает стартовую страницу index.html в браузере.
// Слушает только 127.0.0.1 — с других компьютеров сети не виден.
const http = require('http'), fs = require('fs'), path = require('path'), { exec } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const PORT = +(process.argv[2] || process.env.PORT || 8080);
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.webm': 'video/webm' };
const HIDE = /^(\.git|node_modules)([\\/]|$)/i;                  // и с обратной косой чертой (Windows)

const srv = http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url.replace(/^\/+/, '/'), 'http://x').pathname).replace(/^\/+/, ''); } catch (e) { res.writeHead(400); return res.end('bad url'); }
  if (!rel) rel = 'index.html';
  const file = path.resolve(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || HIDE.test(rel)) { res.writeHead(403); return res.end('forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Нет файла: ' + rel); }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {                                                   // видео перематывается только с Range
      const a = range[1] ? +range[1] : 0, b = range[2] ? +range[2] : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 });
      return fs.createReadStream(file, { start: a, end: b }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
});
srv.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Порт ${PORT} занят — запустите: npm start -- ${PORT + 1}` : e.message); process.exit(1); });
srv.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/`;
  console.log(`Склад №4 — ${url}\n  WMS:        ${url}Buraq_WMS.html\n  3D-модель:  ${url}Sklad4_realistic_film.html\n  Варианты:   ${url}Sklad4_variants_ABC.html\nОстановить — Ctrl+C`);
  if (!process.env.NO_OPEN) {
    const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
    exec(cmd, () => {});
  }
});
