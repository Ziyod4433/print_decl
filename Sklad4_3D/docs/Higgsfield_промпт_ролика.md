# Промпт-пак для Higgsfield: ролик «Склад №4 — перегрузка Китай → Казахстан»

Ролик повторяет фильм из `Sklad4_realistic_film.html` (15 шагов, 3:01) в кинематографичном виде: 16 сцен по 5–8 с,
итого ≈1:45. Делается **image-to-video**: опорный кадр каждой сцены берётся из нашего фильма
(папка `docs/higgsfield_кадры/`, 1920×1080), к нему — промпт из этого файла. Так модель держит нашу планировку,
цвета машин и техники, а не выдумывает свой склад.

Состояние на 13.10.2026 (вечер): опорные кадры подготовлены (`docs/higgsfield_кадры/`, чистый рендер без надписей),
аниматик собран (`раскадровка_аниматик.mp4`, 1:33). CLI Higgsfield залогинен в аккаунт **ziedullas@gmail.com** (бесплатный план,
было 10 кредитов), сеть окружения открыта для хостов Higgsfield. **Первый пробный клип сгенерирован**: сцена 2, MiniMax Hailuo,
6 с, 1364×768, 6 кредитов — `docs/higgsfield_кадры/проба_minimax_hailuo_сцена02.mp4`; осталось 4 кредита.
На бесплатном плане видеомодели в основном закрыты (`job_minimum_basic_plan_required`): Seedance 2.0 mini и Grok 1.5 lite
отказали, MiniMax Hailuo принял. Подробности и выводы — §7, §9, §10.

---

## 1. Как генерировать (порядок действий)

1. Модель: **Seedance 2.5** (`seedance_2_5`) — лучший баланс реализма людей/техники и движения камеры, 16:9, 1080p, звук включён.
   Запасные: `minimax_h3` (2K, точнее держит стартовый кадр, без звука), `kling3_0` (мультишот, хороший звук).
2. Для каждой сцены: `start_image` = опорный кадр сцены, промпт = **общий стиль (§2) + описание объектов (§3) + сцена (§4)**,
   негатив (§5), длительность из таблицы сцены. Сид фиксировать и переиспользовать для соседних сцен — так одежда людей и машины не «плывут».
3. Делать по 2 варианта на сцену, брать лучший. Сцены 7 и 13 (заезд и выезд автопоезда) чаще всего требуют 3-го дубля — модели любят «телепортировать» прицеп.
4. Монтаж (§6): Higgsfield `video-montage` или любой редактор — порядок сцен, стыки, подписи шагов (русские субтитры из §4), музыка, титры.
5. Готовый ролик — 1920×1080, 25 к/с, H.264, ≈1:45.

Команды через MCP Higgsfield (как делал ассистент), для справки:
`generate_video {model:"seedance_2_5", aspect_ratio:"16:9", duration:6, resolution:"1080p", medias:[{role:"start_image", value:"<media_id>"}], prompt:"…"}`
Перед запуском — `get_cost:true` (предварительная цена без списания).

---

## 2. Общий стиль (вставлять в начало каждого промпта)

```
Photorealistic industrial documentary footage, shot on a full-frame cinema camera, 35mm lens, natural daylight
pouring through long ribbon skylights in a white corrugated-steel roof, soft volumetric light shafts with faint dust,
clean light-grey polished concrete floor with subtle tyre marks and soft reflections, white steel columns,
green welded-mesh fencing between aisles, a turquoise fabric partition curtain hanging under the roof in the distance,
cool neutral colour grade with warm sunlight accents, shallow but readable depth of field, smooth stabilised camera,
real-time speed (no slow motion, no time-lapse), highly detailed, 16:9.
Location: Buraq Logistics cross-dock warehouse No. 4, block 4-1, Yuzhe International Logistics Park, Khorgos,
on the China–Kazakhstan border; dry steppe and the Dzungarian Alatau mountains visible outside the gates.
```

## 3. Объекты и люди (единый блок для постоянства облика)

