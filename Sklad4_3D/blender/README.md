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
