// Har bir raund uchun "ish" (case) generatsiyasi: deklaratsiya, texnik pasport
// va (ehtimol) ular orasidagi bitta yashirin nomuvofiqlik.

export const FIELDS = ['fio', 'vin', 'model', 'year', 'engine', 'color'];
export const OK = 'ok';

const VIN_CHARS = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
const VIN_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
const VIN_YEAR = { 2016: 'G', 2017: 'H', 2018: 'J', 2019: 'K', 2020: 'L', 2021: 'M', 2022: 'N', 2023: 'P', 2024: 'R', 2025: 'S', 2026: 'T' };
const VIN_TRANSLIT = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9 };
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
// Ko‘zga o‘xshash belgilar — eng qiyin VIN xatolari shulardan yasaladi
const VIN_LOOKALIKE = { 8: 'B', B: '8', 5: 'S', S: '5', 0: 'D', D: '0', 2: 'Z', Z: '2', 1: '7', 7: '1', 6: 'G', G: '6', U: 'V', V: 'U', E: 'F', F: 'E', M: 'N', N: 'M', 3: '8', C: 'G', K: 'X', X: 'K' };

const MIN_YEAR = 2016;
const MAX_YEAR = 2026;

const CARS = [
  { name: 'BYD Seal U', wmi: 'LGX', body: 'suv', engines: ['1.5T'], similar: ['BYD Seal', 'BYD Song Plus', 'BYD Song L'] },
  { name: 'BYD Song Plus', wmi: 'LGX', body: 'suv', engines: ['1.5 Gibrid', 'Elektr'], similar: ['BYD Song Pro', 'BYD Seal U', 'BYD Tang'] },
  { name: 'BYD Han', wmi: 'LGX', body: 'sedan', engines: ['Elektr', '1.5 Gibrid'], similar: ['BYD Tang', 'BYD Seal', 'BYD Qin Plus'] },
  { name: 'Chevrolet Tahoe', wmi: '1GN', body: 'suv', engines: ['5.3', '6.2'], similar: ['Chevrolet Traverse', 'Chevrolet Suburban', 'Chevrolet Trailblazer'] },
  { name: 'Kia K5', wmi: 'KNA', body: 'sedan', engines: ['2.0', '2.5', '1.6T'], similar: ['Kia K8', 'Kia K3', 'Kia Stinger'] },
  { name: 'Kia Sportage', wmi: 'KNA', body: 'suv', engines: ['2.0', '1.6T'], similar: ['Kia Sorento', 'Kia Seltos', 'Kia Sonet'] },
  { name: 'Hyundai Tucson', wmi: 'KMH', body: 'suv', engines: ['2.0', '1.6T'], similar: ['Hyundai Santa Fe', 'Hyundai Creta', 'Hyundai Palisade'] },
  { name: 'Hyundai Sonata', wmi: 'KMH', body: 'sedan', engines: ['2.0', '2.5', '1.6T'], similar: ['Hyundai Elantra', 'Hyundai Grandeur', 'Hyundai Azera'] },
  { name: 'Toyota Camry', wmi: 'JTN', body: 'sedan', engines: ['2.5', '3.5', '2.0'], similar: ['Toyota Corolla', 'Toyota Crown', 'Toyota Avalon'] },
  { name: 'Toyota Land Cruiser 300', wmi: 'JTM', body: 'suv', engines: ['3.5T', '3.3T'], similar: ['Toyota Land Cruiser 200', 'Toyota Land Cruiser Prado', 'Toyota Sequoia'] },
  { name: 'Toyota RAV4', wmi: 'JTM', body: 'suv', engines: ['2.0', '2.5'], similar: ['Toyota C-HR', 'Toyota Highlander', 'Toyota Venza'] },
  { name: 'Li Auto L7', wmi: 'LW4', body: 'suv', engines: ['1.5T'], similar: ['Li Auto L8', 'Li Auto L9', 'Li Auto L6'] },
  { name: 'Zeekr 001', wmi: 'L6T', body: 'sedan', engines: ['Elektr'], similar: ['Zeekr 007', 'Zeekr 009', 'Zeekr 7X'] },
  { name: 'Chery Tiggo 7 Pro', wmi: 'LVV', body: 'suv', engines: ['1.5T', '1.6T'], similar: ['Chery Tiggo 8 Pro', 'Chery Tiggo 4 Pro', 'Chery Arrizo 8'] },
  { name: 'Haval H6', wmi: 'LGW', body: 'suv', engines: ['1.5T', '2.0T'], similar: ['Haval H9', 'Haval Jolion', 'Haval F7'] },
  { name: 'Geely Monjaro', wmi: 'L6T', body: 'suv', engines: ['2.0T'], similar: ['Geely Atlas', 'Geely Tugella', 'Geely Coolray'] },
  { name: 'Tesla Model Y', wmi: 'LRW', body: 'suv', engines: ['Elektr'], similar: ['Tesla Model 3', 'Tesla Model X', 'Tesla Model S'] },
  { name: 'Lexus RX 350', wmi: 'JTJ', body: 'suv', engines: ['3.5', '2.4T'], similar: ['Lexus NX 350', 'Lexus RX 500h', 'Lexus LX 600'] },
  { name: 'Mercedes-Benz E 200', wmi: 'W1K', body: 'sedan', engines: ['2.0T'], similar: ['Mercedes-Benz E 300', 'Mercedes-Benz C 200', 'Mercedes-Benz S 450'] },
  { name: 'BMW X5', wmi: '5UX', body: 'suv', engines: ['3.0T', '4.4T'], similar: ['BMW X6', 'BMW X3', 'BMW X7'] },
  { name: 'Changan UNI-K', wmi: 'LS5', body: 'suv', engines: ['2.0T'], similar: ['Changan UNI-V', 'Changan UNI-T', 'Changan CS75 Plus'] },
  { name: 'Volkswagen ID.6', wmi: 'LFV', body: 'suv', engines: ['Elektr'], similar: ['Volkswagen ID.4', 'Volkswagen ID.7', 'Volkswagen Tiguan'] },
  { name: 'Hongqi H5', wmi: 'LFP', body: 'sedan', engines: ['1.5T', '2.0T'], similar: ['Hongqi H9', 'Hongqi HS5', 'Hongqi H6'] },
];

