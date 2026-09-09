import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTree } from 'jsonc-parser';
import { fromJsonc } from '../../src/core/adapters';
import { checkFilter } from '../../src/core/rules/filter';

const check = (json: string) => checkFilter(fromJsonc(parseTree(json))!);
const ids = (json: string) => check(json).map((f) => f.ruleId).sort();

test('flags a MongoDB operator with total confidence', () => {
  const f = check('{ "where": { "total": { "$gt": 100 } } }');
  assert.equal(f.length, 1);
  assert.equal(f[0]!.ruleId, 'lb3/mongo-operator');
  assert.equal(f[0]!.severity, 'error');
  assert.equal(f[0]!.suggestion, 'gt');
  assert.match(f[0]!.message, /MongoDB/);
});

test('flags a foreign filter key and names its origin', () => {
  const f = check('{ "select": ["id"] }');
  assert.equal(f[0]!.ruleId, 'lb3/foreign-filter-key');
  assert.equal(f[0]!.suggestion, 'fields');
  assert.match(f[0]!.message, /Mongoose|Sequelize/);
});

test('maps bare foreign operators to their LoopBack equivalents', () => {
  const f = check('{ "where": { "tag": { "in": ["a"] } } }');
  assert.equal(f[0]!.ruleId, 'lb3/foreign-operator');
  assert.equal(f[0]!.suggestion, 'inq');
});

test('reports an operator with no LoopBack equivalent without a suggestion', () => {
  const f = check('{ "where": { "x": { "exists": true } } }');
  assert.equal(f[0]!.ruleId, 'lb3/foreign-operator');
  assert.equal(f[0]!.suggestion, undefined);
});

test('flags order given as an object', () => {
  const f = check('{ "order": { "total": "DESC" } }');
  assert.equal(f[0]!.ruleId, 'lb3/filter-value-shape');
  assert.match(f[0]!.message, /string/);
});

test('flags inq with a non-array value', () => {
  const f = check('{ "where": { "tag": { "inq": "a" } } }');
  assert.equal(f[0]!.ruleId, 'lb3/filter-value-shape');
});

test('flags limit given as a string', () => {
  assert.deepEqual(ids('{ "limit": "10" }'), ['lb3/filter-value-shape']);
});

test('stays silent on a wholly valid filter', () => {
  assert.deepEqual(check(`{
    "where": { "and": [ { "total": { "gt": 100 } }, { "status": { "neq": "void" } } ] },
    "fields": { "id": true },
    "order": "total DESC",
    "limit": 10,
    "skip": 0,
    "include": "customer"
  }`), []);
});

test('stays silent on eq, nor and near, the separately-handled operators', () => {
  assert.deepEqual(check('{ "where": { "s": { "eq": "a" } } }'), []);
  assert.deepEqual(check('{ "where": { "nor": [] } }'), []);
  assert.deepEqual(check('{ "where": { "loc": { "near": "0,0" } } }'), []);
});

test('treats a plain property equality as a property, not an operator', () => {
  // { where: { status: 'active' } } — `status` is a column, not an operator.
  assert.deepEqual(check('{ "where": { "status": "active" } }'), []);
});

test('does not mistake a nested property name for an operator', () => {
  assert.deepEqual(check('{ "where": { "customer": { "name": "x" } } }'), []);
});
