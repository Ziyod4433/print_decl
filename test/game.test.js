import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { createGameServer } from '../server/app.js';

let game;
let url;

before(async () => {
  game = createGameServer({ timings: { hostGrace: 50, lobbyDrop: 200, offlineTurn: 150 } });
  const addr = await game.listen(0, '127.0.0.1');
  url = `ws://127.0.0.1:${addr.port}/ws`;
});
after(() => game.close());

function client() {
  const ws = new WebSocket(url);
  const inbox = [];
  const waiters = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    inbox.push(msg);
    for (const w of [...waiters]) if (w.pred(msg)) w.resolve(msg);
  });
  const c = {
    ws,
    open: () => new Promise((r) => ws.once('open', r)),
    send: (m) => ws.send(JSON.stringify(m)),
    act: (action) => ws.send(JSON.stringify({ t: 'act', action })),
    wait(pred, ms = 2000) {
      const found = inbox.find(pred);
      if (found) {
        inbox.splice(inbox.indexOf(found), 1);
        return Promise.resolve(found);
      }
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('kutish vaqti tugadi')), ms);
        const w = {
          pred,
          resolve: (m) => {
            clearTimeout(t);
            waiters.splice(waiters.indexOf(w), 1);
            inbox.splice(inbox.indexOf(m), 1);
            resolve(m);
          },
        };
        waiters.push(w);
      });
    },
    latest: () => [...inbox].reverse().find((m) => m.t === 'state'),
    close: () => ws.close(),
  };
  return c;
}

const settle = () => new Promise((r) => setTimeout(r, 60));

test('xona, orzular, sozlamalar va o‘yin boshlanishi', async () => {
  const a = client();
  const b = client();
  await Promise.all([a.open(), b.open()]);
  a.send({ t: 'create', name: 'Jasur', avatar: '🦊', dream: 'dacha' });
  const ja = await a.wait((m) => m.t === 'joined');
  b.send({ t: 'join', code: ja.code, name: 'Malika', avatar: '🦄' });
  const jb = await b.wait((m) => m.t === 'joined');
  b.send({ t: 'dream', dream: 'space' });
  await a.wait((m) => m.t === 'state' && m.players.find((p) => p.id === jb.playerId)?.dream === 'space');

  b.send({ t: 'settings', mode: 'quick' });
  assert.equal((await b.wait((m) => m.t === 'error')).code, 'NOT_HOST');
  a.send({ t: 'settings', mode: 'quick', turnSeconds: 60 });
  await a.wait((m) => m.t === 'state' && m.room.settings.mode === 'quick' && m.room.settings.turnSeconds === 60);

  a.send({ t: 'start' });
  const s = await b.wait((m) => m.t === 'state' && m.room.phase === 'playing');
  assert.equal(s.game.mode, 'quick');
  assert.equal(s.game.players.length, 2);
  assert.equal(s.game.players.find((p) => p.id === ja.playerId).dream, 'dacha');
  assert.equal(s.game.turn.pid, ja.playerId);
  assert.ok(s.game.deadline > Date.now(), 'navbat taymeri ishlayapti');
  assert.equal(s.you, jb.playerId);
  assert.equal(s.game.decks.small > 0, true);
  assert.equal(JSON.stringify(s).includes('"draw"'), false, 'kartalar tartibi yashirin');

  // Navbati bo‘lmagan o‘yinchi zar tashlay olmaydi
  b.act({ type: 'roll' });
  assert.equal((await b.wait((m) => m.t === 'error')).code, 'NOT_YOUR_TURN');

  a.act({ type: 'roll' });
  const rolled = await b.wait((m) => m.t === 'state' && m.game?.turn?.move);
  const mv = rolled.game.turn.move;
  assert.equal(mv.pid, ja.playerId);
  assert.equal(mv.dice.length, 1);
  assert.equal(rolled.game.players.find((p) => p.id === ja.playerId).pos, mv.to);

  // Navbatni tugatish (kerak bo‘lsa — bitimdan voz kechish yoki xayriyani rad etish)
  const step = rolled.game.turn.step;
  if (step === 'charity') a.act({ type: 'charity', accept: false });
  if (rolled.game.turn.card?.eligible?.length) await new Promise((r) => setTimeout(r, 50));
  a.act({ type: 'end' });
  const next = await b.wait((m) => m.t === 'state' && m.game?.turn?.pid === jb.playerId, 12000);
  assert.equal(next.game.turn.step, 'roll');
  a.close();
  b.close();
});

