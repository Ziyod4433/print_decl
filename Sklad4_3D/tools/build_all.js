// Сборка всех трёх файлов проекта: node tools/build_all.js  (npm run build)
// Ищет Python 3 под любым именем (python3 — Linux/Mac, python или py — Windows) и запускает build.py, build.py --abc, build.py --wms.
const { spawnSync } = require('child_process'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const cands = process.platform === 'win32' ? [['py', ['-3']], ['python', []], ['python3', []]] : [['python3', []], ['python', []]];
const py = cands.find(([c, a]) => { const r = spawnSync(c, [...a, '--version'], { encoding: 'utf8' }); return r.status === 0 && /Python 3/.test(r.stdout + r.stderr); });
if (!py) { console.error('Не найден Python 3. Установите с python.org (галочка «Add to PATH») и повторите.'); process.exit(1); }
const only = process.argv[2];                                        // model | abc | wms — собрать один файл
const jobs = [['model', []], ['abc', ['--abc']], ['wms', ['--wms']]].filter(j => !only || j[0] === only);
for (const [name, args] of jobs) {
  const t0 = Date.now(), r = spawnSync(py[0], [...py[1], 'build.py', ...args], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) { console.error(`✗ ${name}\n${r.stdout}${r.stderr}`); process.exit(1); }
  console.log(`✓ ${name.padEnd(5)} ${((Date.now() - t0) / 1000).toFixed(1)} с  ${(r.stdout.trim().split('\n').pop() || '')}`);
}
