/* ---------------------------------------------------------------- каталог F01–F20 (тексты — по PDF, стр. 11–20) */
const KAT={
  F01:{n:'F01 Фронтальные паллетные стеллажи',s:'Pallet Racking · A, резерв B и C',t:'Фронтальные паллетные стеллажи (F01)',
    q:'ряд вдоль прохода · пролёт 2,65 м на 3 паллеты 1200×800 · уровень 1,6 м',
    a:'Индивидуальный доступ к паллете; адресный резерв для разнообразного ассортимента.',
    b:'Масса паллеты, нагрузка на ярус и секцию, полезная высота, проход и защита стоек.',
    c:'Геометрия и маркировка адресов, анкеры, нагрузочные таблички; проход фактической техники.',k:'selective pallet racking / фронтальные стеллажи / 横梁式货架'},
  F02:{n:'F02 Паллетный шаттл со стеллажами',s:'Pallet Shuttle · B · каналы',t:'Паллетный шаттл в канальных стеллажах (F02)',
    q:'каналы 1,4 м · шаг паллеты в глубину 0,85 м · шаттл переносит погрузчик',
    a:'Перемещение паллет в глубину канала. Погрузчик обслуживает вход и переносит шаттл.',
    b:'Тип паллеты, глубина канала, остатки по партиям, переносы, ресурс батареи и восстановление.',
    c:'Смешанный поток, неполные каналы, потеря связи и безопасное извлечение шаттла.',k:'pallet shuttle / паллетный шаттл / 穿梭车货架'},
  F03:{n:'F03 Кран-штабелёр AS/RS',s:'Stacker Cranes · C · проход с кранoм',t:'Кран-штабелёр AS/RS с высотным стеллажом (F03)',
    q:'проход 1,5 м · стеллажи двойной глубины с двух сторон · P&D у торца',
    a:'Автоматическое размещение и извлечение паллет в закреплённом проходе.',
    b:'Груз, высота, одиночные/двойные циклы, доступность, интерфейсы WCS и ремонтный доступ.',
    c:'Согласованный пик, точность позиционирования, отказ прохода и восстановление задания.',k:'stacker crane AS/RS / кран-штабелёр / 堆垛机立体库'},
  F04:{n:'F04 Полочные стеллажи для отбора',s:'M7 Heavy Duty · отбор коробов',t:'Полочные стеллажи для отбора (F04)',
    q:'полки 1,8 × 0,6 м · ручной доступ к адресам',
    a:'Хранение коробок и единичного товара с ручным доступом к адресам.',
    b:'Габариты упаковки, нагрузка полки, высота досягаемости, вместимость ячейки и пополнение.',
    c:'Отбор с терминалом, сканирование ячейки и корректное пополнение без смешения SKU.',k:'shelving / полочные стеллажи / 中型货架'},
  F05:{n:'F05 Консольные стеллажи',s:'Cantilever · длинномеры',t:'Консольные стеллажи (F05)',
    q:'стойки через 1,5 м · консоли · трубы и профили',
    a:'Размещение профилей, труб и других грузов, не помещающихся в стандартную паллетную ячейку.',
    b:'Длина и прогиб груза, шаг консолей, нагрузка, ограничители и подход подходящей техники.',
    c:'Устойчивость груза и безопасный маршрут. Обычный ричтрак подходит не для каждого длинномера.',k:'cantilever racking / консольные стеллажи / 悬臂式货架'},
  F06:{n:'F06 Гравитационные паллетные стеллажи',s:'Pallet Flow · буфер FIFO',t:'Гравитационные паллетные стеллажи (F06)',
    q:'роликовые дорожки с уклоном 4 % · загрузка с одной стороны, выдача с другой',
    a:'Паллеты движутся по роликовому каналу от стороны загрузки к стороне выгрузки.',
    b:'Масса, качество нижних досок, торможение, разделитель паллет и глубина канала.',
    c:'Проход лёгкой и тяжёлой паллеты, остановка и безопасное освобождение заклинивания.',k:'pallet flow racking / гравитационные стеллажи / 重力式货架'},
  F07:{n:'F07 Набивные стеллажи Drive-in',s:'Drive-in · однородный запас',t:'Набивные стеллажи Drive-in (F07)',
    q:'въезд погрузчика в канал · при одностороннем доступе — LIFO',
    a:'Плотное хранение с въездом погрузчика в канал. При одностороннем доступе применяется LIFO.',
    b:'Размер партии, совместимость мачты и стоек, направляющие, паллеты и обзор оператора.',
    c:'Работа на крайних уровнях и ограничение доступа. Это отдельная механическая альтернатива, не шаттл.',k:'drive-in racking / набивные стеллажи / 驶入式货架'},
  F08:{n:'F08 Паллетная конвейерная линия',s:'Pallet Conveyor · C',t:'Паллетный конвейер (F08)',
    q:'роликовый или цепной · ширина 1,3 м · верх 0,5 м',
    a:'Роликовые и цепные участки перемещают паллеты между станциями передачи и хранением.',
    b:'Основание паллеты, масса, шаг накопления, повороты, датчики, аварийные остановы.',
    c:'Очередь на выходе, снятие блокировки, повреждённая паллета и повторный запуск без потери ID.',k:'pallet conveyor / паллетный конвейер / 托盘输送线'},
  F09:{n:'F09 Конвейер для коробок',s:'Box Conveyor · комплектация',t:'Конвейер для коробок (F09)',
    q:'приводные ролики · ширина 0,6 м · высота 0,75 м',
    a:'Перемещение коробок и контейнеров между отбором, контролем и упаковкой.',
    b:'Минимальные/максимальные размеры, устойчивость основания, скорость и накопление.',
    c:'Мелкая и мягкая упаковка, интервал между грузами, затор и безопасная остановка.',k:'box conveyor / конвейер для коробок / 箱式输送线'},
  F10:{n:'F10 Мобильный робот AMR',s:'AMR · внутренний транспорт',t:'Мобильный робот AMR (F10)',
    q:'подъёмная платформа · ездит по маршрутам без конвейера',
    a:'Перевозка груза между согласованными точками без стационарной конвейерной трассы.',
    b:'Грузоподъёмность, качество пола, ширина маршрута, передача паллеты, зарядка и связь.',
    c:'Реальная смена, препятствия, пересечения, потеря связи и отсутствие повторного задания.',k:'autonomous mobile robot / мобильный робот / 自主移动机器人'},
  F11:{n:'F11 Ричтрак',s:'Reach Truck · A, обслуживание B',t:'Ричтрак (F11)',
    q:'выдвижная мачта · подъём до 8 м · рабочий проход Ast ≈ 2,75 м',
    a:'Работа с паллетами в стеллажной зоне с выдвижным грузоподъёмным устройством.',
    b:'Остаточная грузоподъёмность на высоте, центр тяжести, проход Ast и качество пола.',
    c:'Паллета максимальной массы на верхнем уровне, манёвр и обзор; параметры брать из выбранной модели.',k:'reach truck / ричтрак / 前移式叉车'},
  F12:{n:'F12 Электрический погрузчик',s:'Core Electric Forklift · приёмка и экспедиция',t:'Электрический погрузчик (F12)',
    q:'противовесный · 3 т · разгрузка и погрузка машин',
    a:'Разгрузка и перемещение паллет в зонах с подходящим пространством для манёвра.',
    b:'Масса с навесным оборудованием, центр тяжести, шины, уклоны и допустимый режим эксплуатации.',
    c:'Работа у дока с фактическим грузом, торможение и зарядный режим.',k:'electric forklift / электропогрузчик / 电动叉车'},
  F13:{n:'F13 Электроперевозчик паллет',s:'Electric Walkie Pallet Jack',t:'Электроперевозчик паллет (F13)',
    q:'короткие перемещения у ворот, в буферах и экспедиции',
    a:'Короткие горизонтальные перемещения у ворот, в буферах и экспедиции.',
    b:'Масса, длина вил, паллетные проёмы, уклон, длина маршрута и запас энергии.',
    c:'Заезд на согласованный док, манёвр с грузом и работа тормоза. Не заменяет высотный штабелёр.',k:'electric pallet jack / электротележка / 电动搬运车'},
  F14:{n:'F14 Высотный комплектовщик',s:'Order Picker · коробочный отбор',t:'Высотный комплектовщик (F14)',
    q:'платформа оператора поднимается вместе с вилами',
    a:'Поднимает рабочее место для отбора единиц с верхних уровней.',
    b:'Высота отбора, рабочий проход, направляющие и предусмотренная производителем защита оператора.',
    c:'Эргономика, аварийный спуск, управление доступом и процедура спасения; обучение обязательно.',k:'order picker / комплектовщик / 拣选车'},
  F15:{n:'F15 Электрический штабелёр',s:'Walkie Stacker · невысокие зоны',t:'Электрический штабелёр (F15)',
    q:'сопровождаемый · подъём до 3 м',
    a:'Поднимает и штабелирует паллеты на небольших маршрутах под управлением оператора.',
    b:'Остаточная грузоподъёмность, высота, опорные консоли, тип паллет и свободный подъём.',
    c:'Совместимость с поддоном и нижним ярусом, манёвр и точность установки на фактической высоте.',k:'walkie stacker / штабелёр / 电动堆高车'},
  F16:{n:'F16 Терминалы сбора данных',s:'Zebra TC22/TC27 · станция зарядки',t:'Терминалы сбора данных (F16)',
    q:'станция на 4 терминала · сканирование товара, места и ячейки',
    a:'Сканирование товара, грузового места и ячейки; получение и подтверждение задания WMS.',
    b:'Читаемость этикетки, дальность, работа в перчатках, Wi-Fi, батарея и поддержка приложения.',
    c:'Маршрут по складу, проблемные этикетки, смена батареи и восстановление после обрыва связи.',k:'mobile computer / терминал сбора данных / 手持终端'},
  F17:{n:'F17 Промышленный принтер этикеток',s:'Zebra ZT400 · рабочее место приёмки',t:'Принтер этикеток (F17)',
    q:'печать ID паллет, коробок и мест хранения',
    a:'Печать идентификаторов паллет, коробок и мест хранения.',
    b:'Ширина и стойкость этикетки, разрешение, материал/риббон, интерфейс WMS и объём печати.',
    c:'Сканируемость после перевозки, повторная печать с тем же ID и контроль расходных материалов.',k:'industrial label printer / принтер этикеток / 工业标签打印机'},
  F18:{n:'F18 Паллетообмотчик',s:'Robopac Masterplat · упаковка',t:'Паллетообмотчик (F18)',
    q:'поворотный стол Ø1,56 м · мачта до 3 м',
    a:'Обмотка сформированной паллеты стретч-плёнкой перед отправкой.',
    b:'Масса и диагональ паллеты, высота, устойчивость груза, натяжение и способ загрузки на стол.',
    c:'Пробная упаковка разных грузов, удержание слоёв и расход плёнки. Рецепты закрепить по типам груза.',k:'pallet stretch wrapper / паллетообмотчик / 缠绕机'},
  F19:{n:'F19 Уравнительная платформа дока',s:'Hörmann Dock Leveller · приёмка и отгрузка',t:'Уравнительная платформа (F19)',
    q:'настил 2,0 × 2,5 м с аппарелью · соединяет пол с кузовом',
    a:'Соединяет уровень пола склада с кузовом транспорта.',
    b:'Перепад высот, нагрузка от техники с грузом, контакт аппарели, приямок и блокировки.',
    c:'Совместимость с автопарком и последовательность стыковки/погрузки; исключить ранний отъезд машины.',k:'dock leveller / уравнительная платформа / 装卸平台'},
  F20:{n:'F20 Герметизатор ворот',s:'Hörmann Dock Shelter · доковые посты',t:'Герметизатор ворот (F20)',
    q:'подушки и шторы вокруг кузова',
    a:'Снижает открытый зазор вокруг кузова при стыковке.',
    b:'Габариты кузовов, тип уплотнения, износ, ветер и согласование с воротами/платформой.',
    c:'Стыковка транспорта разных размеров, отсутствие повреждений и замена изнашиваемых элементов.',k:'dock shelter / герметизатор ворот / 门封'}
};
const infoOf=k=>{ const K=KAT[k]; return {t:K.t,q:K.q,n:'Назначение. '+K.a+' Подбор. '+K.b+' Приёмка. '+K.c+' (Каталог Buraq 2026, '+k+'; фото и бренд — пример, выбор поставщика не зафиксирован.)',k:K.k}; };
const capOf=g=>{ const s=g.userData.slots; return s?s.filter(q=>!q.pd).length:0; };
const LIBX={
  F01:{d:{n:5,lev:4,bw:2.65,dbl:1,fl:0.2,pt:1.6,fill:0.7},p:[['n','Пролётов по 3 паллеты',1,12,1,'шт'],['lev','Уровней (с полом)',1,7,1,'шт'],['dbl','Двойной ряд',0,1,1,''],['fl','Флю между рядами',0.1,1.2,0.05,'мм'],['pt','Шаг уровней',1.3,2.2,0.05,'мм'],['fill','Заполнение (вид)',0,1,0.05,'%']],
    make:f01,sum:g=>{const r=g.userData.rk; return capOf(g)+' мест · ряд '+r.L.toFixed(2)+' × '+r.W.toFixed(2)+' м · рама '+r.H.toFixed(2)+' м';}},
  F02:{d:{nc:6,nd:12,lev:4,pt:1.6,fifo:1,sh:1,fill:0.6},p:[['nc','Каналов',1,24,1,'шт'],['nd','Мест в глубину',3,20,1,'шт'],['lev','Уровней',1,7,1,'шт'],['fifo','Доступ с двух сторон (FIFO)',0,1,1,''],['sh','Шаттлов (вид)',0,6,1,'шт'],['fill','Заполнение (вид)',0,1,0.05,'%']],
    make:f02,sum:g=>{const r=g.userData.rk; return capOf(g)+' мест · блок '+r.W.toFixed(1)+' × '+r.L.toFixed(1)+' м · '+(r.fifo?'FIFO — вход с одной стороны, выход с другой':'LIFO — вход и выход с одной стороны');}},
  F03:{d:{nb:4,lev:5,dd:2,pt:1.6,fill:0.6},p:[['nb','Секций по 3 паллеты',1,8,1,'шт'],['lev','Уровней',2,8,1,'шт'],['dd','Глубина (1 или 2)',1,2,1,'шт'],['pt','Шаг уровней',1.3,2.2,0.05,'мм'],['fill','Заполнение (вид)',0,1,0.05,'%']],
    make:f03,sum:g=>{const r=g.userData.rk; return capOf(g)+' мест · проход '+r.L.toFixed(1)+' м · ширина '+r.W.toFixed(2)+' м · высота '+r.H.toFixed(1)+' м';}},
  F04:{d:{n:4,lev:5,h:2.5,dbl:1},p:[['n','Секций по 1,8 м',1,10,1,'шт'],['lev','Полок',3,7,1,'шт'],['h','Высота',1.8,3.5,0.1,'м'],['dbl','Двусторонний',0,1,1,'']],make:f04,sum:g=>'полки 1,8 × 0,6 м · '+g.userData.rk.L.toFixed(1)+' м'},
  F05:{d:{n:4,lev:4,h:4.0,arm:1.0,dbl:1},p:[['n','Стоек',2,8,1,'шт'],['lev','Консолей',2,6,1,'шт'],['h','Высота',2.5,5.0,0.1,'м'],['arm','Вылет консоли',0.6,1.5,0.05,'м'],['dbl','Двусторонний',0,1,1,'']],make:f05,sum:g=>'длина '+g.userData.rk.L.toFixed(1)+' м · вылет консоли '+g.userData.libOpts.arm.toFixed(2)+' м'},
  F06:{d:{nl:3,nd:6,lev:2,pt:1.6,fill:0.6},p:[['nl','Дорожек',1,8,1,'шт'],['nd','Мест в глубину',2,12,1,'шт'],['lev','Уровней',1,4,1,'шт'],['fill','Заполнение (вид)',0,1,0.05,'%']],make:f06,sum:g=>capOf(g)+' мест · уклон 4 %, загрузка с −z, выдача с +z'},
  F07:{d:{nl:3,nd:6,lev:3,pt:1.6,fill:0.6},p:[['nl','Каналов',1,8,1,'шт'],['nd','Мест в глубину',2,12,1,'шт'],['lev','Уровней',1,5,1,'шт'],['fill','Заполнение (вид)',0,1,0.05,'%']],make:f07,sum:g=>capOf(g)+' мест · вход погрузчика с −z'},
  F08:{d:{len:6,w:1.3,h:0.5,typ:0},p:[['len','Длина',1,40,0.1,'м'],['typ','Цепной (иначе роликовый)',0,1,1,'']],make:f08,sum:g=>'длина '+g.userData.conv.L.toFixed(1)+' м · ширина 1,3 м · 0,3 м/с'},
  F09:{d:{len:6,w:0.6,h:0.75},p:[['len','Длина',1,30,0.5,'м'],['w','Ширина',0.4,0.9,0.05,'мм']],make:f09,sum:g=>'длина '+g.userData.conv.L.toFixed(1)+' м'},
  F10:{d:{lift:0},p:[['lift','Подъём платформы',0,1,1,'']],make:o=>{ const g=f10(); amrSet(g,o.lift); return g; },sum:()=>'до 1 т · 1,5 м/с · подъём платформы 60 мм'},
  F11:{d:{lift:0,reach:0},p:[['lift','Подъём вил',0,8,0.1,'м'],['reach','Выдвижение мачты',0,1,0.05,'%']],make:o=>{ const g=f11(); rtSet(g,o.lift,0.25+0.9*o.reach); return g; },sum:()=>'1,4 т · 2,2 м/с · подъём 0,35 м/с · Ast 2,75 м'},
  F12:{d:{lift:0},p:[['lift','Подъём вил',0,3,0.05,'м']],make:o=>{ const g=forklift(0,0,0); G.equip.remove(g); if(o.lift) fkSet(g,o.lift,0,0,0); return g; },sum:()=>'3 т · 1,9 м/с порожний, 1,5 с грузом'},
  F13:{d:{},p:[],make:()=>{ const g=palletJack(0,0,0,true); G.equip.remove(g); return g; },sum:()=>'2 т · короткие перемещения'},
  F14:{d:{lift:0},p:[['lift','Подъём платформы',0,6,0.1,'м']],make:o=>{ const g=f14(); opSet(g,o.lift); return g; },sum:()=>'отбор с высоты до 7 м'},
  F15:{d:{lift:0},p:[['lift','Подъём вил',0,3,0.05,'м']],make:o=>{ const g=f15(); stSet(g,o.lift); return g; },sum:()=>'1,2 т · подъём до 3 м'},
  F16:{d:{n:4},p:[['n','Терминалов',1,8,1,'шт']],make:f16,sum:g=>g.userData.rk.n+' терминала на зарядке'},
  F17:{d:{},p:[],make:f17,sum:()=>'печать ID паллет при приёмке'},
  F18:{d:{h:2.35,cy:0.55,load:0,film:0.4},p:[['h','Высота мачты',1.8,3.0,0.05,'мм'],['cy','Высота каретки',0.2,2.4,0.05,'мм'],['film','Намотано плёнки',0,1,0.1,'%'],['load','Паллета на столе',0,1,1,'']],
    make:o=>palletWrapper(o),sum:()=>'стол Ø1560 мм · цикл ~90 с'},
  F19:{d:{w:2.0,l:2.5,dh:0.28},p:[['w','Ширина',1.8,2.4,0.05,'м'],['l','Длина',2.0,3.5,0.1,'м'],['dh','Перепад до кузова',-0.3,0.5,0.01,'мм']],make:f19,sum:g=>'перепад '+Math.round(g.userData.libOpts.dh*1000)+' мм'},
  F20:{d:{w:3.4,h:3.8,d:0.8},p:[['w','Ширина проёма',2.8,4.0,0.05,'м'],['h','Высота проёма',3.0,4.5,0.05,'м'],['d','Вылет',0.4,1.2,0.05,'м']],make:f20,sum:g=>'проём '+g.userData.libOpts.w.toFixed(2)+' × '+g.userData.libOpts.h.toFixed(2)+' м'}
};
for(const k in LIBX){ const X=LIBX[k], K=KAT[k]; LIB[k]={n:K.n,s:K.s,d:X.d,p:X.p,make:o=>X.make(o),sum:X.sum,info:infoOf(k)}; }
const MOBILE={F10:'amr',F11:'reach',F12:'fork',F13:'jack',F14:'picker',F15:'stacker'};
const RACKS={F01:1,F02:1,F03:1,F06:1,F07:1};

