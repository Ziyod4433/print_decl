import crypto from 'node:crypto';
import { createCaseGenerator, publicCase, FIELDS, OK } from './cases.js';

export const AVATARS = ['🦊', '🐯', '🦁', '🐼', '🐸', '🦉', '🐺', '🐻', '🦄', '🐲', '🦅', '🐱', '🍉', '🍇', '🥟', '🫖'];
export const PLAYER_COLORS = ['#22c3e6', '#2fd27a', '#ffc94a', '#ff7a59', '#b78cff', '#ff5fa2', '#4dd0b5', '#7aa2ff', '#f2994a', '#a3e635', '#f472b6', '#38bdf8'];
export const REACTIONS = ['👍', '😂', '😮', '🔥', '👏', '😭', '🎉', '🫡'];
export const ROUND_OPTIONS = [5, 8, 12];
export const TIME_OPTIONS = [15, 25, 40];
export const MAX_PLAYERS = 12;

export const DEFAULT_TIMINGS = {
  countdown: 3600, // 3, 2, 1, Boshladik!
  reveal: 6500, // to‘g‘ri javobni ko‘rsatish
  board: 5500, // raundlar orasidagi reyting
  earlyEnd: 700, // hamma javob berganda raundni erta tugatish
  hostGrace: 8000, // mezbon sahifani yangilasa, mezbonlik darhol o‘tib ketmasin
  lobbyDrop: 45000, // kutish zalida uzilib qolgan o‘yinchini olib tashlash
};

export const ERRORS = {
  NO_ROOM: 'Bunday xona topilmadi. Kodni tekshirib ko‘ring.',
  FULL: `Xona to‘lgan — ko‘pi bilan ${MAX_PLAYERS} o‘yinchi.`,
  BAD_NAME: 'Iltimos, ismingizni kiriting (2–16 belgi).',
  NOT_HOST: 'Bu amalni faqat mezbon bajara oladi.',
  RESUME_FAILED: 'Sessiya muddati tugagan. Qaytadan qo‘shiling.',
  BAD_REQUEST: 'Noto‘g‘ri so‘rov.',
  RATE: 'Juda tez! Biroz sekinroq.',
};

const NAME_MAX = 16;

export function cleanName(raw) {
  return String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f-\u009f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX)
    .trim();
}

const randomId = (bytes = 6) => crypto.randomBytes(bytes).toString('hex');

export class Room {
  constructor(code, { timings = {}, rng, onEmpty, now = Date.now } = {}) {
    this.code = code;
    this.timings = { ...DEFAULT_TIMINGS, ...timings };
    this.gen = createCaseGenerator(rng);
    this.onEmpty = onEmpty || (() => {});
    this.now = now;
    this.players = new Map();
    this.hostId = null;
    this.phase = 'lobby';
    this.settings = { rounds: 8, time: 25 };
    this.gameId = 0;
    this.round = 0; // 1-dan boshlanadi; 0 — o‘yin boshlanmagan
    this.cases = [];
    this.answers = new Map();
    this.lastReveal = null;
    this.endsAt = null;
    this.phaseMs = 0;
    this.roundStartedAt = 0;
    this.timer = null;
    this.earlyTimer = null;
    this.lastActivity = now();
    this.destroyed = false;
  }

  // ——— o‘yinchilar ———

  addPlayer({ name, avatar, send }) {
    const clean = cleanName(name);
    if (clean.length < 2) return { error: 'BAD_NAME' };
    if (this.players.size >= MAX_PLAYERS) {
      this._dropDisconnected();
      if (this.players.size >= MAX_PLAYERS) return { error: 'FULL' };
    }
    const player = {
      id: randomId(),
      token: randomId(16),
      name: this._uniqueName(clean),
      avatar: AVATARS.includes(avatar) ? avatar : AVATARS[this.players.size % AVATARS.length],
      color: this._freeColor(),
      joinedAt: this.now(),
      connected: true,
      send,
      dropTimer: null,
      lastReactAt: 0,
    };
    this._resetStats(player);
    this.players.set(player.id, player);
    if (!this.hostId) this.hostId = player.id;
    this.touch();
    this.emit({ t: 'event', kind: 'joined', id: player.id, name: player.name, avatar: player.avatar }, player.id);
    this.broadcastState();
    return { player };
  }

