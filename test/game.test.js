import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { createGameServer } from '../server/app.js';

const timings = { countdown: 60, reveal: 80, board: 60, earlyEnd: 20, hostGrace: 50, lobbyDrop: 200 };
let game;
let url;

before(async () => {
  game = createGameServer({ timings });
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
    for (const w of [...waiters]) {
      if (w.pred(msg)) {
        waiters.splice(waiters.indexOf(w), 1);
        w.resolve(msg);
      }
    }
  });
  const c = {
    ws,
    inbox,
    open: () => new Promise((r) => ws.once('open', r)),
    send: (m) => ws.send(JSON.stringify(m)),
    wait(pred, ms = 2000) {
      const found = inbox.find(pred);
      if (found) {
        inbox.splice(inbox.indexOf(found), 1);
        return Promise.resolve(found);
      }
      return new Promise((resolve, reject) => {
        const w = { pred, resolve: (m) => (inbox.splice(inbox.indexOf(m), 1), clearTimeout(t), resolve(m)) };
        const t = setTimeout(() => reject(new Error('kutish vaqti tugadi')), ms);
        waiters.push(w);
      });
    },
    state: (phase) => c.wait((m) => m.t === 'state' && (!phase || m.room.phase === phase)),
    close: () => ws.close(),
  };
  return c;
}

const lastState = (c) => [...c.inbox].reverse().find((m) => m.t === 'state');

test('to‘liq o‘yin: yaratish, qo‘shilish, javoblar, ball va yakun', async () => {
  const a = client();
  const b = client();
  await Promise.all([a.open(), b.open()]);

  a.send({ t: 'create', name: '  Jasur  ', avatar: '🦊' });
  const joinedA = await a.wait((m) => m.t === 'joined');
  assert.match(joinedA.code, /^[A-Z]{4}$/);

  b.send({ t: 'join', code: joinedA.code.toLowerCase(), name: 'Jasur', avatar: '🐼' });
  const joinedB = await b.wait((m) => m.t === 'joined');
  const lobby = await b.wait((m) => m.t === 'state' && m.players.length === 2);
  assert.deepEqual(lobby.players.map((p) => p.name), ['Jasur', 'Jasur 2']);
  assert.equal(lobby.room.hostId, joinedA.playerId);

  // Faqat mezbon sozlay oladi
  b.send({ t: 'settings', rounds: 5 });
  assert.equal((await b.wait((m) => m.t === 'error')).code, 'NOT_HOST');
  a.send({ t: 'settings', rounds: 5, time: 15 });
  await a.wait((m) => m.t === 'state' && m.room.settings.rounds === 5 && m.room.settings.time === 15);

  a.send({ t: 'start' });
  await a.state('countdown');

  let correctSeen = false;
  for (let r = 1; r <= 5; r++) {
    const ra = await a.wait((m) => m.t === 'state' && m.room.phase === 'round' && m.room.round === r);
    assert.ok(ra.case.decl && ra.case.passport);
    assert.equal(ra.case.answer, undefined, 'javob raund davomida yashirin');
    assert.equal(ra.reveal, null);
    const diff = ['fio', 'vin', 'model', 'year', 'engine', 'color'].filter((f) => ra.case.decl[f] !== ra.case.passport[f]);
    const right = diff[0] || 'ok';
    const wrong = right === 'ok' ? 'vin' : 'ok';
    a.send({ t: 'answer', choice: right });
    a.send({ t: 'answer', choice: wrong }); // ikkinchi javob e’tiborsiz qoldiriladi
    b.send({ t: 'answer', choice: wrong });

    const rev = await a.wait((m) => m.t === 'state' && m.room.phase === 'reveal' && m.room.round === r);
    assert.equal(rev.reveal.answer, right);
    assert.equal(rev.reveal.picks[joinedA.playerId], right);
    const pa = rev.players.find((p) => p.id === joinedA.playerId);
    const pb = rev.players.find((p) => p.id === joinedB.playerId);
    assert.equal(pa.lastCorrect, true);
    assert.ok(pa.lastGain >= 500 && pa.lastGain <= 1250, `ball: ${pa.lastGain}`);
    assert.equal(pa.streak, r);
    assert.equal(pb.lastCorrect, false);
    assert.equal(pb.lastGain, 0);
    correctSeen = true;
    if (r < 5) await a.state('board');
  }
  assert.ok(correctSeen);

  const fin = await a.state('final');
  const pa = fin.players.find((p) => p.id === joinedA.playerId);
  assert.equal(pa.correct, 5);
  assert.equal(pa.bestStreak, 5);
  assert.ok(pa.score > 5 * 500);
  assert.equal(fin.players.find((p) => p.id === joinedB.playerId).score, 0);

  // Yana o‘ynash — hisoblar nolga tushadi
  a.send({ t: 'again' });
  const back = await b.state('lobby');
  assert.ok(back.players.every((p) => p.score === 0));

  a.close();
  b.close();
});