/* ---------------------------------------------------------------- варианты: правка своя у каждого, переключение */
const VAR={
  A:{n:'A · Адресные паллетные стеллажи',s:'ричтраки F11, погрузчики F12, терминалы F16, принтер F17',
    when:'Разнообразный ассортимент, небольшие партии на SKU и часто меняющиеся заказы. Каждая паллета доступна из прохода. Размещение и отбор выполняет техника под заданиями WMS; оператор подтверждает груз и ячейку сканированием.',
    trade:'Проходы занимают площадь; производительность зависит от расстояний и операторов. Зато можно вводить зоны постепенно и менять размещение.',
    cond:'Подтвердить остаточную грузоподъёмность техники на верхнем уровне, рабочий проход для фактической паллеты, несущую способность пола и конструкцию стеллажей.'},
  B:{n:'B · Плотное хранение с шаттлами',s:'каналы F02 с шаттлами, ричтраки у каналов, зона A для мелких партий',
    when:'Повторяющиеся паллетные партии и достаточное число паллет одной позиции. Шаттл перемещает груз в глубину канала; оператор с погрузчиком переносит шаттл и обслуживает вход канала. Полуавтоматический вариант.',
    trade:'Высокая плотность может теряться из-за неполных каналов. Нужны резервирование шаттлов, зарядка и безопасное извлечение неисправного устройства.',
    cond:'Проверить распределение паллет по SKU на истории запасов, число перестановок шаттлов и очереди у каналов. FIFO требует доступа с двух сторон; LIFO возможен при загрузке и выгрузке с одной.'},
  C:{n:'C · Автоматический склад AS/RS',s:'краны-штабелёры F03, паллетный конвейер F08, входной контроль',
    when:'Устойчивый поток стандартных паллет, ограниченный доступ людей в зону хранения и возможность обеспечить сервис автоматизации. Кран-штабелёр размещает и извлекает паллеты, конвейеры подают их к контрольным точкам и станциям передачи.',
    trade:'Высокая зависимость от качества паллет и готовности оборудования. Ремонт крана может ограничить доступ к его проходу; общий конвейер может стать узким местом.',
    cond:'Моделирование смешанного входного/выходного потока, проверка пика и отказа одного узла, подтверждённый сервис и стоимость жизненного цикла.'}
};
const ST=()=>{ if(!edStore.abc||typeof edStore.abc!=='object') edStore.abc={v:'cur'}; return edStore.abc; };
let VCUR='cur', spawned=[], fixG=null, hiddenCur=null, pickCur=null;
const regionHit=(x,z)=>(x>=0.3&&x<=47.75&&z>=12.3&&z<=35.42)||(x>=0.3&&x<=21.2&&z>=6.75&&z<=12.3);
function curExtras(){                                        // объекты текущего процесса вне ZCUR, которые мешают вариантам
  const L=[TRK_L2,TRK_Q,TRK_IN].filter(Boolean);
  G.equip.children.forEach(o=>{ if(o.userData.info===EQ[2]) L.push(o); });                     // мобильная рампа (машины встают к докам)
  edStore.a.forEach(r=>{ const o=edMap.get(r.i); if(o&&regionHit(o.position.x,o.position.z)) L.push(o); });
  (ZCUR.userData.inPlace||[]).forEach(o=>L.push(o));                                         // люди, подписи и адреса текущей планировки — на своих местах
  return [...new Set(L)]; }
