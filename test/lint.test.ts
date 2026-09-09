import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintText, ALL_RULE_IDS } from '../src/core/lint';

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

test('returns findings sorted by position', () => {
  const f = lintText({
    path: '/app/common/models/order.json',
    text: '{ "name": "O", "relations": { "r": { "type": "belongsto" } }, "base": "PersistantModel" }',
    languageId: 'json',
  });
  assert.ok(f.length >= 2);
  for (let i = 1; i < f.length; i++) {
    assert.ok(f[i]!.range.start >= f[i - 1]!.range.start);
  }
});

test('exposes every rule id it can emit', () => {
  assert.ok(ALL_RULE_IDS.includes('lb3/mongo-operator'));
  assert.equal(new Set(ALL_RULE_IDS).size, ALL_RULE_IDS.length);
});
