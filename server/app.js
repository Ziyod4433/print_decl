import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { RoomManager, ERRORS } from './room.js';

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

async function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(PUBLIC_DIR, '.' + pathname);
  if (file !== PUBLIC_DIR && !file.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const stat = await fs.stat(file);
    if (!stat.isFile()) throw new Error('not a file');
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=300',
    });
    if (req.method === 'HEAD') return res.end();
    res.end(await fs.readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Sahifa topilmadi');
  }
}

// Bitta ulanish uchun oddiy "token bucket": soniyasiga ~6 xabar, 20 tagacha portlash
function createLimiter(rate = 6, burst = 20) {
  let tokens = burst;
  let last = Date.now();
  return () => {
    const now = Date.now();
    tokens = Math.min(burst, tokens + ((now - last) / 1000) * rate);
    last = now;
    if (tokens < 1) return false;
    tokens -= 1;
    return true;
  };
}

export function createGameServer({ timings, heartbeatMs = 25000, sweepMs = 60000 } = {}) {
  const manager = new RoomManager({ timings });

  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true, rooms: manager.rooms.size }));
      return;
    }
    serveStatic(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });

  const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 4 * 1024 });

  wss.on('connection', (ws) => {
    const conn = { room: null, playerId: null };
    const allow = createLimiter();
    const send = (msg) => {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
    };
    const fail = (code) => send({ t: 'error', code, message: ERRORS[code] });
    // Ulanish hali ham shu o‘yinchini boshqaradimi (boshqa oynada qayta ulanmaganmi)?
    const current = () => {
      if (!conn.room || conn.room.destroyed) return null;
      const p = conn.room.players.get(conn.playerId);
      return p && p.send === send ? p : null;
    };
    const detach = () => {
      if (current()) conn.room.disconnect(conn.playerId, send);
      conn.room = null;
      conn.playerId = null;
    };
    const attach = (room, player) => {
      conn.room = room;
      conn.playerId = player.id;
      send({ t: 'joined', code: room.code, playerId: player.id, token: player.token });
    };

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (data, isBinary) => {
      if (isBinary) return;
      if (!allow()) return fail('RATE');
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        return fail('BAD_REQUEST');
      }
      if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return fail('BAD_REQUEST');

      switch (msg.t) {
        case 'create': {
          detach();
          const room = manager.create();
          const res = room.addPlayer({ name: msg.name, avatar: msg.avatar, send });
          if (res.error) {
            manager.delete(room.code);
            return fail(res.error);
          }
          return attach(room, res.player);
        }
        case 'join': {
          const room = manager.get(msg.code);
          if (!room) return fail('NO_ROOM');
          if (room === conn.room && current()) return;
          const res = room.addPlayer({ name: msg.name, avatar: msg.avatar, send });
          if (res.error) return fail(res.error);
          detach();
          return attach(room, res.player);
        }
        case 'resume': {
          const room = manager.get(msg.code);
          const player = room && room.resume(String(msg.playerId ?? ''), msg.token, send);
          if (!player) return fail('RESUME_FAILED');
          if (conn.room !== room || conn.playerId !== player.id) detach();
          return attach(room, player);
        }
        case 'leave': {
          if (current()) conn.room.leave(conn.playerId);
          conn.room = null;
          conn.playerId = null;
          return;
        }
        default: {
          if (!current()) return;
          return conn.room.handle(conn.playerId, msg);
        }
      }
    });

    ws.on('close', detach);
    ws.on('error', () => {});
  });

  // Javob bermay qolgan (masalan, telefon uxlab qolgan) ulanishlarni yopish
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, heartbeatMs);

  const sweeper = setInterval(() => manager.sweep(), sweepMs);
  heartbeat.unref();
  sweeper.unref();

  return {
    server,
    manager,
    listen(port, host) {
      return new Promise((resolve) => server.listen(port, host, () => resolve(server.address())));
    },
    close() {
      clearInterval(heartbeat);
      clearInterval(sweeper);
      for (const ws of wss.clients) ws.terminate();
      for (const code of [...manager.rooms.keys()]) manager.delete(code);
      return new Promise((resolve) => wss.close(() => server.close(() => resolve())));
    },
  };
}