const origLibRemove=libRemove;
function despawn(){ const gone=spawned.filter(g=>g&&g.parent); gone.forEach(g=>origLibRemove(g)); spawned=[]; if(ED.sel&&!ED.sel.parent) edDeselect(); return gone; }
function recsOf(v){ const S=ST(); if(!Array.isArray(S[v])){ S[v]=GEN[v]().recs; edSave(); } return S[v]; }
let vN={A:0,B:0,C:0};
function setVariant(v){
  if(!['cur','A','B','C'].includes(v)) v='cur';
  if(SIMX.on) SIMX.stop();
  if(typeof SIM!=='undefined'&&SIM.on) SIM.exit();
  if(ED.sel) edDeselect();
  const gone=despawn(); if(fixG){ if(fixG.parent) fixG.parent.remove(fixG); gone.push(fixG); fixG=null; }
  if(v==='cur'){
    if(hiddenCur){ hiddenCur.forEach(([o,vis])=>o.visible=vis); hiddenCur=null; }
    ZCUR.visible=true; if(pickCur){ pickCur.forEach(o=>{ if(!pickables.includes(o)) pickables.push(o); }); pickCur=null; }
  } else {
    if(!hiddenCur){ hiddenCur=curExtras().map(o=>[o,o.visible]); hiddenCur.forEach(([o])=>{ o.visible=false; }); }
    ZCUR.visible=false;
    if(!pickCur){ pickCur=[]; const hid=new Set(hiddenCur.map(h=>h[0])), under=o=>{ for(let p=o;p;p=p.parent) if(p===ZCUR||hid.has(p)) return true; return false; };
      for(let i=pickables.length-1;i>=0;i--){ const o=pickables[i]; if(under(o)){ pickCur.push(o); pickables.splice(i,1); } } }
    const R=recsOf(v); vN[v]=R.reduce((m,r)=>Math.max(m,(parseInt(r.i.slice(2),10)||0)+1),0);
    R.forEach(r=>{ const g=libSpawn(r.k,r.o,r.p,r.r,r.i); if(g){ g.userData.abcV=v; spawned.push(g); if(g.userData.rig&&g.userData.rig.driver&&g.userData.rig.driver.userData.H) rigSit(g.userData.rig.driver); } });
    fixG=buildFixtures(v);
  }
  freeTrees(gone);   /* после сборки нового: общие материалы моделей остаются, текстуры и материалы прежнего варианта освобождаются */
  VCUR=v; const S=ST(); S.v=v; edSave();
  scene.updateMatrixWorld(true); renderer.shadowMap.needsUpdate=true;
  if(typeof WALKP!=='undefined'&&walk){ WALKP.build(); }
  UIX.sync();
}
/* освободить сетки, материалы и текстуры убранных объектов, которые больше нигде в сцене не используются
   (машины у ворот, надписи, люди-водители создают свои текстуры на canvas; без этого ~70 текстур на каждую смену варианта) */
