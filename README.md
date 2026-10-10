# 💸 Pul Oqimi

Moliyaviy erkinlik haqidagi onlayn stol o‘yini — do‘stlar bilan birga, o‘zbek tilida.

Har bir o‘yinchi kasb bilan boshlaydi: maosh, soliqlar, ipoteka, kreditlar. Maqsad — **kalamush poygasidan
chiqish**: aksiya, kvartira va biznes sotib olib, passiv daromadingizni jami xarajatlardan oshirish. Shundan
so‘ng **tezkor yo‘l** ochiladi — u yerda orzuingizni sotib olgan yoki oylik daromadini +$200 000 ga oshirgan
o‘yinchi g‘olib bo‘ladi.

> **Stol varianti (prototip).** Bu tarmoqda o‘zimizning stol o‘yini taxtasi asosidagi qoidalar: 52 katakli
> tezkor yo‘l (ishonchli va tavakkal bizneslar, 15 ta orzu), 4 ta maosh kuni, «Investor», «Bozor: aksiyalar»,
> «Bozor: ko‘chmas mulk», kichik va katta xarajatlar alohida to‘plamlarda.

> O‘yin mexanikasi Robert Kiyosakining mashhur moliyaviy stol o‘yinidan ilhomlangan; barcha kartalar,
> kasblar, raqamlar va dizayn — o‘zimizniki, mahalliy hayotga moslangan.

## Imkoniyatlar

- 🏠 **Onlayn xonalar**: 4 harfli kod yoki havola orqali 1–6 o‘yinchi, Telegram’da ulashish tugmasi
- 🎲 **Ikki halqali taxta**: 24 katakli kalamush poygasi (4 ta maosh kuni) va 52 katak + 4 ta «Pullar» burchagidan
  iborat tezkor yo‘l; 3D zarlar, sakrab yuradigan fishkalar
- 🏢 **Ishonchli va tavakkal biznes**: ishonchli biznes kafolatli daromad beradi, tavakkal biznes qimmat va daromadi
  yuqori — sotib olgach zar tashlanadi: 4–6 biznes ishlaydi, 1–3 sarmoya kuyadi
- 🤵 **Investor**: biznesga istalgan summani kiriting ($1 000 qadam) — oylik daromad kiritgan pulga mutanosib
- 📊 **Aksiyalar bozori**: O‘zbekiston kompaniyalari (Akfa, Korzinka, UzAuto Motors, Uzum, Artel, Uzbektelecom,
  Navoiy KMK, Hamkorbank, Qizilqumsement) va o‘z brendlarimiz — Buraq Logistics, Moow Motors. Narx chiqqanda
  barcha o‘yinchilar 15 soniya davomida sotib oladi va sotadi. Kartalardagi narx va yangiliklar o‘yin uchun o‘ylab topilgan
- 💼 **13 ta kasb** — farroshdan shifokorgacha, har birining o‘z daromad-xarajat hisoboti bor
- 🃏 **300+ karta**: aksiyalar (11 ta kompaniya), obligatsiya va fondlar, 1–3 xonali kvartiralar, garajlar,
  do‘konlar, ko‘p xonadonli uylar, 30 dan ortiq biznes turi — somsaxona, choyxona, osh markazi, to‘yxona,
  Buxorodagi mehmon uyi, pomidor issiqxonasi… Bozor yangiliklari (ijara oshishi, mulk solig‘i, soliq imtiyozlari,
  yillik mukofot) va mahalliy ortiqcha xarajatlar: «to‘yona», beshik to‘yi, mehmonlar, Navro‘z dasturxoni
- 🎲 **Halol zarlar**: zarlar va kartalar serverda kriptografik tasodifiy generator (`crypto.randomInt`) bilan
  aniqlanadi — natijani hech kim oldindan bila olmaydi. «Jurnal» bo‘limida har bir son necha marta tushgani ko‘rinadi
- 📊 **To‘liq moliyaviy hisobot**: daromadlar, xarajatlar, aktivlar, majburiyatlar, «moliyaviy erkinlik» o‘lchagichi,
  har bir bitim uchun yillik daromadlilik (ROI)