test('qayta ulanish (resume) va mezbonlikni o‘tkazish', async () => {
  const a = client();
  const b = client();
  await Promise.all([a.open(), b.open()]);
  a.send({ t: 'create', name: 'Malika', avatar: '🦄' });
  const ja = await a.wait((m) => m.t === 'joined');
  b.send({ t: 'join', code: ja.code, name: 'Bobur', avatar: '🐯' });
  const jb = await b.wait((m) => m.t === 'joined');

  // Noto‘g‘ri token bilan qaytib bo‘lmaydi
  const evil = client();
  await evil.open();
  evil.send({ t: 'resume', code: ja.code, playerId: ja.playerId, token: 'x'.repeat(32) });
  assert.equal((await evil.wait((m) => m.t === 'error')).code, 'RESUME_FAILED');
  evil.close();

  // Mezbon uzildi va qaytdi — mezbonlik saqlanadi
  a.close();
  await b.wait((m) => m.t === 'state' && m.players.find((p) => p.id === ja.playerId)?.connected === false);
  const a2 = client();
  await a2.open();
  a2.send({ t: 'resume', code: ja.code, playerId: ja.playerId, token: ja.token });
  await a2.wait((m) => m.t === 'joined' && m.playerId === ja.playerId);
  const s = await a2.wait((m) => m.t === 'state' && m.you === ja.playerId);
  assert.equal(s.room.hostId, ja.playerId);

  // Mezbon chiqib ketsa, mezbonlik keyingisiga o‘tadi
  a2.send({ t: 'leave' });
  const ev = await b.wait((m) => m.t === 'event' && m.kind === 'host');
  assert.equal(ev.id, jb.playerId);
  const s2 = await b.wait((m) => m.t === 'state' && m.players.length === 1);
  assert.equal(s2.room.hostId, jb.playerId);

  // Oxirgi o‘yinchi chiqsa, xona o‘chiriladi
  b.send({ t: 'leave' });
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(game.manager.get(ja.code), null);
  a2.close();
  b.close();
});

test('noto‘g‘ri so‘rovlar va mavjud bo‘lmagan xona', async () => {
  const c = client();
  await c.open();
  c.send({ t: 'join', code: 'ZZZZ', name: 'Test', avatar: '🦊' });
  assert.equal((await c.wait((m) => m.t === 'error')).code, 'NO_ROOM');
  c.send({ t: 'create', name: 'a', avatar: '🦊' });
  assert.equal((await c.wait((m) => m.t === 'error')).code, 'BAD_NAME');
  c.ws.send('{bu json emas');
  assert.equal((await c.wait((m) => m.t === 'error')).code, 'BAD_REQUEST');
  c.send({ t: 'create', name: '<b>Hack</b>', avatar: 'not-an-avatar' });
  const st = await c.wait((m) => m.t === 'state');
  assert.equal(st.players[0].name, 'bHack/b');
  assert.ok(['🦊', '🐯', '🦁', '🐼', '🐸', '🦉', '🐺', '🐻', '🦄', '🐲', '🦅', '🐱', '🍉', '🍇', '🥟', '🫖'].includes(st.players[0].avatar));
  c.close();
});

test('hamma javob bersa raund erta tugaydi', async () => {
  const a = client();
  await a.open();
  a.send({ t: 'create', name: 'Sardor', avatar: '🦁' });
  await a.wait((m) => m.t === 'joined');
  a.send({ t: 'settings', rounds: 5, time: 40 });
  a.send({ t: 'start' });
  const r = await a.state('round');
  const t0 = Date.now();
  a.send({ t: 'answer', choice: 'ok' });
  const rev = await a.state('reveal');
  assert.ok(Date.now() - t0 < 1000, '40 soniya kutilmadi');
  assert.equal(rev.room.round, r.room.round);
  assert.equal(rev.myChoice, 'ok');
  a.close();
});