function freeTrees(list){ list=list.filter(Boolean); if(!list.length) return; list.forEach(g=>{ if(g.parent) g.parent.remove(g); });
  const uG=new Set([UB,UC,PALGEO]), uM=new Set(), uT=new Set([scene.environment,scene.background]);
  const texOf=(m,f)=>{ for(const k in m){ const t=m[k]; if(t&&t.isTexture) f(t); } if(m.uniforms) for(const k in m.uniforms){ const t=m.uniforms[k]&&m.uniforms[k].value; if(t&&t.isTexture) f(t); } };
  const mats=o=>o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
  const uS=new Set(); scene.traverse(o=>{ if(o.geometry) uG.add(o.geometry); if(o.skeleton) uS.add(o.skeleton); mats(o).forEach(m=>{ uM.add(m); texOf(m,t=>uT.add(t)); }); });
  const own=t=>{ const im=t.image; return !!im&&(im.data||(typeof HTMLCanvasElement!=='undefined'&&im instanceof HTMLCanvasElement)||(typeof HTMLImageElement!=='undefined'&&im instanceof HTMLImageElement)||(typeof ImageBitmap!=='undefined'&&im instanceof ImageBitmap)); };
  const dG=new Set(), dM=new Set(), dT=new Set(), dS=new Set();   /* скелет человека держит свою текстуру костей — её тоже */
  list.forEach(g=>g.traverse(o=>{ if(o.geometry&&!uG.has(o.geometry)) dG.add(o.geometry); if(o.skeleton&&!uS.has(o.skeleton)) dS.add(o.skeleton); mats(o).forEach(m=>{ if(uM.has(m)) return; dM.add(m); texOf(m,t=>{ if(!uT.has(t)&&own(t)) dT.add(t); }); }); }));
  dG.forEach(x=>x.dispose()); dM.forEach(x=>x.dispose()); dT.forEach(x=>x.dispose()); dS.forEach(x=>x.dispose()); }
