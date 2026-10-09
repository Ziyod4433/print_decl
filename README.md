# 🛃 Bojxona Ustasi

Do‘stlar bilan birga o‘ynaladigan onlayn ko‘p o‘yinchili o‘yin (o‘zbek tilida).

Har raundda chegaraga avtomobil keladi. O‘yinchilar **bojxona deklaratsiyasini** avtomobilning
**texnik pasporti** bilan solishtirib, xato qatorni hammadan tez topishlari kerak — yoki hujjatlar
to‘g‘ri bo‘lsa, avtomobilni o‘tkazib yuborishlari kerak. Aniq va tez javob — ko‘proq ball!

## Imkoniyatlar

- 🏠 **Xonalar**: 4 harfli kod yoki havola orqali 2–12 o‘yinchi qo‘shiladi, Telegram’da ulashish tugmasi bor
- ⚡ **Real vaqt**: WebSocket orqali hamma bir vaqtda o‘ynaydi, kim javob berganini ko‘rib turasiz
- 🎯 **Ball tizimi**: to‘g‘ri javob 500 ball + tezlik uchun 500 gacha + ketma-ket to‘g‘ri javoblar uchun bonus
- 📈 **Qiyinlik oshib boradi**: avval yaqqol farqlar, oxirida — VIN’dagi bitta o‘xshash belgi (8/B, 5/S),
  familiyadagi transliteratsiya (Yusupov/Yusufov), «1.5T» va «1.5» kabi nozik farqlar
- 🚗 **Animatsiyalar**: tungi chegara sahnasi, shlagbaum, avtomobil keladi va ketadi yoki tekshiruvga olinadi,
  muhrlar, ortga sanoq, reytingdagi o‘rin almashinuvi, shohsupa va konfetti
- 😂 **Reaksiyalar**: emoji yuborsangiz, hammaning ekranida uchib chiqadi
- 🔊 **Ovozlar**: WebAudio orqali sintez qilinadi (o‘chirib qo‘yish mumkin)
- 🔁 **Qayta ulanish**: sahifa yangilansa yoki internet uzilib qolsa, o‘yinchi o‘z ballari bilan qaytadi;
  mezbon chiqib ketsa, mezbonlik boshqa o‘yinchiga o‘tadi
- 📱 Telefon va kompyuterda ishlaydi

## Ishga tushirish

Node.js 18 yoki undan yangi versiya kerak.

```bash
npm install
npm start
```

So‘ng brauzerda `http://localhost:3000` manzilini oching. Port `PORT` muhit o‘zgaruvchisi orqali o‘zgartiriladi.

**Bir Wi-Fi tarmog‘ida do‘stlar bilan o‘ynash:** kompyuteringizning lokal IP manzilini toping
(masalan, `192.168.1.10`) va do‘stlaringiz telefonida `http://192.168.1.10:3000` ni ochishsin.

**Internetda o‘ynash:** loyihani Node.js va WebSocket’ni qo‘llab-quvvatlaydigan istalgan
xostingga joylashtiring (Render, Railway, Fly.io, VPS va h.k.). Ishga tushirish buyrug‘i — `npm start`.
Docker bilan:

```bash
docker build -t bojxona-ustasi .
docker run -p 3000:3000 bojxona-ustasi
```

> GitHub Pages kabi faqat statik fayllarni joylaydigan xostinglar mos emas — o‘yinga server kerak.

## Testlar

```bash
npm test
```

Testlar hujjatlar generatorini (har bir ishda aynan bitta farq, to‘g‘ri VIN) va haqiqiy WebSocket
ulanishlari orqali to‘liq o‘yinni tekshiradi: xona yaratish, qo‘shilish, ball hisoblash,
qayta ulanish, mezbonlikni o‘tkazish.

## Tuzilishi

```
server/
  index.js   — serverni ishga tushirish
  app.js     — HTTP (statik fayllar) va WebSocket
  room.js    — xona va o‘yin bosqichlari: kutish → ortga sanoq → raund → javob → reyting → yakun
  cases.js   — avtomobil, ism-familiya, VIN va yashirin xatolarni generatsiya qilish
public/
  index.html, css/style.css
  js/app.js  — ekranlar va o‘yin mantiqi
  js/scene.js — chegara sahnasi va SVG avtomobillar
  js/fx.js, js/sound.js, js/net.js, js/dom.js
test/        — node:test testlari
```

To‘g‘ri javob server tomonda saqlanadi va faqat raund tugagach yuboriladi — brauzer orqali
«ko‘chirib olish» imkonsiz.
