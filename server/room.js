import crypto from 'node:crypto';
import { Game, GameError } from './cashflow/game.js';
import { DREAMS, MAX_PLAYERS } from '../public/js/shared/rules.js';

export const AVATARS = ['🦊', '🐯', '🦁', '🐼', '🐸', '🦉', '🐺', '🐻', '🦄', '🐲', '🦅', '🐱', '🍉', '🍇', '🥟', '🫖'];
export const PLAYER_COLORS = ['#2bd67b', '#22c3e6', '#ffc94a', '#ff7a59', '#b78cff', '#ff5fa2'];
export const REACTIONS = ['👍', '😂', '😮', '🔥', '👏', '😭', '🤑', '🫡'];
export const MODES = ['full', 'quick'];
export const TURN_OPTIONS = [0, 60, 120];

export const DEFAULT_TIMINGS = {
  hostGrace: 8000, // mezbon sahifani yangilasa, mezbonlik darhol o‘tib ketmasin
  lobbyDrop: 45000, // kutish zalida uzilib qolgan o‘yinchini olib tashlash
  offlineTurn: 15000, // navbati kelgan o‘yinchi uzilib qolsa, shuncha kutamiz
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
    this.rng = rng;
    this.onEmpty = onEmpty || (() => {});
    this.now = now;
    this.players = new Map();
    this.hostId = null;
    this.phase = 'lobby';
    this.settings = { mode: 'full', turnSeconds: 0 };
    this.gameId = 0;
    this.game = null;
    this.turnTimer = null;
    this.turnKey = null;
    this.deadline = null;
    this.lastActivity = now();
    this.destroyed = false;
  }

  // ——— o‘yinchilar ———

  addPlayer({ name, avatar, dream, send }) {
    const clean = cleanName(name);
    if (clean.length < 2) return { error: 'BAD_NAME' };
    if (this.players.size >= MAX_PLAYERS) {
      if (this.phase === 'lobby') this._dropDisconnected();
      if (this.players.size >= MAX_PLAYERS) return { error: 'FULL' };
    }
    const player = {
      id: randomId(),
      token: randomId(16),
      name: this._uniqueName(clean),
      avatar: AVATARS.includes(avatar) ? avatar : AVATARS[this.players.size % AVATARS.length],
      color: this._freeColor(),
      dream: DREAMS.some((d) => d.id === dream) ? dream : DREAMS[crypto.randomInt(DREAMS.length)].id,
      joinedAt: this.now(),
      connected: true,
      send,
      dropTimer: null,
      lastReactAt: 0,
    };
    this.players.set(player.id, player);
    if (!this.hostId) this.hostId = player.id;
    this.touch();
    // O‘yin ketayotgan bo‘lsa ham qo‘shilish mumkin — yangi o‘yinchi navbatning oxiriga qo‘yiladi
    if (this.phase === 'playing') this.game.addPlayer({ id: player.id, dream: player.dream });
    this.emit({ t: 'event', kind: 'joined', id: player.id, name: player.name, avatar: player.avatar }, player.id);
    this._update();
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
    if (old && old !== send) old({ t: 'error', code: 'REPLACED', message: 'Siz boshqa oynada ulandingiz.' });
    this.touch();
    this._update();
    return p;
  }

  disconnect(playerId, send) {
    const p = this.players.get(playerId);
    if (!p || p.send !== send) return;
    p.connected = false;
    p.send = null;
    this.touch();
    if (this.phase === 'lobby') p.dropTimer = setTimeout(() => this._remove(p.id), this.timings.lobbyDrop);
    if (this.hostId === p.id) {
      setTimeout(() => {
        const host = this.players.get(this.hostId);
        if (!this.destroyed && host && !host.connected) this._transferHost();
      }, this.timings.hostGrace);
    }
    this._update();
  }

  leave(playerId) {
    this._remove(playerId);
  }

  _remove(playerId) {
    const p = this.players.get(playerId);
    if (!p) return;
    clearTimeout(p.dropTimer);
    this.players.delete(playerId);
    if (this.game && !this.game.over) this.game.removePlayer(playerId);
    this.emit({ t: 'event', kind: 'left', id: p.id, name: p.name, avatar: p.avatar });
    if (this.players.size === 0) {
      this.onEmpty();
      return;
    }
    if (this.hostId === playerId) this._transferHost();
    this._update();
  }

  _transferHost() {
    const candidates = [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
    const next = candidates.find((p) => p.connected && p.id !== this.hostId) || candidates.find((p) => p.connected);
    if (!next || next.id === this.hostId) return;
    this.hostId = next.id;
    this.emit({ t: 'event', kind: 'host', id: next.id, name: next.name, avatar: next.avatar });
    this._update();
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
      case 'dream':
        return this._dream(p, msg.dream);
      case 'start':
        return this._start(p);
      case 'act':
        return this._act(p, msg.action);
      case 'react':
        return this._react(p, msg.emoji);
      case 'again':
        return this._again(p);
      default:
        return this._error(p, 'BAD_REQUEST');
    }
  }

  _error(p, code, message = ERRORS[code]) {
    p.send?.({ t: 'error', code, message });
  }

  _settings(p, { mode, turnSeconds }) {
    if (p.id !== this.hostId) return this._error(p, 'NOT_HOST');
    if (this.phase !== 'lobby') return;
    if (MODES.includes(mode)) this.settings.mode = mode;
    if (TURN_OPTIONS.includes(turnSeconds)) this.settings.turnSeconds = turnSeconds;
    this._update();
  }

  _dream(p, dream) {
    if (this.phase !== 'lobby' || !DREAMS.some((d) => d.id === dream)) return;
    p.dream = dream;
    this._update();
  }

  _start(p) {
    if (p.id !== this.hostId) return this._error(p, 'NOT_HOST');
    if (this.phase !== 'lobby') return;
    this._dropDisconnected();
    this.gameId++;
    const players = [...this.players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
    this.game = new Game({
      players: players.map((x) => ({ id: x.id, dream: x.dream })),
      mode: this.settings.mode,
      rng: this.rng,
      now: this.now,
      nameOf: (id) => this.players.get(id)?.name || 'O‘yinchi',
    });
    this.phase = 'playing';
    this._update();
  }

  _again(p) {
    if (p.id !== this.hostId) return this._error(p, 'NOT_HOST');
    if (this.phase !== 'final') return;
    this._clearTurnTimer();
    this.phase = 'lobby';
    this.game = null;
    this._dropDisconnected();
    this._update();
  }

  _act(p, action) {
    if (this.phase !== 'playing' || !action || typeof action !== 'object') return;
    try {
      this.game.act(p.id, action);
    } catch (e) {
      if (e instanceof GameError) return this._error(p, e.code, e.message);
      throw e;
    }
    this._update();
  }

  _react(p, emoji) {
    if (!REACTIONS.includes(emoji)) return;
    const t = this.now();
    if (t - p.lastReactAt < 350) return;
    p.lastReactAt = t;
    this.emit({ t: 'react', id: p.id, emoji });
  }

  // ——— navbat taymeri ———

  _clearTurnTimer() {
    clearTimeout(this.turnTimer);
    this.turnTimer = null;
    this.turnKey = null;
    this.deadline = null;
  }

  _syncTurnTimer() {
    const turn = this.game?.turn;
    if (this.phase !== 'playing' || !turn || this.game.over) return this._clearTurnTimer();
    const active = this.players.get(turn.pid);
    const offline = !active?.connected;
    const key = `${turn.seq}:${turn.step}:${offline}`;
    if (key === this.turnKey) return;
    clearTimeout(this.turnTimer);
    this.turnKey = key;
    const limits = [];
    if (this.settings.turnSeconds) limits.push(this.settings.turnSeconds * 1000);
    if (offline) limits.push(this.timings.offlineTurn);
    if (!limits.length) {
      this.turnTimer = null;
      this.deadline = null;
      return;
    }
    const ms = Math.min(...limits);
    this.deadline = this.now() + ms;
    this.turnTimer = setTimeout(() => {
      this.turnTimer = null;
      this.turnKey = null;
      if (this.destroyed || this.phase !== 'playing') return;
      this.game.timeout();
      this._update();
    }, ms);
  }

  // Har o‘zgarishdan keyin: bosqichni tekshirish, taymerni yangilash, hammaga yuborish
  _update() {
    if (this.destroyed) return;
    if (this.phase === 'playing' && this.game?.over) {
      this.phase = 'final';
      this._clearTurnTimer();
    }
    this._syncTurnTimer();
    this.broadcastState();
  }

  // ——— holatni yuborish ———

  snapshot() {
    return {
      t: 'state',
      now: this.now(),
      room: {
        code: this.code,
        phase: this.phase,
        hostId: this.hostId,
        settings: { ...this.settings },
        gameId: this.gameId,
        maxPlayers: MAX_PLAYERS,
      },
      players: [...this.players.values()]
        .sort((a, b) => a.joinedAt - b.joinedAt)
        .map((p) => ({ id: p.id, name: p.name, avatar: p.avatar, color: p.color, dream: p.dream, connected: p.connected })),
      game: this.game ? { ...this.game.view(), deadline: this.deadline } : null,
    };
  }

  broadcastState() {
    if (this.destroyed) return;
    const base = JSON.stringify(this.snapshot()).slice(0, -1);
    for (const p of this.players.values()) {
      if (!p.send) continue;
      p.send(`${base},"you":${JSON.stringify(p.id)}}`);
    }
  }

  emit(msg, exceptId = null) {
    for (const p of this.players.values()) if (p.send && p.id !== exceptId) p.send(msg);
  }

  destroy() {
    this.destroyed = true;
    this._clearTurnTimer();
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
    const room = new Room(code, { ...this.roomOptions, onEmpty: () => this.delete(code) });
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

  sweep(idleMs = 30 * 60 * 1000, now = Date.now()) {
    for (const [code, room] of this.rooms) {
      const anyone = [...room.players.values()].some((p) => p.connected);
      if (!room.players.size || (!anyone && now - room.lastActivity > idleMs)) this.delete(code);
    }
  }
}