```
CHINESE TRUCK: Chinese 8x4 stake-body truck (栏板 lattice sides), white cab, dark-green steel stake sides with
horizontal lattice rails, wooden deck, blue Chinese licence plate 新F·3K218, loaded with brown corrugated cartons
of four sizes with white shipping labels and Chinese print.
KAZAKH ROAD TRAIN: white Euro tractor unit with a 145 m³ tandem combination — rigid truck body plus full trailer,
both with light-grey curtain sides, large dark-blue "BURAQ LOGISTICS" lettering and "KHORGOS · ALMATY · ASTANA"
below it on the curtains, "BURAQ LOGISTICS" door decals on the cab, Kazakh licence plates; when the right-side curtains
are opened a steel lattice frame with a rectangular side opening in the middle of each body is visible.
FORKLIFT: 3-tonne electric counterbalance forklift, dark graphite-grey body, black mast and forks, amber beacon,
seated driver in a hi-vis vest and white hard hat, blue LED headlights.
TELESCOPIC CONVEYOR: orange telescopic belt conveyor, 4.6 m base with two extending sections reaching 9 m,
black belt, yellow operator platform with railings on the extending tip, hydraulic front leg, boxes riding the belt.
DWS STATION: stainless dimension-weight-scan station — scale platform, overhead scanner arch with red laser lines,
a monitor showing weight, dimensions and barcode.
POST PALLETS: steel post pallets ("rack pallets") 1.5 × 1.5 × 1.6 m, galvanised frame with four corner posts
ending in cups so an upper pallet seats onto a lower one; each holds 20 cartons; a coloured day tag (e.g. "ЧТ")
hangs on the front post.
CELLS: floor cells A1…A15 and B1…B15 painted on the concrete, two tiers of post pallets per cell, address signs.
WORKERS: warehouse crew in orange and yellow hi-vis vests over dark-blue work jackets, grey work trousers with
reflective bands, white and yellow hard hats, ID badges on lanyards; the shift lead carries a tablet and a radio;
loaders wear gloves; the storekeeper uses a smartphone for photos; the security guard at the gate wears a dark uniform.
Gates: sectional doors with glazing — L2 on the west side (loading dock 1 m above the yard), P2 on the east side
(drive-in gate 4 m high).
```

## 4. Сцены (порядок монтажа)

Для каждой сцены теперь есть **пара кадров** (начальный и конечный из одного плана фильма) и короткий промпт — это основной режим после пробы 13.10;
длинные промпты ниже остаются для text-to-video и для платных моделей. Запуск всех сцен одной командой: `bash tools/higgsfield/run_scenes.sh <модель> [id…]`
(`DRY=1` — только оценка; таблица сцен — `tools/higgsfield/scenes.json`; результаты — `docs/higgsfield_кадры/клипы/`). По оценке CLI: 16 сцен × 6 с на MiniMax Hailuo = 96 кредитов.

Для каждой сцены: опорный кадр, длительность, движение камеры, промпт, субтитр (подпись шага, как в фильме), звук.
`t` — секунда нашего фильма, из которой взят кадр.

