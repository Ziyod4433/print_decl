// O‘yin kartalari. Faqat serverda saqlanadi — keyingi karta nimaligini hech kim bilmaydi.

const stock = (symbol, price, title, text) => ({ kind: 'stock', symbol, price, title, text });
const split = (symbol, ratio, title, text) => ({ kind: 'split', symbol, ratio, title, text });
const ESTATE_ICON = { flat2: '🏢', house3: '🏡', plex: '🏘️', complex: '🏙️' };
const estate = (type, title, cost, down, cashflow, text, units = 1) => ({ kind: 'realestate', type, title, icon: ESTATE_ICON[type], cost, down, cashflow, units, text });
const business = (tag, title, icon, cost, down, cashflow, text) => ({ kind: 'business', type: 'business', tag, title, icon, cost, down, cashflow, text });
const land = (title, cost, text) => ({ kind: 'land', type: 'land', title, icon: '🌾', cost, down: cost, cashflow: 0, text });
const startup = (title, icon, cost, text) => ({ kind: 'startup', type: 'startup', title, icon, cost, down: cost, cashflow: 0, text });
const gold = (title, price, text) => ({ kind: 'gold', title, icon: '🪙', price, text });

export const SMALL_DEALS = [
  stock('ANOR', 1, 'Anor Tekstil inqirozda', 'Eksport buyurtmalari bekor qilindi, aksiyalar qulab tushdi. Tavakkal qilishga tayyormisiz?'),
  stock('ANOR', 5, 'Anor Tekstil: past narx', 'Kompaniya yangi fabrika qurmoqda, investorlar hali ikkilanmoqda.'),
  stock('ANOR', 10, 'Anor Tekstil: barqaror savdo', 'Paxta narxi barqaror, aksiyalar odatiy oraliqda.'),
  stock('ANOR', 30, 'Anor Tekstil cho‘qqida', 'Yevropa brendi bilan yirik shartnoma imzolandi. Sotish vaqti kelmadimi?'),
  stock('QOVN', 5, 'Qovun Agro: qurg‘oqchilik xavfi', 'Ob-havo prognozi yomon — aksiyalar arzonlashdi.'),
  stock('QOVN', 10, 'Qovun Agro: odatiy mavsum', 'Hosil o‘rtacha bo‘lishi kutilmoqda.'),
  stock('QOVN', 20, 'Qovun Agro eksportni kengaytirdi', 'Mirzacho‘l qovunlari endi Dubay do‘konlarida sotilmoqda.'),
  stock('QOVN', 40, 'Qovun Agro: rekord hosil!', 'Kompaniya tarixidagi eng katta foyda e’lon qilindi.'),
  stock('TLPR', 1, 'Tulpor Motors: bankrotlik mish-mishlari', 'Gazetalar kompaniya yopilishi haqida yozmoqda. Mish-mish rostmi yoki imkoniyatmi?'),
  stock('TLPR', 10, 'Tulpor Motors: yangi model', 'Kompaniya arzon elektromobilini taqdim etdi.'),
  stock('TLPR', 20, 'Tulpor Motors: savdo o‘sdi', 'Elektromobillar uchun navbat bir oyga cho‘zildi.'),
  stock('TLPR', 30, 'Tulpor Motors eksportga chiqdi', 'Qo‘shni davlatlarga birinchi partiya jo‘natildi.'),
  stock('CHNR', 5, 'Chinor Soft: sinov bosqichi', 'Yangi ilova hali sinovda, aksiyalar arzon.'),
  stock('CHNR', 10, 'Chinor Soft investor qidirmoqda', 'Kompaniya yangi investitsiya raundini e’lon qildi.'),
  stock('CHNR', 20, 'Chinor Soft: million foydalanuvchi', 'Ilova 1 000 000 marta yuklab olindi.'),
  stock('CHNR', 40, 'Chinor Soft: xorijiy xaridor', 'Yirik xalqaro kompaniya Chinor Soft bilan muzokara olib bormoqda.'),
  stock('SMRQ', 5, 'Samarqand Media: reyting tushdi', 'Reklama beruvchilar kamaydi.'),
  stock('SMRQ', 15, 'Samarqand Media: yangi serial', 'Serial butun mamlakatda ommalashdi.'),
  stock('SMRQ', 25, 'Samarqand Media: rekord tomosha', 'Reklama beruvchilar navbatda turibdi.'),
  split('ANOR', 2, 'Anor Tekstil aksiyalari bo‘lindi (2:1)', 'Egalarida aksiyalar soni ikki barobar ko‘paydi.'),
  split('CHNR', 2, 'Chinor Soft aksiyalari bo‘lindi (2:1)', 'Egalarida aksiyalar soni ikki barobar ko‘paydi.'),
  split('TLPR', 0.5, 'Tulpor Motors: teskari bo‘linish (1:2)', 'Egalarida aksiyalar soni ikki barobar kamaydi.'),
  estate('flat2', 'Chilonzorda 2 xonali kvartira', 45000, 4000, 140, 'Ijarachisi bor kvartira. Egasi chet elga ko‘chmoqda va tez sotmoqchi.'),
  estate('flat2', 'Sergelida 2 xonali kvartira', 40000, 3000, 100, 'Yangi metro bekati yonida, ijaraga talab yuqori.'),
  estate('flat2', 'Bank musodara qilgan kvartira', 35000, 2000, 180, 'Bank qarzdorning kvartirasini arzon narxda sotmoqda.'),
  estate('flat2', 'Yunusobodda 2 xonali kvartira', 60000, 5000, 220, 'Talabalarga ijaraga berilgan, ular uzoq muddatga kelishgan.'),
  estate('house3', 'Qo‘yliqda 3 xonali hovli', 48000, 4000, 200, 'Bozor yaqinida, oilaga ijaraga berilgan.'),
  estate('house3', 'Ta’mir talab hovli', 52000, 3000, -100, 'Arzon, lekin ijara puli xarajatlarni qoplamaydi. Ehtiyot bo‘ling!'),
  estate('house3', 'Shoshilinch sotuv: 3 xonali hovli', 50000, 5000, 160, 'Egasi boshqa shaharga ko‘chmoqda.'),
  estate('house3', 'Yangi qurilgan hovli', 65000, 5000, 120, 'Hali ijarachi kam, lekin hudud tez rivojlanmoqda.'),
  land('Shahar chekkasida 10 sotix yer', 5000, 'Kelajakda yangi yo‘l o‘tishi kutilmoqda. Hozircha daromad yo‘q.'),
  land('Bog‘ uchastkasi (6 sotix)', 3000, 'Dam olish uchun yaxshi joy. Daromad keltirmaydi.'),
  startup('Uyda tort pishirish', '🎂', 3000, 'Instagram orqali buyurtmalar. Hozircha foyda yo‘q — «Bozor» kartalari biznesingizni o‘stirishi mumkin.'),
  startup('Telegram-do‘kon', '🛒', 4000, 'Qo‘l mehnati buyumlarini onlayn sotish. Hozircha daromad yo‘q.'),
  startup('Kechki repetitorlik markazi', '✏️', 5000, 'Ingliz tili kurslari. Hozircha faqat o‘zini oqlamoqda.'),
  business('vending', 'Qahva avtomati (biznes markazda)', '☕', 4000, 4000, 150, 'Tayyor joy va doimiy mijozlar oqimi bilan.'),
  business('bikes', 'Velosiped ijarasi punkti', '🚲', 5000, 5000, 170, 'Istirohat bog‘i yonida, elektr skuterlar ham bor.'),
  business('note', 'Do‘stingiz biznesiga qarz', '🤝', 5000, 5000, 100, 'Do‘stingiz har oy $100 foiz to‘lab turadi.'),
  gold('Qadimiy oltin tangalar', 500, 'Kolleksioner meros tangalarni sotmoqda. Xohlagancha oling.'),
  gold('Oltin tangalar kim oshdi savdosi', 300, 'Bank tanga kolleksiyasini arzon narxda sotmoqda.'),
];