// Birinchi element — eng "yaqin" (eng qiyin) muqobil
const ENGINE_NEAR = {
  '1.5T': ['1.5', '1.6T', '1.8T'],
  '1.6T': ['1.5T', '1.6', '2.0T'],
  '2.0T': ['2.0', '2.5T', '1.8T'],
  '2.0': ['2.0T', '2.4', '1.8'],
  '2.5': ['2.4', '2.0', '3.5'],
  '3.5': ['3.3', '2.5', '3.5T'],
  '3.5T': ['3.3T', '3.5', '4.0'],
  '3.3T': ['3.5T', '3.0T', '3.3'],
  '3.0T': ['2.0T', '3.5', '4.4T'],
  '4.4T': ['4.0T', '3.0T', '4.4'],
  '5.3': ['6.2', '5.0', '5.7'],
  '6.2': ['5.3', '6.0', '6.4'],
  '2.4T': ['2.5', '2.0T', '2.4'],
  'Elektr': ['1.5 Gibrid', '2.0 Gibrid', '1.5T'],
  '1.5 Gibrid': ['1.5T', 'Elektr', '2.0 Gibrid'],
};
const ALL_ENGINES = [...new Set(Object.entries(ENGINE_NEAR).flat(2))];

const COLORS = [
  { name: 'Oq', hex: '#f3f4f6', near: ['Sadafrang', 'Kumushrang'] },
  { name: 'Sadafrang', hex: '#ebe3d2', near: ['Oq', 'Kumushrang'] },
  { name: 'Qora', hex: '#1b1d22', near: ['Grafit', 'To‘q ko‘k'] },
  { name: 'Grafit', hex: '#454a52', near: ['Kulrang', 'Qora'] },
  { name: 'Kulrang', hex: '#7c828b', near: ['Grafit', 'Kumushrang'] },
  { name: 'Kumushrang', hex: '#c2c7ce', near: ['Kulrang', 'Oq'] },
  { name: 'Ko‘k', hex: '#2d6cd2', near: ['Moviy', 'To‘q ko‘k'] },
  { name: 'To‘q ko‘k', hex: '#1d3567', near: ['Ko‘k', 'Qora'] },
  { name: 'Moviy', hex: '#5ab1e8', near: ['Zangori', 'Ko‘k'] },
  { name: 'Zangori', hex: '#2fb3ad', near: ['Moviy', 'Yashil'] },
  { name: 'Yashil', hex: '#2e8b57', near: ['Zangori', 'Grafit'] },
  { name: 'Qizil', hex: '#d2343a', near: ['Bordo', 'To‘q sariq'] },
  { name: 'Bordo', hex: '#73202c', near: ['Qizil', 'Jigarrang'] },
  { name: 'Jigarrang', hex: '#6b4532', near: ['Bordo', 'Grafit'] },
  { name: 'Sariq', hex: '#e8b10c', near: ['To‘q sariq', 'Sadafrang'] },
  { name: 'To‘q sariq', hex: '#ea7a1a', near: ['Sariq', 'Qizil'] },
];
// Ko‘chalarda eng ko‘p uchraydigan ranglar tez-tez chiqsin
const COMMON_COLORS = ['Oq', 'Oq', 'Qora', 'Qora', 'Kulrang', 'Kumushrang', 'Sadafrang', 'Grafit'];