### 0. Титр · общий план (t 1.5) — `00_титр_общий_план.jpg`, 5 с
Пара кадров для генерации «начало → конец» (один план камеры): `00_титр_общий_план.jpg` (t 1.5) → `00_титр_общий_план_конец.jpg` (t 4.4), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
Aerial drone shot slowly descending toward a modern logistics warehouse in Khorgos; a Chinese stake truck approaches the west loading dock; mountains on the horizon. Smooth forward drone move, realistic daylight.
```
Камера: медленный подлёт дрона сверху-сбоку к открытым воротам, лёгкий наклон вниз.
```
Slow aerial drone approach over a modern logistics warehouse in Khorgos at golden morning light; the long white
hall with ribbon skylights, two loading gates on the west side, a Chinese stake truck approaching the dock, trucks
in the yard, dry steppe and snow-capped Dzungarian Alatau mountains on the horizon. Gentle forward dolly with a
slight downward tilt, crisp realistic detail, cinematic establishing shot.
```
Субтитр: «СКЛАД №4 · БЛОК 4-1 · YUZHE PARK, ХОРГОС — перегрузка Китай → Казахстан». Звук: ветер, далёкие машины.

### 1. Заезд к воротам Л2 (t 6) — `01_заезд_Л2.jpg`, 6 с
Пара кадров для генерации «начало → конец» (один план камеры): `01_заезд_Л2.jpg` (t 6) → `01_заезд_Л2_конец.jpg` (t 7.2), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
A Chinese stake truck with green lattice sides drives slowly along the yard toward the warehouse loading gate, dust behind the wheels, mountains in the background. Static camera with slight pan following the truck.
```
Камера: статичная с лёгким параллаксом, с уровня площадки, 45° к воротам.
```
The Chinese stake truck reverses slowly toward loading gate L2, brake lights glowing, reversing beeper, tyres
crunching dust on the asphalt apron one metre below the hall floor. An LPR camera on a pole above the gate flashes
once as the plate 新F·3K218 passes; a security guard in dark uniform walks up, checks the seal on the tailgate and
compares a paper document with the plate. Natural motion, realistic weight of the truck as it stops and settles
on its suspension.
```
Субтитр: «1 · Заезд к воротам Л2 — LPR фиксирует номер и время · фото пломбы · сверка документов». Звук: дизель, бипер заднего хода.

### 2. Конвейер выдвигается в кузов (t 12) — `02_конвейер_выдвигается.jpg`, 6 с
Пара кадров для генерации «начало → конец» (один план камеры): `02_конвейер_выдвигается.jpg` (t 12) → `02_конвейер_выдвигается_конец.jpg` (t 18.7), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
Inside the truck bed: the orange telescopic conveyor extends from the left, its tip with the yellow operator platform sliding smoothly into the bed next to the stacked cartons while the worker watches. Camera static, only the conveyor moves.
```
Камера: низкая, от пола зала вдоль конвейера к воротам; медленный долли вперёд.
```
Inside the hall the sectional door L2 rolls up, daylight floods in. The folded orange telescopic belt conveyor
starts to extend: its two inner sections slide forward smoothly, the yellow operator platform riding on the tip,
until the tip rests just inside the open cargo bed of the Chinese truck. Hydraulic hum, slight mechanical sway as
it reaches full extension. Low camera on the floor dollying slowly toward the gate along the conveyor.
```
Субтитр: «2 · Конвейер выдвигается в кузов — телескопическая лента: база 4,6 м + 4,6 м хода». Звук: ворота, гидравлика.

### 3. Выгрузка лентой (t 20) — `03_выгрузка_лентой.jpg`, 8 с
Пара кадров для генерации «начало → конец» (один план камеры): `03_выгрузка_лентой.jpg` (t 20) → `03_выгрузка_лентой_конец.jpg` (t 24.4), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
Workers in orange vests place brown cartons onto the moving black conveyor belt; the cartons ride along the orange conveyor toward the camera. Belt motion steady, camera static.
```
Камера: плечевая, полуобщий план от конца ленты в сторону кузова, лёгкое покачивание.
```
A worker standing in the truck bed lifts brown cartons one by one from the stacks and places them onto the moving
black belt; the cartons ride down the orange conveyor into the hall, bump softly into a queue; at the end of the belt
a packer takes each carton off and sets it down. Four carton sizes: small, standard, long and large. Realistic
belt motion, boxes slightly slipping as they accelerate, hands and gloves detailed.
```
Субтитр: «A — малый · B — стандарт · C — длинный · D — крупный». Звук: лента, картон, голоса.