  resume(playerId, token, send) {
    const p = this.players.get(playerId);
    if (!p || typeof token !== 'string' || token.length !== p.token.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(token), Buffer.from(p.token))) return null;
    const old = p.send;
    p.send = send;
    p.connected = true;
    clearTimeout(p.dropTimer);
    p.dropTimer = null;
    // eski ulanish (masalan, boshqa oynada) endi bu o‘yinchini boshqarmaydi
    if (old && old !== send) old({ t: 'error', code: 'REPLACED', message: 'Siz boshqa oynada ulandingiz.' });
    this.touch();
    this.broadcastState();
    return p;
  }

  disconnect(playerId, send) {
    const p = this.players.get(playerId);
    if (!p || p.send !== send) return;
    p.connected = false;
    p.send = null;
    this.touch();
    if (this.phase === 'lobby') {
      p.dropTimer = setTimeout(() => this._remove(p.id), this.timings.lobbyDrop);
    }
    if (this.hostId === p.id) {
      setTimeout(() => {
        const host = this.players.get(this.hostId);
        if (!this.destroyed && host && !host.connected) this._transferHost();
      }, this.timings.hostGrace);
    }
    if (this.phase === 'round') this._checkAllAnswered();
    this.broadcastState();
  }

  leave(playerId) {
    this._remove(playerId);
  }

  _remove(playerId) {
    const p = this.players.get(playerId);
    if (!p) return;
    clearTimeout(p.dropTimer);
    this.players.delete(playerId);
    this.answers.delete(playerId);
    this.emit({ t: 'event', kind: 'left', id: p.id, name: p.name, avatar: p.avatar });
    if (this.players.size === 0) {
      this.onEmpty();
      return;
    }
    if (this.hostId === playerId) this._transferHost();
    if (this.phase === 'round') this._checkAllAnswered();
    this.broadcastState();
  }

  _transferHost() {
    const candidates = [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
    const next = candidates.find((p) => p.connected && p.id !== this.hostId) || candidates.find((p) => p.connected);
    if (!next || next.id === this.hostId) return;
    this.hostId = next.id;
    this.emit({ t: 'event', kind: 'host', id: next.id, name: next.name, avatar: next.avatar });
    this.broadcastState();
  }

  _dropDisconnected() {
    for (const p of [...this.players.values()]) if (!p.connected) this._remove(p.id);
  }

  _uniqueName(name) {
    const taken = new Set([...this.players.values()].map((p) => p.name.toLowerCase()));
    if (!taken.has(name.toLowerCase())) return name;
    for (let i = 2; ; i++) {
      const candidate = `${name.slice(0, NAME_MAX - String(i).length - 1)} ${i}`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }
  }

  _freeColor() {
    const used = new Set([...this.players.values()].map((p) => p.color));
    return PLAYER_COLORS.find((c) => !used.has(c)) || PLAYER_COLORS[this.players.size % PLAYER_COLORS.length];
  }

  _resetStats(p) {
    p.score = 0;
    p.streak = 0;
    p.bestStreak = 0;
    p.correct = 0;
    p.fastest = null;
    p.lastGain = 0;
    p.lastCorrect = null;
  }

  touch() {
    this.lastActivity = this.now();
  }

  // ——— xabarlar ———

  handle(playerId, msg) {
    const p = this.players.get(playerId);
    if (!p) return;
    this.touch();
    switch (msg.t) {
      case 'settings':
        return this._settings(p, msg);
      case 'start':
        return this._start(p);
      case 'answer':
        return this._answer(p, msg.choice);
      case 'react':
        return this._react(p, msg.emoji);
      case 'again':
        return this._again(p);
      case 'skip':
        return this._skip(p);
      default:
        return this._error(p, 'BAD_REQUEST');
    }
  }

  _error(p, code) {
    p.send?.({ t: 'error', code, message: ERRORS[code] });
  }

  _settings(p, { rounds, time }) {
    if (p.id !== this.hostId) return this._error(p, 'NOT_HOST');
    if (this.phase !== 'lobby') return;
    if (ROUND_OPTIONS.includes(rounds)) this.settings.rounds = rounds;
    if (TIME_OPTIONS.includes(time)) this.settings.time = time;
    this.broadcastState();
  }

  _start(p) {
    if (p.id !== this.hostId) return this._error(p, 'NOT_HOST');
    if (this.phase !== 'lobby') return;
    this._dropDisconnected();
    for (const pl of this.players.values()) this._resetStats(pl);
    this.gameId++;
    this.cases = this.gen.makeGame(this.settings.rounds);
    this.round = 0;
    this.lastReveal = null;
    this._setPhase('countdown', this.timings.countdown, () => this._beginRound());
  }

  _again(p) {
    if (p.id !== this.hostId) return this._error(p, 'NOT_HOST');
    if (this.phase !== 'final') return;
    this._clearTimers();
    this.phase = 'lobby';
    this.round = 0;
    this.cases = [];
    this.answers.clear();
    this.lastReveal = null;
    this.endsAt = null;
    this._dropDisconnected();
    for (const pl of this.players.values()) this._resetStats(pl);
    this.broadcastState();
  }

  // Mezbon reyting yoki javob ekranini kutmasdan o‘tkazib yuborishi mumkin
  _skip(p) {
    if (p.id !== this.hostId) return this._error(p, 'NOT_HOST');
    if (this.phase === 'reveal' || this.phase === 'board') {
      const fn = this.timer?.fn;
      this._clearTimers();
      fn?.();
    }
  }

  _answer(p, choice) {
    if (this.phase !== 'round' || this.answers.has(p.id)) return;
    if (choice !== OK && !FIELDS.includes(choice)) return this._error(p, 'BAD_REQUEST');
    const at = Math.max(0, this.now() - this.roundStartedAt);
    this.answers.set(p.id, { choice, at });
    this.broadcastState();
    this._checkAllAnswered();
  }

  _react(p, emoji) {
    if (!REACTIONS.includes(emoji)) return;
    const t = this.now();
    if (t - p.lastReactAt < 350) return;
    p.lastReactAt = t;
    this.emit({ t: 'react', id: p.id, emoji });
  }

  _checkAllAnswered() {
    if (this.phase !== 'round' || this.earlyTimer) return;
    const active = [...this.players.values()].filter((x) => x.connected);
    if (active.length && active.every((x) => this.answers.has(x.id))) {
      this.earlyTimer = setTimeout(() => {
        this.earlyTimer = null;
        if (this.phase === 'round') {
          this._clearTimers();
          this._endRound();
        }
      }, this.timings.earlyEnd);
    }
  }

  // ——— o‘yin bosqichlari ———

  _setPhase(phase, ms, next) {
    this._clearTimers();
    this.phase = phase;
    this.phaseMs = ms;
    this.endsAt = ms ? this.now() + ms : null;
    if (next) {
      const fn = () => {
        this.timer = null;
        if (!this.destroyed) next();
      };
      this.timer = { id: setTimeout(fn, ms), fn };
    }
    this.broadcastState();
  }

  _clearTimers() {
    if (this.timer) clearTimeout(this.timer.id);
    if (this.earlyTimer) clearTimeout(this.earlyTimer);
    this.timer = null;
    this.earlyTimer = null;
  }

  _beginRound() {
    this.round++;
    this.answers.clear();
    this.lastReveal = null;
    this.roundStartedAt = this.now();
    this._setPhase('round', this.settings.time * 1000, () => this._endRound());
  }

  _endRound() {
    const c = this.cases[this.round - 1];
    const duration = this.settings.time * 1000;
    const picks = {};
    for (const p of this.players.values()) {
      const a = this.answers.get(p.id);
      p.lastGain = 0;
      if (!a) {
        p.lastCorrect = null;
        p.streak = 0;
        continue;
      }
      picks[p.id] = a.choice;
      if (a.choice === c.answer) {
        p.streak++;
        p.bestStreak = Math.max(p.bestStreak, p.streak);
        p.correct++;
        p.fastest = p.fastest === null ? a.at : Math.min(p.fastest, a.at);
        const speed = Math.max(0, Math.min(1, 1 - a.at / duration));
        const streakBonus = Math.min(p.streak - 1, 5) * 50;
        p.lastGain = Math.round(500 + 500 * speed) + streakBonus;
        p.score += p.lastGain;
        p.lastCorrect = true;
      } else {
        p.streak = 0;
        p.lastCorrect = false;
      }
    }
    this.lastReveal = { answer: c.answer, explain: c.explain, picks };
    const last = this.round >= this.cases.length;
    this._setPhase('reveal', this.timings.reveal, () => (last ? this._final() : this._board()));
  }

  _board() {
    this._setPhase('board', this.timings.board, () => this._beginRound());
  }

  _final() {
    this._setPhase('final', 0, null);
  }

  // ——— holatni yuborish ———

  snapshot() {
    const inRound = this.phase === 'round';
    const showCase = this.phase === 'round' || this.phase === 'reveal';
    const c = this.cases[this.round - 1];
    return {
      t: 'state',
      now: this.now(),
      room: {
        code: this.code,
        phase: this.phase,
        hostId: this.hostId,
        settings: { ...this.settings },
        gameId: this.gameId,
        round: this.round,
        totalRounds: this.phase === 'lobby' ? this.settings.rounds : this.cases.length,
        endsAt: this.endsAt,
        phaseMs: this.phaseMs,
      },
      players: [...this.players.values()]
        .sort((a, b) => a.joinedAt - b.joinedAt)
        .map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          color: p.color,
          score: p.score,
          streak: p.streak,
          bestStreak: p.bestStreak,
          correct: p.correct,
          fastest: p.fastest,
          lastGain: p.lastGain,
          lastCorrect: p.lastCorrect,
          connected: p.connected,
          answered: inRound ? this.answers.has(p.id) : false,
        })),
      case: showCase && c ? publicCase(c) : null,
      reveal: this.phase === 'reveal' ? this.lastReveal : null,
    };
  }

  broadcastState() {
    if (this.destroyed) return;
    const base = this.snapshot();
    for (const p of this.players.values()) {
      if (!p.send) continue;
      p.send({ ...base, you: p.id, myChoice: this.answers.get(p.id)?.choice ?? null });
    }
  }

  emit(msg, exceptId = null) {
    for (const p of this.players.values()) if (p.send && p.id !== exceptId) p.send(msg);
  }

  destroy() {
    this.destroyed = true;
    this._clearTimers();
    for (const p of this.players.values()) clearTimeout(p.dropTimer);
  }
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPRSTUVWXYZ';

export class RoomManager {
  constructor(roomOptions = {}) {
    this.rooms = new Map();
    this.roomOptions = roomOptions;
  }

  create() {
    let code;
    do code = Array.from({ length: 4 }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
    while (this.rooms.has(code));
    const room = new Room(code, {
      ...this.roomOptions,
      onEmpty: () => this.delete(code),
    });
    this.rooms.set(code, room);
    return room;
  }

  get(code) {
    return this.rooms.get(String(code ?? '').toUpperCase().trim()) || null;
  }

  delete(code) {
    const room = this.rooms.get(code);
    if (!room) return;
    room.destroy();
    this.rooms.delete(code);
  }

  // Hech kim ulanmagan va uzoq vaqt faolsiz xonalarni tozalash
  sweep(idleMs = 10 * 60 * 1000, now = Date.now()) {
    for (const [code, room] of this.rooms) {
      const anyone = [...room.players.values()].some((p) => p.connected);
      if (!room.players.size || (!anyone && now - room.lastActivity > idleMs)) this.delete(code);
    }
  }
}