// [asosiy, yaqin variant] — transliteratsiya farqlari: bojxonada eng ko‘p uchraydigan xato
const SURNAMES = [
  ['Karimov', 'Kerimov'], ['Rahimov', 'Rahmonov'], ['Yusupov', 'Yusufov'], ['Nazarov', 'Nazirov'],
  ['Saidov', 'Sayidov'], ['Usmonov', 'Usmanov'], ['Sultonov', 'Sultanov'], ['Qodirov', 'Kadirov'],
  ['Xolmatov', 'Holmatov'], ['Tursunov', 'Tursinov'], ['Qosimov', 'Kasimov'], ['Hamidov', 'Xamidov'],
  ['Sharipov', 'Sharifov'], ['Ortiqov', 'Ortikov'], ['Ismoilov', 'Ismailov'], ['Mirzayev', 'Mirzaev'],
  ['Ergashev', 'Ergeshev'], ['Normatov', 'Nurmatov'], ['Toshmatov', 'Toshmetov'], ['Abdullayev', 'Abdulayev'],
  ['Jo‘rayev', 'Jurayev'],
];
const MALE = [
  ['Jasur', 'Jasurbek'], ['Sardor', 'Sarvar'], ['Bekzod', 'Behzod'], ['Otabek', 'Oybek'], ['Javohir', 'Javlon'],
  ['Sherzod', 'Shahzod'], ['Azizbek', 'Aziz'], ['Doniyor', 'Doniyorbek'], ['Akmal', 'Akram'], ['Bobur', 'Bobir'],
  ['Diyorbek', 'Diyor'], ['Farrux', 'Farruh'], ['Jamshid', 'Jamshed'], ['Sanjar', 'Sanjarbek'], ['Temur', 'Timur'],
  ['Islom', 'Islombek'], ['Ulug‘bek', 'Ulug‘murod'], ['Rustam', 'Rustamjon'],
];
const FEMALE = [
  ['Dilnoza', 'Dilfuza'], ['Malika', 'Maliha'], ['Gulnora', 'Gulnoza'], ['Zarina', 'Zarnigor'], ['Nilufar', 'Nilufarxon'],
  ['Madina', 'Mohina'], ['Shahnoza', 'Shaxnoza'], ['Feruza', 'Firuza'], ['Sevara', 'Sevinch'], ['Kamola', 'Komila'],
  ['Mohira', 'Mohinur'], ['Nodira', 'Nozira'], ['Laylo', 'Layli'], ['Munisa', 'Munira'], ['Sabina', 'Sabrina'],
  ['Gulchehra', 'Gulshoda'],
];
const FATHERS = ['Anvar', 'Bahodir', 'Rustam', 'Akmal', 'Farhod', 'Ilhom', 'Murod', 'Shuhrat', 'Komil', 'Alisher',
  'Shavkat', 'Ulug‘bek', 'Rashid', 'Erkin', 'Botir', 'Hamid', 'Nodir', 'Abdulla', 'Sobir', 'Hasan'];