### 4. Образец каждого типа — на DWS (t 32) — `04_образец_на_DWS.jpg`, 6 с
Пара кадров для генерации «начало → конец» (один план камеры): `04_образец_на_DWS.jpg` (t 32) → `04_образец_на_DWS_конец.jpg` (t 33.5), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
A worker sets a carton on the dimension-weight-scan station; red scanner laser lines sweep over the box; the monitor updates. Slow push-in.
```
Камера: средний план, медленный наезд на экран станции.
```
The shift lead in an orange vest carries a sample carton to the stainless DWS station and sets it on the scale
platform; red scanner laser lines sweep across the box, the monitor shows weight, dimensions and the barcode in
about two seconds; he picks the box up again and carries it back toward the post pallet. Slow push-in on the screen.
```
Субтитр: «3 · Образец каждого типа — на DWS: вес, габарит и штрихкод за 2 секунды». Звук: пищание сканера.

### 5. Сборка в стоечный поддон (t 43) — `05_сборка_стойки.jpg`, 6 с
Пара кадров для генерации «начало → конец» (один план камеры): `05_сборка_стойки.jpg` (t 43) → `05_сборка_стойки_конец.jpg` (t 45), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
Two workers stack brown cartons into a steel post pallet next to the conveyor end, heavy boxes below, light boxes on top. Natural hand movement, camera static.
```
Камера: статичная, 3/4 ракурс на стойку у конца ленты.
```
Two workers stack cartons into a steel post pallet beside the end of the conveyor: the heavy large cartons go on
the bottom layer, lighter small ones on top, neat rows with small gaps; the packer hangs a coloured day tag reading
"ЧТ" on the front post and sticks an address label. Twenty cartons fill the pallet. Natural hand movements,
cardboard texture, no stretch film anywhere.
```
Субтитр: «4 · Сборка в стоечный поддон — тяжёлое вниз, лёгкое наверх · плёнка не нужна». Звук: картон, шаги.

### 6. Размещение по FIFO · второй ярус (t 60) — `06_FIFO_второй_ярус_A6.jpg`, 8 с
Пара кадров для генерации «начало → конец» (один план камеры): `06_FIFO_второй_ярус_A6.jpg` (t 60) → `06_FIFO_второй_ярус_A6_конец.jpg` (t 62.5), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
A dark-grey electric forklift carries a loaded steel post pallet along the warehouse aisle toward the camera, amber beacon turning. Camera tracks slowly alongside.
```
Камера: следящая сбоку за погрузчиком, затем остановка и наклон вверх на посадку стойки.
```
The dark-grey electric forklift lifts the loaded post pallet, mast tilting back slightly, and drives along the
concrete aisle past white columns and green mesh fences; it turns toward floor cell A6, raises the pallet to the
second tier and lowers it slowly so its four posts seat into the cups of the pallet already standing there,
a light metallic clink as it settles. The driver looks over his shoulder; amber beacon turning. Camera tracks
alongside, then stops and tilts up for the placement.
```
Субтитр: «5 · Размещение по FIFO — ячейка A6, тот же день приёмки (ЧТ) · опоры садятся в чаши нижней стойки». Звук: электромотор, гидравлика, клик.

### 7. Автопоезд заезжает через П2 (t 80) — `07_автопоезд_через_П2.jpg`, 8 с
Пара кадров для генерации «начало → конец» (один план камеры): `07_автопоезд_через_П2.jpg` (t 80) → `07_автопоезд_через_П2_конец.jpg` (t 85), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
A white road train with grey curtain sides drives slowly into the warehouse hall through the tall gate and stops; workers walk toward it. Camera static, truck moves.
```
Камера: широкий план изнутри зала на восточные ворота, медленный отъезд назад.
```
The white Kazakh tandem road train — tractor, rigid body and full trailer with light-grey curtain sides and
dark-blue BURAQ LOGISTICS lettering — drives slowly in through the tall east gate P2 into the hall, air brakes
hiss, and it stops at the painted stop line with its right side toward the floor cells. Workers place yellow wheel
chocks and start sliding the right-hand curtains open, revealing the lattice frame with a side opening in each body.
Camera slowly pulls back, keeping the whole combination in frame; realistic articulation of the trailer.
```
Субтитр: «6 · Автопоезд заезжает через П2 — тандем 145 м³ встаёт внутри, правым бортом к ячейкам · упоры · шторы открыты». Звук: дизель, пневматика, шторы.