export const BIG_DEALS = [
  estate('house3', 'Yunusobodda 3 xonali hovli', 85000, 10000, 300, 'Yaxshi ta’mirlangan, oila ijaraga olgan.'),
  estate('house3', 'Mirzo Ulug‘bekda 3 xonali hovli', 100000, 15000, 450, 'Elchixonalar yaqinida, xorijliklarga ijaraga beriladi.'),
  estate('house3', 'Ijarachilari bilan hovli', 75000, 8000, 250, 'Ijarachilar 3 yillik shartnoma imzolagan.'),
  estate('house3', 'Hashamatli hovli', 130000, 20000, -50, 'Chiroyli, lekin qimmat — ijara puli ipotekani qoplamaydi.'),
  estate('house3', 'Qarzdor egadan hovli', 70000, 7000, 400, 'Egasi qarzini uzish uchun arzonga sotmoqda.'),
  estate('plex', '4 xonadonli uy (Olmazor)', 120000, 15000, 600, 'To‘rtta ijarachi, barqaror daromad.', 4),
  estate('plex', '4 xonadonli uy (Chilonzor)', 140000, 20000, 800, 'Metro yonida, xonadonlar doim band.', 4),
  estate('plex', '8 xonadonli uy', 240000, 40000, 1700, 'Boshqaruvchi kompaniya bilan — vaqtingiz sarflanmaydi.', 8),
  estate('plex', '8 xonadonli eski bino', 200000, 32000, 1200, 'Ta’mir talab, lekin ijarachilar to‘la.', 8),
  estate('complex', '24 xonadonli turar-joy majmuasi', 600000, 75000, 3400, 'Investorlar guruhi o‘z ulushini sotmoqda.', 24),
  estate('complex', '60 xonadonli turar-joy majmuasi', 1500000, 200000, 9500, 'Haqiqiy katta o‘yin! Bunday imkoniyat kamdan-kam bo‘ladi.', 60),
  business('somsa', 'Somsaxona', '🥟', 100000, 20000, 1800, 'Tandir somsasi bilan mashhur, tushlikda navbat bo‘ladi.'),
  business('choyxona', 'Choyxona', '🫖', 150000, 30000, 2500, 'Mahalla choyxonasi: osh, choy va doimiy mijozlar.'),
  business('toyxona', 'To‘yxona (400 o‘rinli)', '💒', 400000, 80000, 6000, 'Yil oxirigacha barcha shanba-yakshanbalar band.'),
  business('carwash', 'Avtoyuvish shoxobchasi', '🚿', 125000, 25000, 1600, 'Katta yo‘l bo‘yida, 4 ta joy.'),
  business('pizza', 'Pitsa franshizasi', '🍕', 300000, 60000, 4200, 'Tayyor biznes-model va taniqli brend.'),
  business('parking', 'Avtoturargoh (40 o‘rin)', '🅿️', 80000, 20000, 1500, 'Savdo markazi yonida, doim to‘la.'),
  business('bakery', 'Tandir non novvoyxonasi', '🫓', 90000, 18000, 1400, 'Issiq non har tongda tugab qoladi.'),
  business('market', 'Mini-market', '🏪', 200000, 40000, 2800, 'Yangi turar-joy massivi ichida.'),
  business('pharmacy', 'Dorixona', '💊', 250000, 50000, 3200, 'Poliklinika yonida.'),
  business('laundry', 'Kir yuvish xonasi', '🧺', 150000, 25000, 2000, 'Talabalar turar joyi yaqinida.'),
  business('hotel', 'Mehmonxona qurilishida ulush', '🏗️', 30000, 30000, 600, 'Hamkorlik ulushi: har oy foydadan ulushingizni olasiz.'),
  land('Toshkent atrofida 1 gektar yer', 30000, 'Quruvchilar bu hududga qiziqmoqda. Hozircha daromad yo‘q.'),
  land('Yo‘l bo‘yidagi tijorat yeri', 25000, 'Yoqilg‘i quyish shoxobchasi uchun qulay joy.'),
];

