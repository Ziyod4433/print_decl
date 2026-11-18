// Быстрые проверки проекта: node tools/check.js  (npm test). Нужны npm install и Chrome или Edge (tools/_chrome.js, CHROME_PATH).
// Полный набор (живой процесс два цикла, столкновения в фильме и т. д.) — CLAUDE.md §9 и tools/README.md.
const { spawnSync } = require('child_process'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), M = 'Sklad4_realistic_film.html';
const CHECKS = [
  ['погрузчик без рывков',          ['tools/ev.js', M, 'tools/checks/forklift_jumps.js'],     /"jumps":\[\]/],
  ['правка пользователя в фильме',  ['tools/ev.js', M, 'tools/checks/user_edits_in_film.js'], /"diff":\[\]/],
  ['планы фильма',                  ['tools/ev.js', M, 'tools/checks/film_shots.js'],         /"bad":\[\]/],
  ['учёт груза в 3D',               ['tools/ev.js', M, 'tools/checks/stock.js'],              /"bad":\[\]/],
  ['WMS',                           ['tools/wms_ev.js', 'Buraq_WMS.html', 'tools/checks/wms.js'], /"bad":\[\]/],
  ['обход',                         ['tools/walktest.js'],                                    /"walk":false,"simOn":true/],
];
let fail = 0;
for (const [name, args, ok] of CHECKS) {
  const t0 = Date.now(), r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', timeout: 900000 });
  const out = (r.stdout || '') + (r.stderr || ''), good = r.status === 0 && ok.test(out);
  console.log(`${good ? '✓' : '✗'} ${name.padEnd(30)} ${((Date.now() - t0) / 1000).toFixed(0)} с`);
  if (!good) { fail++; console.log(out.slice(-1500)); }
}
console.log(fail ? `Не прошло: ${fail}` : 'Все быстрые проверки прошли');
process.exit(fail ? 1 : 0);