/* правка редактора внутри варианта: записи — в edStore.abc[V] (ID «vA12»), а не в общий список */
const isV=id=>typeof id==='string'&&/^v[ABC]\d+$/.test(id);
const vRec=id=>{ const L=ST()[id[1]]; return Array.isArray(L)?L.find(r=>r.i===id):null; };
{ const recO=edRecord, rebO=libRebuild, addO=libAdd, delO=edDel, undoO=edUndo, dupO=edDup;
  edRecord=function(o){ const id=o&&o.userData&&o.userData.eid; if(isV(id)){ const r=vRec(id); if(r){ r.p=[+o.position.x.toFixed(3),+o.position.y.toFixed(3),+o.position.z.toFixed(3)]; r.r=+o.rotation.y.toFixed(4); edSave(); } return; } recO(o); };
  libAdd=function(kind){ if(VCUR==='cur'){ addO(kind); return; }
    const id='v'+VCUR+(vN[VCUR]++), p=[+target.x.toFixed(2),0,+target.z.toFixed(2)], g=libSpawn(kind,null,p,0,id); if(!g){ vN[VCUR]--; return; }
    g.userData.abcV=VCUR; spawned.push(g); ST()[VCUR].push({i:id,k:kind,p,r:0,o:Object.assign({},g.userData.libOpts)}); edSave(); edPush({t:'del-v',id}); edSetMode(true); edSelect(g); libPanel(); };
  libRemove=function(o){ const id=o&&o.userData&&o.userData.eid; origLibRemove(o); if(isV(id)){ const L=ST()[id[1]]; if(Array.isArray(L)){ ST()[id[1]]=L.filter(r=>r.i!==id); edSave(); } spawned=spawned.filter(g=>g!==o); } };
  libRebuild=function(o,key,val){ const id=o&&o.userData&&o.userData.eid; if(!isV(id)){ rebO(o,key,val); return; }
    const L0=LIB[o.userData.libKind]; if(!L0||!L0.p.some(x=>x[0]===key)) return;
    const opts=Object.assign({},o.userData.libOpts); opts[key]=val; const p=[o.position.x,o.position.y,o.position.z], r=o.rotation.y, kind=o.userData.libKind;
    origLibRemove(o); spawned=spawned.filter(g=>g!==o); const g=libSpawn(kind,opts,p,r,id); if(!g) return; g.userData.abcV=VCUR; spawned.push(g);
    const R=vRec(id); if(R) R.o=opts; edSave(); ED.sel=g; edUI(); libPanel(true); };
  edDel=function(){ const o=ED.sel, id=o&&o.userData.eid; if(!isV(id)){ delO(); return; }
    const R=vRec(id); libRemove(o); if(R) edPush({t:'restore-v',rec:JSON.parse(JSON.stringify(R))}); edDeselect(); };
  edDup=function(){ const o=ED.sel, id=o&&o.userData.eid; if(!isV(id)){ dupO(); return; }
    const nid='v'+VCUR+(vN[VCUR]++), p=[o.position.x+1.4,o.position.y,o.position.z], g=libSpawn(o.userData.libKind,o.userData.libOpts,p,o.rotation.y,nid); if(!g) return;
    g.userData.abcV=VCUR; spawned.push(g); ST()[VCUR].push({i:nid,k:o.userData.libKind,p:p.map(v=>+v.toFixed(3)),r:+o.rotation.y.toFixed(4),o:Object.assign({},o.userData.libOpts)}); edSave(); edPush({t:'del-v',id:nid}); edSelect(g); };
  edUndo=function(){ const a=ED.undo[ED.undo.length-1];
    if(a&&a.t==='del-v'){ ED.undo.pop(); const o=edMap.get(a.id); if(o){ libRemove(o); edDeselect(); } return; }
    if(a&&a.t==='restore-v'){ ED.undo.pop(); const r=a.rec; if(r.i[1]!==VCUR) return; const g=libSpawn(r.k,r.o,r.p,r.r,r.i); if(g){ g.userData.abcV=VCUR; spawned.push(g); ST()[VCUR].push(r); edSave(); edSelect(g); } return; }
    undoO(); };
  document.getElementById('eddel').onclick=()=>edDel(); document.getElementById('edundo').onclick=()=>edUndo(); document.getElementById('eddup').onclick=()=>edDup();
}
function resetVariant(v){ if(v==='cur') return; const S=ST(); S[v]=GEN[v]().recs; edSave(); if(VCUR===v){ VCUR='x'; setVariant(v); } }

