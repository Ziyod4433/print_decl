# Проверки в безголовом Chrome

Все скрипты открывают собранный `Sklad4_realistic_film.html` в Chrome/Edge через puppeteer-core
(путь к браузеру — `tools/_chrome.js`, можно задать `CHROME_PATH`). Перед запуском: `npm install`.
`Math.random` в странице подменяется детерминированным — результаты повторяемы.
В безголовом режиме без видеокарты WebGL идёт программно (SwiftShader): ~1 кадр/с — о скорости по этим прогонам не судить.

| Команда | Что проверяет | Норма |
|---|---|---|
| `python3 build.py` | сборка | без AssertionError, «собрано … байт» |
| `node tools/ev.js <html> <snippet.js>` | выполнить JS в странице, вывести JSON | — |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/forklift_jumps.js` | рывки погрузчика в фильме (скачки позиции/курса) | `"jumps":[]` |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/film_restore.js` | вход/выход из фильма возвращает сцену как была | в `diff` только `n` (число узлов: объекты фильма строятся один раз) |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/user_edits_in_film.js` | правка пользователя видна в фильме, якоря на месте | `"diff":[]`, есть `warn` по стойке на маршруте |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/pick.js` | выбор объектов мышью (подпись `sig`) | сравнивать `sig` до/после |
| `NOBATCH=1 node tools/ev.js Sklad4_realistic_film.html tools/checks/obb.js` | пересечения коробов в фильме | нет постоянных пересечений > 7 мм |
| `bash tools/run_coll.sh` | столкновения в фильме: погрузчик, вилы, стойка, люди | пустой список |
| `node tools/simrun.js Sklad4_realistic_film.html 12000` | живой процесс: полный цикл (~115 мин процесса, ~3,5 мин счёта) со столкновениями | доходит до `=== НОВЫЙ ЦИКЛ 2`, `HITS` пусто |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/sim_timeline.js` | хронология цикла (машины, задачи погрузчика, журнал) | — |
| `node tools/test_save.js` | автосохранение правки в сам файл и открытие копии | шаг 2 видит правку |
| `node tools/walktest.js` | режим обхода включает живой процесс, ходьба | `walk:true, simOn:true`, камера сдвинулась; кадр в `out/walk.jpg` |
| `node tools/filmtest.js <html> out/ft 960 540 6,14,22,…` | контрольные кадры фильма в моменты t (с) | смотреть глазами |
| `node tools/still.js <html> out/st 1600 900 shots.json` | стоп-кадры с постобработкой | — |
| `node tools/close.js <html> out/cl 1280 720 shots.json` | крупные планы фильма у объектов | — |
| `node tools/simshot.js <html> out/sim 1280 720 tools/checks/sim_shots_example.json` | кадры живого процесса (по времени T или по условию `until`) | смотреть глазами |
| `node tools/exportgl.js`, `node tools/overlay.js` | экспорт фильма для Blender | см. `blender/README.md` |
