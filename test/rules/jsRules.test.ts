import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as espree from 'espree';
import { checkJs } from '../../src/core/rules/js';

const run = (code: string) =>
  checkJs(espree.parse(code, { ecmaVersion: 2022, range: true, sourceType: 'script' }));

test('flags a camelCased operation hook', () => {
  const f = run("Order.observe('beforeSave', fn);");
  assert.equal(f[0]!.ruleId, 'lb3/invalid-operation-hook');
  assert.equal(f[0]!.suggestion, 'before save');
  assert.match(f[0]!.message, /never runs/);
});

test('flags an underscored operation hook', () => {
  assert.equal(run("Order.observe('before_save', fn);")[0]!.suggestion, 'before save');
});

test('accepts all seven documented hooks', () => {
  for (const h of ['access', 'before save', 'after save', 'before delete',
                   'after delete', 'loaded', 'persist']) {
    assert.deepEqual(run(`Order.observe('${h}', fn);`), [], h);
  }
});

test('stays silent on an unrecognized hook that resembles nothing', () => {
  // observer.js builds names by concatenation, so connectors may register
  // hooks we have never heard of. Absence is not evidence of error.
  assert.deepEqual(run("tx.observe('before execute', fn);"), []);
});

test('flags an unknown remoteMethod option', () => {
  const f = run("Order.remoteMethod('search', { acepts: [], returns: {} });");
  assert.equal(f[0]!.ruleId, 'lb3/unknown-remote-method-option');
  assert.equal(f[0]!.suggestion, 'accepts');
});

test('checks filters passed to finder methods', () => {
  const f = run("Order.find({ where: { total: { $gt: 1 } } });");
  assert.equal(f[0]!.ruleId, 'lb3/mongo-operator');
});

test('checks any object literal carrying a where key', () => {
  const f = run("const filter = { where: { t: { $lt: 1 } } };");
  assert.equal(f[0]!.ruleId, 'lb3/mongo-operator');
});

test('does not double-report a filter reached by both paths', () => {
  const f = run("Order.find({ where: { t: { $lt: 1 } } });");
  assert.equal(f.length, 1);
});

test('produces nothing on the Sequelize fixture even if forced past the gate', () => {
  // Belt and braces: the gate should never let this file through, but if a
  // future signal change did, the rules must still stay silent. This must
  // be a wholly empty result -- not just no errors. A bare object literal
  // carrying `where` (Sequelize's findAll options) is weak evidence of a
  // LoopBack filter, so its sibling keys (here, `attributes`) must not be
  // judged against LoopBack vocabulary.
  // Source tree, not out/ — tsc does not copy fixtures. This file compiles
  // to out/test/rules/, hence three levels up.
  const code = readFileSync(
    join(__dirname, '..', '..', '..', 'test', 'fixtures',
         'non-loopback', 'sequelize-model.js'), 'utf8');
  assert.deepEqual(run(code), []);
});

test('a bare object with a where clause still catches Mongo operators', () => {
  const f = run("const filter = { where: { total: { $lt: 1 } } };");
  assert.equal(f.length, 1);
  assert.equal(f[0]!.ruleId, 'lb3/mongo-operator');
});

test('a bare object with a where clause does not judge its sibling keys', () => {
  // Could be any query builder. Not enough evidence that it is LoopBack's.
  assert.deepEqual(run("const q = { where: { x: 1 }, attributes: ['a'] };"), []);
});

test('a filter passed to a finder method IS judged in full', () => {
  const f = run("Order.find({ where: { x: 1 }, attributes: ['a'] });");
  assert.equal(f[0]!.ruleId, 'lb3/foreign-filter-key');
});
