import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCaseGenerator, seededRng, vinCheckDigit, isValidVinShape, FIELDS, OK, publicCase } from '../server/cases.js';

test('har bir ishda aynan bitta maydon farq qiladi (yoki hech biri)', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const gen = createCaseGenerator(seededRng(seed));
    for (const c of gen.makeGame(12)) {
      const diff = FIELDS.filter((f) => c.decl[f] !== c.passport[f]);
      if (c.answer === OK) {
        assert.deepEqual(diff, [], `seed ${seed}: toza ishda farq bo‘lmasligi kerak`);
        assert.equal(c.explain, null);
      } else {
        assert.deepEqual(diff, [c.answer], `seed ${seed}: faqat ${c.answer} farq qilishi kerak`);
        assert.equal(c.explain.decl, c.decl[c.answer]);
        assert.equal(c.explain.real, c.passport[c.answer]);
      }
    }
  }
});

test('VIN raqamlari to‘g‘ri shaklda va nazorat raqami mos', () => {
  const gen = createCaseGenerator(seededRng(42));
  for (let i = 0; i < 500; i++) {
    const c = gen.makeCase({ tier: 1 + (i % 3), answer: 'vin' });
    assert.ok(isValidVinShape(c.passport.vin), c.passport.vin);
    assert.ok(isValidVinShape(c.decl.vin), c.decl.vin);
    assert.equal(vinCheckDigit(c.passport.vin), c.passport.vin[8]);
  }
});

test('qiyinlik o‘yin davomida oshib boradi va ketma-ket ikki toza raund yo‘q', () => {
  const gen = createCaseGenerator(seededRng(7));
  const game = gen.makeGame(12);
  assert.equal(game[0].tier, 1);
  assert.equal(game.at(-1).tier, 3);
  for (let i = 1; i < game.length; i++) {
    assert.ok(game[i].tier >= game[i - 1].tier);
    assert.ok(!(game[i].answer === OK && game[i - 1].answer === OK));
  }
});

test('ochiq ko‘rinishda to‘g‘ri javob yo‘q', () => {
  const gen = createCaseGenerator(seededRng(3));
  const pub = publicCase(gen.makeCase({ answer: 'color' }));
  assert.equal(pub.answer, undefined);
  assert.equal(pub.explain, undefined);
});