const ORIGIN_BY_WMI = [
  [/^L/, { name: 'Xitoy', flag: '🇨🇳' }],
  [/^K/, { name: 'Janubiy Koreya', flag: '🇰🇷' }],
  [/^J/, { name: 'Yaponiya', flag: '🇯🇵' }],
  [/^W/, { name: 'Germaniya', flag: '🇩🇪' }],
  [/^[15]/, { name: 'AQSH', flag: '🇺🇸' }],
];

export const POSTS = ['G‘ishtko‘prik', 'Yallama', 'Do‘stlik', 'Oybek', 'Olot', 'Sariosiyo', 'Toshkent-Tovar'];

// Kichik, urug‘li (seed) tasodifiy generator — testlarda takrorlanuvchanlik uchun
export function seededRng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function vinCheckDigit(vin) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin[i];
    const v = /\d/.test(c) ? Number(c) : VIN_TRANSLIT[c];
    sum += v * VIN_WEIGHTS[i];
  }
  const r = sum % 11;
  return r === 10 ? 'X' : String(r);
}

export function isValidVinShape(vin) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(vin);
}

function formatDate(d) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tashkent', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('day')}.${get('month')}.${get('year')}`;
}

export function createCaseGenerator(rng = Math.random) {
  const int = (n) => Math.floor(rng() * n);
  const pick = (arr) => arr[int(arr.length)];
  const chance = (p) => rng() < p;
  const str = (alphabet, n) => Array.from({ length: n }, () => pick(alphabet)).join('');

  function makeVin(wmi, year) {
    const body = wmi + str(VIN_CHARS, 5) + '0' + VIN_YEAR[year] + pick(VIN_LETTERS) + str('0123456789', 6);
    return body.slice(0, 8) + vinCheckDigit(body) + body.slice(9);
  }

  function makePerson() {
    const female = chance(0.4);
    const [surname] = pick(SURNAMES);
    const [first] = pick(female ? FEMALE : MALE);
    return { female, surname, first, father: pick(FATHERS) };
  }

  const fio = (p) => `${p.surname}${p.female ? 'a' : ''} ${p.first} ${p.father} ${p.female ? 'qizi' : 'o‘g‘li'}`;

  // tier: 1 — oson, 2 — o‘rtacha, 3 — qiyin
  const mutate = {
    fio(real, tier, ctx) {
      const p = ctx.person;
      if (tier === 1) {
        const names = p.female ? FEMALE : MALE;
        let surname, first;
        do {
          [surname] = pick(SURNAMES);
          [first] = pick(names);
        } while (surname === p.surname || first === p.first);
        return fio({ ...p, surname, first });
      }
      if (tier === 2) {
        const pair = (p.female ? FEMALE : MALE).find(([n]) => n === p.first);
        return fio({ ...p, first: pair[1] });
      }
      const pair = SURNAMES.find(([n]) => n === p.surname);
      return fio({ ...p, surname: pair[1] });
    },
    vin(real, tier) {
      const chars = real.split('');
      if (tier === 3) {
        const spots = [];
        for (let i = 3; i < 17; i++) if (i !== 8 && VIN_LOOKALIKE[chars[i]]) spots.push(i);
        if (spots.length) {
          const i = pick(spots);
          chars[i] = VIN_LOOKALIKE[chars[i]];
          return chars.join('');
        }
      }
      if (tier >= 2) {
        const i = 11 + int(6);
        let d;
        do d = String(int(10)); while (d === chars[i]);
        chars[i] = d;
        return chars.join('');
      }
      let tail;
      do tail = str('0123456789', 5); while (tail === real.slice(12));
      return real.slice(0, 12) + tail;
    },
    model(real, tier, ctx) {
      const car = ctx.car;
      if (tier === 3) return car.similar[0];
      if (tier === 2) return pick(car.similar.slice(1));
      const brand = car.name.split(' ')[0];
      return pick(CARS.filter((c) => !c.name.startsWith(brand))).name;
    },
    year(real, tier) {
      const delta = tier === 3 ? 1 : tier === 2 ? 2 + int(2) : 5 + int(3);
      const up = real + delta <= MAX_YEAR && (real - delta < MIN_YEAR || chance(0.5));
      return String(up ? real + delta : real - delta);
    },
    engine(real, tier) {
      const near = ENGINE_NEAR[real];
      if (tier === 3) return near[0];
      if (tier === 2) return pick(near.slice(1));
      return pick(ALL_ENGINES.filter((e) => e !== real && !near.includes(e)));
    },
    color(real, tier) {
      const c = COLORS.find((x) => x.name === real);
      if (tier === 3) return c.near[0];
      if (tier === 2) return pick(c.near);
      return pick(COLORS.filter((x) => x.name !== real && !c.near.includes(x.name))).name;
    },
  };

  function makeCase({ tier = 2, answer = OK, post = POSTS[0], date = new Date() } = {}) {
    const car = pick(CARS);
    const person = makePerson();
    const year = MIN_YEAR + 2 + int(MAX_YEAR - MIN_YEAR - 1);
    const colorName = chance(0.55) ? pick(COMMON_COLORS) : pick(COLORS).name;
    const color = COLORS.find((c) => c.name === colorName);
    const passport = {
      series: `AA${pick('ABCDEFGHKLMNPRSTXZ')} ${str('0123456789', 7)}`,
      fio: fio(person),
      vin: makeVin(car.wmi, year),
      model: car.name,
      year: String(year),
      engine: pick(car.engines),
      color: color.name,
    };
    const decl = {
      number: `${str('0123456789abcdef', 11)}_1_ugtd`,
      date: formatDate(date),
      fio: passport.fio,
      vin: passport.vin,
      model: passport.model,
      year: passport.year,
      engine: passport.engine,
      color: passport.color,
    };
    let explain = null;
    if (answer !== OK) {
      const real = answer === 'year' ? year : passport[answer];
      decl[answer] = mutate[answer](real, tier, { car, person });
      explain = { field: answer, decl: decl[answer], real: passport[answer] };
    }
    const origin = (ORIGIN_BY_WMI.find(([re]) => re.test(car.wmi)) || [null, { name: 'Xitoy', flag: '🇨🇳' }])[1];
    return {
      tier,
      answer,
      explain,
      post,
      origin,
      car: { body: car.body, color: color.hex },
      decl,
      passport,
    };
  }

  // Butun o‘yin uchun ishlar ketma-ketligi: qiyinlik asta-sekin oshadi,
  // xato maydonlari takrorlanmaydi, "toza" (xatosiz) raundlar ham uchraydi.
  function makeGame(rounds, { date = new Date() } = {}) {
    const post = pick(POSTS);
    const cases = [];
    let bag = [];
    let prevAnswer = null;
    let cleanCount = 0;
    for (let r = 0; r < rounds; r++) {
      const progress = rounds > 1 ? r / (rounds - 1) : 0;
      const tier = progress < 0.34 ? 1 : progress < 0.67 ? 2 : 3;
      const maxClean = Math.max(1, Math.round(rounds * 0.25));
      let answer;
      if (r > 0 && prevAnswer !== OK && cleanCount < maxClean && chance(0.22)) {
        answer = OK;
        cleanCount++;
      } else {
        if (!bag.length) bag = shuffle(FIELDS.slice());
        answer = bag.pop();
        if (answer === prevAnswer && bag.length) {
          const swap = bag.pop();
          bag.push(answer);
          answer = swap;
        }
      }
      prevAnswer = answer;
      cases.push(makeCase({ tier, answer, post, date }));
    }
    return cases;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  return { makeCase, makeGame };
}

// O‘yinchilarga raund davomida yuboriladigan ko‘rinish: to‘g‘ri javobsiz
export function publicCase(c) {
  return { tier: c.tier, post: c.post, origin: c.origin, car: c.car, decl: c.decl, passport: c.passport };
}