### 8. Отбор по FIFO (t 97) — `08_отбор_A14.jpg`, 6 с
Пара кадров для генерации «начало → конец» (один план камеры): `08_отбор_A14.jpg` (t 97) → `08_отбор_A14_конец.jpg` (t 99.2), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
The forklift lifts the upper steel post pallet with cartons out of the floor cell and backs away with it. Camera static, slow motion of the mast.
```
Камера: средний план от прохода, лёгкое панорамирование за вилами.
```
The forklift approaches floor cell A14, where two post pallets stand stacked; the day tag on the upper one reads
"ПН" (Monday) — the oldest date. The forks slide under the upper pallet, lift it clear of the cups and tilt back;
the forklift reverses out onto the aisle with the load. Camera pans gently following the forks.
```
Субтитр: «7 · Отбор по FIFO — первой уходит самая старая дата: ПН, ячейка A14, сначала верхняя стойка». Звук: электромотор.

### 9. Стойка — в проём кузова (t 114.5) — `09_стойка_в_проём.jpg`, 8 с
Пара кадров для генерации «начало → конец» (один план камеры): `09_стойка_в_проём.jpg` (t 114.5) → `09_стойка_в_проём_конец.jpg` (t 116.5), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
The forklift holds a loaded post pallet at the side opening of the truck body; two loaders inside take cartons one by one and set them on the truck floor. Camera static.
```
Камера: от кузова через проём на стойку и погрузчик, затем на руки грузчиков.
```
The forklift holds the loaded post pallet raised level with the truck floor, right at the side opening of the
rigid body; two loaders inside the body take cartons from the pallet one at a time and set them down in their
own lanes across the floor — small, long, standard, large side by side — working from the far end toward the
opening. The forklift mast flexes slightly under the load; the driver watches the loaders. Camera inside the body
looking out through the opening, then a slow pan down to the loaders' hands.
```
Субтитр: «8 · Стойка — в проём кузова, на поднятых вилах · грузчики кладут по одному коробу в свою дорожку». Звук: картон, шаги по полу кузова.

### 10. Пустая стойка — к приёмке (t 127) — `10_пустая_стойка_к_приёмке.jpg`, 5 с
Пара кадров для генерации «начало → конец» (один план камеры): `10_пустая_стойка_к_приёмке.jpg` (t 127) → `10_пустая_стойка_к_приёмке_конец.jpg` (t 128.3), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
The forklift drives away along the aisle carrying an empty steel post pallet; workers continue loading in the background. Camera static.
```
Камера: широкий план вдоль южной магистрали.
```
The forklift drives away from the road train along the main aisle carrying the now-empty post pallet toward the
reception area at gate L2, passes the columns, turns and sets it down; in the background the loaders keep working
in the open body. Smooth tracking shot, realistic acceleration and braking nod of the forklift.
```
Субтитр: «9 · Пустая стойка — к приёмке · следующая из той же ячейки — A14 освобождается целиком». Звук: зал, электромотор.

### 11. Прицеп · погрузка через проём (t 139) — `11_прицеп_через_проём.jpg`, 6 с
Пара кадров для генерации «начало → конец» (один план камеры): `11_прицеп_через_проём.jpg` (t 139) → `11_прицеп_через_проём_конец.jpg` (t 140.3), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
The forklift driver holds the post pallet level with the trailer floor while loaders inside the trailer take cartons. Camera static, subtle motion.
```
Камера: 3/4 на прицеп, статичная.
```
The forklift brings the second post pallet from cell A14 to the trailer, whose side opening faces the aisle; it
lifts the pallet to floor height and holds it in the trailer opening while a second pair of loaders inside the
trailer unload cartons into their lanes. Columns and green fencing in the background, daylight from the skylights.
```
Субтитр: «10 · Прицеп — погрузка через проём · вторая стойка · своя пара грузчиков». Звук: как в 9.

