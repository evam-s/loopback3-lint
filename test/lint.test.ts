import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { lintText, ALL_RULE_IDS } from '../src/core/lint';

// Fixtures are read from the SOURCE tree, not `out/` — tsc does not copy
// non-TS files. This file compiles to out/test/, hence two levels up.
const FIX = join(__dirname, '..', '..', 'test', 'fixtures');

test('returns nothing when the gate declines', () => {
  assert.deepEqual(
    lintText({ path: '/x/lib/a.js', text: 'resizeObserver.observe(el);', languageId: 'javascript' }),
    [],
  );
});

test('lints a model json end to end', () => {
  const f = lintText({
    path: '/app/common/models/order.json',
    text: '{ "name": "Order", "base": "PersistantModel" }',
    languageId: 'json',
  });
  assert.equal(f[0]!.ruleId, 'lb3/unknown-base-model');
});

test('honours a rule set to off', () => {
  const f = lintText(
    { path: '/app/common/models/order.json',
      text: '{ "name": "Order", "base": "PersistantModel" }', languageId: 'json' },
    { 'lb3/unknown-base-model': 'off' },
  );
  assert.deepEqual(f, []);
});

test('honours a severity override', () => {
  const f = lintText(
    { path: '/app/common/models/order.json',
      text: '{ "name": "Order", "base": "PersistantModel" }', languageId: 'json' },
    { 'lb3/unknown-base-model': 'error' },
  );
  assert.equal(f[0]!.severity, 'error');
});

test('returns nothing for unparseable javascript rather than throwing', () => {
  assert.deepEqual(
    lintText({ path: '/app/common/models/o.js',
      text: "Order.observe('beforeSave', ;;;", languageId: 'javascript' }),
    [],
  );
});

test('findings are returned in source-position order', () => {
  // Documents the boundary contract rather than forcing disorder: no
  // current rule emits out of source order (checkModelJson walks props in
  // document order), so this cannot exercise .sort() actually reordering
  // anything today. The sort is kept as a cheap guarantee at the lintText
  // boundary for a future rule that might emit out of order; this test
  // just pins the contract that callers may rely on ascending positions.
  const text = readFileSync(join(FIX, 'broken', 'order.json'), 'utf8');
  const f = lintText({ path: '/app/common/models/order.json', text, languageId: 'json' });
  assert.equal(f.length, 7);
  for (let i = 1; i < f.length; i++) {
    assert.ok(f[i]!.range.start >= f[i - 1]!.range.start);
  }
});

test('a JavaScript finding reaches lintText output', () => {
  // Regression guard: a bad espree option once made this return [] while
  // every direct checkJs test still passed. Silence here must mean "no
  // findings", never "the parser threw and safely() swallowed it".
  const f = lintText({
    path: '/app/common/models/order.js',
    text: "Order.observe('beforeSave', fn);",
    languageId: 'javascript',
  });
  assert.equal(f.length, 1);
  assert.equal(f[0]!.ruleId, 'lb3/invalid-operation-hook');
  assert.equal(f[0]!.suggestion, 'before save');
});

test('exposes every rule id it can emit', () => {
  assert.ok(ALL_RULE_IDS.includes('lb3/mongo-operator'));
  assert.equal(new Set(ALL_RULE_IDS).size, ALL_RULE_IDS.length);
});