test('uzilib qolgan o‘yinchi navbati avtomatik o‘tadi, qayta ulanish ishlaydi', async () => {
  const a = client();
  const b = client();
  await Promise.all([a.open(), b.open()]);
  a.send({ t: 'create', name: 'Sardor', avatar: '🦁' });
  const ja = await a.wait((m) => m.t === 'joined');
  b.send({ t: 'join', code: ja.code, name: 'Nilufar', avatar: '🐼' });
  const jb = await b.wait((m) => m.t === 'joined');
  a.send({ t: 'start' });
  await b.wait((m) => m.t === 'state' && m.room.phase === 'playing');

  // Navbat egasi uziladi — server 150 ms dan keyin uning o‘rniga zar tashlaydi, keyin navbatni o‘tkazadi
  a.close();
  await b.wait((m) => m.t === 'state' && m.game?.turn?.pid === jb.playerId, 3000);

  const a2 = client();
  await a2.open();
  a2.send({ t: 'resume', code: ja.code, playerId: ja.playerId, token: ja.token });
  await a2.wait((m) => m.t === 'joined' && m.playerId === ja.playerId);
  const s = await a2.wait((m) => m.t === 'state' && m.room.phase === 'playing');
  assert.equal(s.you, ja.playerId);
  assert.ok(s.game.log.some((e) => e.kind === 'timeout'));

  // O‘yin davomida yangi o‘yinchi qo‘shiladi va navbat oxiriga turadi
  const c = client();
  await c.open();
  c.send({ t: 'join', code: ja.code, name: 'Bobur', avatar: '🐯' });
  const jc = await c.wait((m) => m.t === 'joined');
  const sc = await c.wait((m) => m.t === 'state' && m.game?.players.some((p) => p.id === jc.playerId));
  assert.equal(sc.game.order.at(-1), jc.playerId);

  // O‘yinchi chiqsa — o‘yindan ham chiqariladi
  c.send({ t: 'leave' });
  await a2.wait((m) => m.t === 'state' && m.game && !m.game.players.some((p) => p.id === jc.playerId));
  a2.close();
  b.close();
  c.close();
});

test('xatolar: noto‘g‘ri xona, ism va so‘rovlar', async () => {
  const c = client();
  await c.open();
  c.send({ t: 'join', code: 'ZZZZ', name: 'Test', avatar: '🦊' });
  assert.equal((await c.wait((m) => m.t === 'error')).code, 'NO_ROOM');
  c.send({ t: 'create', name: 'a', avatar: '🦊' });
  assert.equal((await c.wait((m) => m.t === 'error')).code, 'BAD_NAME');
  c.ws.send('{bu json emas');
  assert.equal((await c.wait((m) => m.t === 'error')).code, 'BAD_REQUEST');
  c.send({ t: 'create', name: '<b>Hack</b>', avatar: 'x', dream: 'not-a-dream' });
  const st = await c.wait((m) => m.t === 'state');
  assert.equal(st.players[0].name, 'bHack/b');
  assert.ok(st.players[0].dream && st.players[0].dream !== 'not-a-dream');
  c.send({ t: 'act', action: { type: 'roll' } }); // o‘yin boshlanmagan — e’tiborsiz
  await settle();
  c.close();
});

test('xona 6 o‘yinchidan oshmaydi', async () => {
  const host = client();
  await host.open();
  host.send({ t: 'create', name: 'Mezbon', avatar: '🦊' });
  const j = await host.wait((m) => m.t === 'joined');
  const others = [];
  for (let i = 0; i < 6; i++) {
    const c = client();
    await c.open();
    c.send({ t: 'join', code: j.code, name: `O‘yinchi ${i}`, avatar: '🐼' });
    others.push(c);
  }
  const last = others.at(-1);
  assert.equal((await last.wait((m) => m.t === 'error' || m.t === 'joined')).code, 'FULL');
  for (const c of [host, ...others]) c.close();
});