### 12. Пустые стойки — в два яруса у Л2 (t 156) — `12_пустые_стойки_у_Л2.jpg`, 5 с
Пара кадров для генерации «начало → конец» (один план камеры): `12_пустые_стойки_у_Л2.jpg` (t 156) → `12_пустые_стойки_у_Л2_конец.jpg` (t 160.2), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
The forklift lowers an empty steel post pallet onto another empty one, the posts seating into the cups, then backs away. Camera static.
```
Камера: статичная, средний план на приёмку.
```
At the reception area by gate L2 the forklift lowers an empty post pallet onto another empty one, the posts
seating into the cups with a soft clink — two tiers of empty pallets ready for the next truck from China; the
orange conveyor stands folded beside them. Calm, tidy composition.
```
Субтитр: «11 · Пустые стойки — в два яруса у ворот Л2 · готовы к следующей машине из Китая». Звук: клик металла.

### 13. Фото кузова · шторы · пломба (t 169) — `13_фото_шторы_пломба.jpg`, 8 с
Пара кадров для генерации «начало → конец» (один план камеры): `13_фото_шторы_пломба.jpg` (t 169) → `13_фото_шторы_пломба_конец.jpg` (t 173.7), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
Two workers slide the grey curtain of the truck body closed along its rail; a storekeeper photographs the body with a phone. Camera static.
```
Камера: от средней к крупной — руки с телефоном, затем штора закрывается в кадр.
```
The loaders jump down from the body to the concrete floor and land with a slight crouch; the storekeeper raises a
smartphone and photographs the fully loaded body through the opening — neat lanes of cartons; two workers slide the
grey curtain closed along its rail, the blue BURAQ LOGISTICS lettering gliding into frame; a hand snaps a seal
onto the curtain lock. Camera moves from a medium shot to a close-up on the hands.
```
Субтитр: «12 · Фото кузова · шторы · пломба — 100 % скан против плана · фото уходит клиенту». Звук: затвор, шторы, щелчок пломбы.

