import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseTree } from 'jsonc-parser';
import { fromJsonc } from '../../src/core/adapters';
import { checkModelJson } from '../../src/core/rules/modelJson';
import { checkModelConfigJson } from '../../src/core/rules/modelConfigJson';
import { checkDatasourcesJson } from '../../src/core/rules/datasourcesJson';
import { checkMiddlewareJson } from '../../src/core/rules/middlewareJson';

// Fixtures are read from the SOURCE tree, not `out/` — tsc does not copy
// non-TS files. This file compiles to out/test/rules/, hence three levels up.
const FIX = join(__dirname, '..', '..', '..', 'test', 'fixtures');
const obj = (text: string) => fromJsonc(parseTree(text))!;
const file = (p: string) => obj(readFileSync(join(FIX, p), 'utf8'));

test('the clean model fixture produces no findings at all', () => {
  assert.deepEqual(checkModelJson(file('clean/common/models/order.json')), []);
});

test('the broken model fixture produces exactly the expected rule ids', () => {
  const ids = checkModelJson(file('broken/common/models/order.json')).map((f) => f.ruleId).sort();
  assert.deepEqual(ids, [
    'lb3/invalid-acl-value',
    'lb3/invalid-acl-value',
    'lb3/invalid-relation-type',
    'lb3/unknown-base-model',
    'lb3/unknown-model-key',
    'lb3/unknown-property-attribute',
    'lb3/unknown-property-type',
  ]);
});

test('base near-miss suggests the built-in', () => {
  const f = checkModelJson(obj('{ "name": "X", "base": "PersistantModel" }'));
  assert.equal(f[0]!.ruleId, 'lb3/unknown-base-model');
  assert.equal(f[0]!.suggestion, 'PersistedModel');
});

test('base naming an unfamiliar model is left alone', () => {
  // Almost certainly one of the user's own models. We cannot know. Stay quiet.
  assert.deepEqual(checkModelJson(obj('{ "name": "X", "base": "Custumer" }')), []);
});

test('connector-namespaced property blocks are never flagged', () => {
  assert.deepEqual(
    checkModelJson(obj('{ "name": "X", "properties": { "a": { "type": "string", "postgresql": { "columnName": "A" } } } }')),
    [],
  );
});

test('relation scope is checked as a filter', () => {
  const f = checkModelJson(obj('{ "name": "X", "relations": { "r": { "type": "hasMany", "model": "Y", "scope": { "sort": "id" } } } }'));
  assert.equal(f[0]!.ruleId, 'lb3/foreign-filter-key');
});

test('model-config flags the silently-ignored datasource casing', () => {
  const f = checkModelConfigJson(obj('{ "Order": { "datasource": "db", "public": true } }'));
  assert.equal(f[0]!.ruleId, 'lb3/unknown-model-config-key');
  assert.equal(f[0]!.suggestion, 'dataSource');
});

test('model-config leaves _meta alone', () => {
  assert.deepEqual(
    checkModelConfigJson(obj('{ "_meta": { "sources": ["../common/models"] }, "Order": { "dataSource": "db" } }')),
    [],
  );
});

test('datasources flags a near-miss connector but not an unknown one', () => {
  const f = checkDatasourcesJson(obj('{ "db": { "connector": "postgres" } }'));
  assert.equal(f[0]!.ruleId, 'lb3/unknown-connector');
  assert.equal(f[0]!.suggestion, 'postgresql');
  assert.deepEqual(checkDatasourcesJson(obj('{ "db": { "connector": "our-inhouse-thing" } }')), []);
});

test('middleware flags an invalid phase and accepts suffixed forms', () => {
  const f = checkMiddlewareJson(obj('{ "routs": {} }'));
  assert.equal(f[0]!.ruleId, 'lb3/invalid-middleware-phase');
  assert.equal(f[0]!.suggestion, 'routes');
  assert.deepEqual(checkMiddlewareJson(obj('{ "routes:before": {}, "final:after": {} }')), []);
});