const sell = (target, price, title, text) => ({ kind: 'sell', target, price, title, text });
const sellUnit = (price, title, text) => ({ kind: 'sellUnit', price, title, text });
const sellTag = (tag, price, title, text) => ({ kind: 'sellTag', tag, price, title, text });
const goldBuyer = (price, title, text) => ({ kind: 'gold', price, title, text });
const boost = (amount, title, text) => ({ kind: 'boost', amount, title, text });
const damage = (cost, title, text) => ({ kind: 'damage', cost, title, text });

export const MARKET = [
  sell('house3', 65000, 'Xaridor: 3 xonali hovli', 'Yosh oila 3 xonali hovli uchun $65 000 taklif qilmoqda.'),
  sell('house3', 85000, 'Xaridor: 3 xonali hovli', 'Chet eldan qaytgan oila hovli izlamoqda: $85 000.'),
  sell('house3', 100000, 'Hovlilarga talab oshdi', 'Har qanday 3 xonali hovli uchun $100 000.'),
  sell('house3', 135000, 'Ko‘chmas mulk narxi keskin oshdi!', 'Investor 3 xonali hovli uchun $135 000 to‘lashga tayyor.'),
  sell('flat2', 45000, 'Xaridor: 2 xonali kvartira', 'Yosh juftlik 2 xonali kvartira uchun $45 000 taklif qilmoqda.'),
  sell('flat2', 60000, 'Kvartiralarga talab yuqori', 'Har qanday 2 xonali kvartira uchun $60 000.'),
  sell('flat2', 75000, 'Metro yonidagi kvartiralar qimmatladi', '2 xonali kvartira uchun $75 000.'),
  sell('land', 25000, 'Fermer yer qidirmoqda', 'Har qanday yer uchastkasi uchun $25 000.'),
  sell('land', 60000, 'Quruvchi kompaniya yer sotib olmoqda', 'Yangi massiv uchun har qanday uchastkaga $60 000.'),
  sellUnit(25000, 'Ko‘p xonadonli uy xaridori', 'Har bir xonadon uchun $25 000 — 4 va 8 xonadonli uylar hamda majmualar.'),
  sellUnit(35000, 'Ijara biznesi uchun xaridor', 'Har bir xonadon uchun $35 000.'),
  sellUnit(45000, 'Investitsiya fondi uy sotib olmoqda', 'Har bir xonadon uchun $45 000!'),
  sellTag('somsa', 180000, 'Restoran tarmog‘i somsaxona izlamoqda', 'Somsaxona uchun $180 000.'),
  sellTag('choyxona', 260000, 'Choyxona uchun xaridor', 'Mahalla choyxonasi uchun $260 000.'),
  sellTag('carwash', 200000, 'Avtoyuvish tarmog‘i kengaymoqda', 'Avtoyuvish shoxobchasi uchun $200 000.'),
  sellTag('pizza', 500000, 'Franshiza egasi bizneslarni qaytarib olmoqda', 'Pitsa franshizasi uchun $500 000.'),
  sellTag('toyxona', 700000, 'To‘yxona uchun xaridor', 'Mehmonxona tarmog‘i to‘yxona uchun $700 000 taklif qilmoqda.'),
  sellTag('parking', 150000, 'Avtoturargoh xaridori', 'Avtoturargoh uchun $150 000.'),
  sellTag('market', 350000, 'Supermarketlar tarmog‘i', 'Mini-market uchun $350 000.'),
  sellTag('bakery', 160000, 'Non kombinati novvoyxona izlamoqda', 'Novvoyxona uchun $160 000.'),
  sellTag('hotel', 90000, 'Mehmonxona qurib bitkazildi', 'Hamkorlik ulushi uchun $90 000.'),
  goldBuyer(1000, 'Kolleksioner oltin tanga qidirmoqda', 'Har bir tanga uchun $1 000.'),
  goldBuyer(1500, 'Oltin narxi rekord darajada!', 'Har bir tanga uchun $1 500.'),
  boost(250, 'Kichik biznes o‘smoqda', 'Har bir kichik biznesning oylik daromadi $250 ga oshdi.'),
  boost(400, 'Biznesingiz internetda mashhur bo‘ldi', 'Har bir kichik biznesning oylik daromadi $400 ga oshdi.'),
  damage(1000, 'Ijarachi xonadonni buzib ketdi', 'Agar sizda ko‘chmas mulk bo‘lsa, ta’mir uchun $1 000 to‘laysiz.'),
  damage(500, 'Quvur yorildi', 'Agar sizda ko‘chmas mulk bo‘lsa, ta’mir uchun $500 to‘laysiz.'),
];