### 14. Выезд через П2 (t 177) — `14_выезд_через_П2.jpg`, 6 с
Пара кадров для генерации «начало → конец» (один план камеры): `14_выезд_через_П2.jpg` (t 177) → `14_выезд_через_П2_конец.jpg` (t 178.8), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
The white road train reverses slowly in a straight line out of the warehouse through the gate into daylight. Camera static inside the hall.
```
Камера: статичная изнутри зала на ворота, автопоезд уходит из кадра.
```
Wheel chocks are pulled away; the white tandem road train reverses slowly in a straight line out through gate P2
into bright daylight, reversing beeper echoing in the hall, the LPR camera above the gate flashing once as the
trailer plate passes. The hall is left quiet and tidy, light shafts from the skylights.
```
Субтитр: «13 · Выезд через П2 — задним ходом по прямой · LPR на выезде». Звук: бипер, дизель, тишина зала.

### 15. Финал (t 184) — `15_финал.jpg`, 5 с
Пара кадров для генерации «начало → конец» (один план камеры): `15_финал.jpg` (t 184) → `15_финал_конец.jpg` (t 185.2), 6 с. Короткий промпт для пары (рекомендуется, см. §10):
```
Aerial drone shot rising and pulling back from the warehouse roof with skylights, logistics park and mountains in late afternoon light.
```
Камера: отлёт дрона снаружи вверх и назад.
```
Aerial drone shot rising and pulling back from the east gate as the road train leaves the yard onto the road toward
Kazakhstan; the warehouse roof with skylights, the logistics park, mountains on the horizon in late afternoon light.
```
Субтитр: «Цикл машины ≤ 4 ч · FIFO без исключений — Buraq Logistics · Склад №4, блок 4-1 · Хоргос». Звук: ветер, музыка на титры.

## 5. Негативный промпт (для моделей, которые его принимают; для Seedance — добавить фразой «avoid: …» в конец)

```
avoid: cartoon, CGI look, low-poly, video-game render, blurry, warped hands, extra limbs, floating boxes,
boxes passing through each other, forklift or truck sliding sideways, trailer teleporting, flickering textures,
text gibberish on signs, watermark, lens flare overload, slow motion, time-lapse, fisheye, night scene.
```

## 6. Монтаж

- Порядок — сцены 0…15, стыки «по движению» (конец движения камеры одной сцены → начало следующей), без модных
  переходов; между блоками «приёмка» (1–6) и «погрузка» (7–14) — одна жёсткая склейка с паузой звука 0,5 с.
- Подписи шагов — как в фильме: номер и заголовок крупно (Barlow Condensed / аналог, белый, тень), под ним пояснение
  мельче; плашка полупрозрачная тёмная внизу слева; появляются через 0,5 с после начала сцены, держатся до её конца.
- Музыка: спокойный индустриальный эмбиент с ритмом ≈90 bpm, под шаг процесса; на сценах 7 и 13 — акцент.
- Цвет: единый грейдинг (нейтрально-холодный зал, тёплый дневной свет снаружи), лёгкая виньетка; по яркости ровнять
  по полу зала — он должен быть одинаково светлым во всех сценах.
- Титры: начало — «BURAQ LOGISTICS · Склад №4, блок 4-1 · Yuzhe International Logistics Park, Хоргос»;
  конец — «Процесс: приёмка лентой → DWS → стоечный поддон → FIFO → автопоезд 145 м³ · цикл машины ≤ 4 ч».
- Экспорт: 1920×1080, 25 к/с, H.264 High, ≈16 Мбит/с, стерео.

## 7. Бюджет (цены Higgsfield на 13.10.2026, предварительный расчёт `get_cost`)

| Модель | 5 с 16:9 | 16 сцен × 2 дубля | Примечание |
|---|---|---|---|
| Seedance 2.5 (`seedance_2_5`) | 35 кредитов | ≈1 300 кредитов (при 6–8 с — до 1 800) | рекомендуемая |
| Seedance 2.0 mini (`seedance_2_0_mini`) | 5 кредитов | ≈160–250 кредитов | бюджетная, 720p; принимает «unlim» (на бесплатном плане недоступен) |
| MiniMax H3 (`minimax_h3`) | 10 кредитов | ≈320–500 кредитов | 2K, точно держит стартовый кадр, без звука |
| MiniMax Hailuo (`minimax_hailuo`) | 6 кредитов (6 с, 768p) | ≈190–290 кредитов | **единственная из проверенных, что работает на бесплатном плане**; есть `input_image_end` |
| Grok 1.5 lite (`grok_video_v15_lite`) | 5 кредитов | — | на бесплатном плане отказ |

Аккаунты: sadullayevziyodlla@gmail.com — 0,7 кредита (исчерпан); ziedullas@gmail.com — 10 кредитов, после пробного клипа 4. Оба на бесплатном плане.
**На бесплатном плане** сервер отвечает `job_minimum_basic_plan_required` для Seedance 2.0 mini, Grok 1.5 lite (и, по ответу MCP, Seedance 2.5);
MiniMax Hailuo заказ принял. Для полного ролика нужен план PLUS (1 000 кредитов/мес) или выше — тогда открываются Seedance 2.5 и остальные. Чтобы собрать ролик, нужен пакет кредитов или план с
безлимитом Seedance 2.0 / Kling 3.0: тогда все 16 сцен можно сгенерировать в unlim-режиме без списания кредитов.

## 8. Опорные кадры

Чистые кадры (без надписей фильма — текст в стартовом кадре модель «оживляет» и портит клип) — `docs/higgsfield_кадры/NN_….jpg`,
1920×1080. Те же кадры с подписями шагов — только для аниматика (`cap_*.jpg` не хранятся, собираются скриптом).
В медиатеку Higgsfield кадры **ещё не загружены**: загружать надо в аккаунт пользователя после переподключения коннектора (§9),
иначе media_id окажутся в чужом пространстве. После загрузки — вписать сюда:

| Сцена | Файл | media_id |
|---|---|---|
| 0…15 | `docs/higgsfield_кадры/NN_….jpg` | — |

Как сделаны кадры: `node tools/filmclean.js Sklad4_realistic_film.html out 1920 1080 1.5,6,10,20,32,43,60,80,97,116,127,139,156,169,177,184` (кадр фильма в момент t без оверлея),
аниматик: `story.py` (подписи) + `mk_video.sh` (ffmpeg: zoompan-наезд 5–8 с на кадр, стыки xfade 0,6 с) — оба лежат в `tools/higgsfield/`.

## 9. Аккаунт Higgsfield, CLI и скиллы

- **Аккаунты.** У пользователя два: sadullayevziyodlla@gmail.com (коннектор claude.ai привязан к нему; 0,7 кредита) и ziedullas@gmail.com
  (профиль `cezannepie2087`, 10 кредитов). Браузер при входе через Google подставлял первый; второй входит через поле **Work email**
  в окне инкогнито (код на почту). Коннектор MCP можно перепривязать: https://claude.ai/customize/connectors → Higgsfield → отключить →
  подключить заново → новая сессия.
- **CLI** `@higgsfield/cli` 1.1.26 установлен глобально (`higgsfield`). Вход из облачной сессии: `higgsfield auth login` печатает ссылку
  (`file:///root/higgsfield-auth-*/sign-in.html` → внутри URL `clerk.higgsfield.ai/oauth/authorize?…`), пользователь открывает её в браузере,
  после Allow копирует адрес `http://localhost:876x/callback?code=…&state=…` и присылает; в контейнере `curl "<этот адрес>"` — вход завершён.
  Ссылка живёт **5 минут**; процесс держать в фоне. Потом `higgsfield workspace set <id>` (из `workspace list`), `higgsfield account status`.
  Сетевая политика окружения по умолчанию закрывала `*.higgsfield.ai` (403 на CONNECT) — пользователь открыл хосты в настройках окружения.
  Генерация: `higgsfield generate cost <model> --prompt … --start-image <jpg>` (оценка), `generate create … --json` (заказ, возвращает job id),
  `generate wait <id> --json` (результат с `result_url`).
