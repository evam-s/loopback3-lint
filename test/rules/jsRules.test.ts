import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as espree from 'espree';
import { checkJs, checkLb4Syntax } from '../../src/core/rules/js';

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

test('flags LoopBack 4 syntax without needing the file to parse', () => {
  const f = checkLb4Syntax("const { repository } = require('@loopback/repository');");
  assert.equal(f[0]!.ruleId, 'lb3/loopback4-syntax');
});

test('flags LoopBack 4 decorators, which do not parse as LoopBack 3 script', () => {
  // The reason this rule is text-level: espree in script mode rejects this
  // outright, so an AST-based check would find nothing here.
  const f = checkLb4Syntax('@model()\nexport class Order {}');
  assert.equal(f[0]!.ruleId, 'lb3/loopback4-syntax');
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
  // future signal change did, the rules must still stay silent.
  // Source tree, not out/ — tsc does not copy fixtures. This file compiles
  // to out/test/rules/, hence three levels up.
  const code = readFileSync(
    join(__dirname, '..', '..', '..', 'test', 'fixtures',
         'non-loopback', 'sequelize-model.js'), 'utf8');
  const findings = run(code);
  assert.deepEqual(findings.filter((f) => f.severity === 'error'), []);
});
