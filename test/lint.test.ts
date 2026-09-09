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

test('returns findings sorted by position even when rules emit out of order', () => {
  // checkLb4Syntax runs before checkJs, so its finding is pushed first
  // despite sitting later in the file. Without the sort, these come back
  // reversed.
  const text = "Order.observe('beforeSave', fn);\nconst { repository } = require('@loopback/repository');";
  const f = lintText({ path: '/app/common/models/order.js', text, languageId: 'javascript' });
  assert.equal(f.length, 2);
  assert.equal(f[0]!.ruleId, 'lb3/invalid-operation-hook');
  assert.equal(f[1]!.ruleId, 'lb3/loopback4-syntax');
  assert.ok(f[0]!.range.start < f[1]!.range.start);
});

test('exposes every rule id it can emit', () => {
  assert.ok(ALL_RULE_IDS.includes('lb3/mongo-operator'));
  assert.equal(new Set(ALL_RULE_IDS).size, ALL_RULE_IDS.length);
});