/* ---------------------------------------------------------------- неподвижное оформление варианта: зоны, разметка, ограждения, машины у доков */
function buildFixtures(v){
  const F=new THREE.Group(); F.name='abc-fix'; scene.add(F); F.userData.v=v;
  const n0=G.floorgfx.children.length, l0=G.labels.children.length;
  const S=southZones(v), Y=PAL.yellow;
  const zone=(x0,z0,x1,z1,c,a)=>{ decal(x1-x0,z1-z0,paintMat(c,a||0.10),(x0+x1)/2,(z0+z1)/2,0.0125); paintRect(x0,z0,x1,z1,c,0.08,0.0165); };
  const corner=(sp)=>{ const m=paintMat(0xf2f2f2,.9), hx=0.45, hz=0.65, a=0.22;
    for(const sx of [-1,1]) for(const sz of [-1,1]){ decal(a,0.05,m,sp.x+sx*(hx-a/2),sp.z+sz*hz,0.0168); decal(0.05,a,m,sp.x+sx*hx,sp.z+sz*(hz-a/2),0.0168); } };
  /* приёмка, карантин, экспедиция, буфер у Л1 */
  zone(0.4,7.45,15.4,13.95,0x3f76ad,0.10); stencil('ПРИЁМКА · БУФЕР ВХОДА',7.6,10.6,6.5,'rgba(220,235,255,.9)');
  S.inb.concat(S.exp,S.rear).forEach(corner);
  zone(11.0,7.35,14.2,8.75,PAL.red,0.18); stencil('КАРАНТИН',12.6,9.05,2.2,'rgba(255,200,190,.95)');
  for(let x=11.1;x<14.2;x+=0.9) box(0.04,1.1,0.04,M.red,x,0.55,7.3,F).castShadow=false;
  box(3.15,0.04,0.03,M.red,12.6,1.08,7.3,F).castShadow=false; box(3.15,0.04,0.03,M.red,12.6,0.6,7.3,F).castShadow=false;
  if(v==='A'){ zone(16.6,7.45,21.45,13.95,PAL.green,0.12); stencil('ЭКСПЕДИЦИЯ',19.0,10.6,3.8,'rgba(210,255,225,.9)'); }
  if(v==='B'){ zone(3.9,33.5,16.6,35.3,PAL.green,0.12); stencil('ЭКСПЕДИЦИЯ · ОТГРУЗКА ЧЕРЕЗ Л1',11.5,33.3,6.0,'rgba(210,255,225,.9)'); }
  else { zone(4.7,34.0,15.5,35.25,0x3f76ad,0.10); stencil('БУФЕР Л1 · РЕЗЕРВ',10.1,33.55,3.6,'rgba(220,235,255,.9)'); }
  zone(34.0,32.75,47.3,35.25,0x7c8794,0.14); stencil('ЗАРЯДКА ТЕХНИКИ',40.6,32.4,4.0,'rgba(235,235,235,.85)');
  /* главный проезд, полоса Л1–П1, зона погрузки автопоезда */
  for(const z of (v==='C'?[CZ.fence-0.08]:[CROSS.z0,CROSS.z1])) decal(v==='C'?40:47.0,0.12,paintMat(Y),v==='C'?27.0:24.0,z,0.0165);
  for(const z of [REAR.z0+0.05,REAR.z1-0.05]) decal(47.0,0.12,paintMat(Y),24.0,z,0.0165);
  stencil(v==='C'?'КОРИДОР ПОГРУЗЧИКОВ':'ГЛАВНЫЙ ПРОЕЗД',v==='C'?33.0:9.2,v==='C'?13.0:15.3,6.0,'rgba(242,183,5,.85)');
  stencil('ПОЛОСА Л1–П1 · ЗАДНИЙ ПРОЕЗД',24.0,32.9,9.0,'rgba(242,183,5,.85)');
  if(v!=='B'){ hatchStrip(25.2,11.98,43.9,12.22); stencil('ПОГРУЗКА АВТОПОЕЗДА ВИЛАМИ · СЕВЕРНЫЙ БОРТ',34.0,12.9,10,'rgba(242,242,242,.85)'); }
  /* номера проходов */
  aislesOf(v).forEach((a,i)=>{ stencil(String(i+1),a.x,(v==='C'?CZ.front:ZS.z0)-0.55,0.9,'rgba(242,242,242,.95)'); });
  /* C: ограждение зоны AS/RS по краю коридора погрузчиков (конвейер, P&D и краны — внутри), проёмы — только у входа и выхода; входной контроль */
  if(v==='C'){ const mesh=std(0x2f3540,.6,.4,{transparent:true,opacity:.45,side:THREE.DoubleSide}), post=MAT.yel;
    const fz=CZ.fence, x0=ZS.x0-0.25, x1=ZS.x1+0.25, fr=CZ.front+11.3+0.9;
    const seg=(a,b,z)=>{ if(b-a<0.2) return; box(b-a,2.0,0.02,mesh,(a+b)/2,1.15,z,F).castShadow=false; box(b-a,0.06,0.06,MAT.toyD,(a+b)/2,2.17,z,F); for(let q=a;q<=b+0.01;q+=Math.max(0.5,(b-a)/Math.ceil((b-a)/2))) box(0.06,2.2,0.06,post,q,1.1,z,F); };
    const segZ=(x,a,b)=>{ box(0.02,2.0,b-a,mesh,x,1.15,(a+b)/2,F).castShadow=false; box(0.06,0.06,b-a,MAT.toyD,x,2.17,(a+b)/2,F); for(let q=a;q<=b+0.01;q+=Math.max(0.5,(b-a)/Math.ceil((b-a)/2))) box(0.06,2.2,0.06,post,x,1.1,q,F); };
    let x=x0; [[CZ.inX-0.72,CZ.inX+0.72],[CZ.outX-0.72,CZ.outX+0.72]].forEach(([a,b])=>{ seg(x,a,fz); x=b; }); seg(x,x1,fz);
    seg(x0,x1,fr); segZ(x0,fz,fr); segZ(x1,fz,fr);
    const pg=new THREE.Group(); pg.position.set(CZ.inX,0,14.0); F.add(pg);
    for(const s of [-1,1]) box(0.12,2.0,0.12,MAT.yel,s*0.85,1.0,0,pg); box(1.82,0.12,0.12,MAT.yel,0,2.0,0,pg);
    for(const s of [-1,1]) for(let y=0.4;y<1.9;y+=0.12) box(0.02,0.02,0.02,MAT.led,s*0.78,y,0,pg).castShadow=false;
    sign(pg,'ВХОДНОЙ КОНТРОЛЬ · ID · ГАБАРИТ · ВЕС',0,2.35,0,0,1.8,'#14161a');
    label('C · AS/RS',24.0,9.6,25.0,'#f2b705',44,0.55,F);
  } else label(v==='A'?'A · АДРЕСНЫЕ СТЕЛЛАЖИ':'B · ШАТТЛЫ + ЗОНА A',24.0,9.6,24.0,'#f2b705',44,0.55,F);
  /* подвесные таблички зон */
  [['ПРИЁМКА · Л2',7.6,10.6],['КАРАНТИН',12.6,7.9]].concat(v==='C'?[['ВЫХОД AS/RS',CZ.outX,13.0]]:v==='A'?[['ЭКСПЕДИЦИЯ',19.0,10.6]]:[['ЭКСПЕДИЦИЯ · Л1',11.5,33.0]]).forEach(([t,x,z])=>{
    signBoard(2.2,0.55,signTex([t],'#14161a','#f2b705',1024,256,{border:'#f2b705',px:[120]}),x,3.6,z,0,F,{two:true,hang:1.4}); });
  G.floorgfx.children.slice(n0).forEach(o=>F.add(o)); G.labels.children.slice(l0).forEach(o=>F.add(o));
  /* машины у доков: китайская у Л2 задним бортом к платформе, автопоезд на посту П2 (правый борт без обрешётки) */
  const cn=cnSemi(-12.45,GZ_L2,-1,0,{load:0,tarp:'open'}); G.trucks.remove(cn); F.add(cn); cn.position.y=-1; rdoorSet(cn,1);
  const cs=[]; for(let k=0;k<18;k++) for(const zz of [-0.65,0.65]) cs.push({x:8.75-0.5-k*0.86,y:1.29,z:zz,ry:PI/2});
  loadsFor(cn,cs,PI/2); for(let i=8;i<cs.length;i++) cn.userData.loads.set(i,true,0.95+RND()*0.3,OWNC[(RND()*OWNC.length)|0]); cn.userData.slots=cs;
  F.userData.cn=cn;
  if(v==='B'){                                                  // B: отгрузка — китайский полуприцеп у Л1, загрузка вилами с торца
    const co=cnSemi(-12.45,GZ_L1,-1,0,{load:0,tarp:'open'}); G.trucks.remove(co); F.add(co); co.position.y=-1; rdoorSet(co,1);
    const os=[]; for(let k=0;k<18;k++) for(const zz of [-0.65,0.65]) os.push({x:8.75-0.5-k*0.86,y:1.29,z:zz,ry:PI/2});
    loadsFor(co,os,PI/2); co.userData.slots=os; F.userData.cnOut=co;
  } else {
    const kz=tandem145(36.0,KZY,0,{open:1,tall:0,plate:'248 KZA 13',palletSide:1}); G.trucks.remove(kz); F.add(kz);
    [kz.userData.b1,kz.userData.b2].forEach(b=>{ const o=b.position.x+36.0, sl=kzSlots().filter(s=>Math.abs(s.x-o)<5).map(s=>({x:s.x-o,y:0.97,z:s.z-KZY,ry:PI/2}));
      loadsFor(b,sl,PI/2); b.userData.slots=sl; });
    F.userData.kz=kz; }
  F.traverse(o=>{ if(o.isMesh&&o.castShadow===undefined) o.castShadow=true; });
  return F; }
function aislesOf(v){ const out=[]; if(v==='C'){ recsOf('C').filter(r=>r.k==='F03').forEach(r=>out.push({x:r.p[0],z0:CZ.front,z1:CZ.front+11.3,w:1.5,crane:r.i})); return out; }
  /* проходы — промежутки ≥ 2 м между рядами стеллажей (по записям варианта) */
  const sp=[]; recsOf(v).forEach(r=>{ if(r.k==='F01'){ const d=1.05, half=r.o.dbl?(d+r.o.fl/2):d/2; sp.push([r.p[0]-half,r.p[0]+half]); } else if(r.k==='F02'){ const W=r.o.nc*1.4; sp.push([r.p[0]-W/2,r.p[0]+W/2]); } });
  sp.sort((a,b)=>a[0]-b[0]); for(let i=0;i+1<sp.length;i++){ const g0=sp[i][1], g1=sp[i+1][0]; if(g1-g0>=2.0) out.push({x:(g0+g1)/2,z0:ZS.z0,z1:ZS.z0+13.85,w:g1-g0}); }
  return out; }
