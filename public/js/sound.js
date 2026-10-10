// Barcha ovozlar WebAudio orqali sintez qilinadi — tashqi fayllar kerak emas.

const KEY = 'bu.muted';
let ctx = null;
let master = null;
let muted = (() => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();

function ac() {
  if (muted) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, { at = 0, dur = 0.15, type = 'sine', vol = 0.2, to = null, attack = 0.006 } = {}) {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise({ at = 0, dur = 0.2, vol = 0.3, freq = 800, q = 0.8, type = 'lowpass' } = {}) {
  const c = ac();
  if (!c) return;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(master);
  src.start(c.currentTime + at);
}

export const sfx = {
  click: () => tone(700, { dur: 0.06, type: 'triangle', vol: 0.1 }),
  pop: () => tone(480, { dur: 0.14, vol: 0.18, to: 900 }),
  join: () => {
    tone(523, { dur: 0.14, type: 'triangle', vol: 0.16 });
    tone(784, { at: 0.1, dur: 0.22, type: 'triangle', vol: 0.16 });
  },
  leave: () => {
    tone(587, { dur: 0.14, type: 'triangle', vol: 0.12 });
    tone(392, { at: 0.1, dur: 0.22, type: 'triangle', vol: 0.12 });
  },
  // Zar stolda dumalaydi
  dice: () => {
    for (let i = 0; i < 7; i++) noise({ at: i * 0.09 + Math.random() * 0.03, dur: 0.05, vol: 0.35 - i * 0.03, freq: 2400 + Math.random() * 1500, type: 'bandpass', q: 2 });
  },
  step: () => tone(880 + Math.random() * 80, { dur: 0.05, type: 'triangle', vol: 0.06 }),
  flip: () => noise({ dur: 0.18, vol: 0.14, freq: 3000, type: 'highpass', q: 0.5 }),
  coin: () => {
    tone(1568, { dur: 0.08, type: 'square', vol: 0.05 });
    tone(2093, { at: 0.07, dur: 0.2, type: 'square', vol: 0.05 });
  },
  // Kassa apparati: «chin-chin»
  kaching: () => {
    noise({ dur: 0.06, vol: 0.25, freq: 1800, type: 'bandpass' });
    [1318, 1760, 2637].forEach((f, i) => tone(f, { at: 0.06 + i * 0.07, dur: 0.35, type: 'sine', vol: 0.11 }));
  },
  buy: () => {
    tone(392, { dur: 0.12, type: 'triangle', vol: 0.16 });
    tone(523, { at: 0.08, dur: 0.12, type: 'triangle', vol: 0.16 });
    tone(784, { at: 0.16, dur: 0.3, type: 'triangle', vol: 0.16 });
  },
  spend: () => {
    tone(523, { dur: 0.12, type: 'triangle', vol: 0.12 });
    tone(415, { at: 0.1, dur: 0.24, type: 'triangle', vol: 0.12 });
  },
  baby: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, { at: i * 0.11, dur: 0.25, type: 'sine', vol: 0.12 })),
  charity: () => [523, 659, 784].forEach((f, i) => tone(f, { at: i * 0.1, dur: 0.4, type: 'sine', vol: 0.12 })),
  down: () => {
    tone(392, { dur: 0.25, type: 'sawtooth', vol: 0.06, to: 330 });
    tone(330, { at: 0.22, dur: 0.25, type: 'sawtooth', vol: 0.06, to: 262 });
    tone(262, { at: 0.44, dur: 0.5, type: 'sawtooth', vol: 0.06, to: 196 });
  },
  turn: () => {
    tone(660, { dur: 0.12, type: 'triangle', vol: 0.18 });
    tone(990, { at: 0.1, dur: 0.3, type: 'triangle', vol: 0.18 });
  },
  correct: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.075, dur: 0.24, type: 'triangle', vol: 0.17 })),
  wrong: () => {
    tone(233, { dur: 0.28, type: 'sawtooth', vol: 0.08, to: 150 });
    tone(175, { at: 0.14, dur: 0.34, type: 'sawtooth', vol: 0.07, to: 98 });
  },
  whoosh: () => noise({ dur: 0.4, vol: 0.16, freq: 1400, type: 'bandpass' }),
  fanfare: () => {
    const notes = [523, 659, 784, 1047, 784, 1047];
    const times = [0, 0.13, 0.26, 0.39, 0.62, 0.75];
    notes.forEach((f, i) => tone(f, { at: times[i], dur: i === notes.length - 1 ? 0.7 : 0.22, type: 'triangle', vol: 0.18 }));
    tone(262, { at: 0.62, dur: 0.9, type: 'sine', vol: 0.12 });
  },
};

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? '1' : '0');
  } catch {}
  if (value && ctx) ctx.suspend().catch(() => {});
}

// Brauzerlar ovozni faqat foydalanuvchi harakatidan keyin ruxsat beradi
export function unlockAudio() {
  ac();
}
