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
  tick: () => tone(1250, { dur: 0.05, type: 'square', vol: 0.05 }),
  beat: () => tone(440, { dur: 0.2, type: 'triangle', vol: 0.22 }),
  go: () => {
    tone(660, { dur: 0.14, type: 'triangle', vol: 0.22 });
    tone(990, { at: 0.12, dur: 0.35, type: 'triangle', vol: 0.22 });
  },
  stamp: () => {
    noise({ dur: 0.16, vol: 0.55, freq: 420 });
    tone(110, { dur: 0.16, vol: 0.4, to: 45 });
  },
  correct: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.075, dur: 0.24, type: 'triangle', vol: 0.17 })),
  wrong: () => {
    tone(233, { dur: 0.28, type: 'sawtooth', vol: 0.08, to: 150 });
    tone(175, { at: 0.14, dur: 0.34, type: 'sawtooth', vol: 0.07, to: 98 });
  },
  car: () => {
    tone(55, { dur: 1.3, type: 'sawtooth', vol: 0.035, to: 95, attack: 0.15 });
    noise({ dur: 1.2, vol: 0.06, freq: 260 });
  },
  barrier: () => tone(320, { dur: 0.5, type: 'triangle', vol: 0.07, to: 620 }),
  siren: () => {
    for (let i = 0; i < 3; i++) {
      tone(880, { at: i * 0.34, dur: 0.17, type: 'square', vol: 0.035 });
      tone(660, { at: i * 0.34 + 0.17, dur: 0.17, type: 'square', vol: 0.035 });
    }
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
