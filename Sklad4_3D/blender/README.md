# Рендер ролика в Blender Cycles

Ролик `Sklad4_process_Cycles.mp4` (3:01, 4350 кадров, 24 к/с) — это фильм из HTML, просчитанный физическим рендером.
Нужны: Node.js + Chrome (для экспорта), Blender 4.2 LTS **или** Python-модуль `bpy` 4.2 (`pip install bpy==4.2.0`), ffmpeg.

Порядок (из корня проекта, рабочая папка — `blender/`):

```bash
node tools/exportgl.js Sklad4_realistic_film.html blender/exp10 24   # сцена фильма → glTF с анимацией + meta.json (камера, свет, подписи) ~1 мин
node tools/overlay.js  Sklad4_realistic_film.html blender/ovl10 1280 720 24   # подписи фильма — прозрачные PNG на каждый кадр ~4 мин
cd blender
python3 import.py exp10 base10.blend                 # импорт glTF (~1 мин)
python3 setup.py  exp10 base10.blend final10.blend   # материалы Cycles, свет, небо, камера по meta.json (~1 мин)
python3 testframes.py -- final10.blend t 500,2600    # пробные кадры
./runfinal.sh &                                      # все кадры в final10/ (≈14 ч на 2 ядрах, 4 сэмпла + OIDN, 960×540)
./ensure.sh                                          # если процесс умер — удаляет битые кадры и продолжает
./enc.sh 1260k ../Sklad4_process_Cycles.mp4          # 720p, подписи поверх, H.264 в два прохода, < 30 МБ
python3 proj.py -- final10.blend exp10/meta.json proj.blend README_RU.txt   # проект для передачи: имена, коллекции, маркеры
```

`enc.sh` подсвечивает (gamma 1.12) только уличные планы — диапазоны кадров `between(n,…)` взяты из
`meta.json → shots` (планы с `ext:true`); при изменении фильма пересчитать.
Ловушки рендера — в `docs/Склад4_фильм_и_замечания_по_расстановке.md`, раздел «Как сделан ролик».

## Кадры, пролёт и запечённый свет зала (18.11)

```bash
STILL=1 node tools/exportgl.js Sklad4_realistic_film.html blender/exps 24      # неподвижная сцена с грузом (демо учёта)
cd blender
blender -b -P import.py -- exps bases.blend
blender -b -P setup.py  -- exps bases.blend finals.blend
blender -b finals.blend -P stills.py -- exps/meta.json out 48 1600 900 all     # aerial, aisle, rows, loading, plan, truck (~1–2 мин на кадр, 4 ядра)
blender -b finals.blend -P stills.py -- exps/meta.json fly 24 1280 720 fly     # пролёт 13 с: f0000…f0312.jpg; дальше: [кадр начала] [шаг] (черновик: 4 320 180 fly 0 12)
ffmpeg -framerate 24 -i fly/f%04d.jpg -c:v libx264 -crf 20 -pix_fmt yuv420p ../docs/снимки_18.11_WMS_Blender_фуры/Пролёт_Cycles_13с.mp4
blender -b finals.blend -P bake.py -- exps/meta.json hall.png hall.json 384 64     # свет зала → hall.png.npy
python3 bake_post.py hall.png.npy ../assets/hall_light.png ../assets/hall_light.json   # затем python3 build.py
```
