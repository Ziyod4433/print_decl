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
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/film_shots.js` | планы камеры и подписи фильма: подряд, без разрывов и перекрытий | `"bad":[]`, `"capsBad":[]` |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/variant_static.js` | кнопка варианта приёмки в обычной сцене: машина, конвейер, стойки и люди к П1 и обратно, фильм и живой процесс не сбивают, правка у П1 — отдельно | нормы — в шапке файла |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/film_restore.js` | вход/выход из фильма возвращает сцену как была | в `diff` только `n` (число узлов: объекты фильма строятся один раз) |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/user_edits_in_film.js` | правка пользователя видна в фильме, якоря на месте | `"diff":[]`, есть `warn` по стойке на маршруте |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/pick.js` | выбор объектов мышью (подпись `sig`) | сравнивать `sig` до/после |
| `NOBATCH=1 node tools/ev.js Sklad4_realistic_film.html tools/checks/obb.js` | пересечения коробов в фильме (с 15.10 снова работает: `F.WTbox` — объект) | нет постоянных пересечений > 7 мм; краткие (1–5 кадров) при передаче короба — допустимы |
| `bash tools/run_coll.sh` | столкновения в фильме: погрузчик, вилы, стойка, люди | пустой список |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/walk_knock.js` | обход: наезд погрузчика — падение и подъём | `hits` 1, камера опускается до ~0,23 м и через ~3,5 с встаёт |
| `node tools/simrun.js Sklad4_realistic_film.html 30000 3` | живой процесс: два полных цикла (третий аргумент — на каком цикле остановиться, по умолчанию 2): погрузчик, вилы и стойка на вилах против препятствий (`HITS`), люди рядом с погрузчиком (`HUM`), люди против неподвижных препятствий, аппаратов DWS и стоек (`HP`, с 14.10); ~40 мин счёта | доходит до `=== НОВЫЙ ЦИКЛ 3`, `HITS` пусто, `HUM {}`, `HP []` |
| `SIMV=2 node tools/simrun.js Sklad4_realistic_film.html 30000 3` | то же для второго варианта приёмки (машина через П1 на полосе Л1–П1) | `HITS` пусто, `HUM {}`, `HP []` |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/people_body.js` | тело людей: ботинки над полом и не перевёрнуты во всех позах, шаге и беге; кисти и предплечья не в куртке и жилете | нормы — в шапке файла |
| `NOBATCH=1 node tools/ev.js Sklad4_realistic_film.html tools/checks/people_space.js` | люди обычного вида: тело (цилиндр r 0,2) не в оборудовании, стойках, стенах и не друг в друге | `bad []`, `pairs []` |
| `NOBATCH=1 node tools/ev.js Sklad4_realistic_film.html tools/checks/people_space_film.js` | то же в фильме, кадры каждые 0,25 с | `bad []` |
| `NOBATCH=1 node tools/ev.js Sklad4_realistic_film.html tools/checks/people_space_sim.js` | то же в живом процессе до `window.__PSS_T` с (по умолчанию 1500; два цикла — 3200), вариант П1 — `window.__SIMV=2` (строкой перед скриптом); ~10 мин | `bad []` или краткие касания коробов у ряда (≤0,12 м) |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/sim_timeline.js` | хронология цикла (машины, задачи погрузчика, журнал) | — |
| `node tools/test_save.js` | автосохранение правки в сам файл и открытие копии | шаг 2 видит правку |
| `node tools/ev.js Sklad4_realistic_film.html tools/checks/walk_phys.js` | физика обхода: колонна, решётка, спрыгнуть с платформы Л2, подняться по лестнице, прыжок, не пройти сквозь Goodscan и портальный DWS | нормы — в шапке файла |
| `node tools/walktest.js` | режим обхода включает живой процесс, ходьба | `walk:true, simOn:true`, камера сдвинулась; кадр в `out/walk.jpg` |
| `node tools/filmtest.js <html> out/ft 960 540 6,14,22,…` | контрольные кадры фильма в моменты t (с) | смотреть глазами |
| `node tools/filmclean.js <html> out/fc 1920 1080 1.5,6,10,…` | те же кадры без надписей (стартовые кадры для Higgsfield image-to-video) | смотреть глазами |
| `node tools/still.js <html> out/st 1600 900 shots.json` | стоп-кадры с постобработкой; в кадре можно задать `js` (до камеры) и `jsAfter` (после — например, `POST.P.exposure=EXPO.at(camera,false)`) | — |
| `node tools/close.js <html> out/cl 1280 720 shots.json` | крупные планы фильма у объектов | — |
| `node tools/simshot.js <html> out/sim 1280 720 tools/checks/sim_shots_example.json` | кадры живого процесса (по времени T или по условию `until`), с постобработкой и экспозицией как у пользователя | смотреть глазами |
| `node tools/imgrun.js <html> <скрипт.js> out/dir` | выполнить в странице скрипт, вернувший `{info,imgs:[dataURL]}`, сохранить кадры `f00.jpg…` (обход: третье лицо, удар) | смотреть глазами |
| `SIMV=2 node tools/simshot.js …` | кадры живого процесса во втором варианте приёмки | — |
| `node tools/exportgl.js`, `node tools/overlay.js` | экспорт фильма для Blender | см. `blender/README.md` |