- **Скиллы** `higgsfield-ai/skills` установлены в проект: `.agents/skills/higgsfield-*` (+ ссылки `.claude/skills/`, `skills-lock.json`):
  `higgsfield-generate` (генерация через CLI), `-video-explainer`, `-product-photoshoot`, `-brandkit`, `-soul-id`,
  `-marketplace-cards`, `-websites`, `-youtube-thumbnail`. Они вызывают CLI, поэтому требуют выполненного `auth login`.

## 10. Пробный клип 13.10 и выводы

`проба_minimax_hailuo_сцена02.mp4`: стартовый кадр `02_конвейер_выдвигается.jpg`, промпт сцены 2, MiniMax Hailuo (minimax-2.3), 6 с, 1364×768, 24 к/с.
- Модель сохранила планировку, цвета и свет кадра, но движение придумала своё: камера отъезжает назад вместо наезда, конвейер остаётся
  сложенным, справа появляется белый фургон, которого в кадре не было. Картинка остаётся «3D-рендером» — модель держит стиль стартового кадра.
- **Выводы для следующих клипов.** 1) Для сцен с одним ключевым движением (конвейер, стойка в ячейку, шторы) задавать **начальный и конечный кадр**
  (`--start-image` + `--end-image`; у MiniMax Hailuo это `input_image_end`): кадры фильма t 10 → t 20 для конвейера, t 60 → t 66 для стойки,
  t 166 → t 171 для штор — тогда модель вынуждена сделать именно это движение. 2) Промпт — коротко, одно движение и одно движение камеры;
  длинное описание стиля модель на бесплатном плане игнорирует. 3) Чтобы уйти от «рендерного» вида, стартовые кадры сначала пропустить через
  image-to-image («photorealistic photo of the same scene», Seedream/Nano Banana), затем анимировать — это уже на платном плане.
  4) Оставшихся 4 кредитов на клип не хватает (минимум 5–6).