- 🏦 **Bank**: $1 000 qadamli qarz (oyiga 10%), qarzlarni muddatidan oldin yopish, majburiy to‘lovda avtomatik kredit, bankrotlik
- 🤝 **O‘yinchilar o‘zaro**: aksiya yoki «Bozor» kartasi chiqqanda mos aktivi bor har bir o‘yinchi sotishi mumkin;
  10 soniyalik kutish oynasi hammaga ulgurish imkonini beradi
- 👶 Farzand, 💤 ishsizlik, 🤝 xayriya (2 ta zar), 🛍️ kichik va 💸 katta xarajatlar (to‘y, ta’mir, davolanish)
- ⚠️ Tezkor yo‘ldagi xavflar: 🧾 soliq tekshiruvi (−30%), 💔 ajrashuv (−50%), 🚔 noqonuniy ish (2 navbat),
  💥 bankrot (bizneslardan biri — o‘yinchi o‘zi tanlaydi)
- ⭐ **15 ta orzu**: kutish zalida har kim o‘z orzusini tanlaydi — Surxondaryoda subtropik bog‘, 1000 ta oilaning to‘yi,
  kosmosga parvoz, Dubaydan orol…
- ⚙️ **Sozlamalar**: to‘liq yoki qisqa o‘yin, navbat uchun vaqt cheklovi
- 🔁 Sahifa yangilansa yoki internet uzilsa — o‘yinchi o‘z hisoboti bilan qaytadi; uzilgan o‘yinchining navbati
  avtomatik o‘tadi; o‘yin davomida ham qo‘shilish mumkin
- 😂 Emoji-reaksiyalar, sintez qilingan ovozlar, konfetti, telefon va kompyuterga moslashgan dizayn

## Ishga tushirish

Node.js 18 yoki undan yangi versiya kerak.

```bash
npm install
npm start
```

So‘ng brauzerda `http://localhost:3000` manzilini oching. Port `PORT` muhit o‘zgaruvchisi orqali o‘zgartiriladi.

**Bir Wi-Fi tarmog‘ida o‘ynash:** kompyuteringizning lokal IP manzilini toping (masalan, `192.168.1.10`)
va do‘stlaringiz telefonida `http://192.168.1.10:3000` ni ochishsin.

**Internetda o‘ynash:** loyihani Node.js va WebSocket’ni qo‘llab-quvvatlaydigan istalgan xostingga joylang
(Render, Railway, Fly.io, VPS va h.k.). Ishga tushirish buyrug‘i — `npm start`. Docker bilan:

```bash
docker build -t pul-oqimi .
docker run -p 3000:3000 pul-oqimi
```

> GitHub Pages kabi faqat statik fayllarni joylaydigan xostinglar mos emas — o‘yinga server kerak.

## Testlar

```bash
npm test
```

Testlar o‘yin qoidalarini (maosh, bitimlar, bozor, bank, bankrotlik, xayriya, tezkor yo‘l, g‘alaba shartlari),
zarlarning haloligini (χ² mezoni bilan: har bir son, ikki zar yig‘indisi va ketma-ket tashlashlar mustaqilligi),
kartalar to‘g‘riligini va haqiqiy WebSocket ulanishlari orqali ko‘p o‘yinchili seansni tekshiradi.

## Tuzilishi

```
server/
  index.js            — serverni ishga tushirish
  app.js              — HTTP (statik fayllar) va WebSocket
  room.js             — xonalar, kutish zali, navbat taymeri, qayta ulanish
  cashflow/game.js    — o‘yin dvigateli: barcha qoidalar
  cashflow/cards.js   — kartalar (faqat serverda — keyingi karta sir saqlanadi)
public/
  index.html, css/style.css
  js/shared/rules.js  — taxta, kasblar, orzular va moliyaviy formulalar (server bilan umumiy)
  js/app.js           — ekranlar, kutish zali, natijalar
  js/game-ui.js       — o‘yin ekrani: navbat, kartalar, effektlar
  js/board.js         — taxta, fishkalar, zarlar
  js/statement.js     — moliyaviy hisobot va bank
  js/cards.js         — karta ko‘rinishi
test/                 — node:test testlari
```