export const DOODADS = [
  { title: 'Yangi smartfon', icon: '📱', cost: 800, text: 'Eski telefoningiz hali yaxshi ishlardi, lekin yangi model juda chiroyli edi…' },
  { title: 'Do‘stingiz to‘yiga to‘yona', icon: '💐', cost: 300, text: 'To‘y — muqaddas. Konvertni unutmang!' },
  { title: 'Osh markazida ziyofat', icon: '🍛', cost: 150, text: 'Do‘stlar bilan uchrashuv — hisob sizdan.' },
  { title: 'Avtomobilga yangi shinalar', icon: '🛞', cost: 400, text: 'Qish yaqinlashmoqda.' },
  { title: 'Sport zali a’zoligi', icon: '🏋️', cost: 500, text: 'Bir yillik to‘lov. Atigi ikki marta bordingiz.' },
  { title: 'Mehmonlar uchun yangi gilam', icon: '🧶', cost: 900, text: 'Qo‘shnilarnikidan qolishmasin!' },
  { title: 'Navro‘z dasturxoni', icon: '🌷', cost: 250, text: 'Sumalak, ko‘k somsa va ko‘p mehmonlar.' },
  { title: 'Onlayn chegirmalar', icon: '📦', cost: 350, text: '«Chegirma» degan so‘zga yana aldandingiz.' },
  { title: 'Har kuni taksi', icon: '🚕', cost: 200, text: 'Avtobusda yurish noqulay tuyuldi.' },
  { title: 'Yangi krossovkalar', icon: '👟', cost: 180, text: 'Albatta, brendli.' },
  { title: 'Restoranda tug‘ilgan kun', icon: '🎂', cost: 300, text: 'Hammani taklif qildingiz.' },
  { title: 'Mashina kuzovi ta’miri', icon: '🔧', cost: 600, text: 'Kichik avariya — katta hisob.' },
  { title: 'Bolalar uchun o‘yinchoqlar', icon: '🧸', perChild: 150, text: 'Har bir farzand uchun $150. Farzandingiz bo‘lmasa — to‘lov yo‘q.' },
  { title: 'Maktab formasi va daftarlar', icon: '🎒', perChild: 200, text: 'Har bir farzand uchun $200. Farzandingiz bo‘lmasa — to‘lov yo‘q.' },
  { title: 'Antalyaga ta’til', icon: '🏖️', cost: 500, loan: { liability: 'card', amount: 3000, payment: 90 }, text: '$500 naqd, qolgani kredit kartaga: qarz $3 000, oyiga $90.' },
  { title: 'Katta televizor — muddatli to‘lovga', icon: '📺', cost: 200, loan: { liability: 'retail', amount: 2000, payment: 60 }, text: '$200 boshlang‘ich to‘lov, qolgani bo‘lib to‘lanadi: qarz $2 000, oyiga $60.' },
  { title: 'Yangi muzlatkich — muddatli to‘lovga', icon: '🧊', cost: 100, loan: { liability: 'retail', amount: 1200, payment: 40 }, text: '$100 boshlang‘ich to‘lov: qarz $1 200, oyiga $40.' },
  { title: 'To‘y uchun yangi kostyum', icon: '🤵', cost: 450, text: 'Qarindoshingiz to‘yida chiroyli ko‘rinish kerak.' },
  { title: 'Har kuni qahvaxonada qahva', icon: '☕', cost: 120, text: 'Bittasi $4 — bir oyda qancha bo‘lishini hisoblab ko‘ring.' },
  { title: 'Tish shifokori', icon: '🦷', cost: 350, text: 'Kutilmagan, lekin zarur xarajat.' },
  { title: 'O‘yinlar uchun yangi noutbuk', icon: '🎮', cost: 1200, text: 'Ish uchun eskisi yetarli edi.' },
  { title: 'Moda kiyimlar', icon: '👗', cost: 400, text: 'Mavsumiy chegirmalar boshlandi.' },
  { title: 'Konsertga VIP chiptalar', icon: '🎤', cost: 350, text: 'Sevimli xonandangiz shaharga keldi.' },
  { title: 'Yangi velosiped', icon: '🚴', cost: 300, text: 'Ikki marta minib, garajga qo‘ydingiz.' },
  { title: 'Aqlli soat', icon: '⌚', cost: 250, text: 'Qadamlarni sanaydi — siz esa ko‘p yurmaysiz.' },
];
