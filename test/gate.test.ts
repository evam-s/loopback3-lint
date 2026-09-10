import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gate } from '../src/core/gate';

// __dirname at runtime is the compiled out/test directory, not the source
// test directory the fixtures live in. Walk back up to the repo root so the
// fixtures on disk (never copied by tsc) are found regardless of build layout.
const FIX = join(__dirname, '..', '..', 'test', 'fixtures');
const read = (p: string) => readFileSync(join(FIX, p), 'utf8');

function js(path: string, text: string) {
  return gate({ path, text, languageId: 'javascript' });
}
function json(path: string, text: string) {
  return gate({ path, text, languageId: 'json' });
}

test('opens on an explicit loopback require', () => {
  const r = js('/app/server/server.js', "const loopback = require('loopback');");
  assert.equal(r.linted, true);
  assert.equal(r.kind, 'js');
});

test('opens on a generated model file that never names loopback', () => {
  const r = js('/app/common/models/order.js',
    'module.exports = function (Order) {\n  Order.foo = 1;\n};');
  assert.equal(r.linted, true);
});

test('does not open on that same shape outside a models directory', () => {
  const r = js('/app/lib/helper.js', 'module.exports = function (Thing) {};');
  assert.equal(r.linted, false);
});

test('opens on observe with a string literal', () => {
  const r = js('/app/lib/x.js', "Order.observe('before save', fn);");
  assert.equal(r.linted, true);
});

test('stays shut on observe with a non-string argument', () => {
  // The load-bearing case: DOM observers must never open the gate.
  const r = js('/app/lib/x.js', 'resizeObserver.observe(document.body);');
  assert.equal(r.linted, false);
});

test('stays shut on every non-loopback fixture', () => {
  for (const f of ['sequelize-model.js', 'mongoose-model.js',
                   'react-component.js', 'express-app.js']) {
    const r = js(`/other/src/${f}`, read(`non-loopback/${f}`));
    assert.equal(r.linted, false, `${f} must not be linted`);
  }
  const g = json('/other/conf/datasources.json', read('non-loopback/grafana-datasources.json'));
  assert.equal(g.linted, false, 'grafana datasources.json must not be linted');
});

test('recognizes loopback datasources.json by name and shape', () => {
  const r = json('/app/server/datasources.json',
    '{ "db": { "name": "db", "connector": "memory" } }');
  assert.equal(r.linted, true);
  assert.equal(r.kind, 'datasources-json');
});

test('recognizes datasources.json even when connector is misspelled', () => {
  // A gate demanding the exact key would hide the very typo we exist to find.
  const r = json('/app/server/datasources.json',
    '{ "db": { "name": "db", "conector": "memory" } }');
  assert.equal(r.linted, true);
  assert.equal(r.kind, 'datasources-json');
});

test('recognizes a model json by folder and name key alone', () => {
  const r = json('/app/common/models/order.json',
    '{ "name": "Order", "propertys": {} }');
  assert.equal(r.linted, true);
  assert.equal(r.kind, 'model-json');
});

test('recognizes a model json even when the only present key is a misspelled name', () => {
  // Isolates the near-miss match on 'name' alone (no other model-shaped key
  // present), confirming it still works as one of the five independent
  // signals even on its own.
  const r = json('/app/common/models/order.json',
    '{ "nane": "Order" }');
  assert.equal(r.linted, true);
  assert.equal(r.kind, 'model-json');
});

test('recognizes a model json via properties even when name is a transposition-typo', () => {
  // The load-bearing case: relying on 'name' alone -- even matched loosely
  // -- was still broken, because 'name' is a MODEL_TOP_LEVEL_KEYS entry
  // that unknown-model-key exists to catch typos of, and a transposition
  // like 'nmae' (edit distance 2 from a 4-character candidate) sits outside
  // the shared near-miss threshold. The fix is not depending on any single
  // key: 'properties' here is independent evidence, so a mangled 'name'
  // does not hide the file.
  const r = json('/app/common/models/order.json',
    '{ "nmae": "Order", "properties": {} }');
  assert.equal(r.linted, true);
  assert.equal(r.kind, 'model-json');
});

test('recognizes a model json by base alone', () => {
  const r = json('/app/common/models/order.json', '{ "base": "PersistedModel" }');
  assert.equal(r.linted, true);
  assert.equal(r.kind, 'model-json');
});

test('does not open on a models-directory json with none of the five model-shaped keys', () => {
  // Guards against the multi-signal gate becoming a rubber stamp for any
  // JSON file that happens to sit in a folder named "models".
  const r = json('/app/common/models/order.json', '{ "unrelated": true }');
  assert.equal(r.linted, false);
});

test('recognizes middleware.json when a phase is misspelled', () => {
  const r = json('/app/server/middleware.json', '{ "routs": {} }');
  assert.equal(r.linted, true);
  assert.equal(r.kind, 'middleware-json');
});

test('reports a reason when it declines', () => {
  const r = json('/other/conf/datasources.json', '{ "a": 1 }');
  assert.equal(r.linted, false);
  assert.ok(r.reason && r.reason.length > 0);
});

test('honours the lb3lint-disable opt-out comment', () => {
  const r = js('/app/common/models/order.js',
    "// lb3lint-disable\nOrder.observe('beforeSave', fn);");
  assert.equal(r.linted, false);
  assert.match(r.reason!, /lb3lint-disable/);
});

test('only honours the opt-out on the first line', () => {
  const r = js('/app/common/models/order.js',
    "Order.observe('beforeSave', fn);\n// lb3lint-disable");
  assert.equal(r.linted, true);
});

test('normalizes Windows path separators', () => {
  const r = gate({
    path: 'C:\\app\\common\\models\\order.js',
    text: 'module.exports = function (Order) {};',
    languageId: 'javascript',
  });
  assert.equal(r.linted, true);
});

test('accepts the model fixtures at their real on-disk paths', () => {
  // Regression guard: every other gate test passes a synthetic path, so
  // fixtures could sit somewhere the gate rejects and no unit test would
  // notice. Integration tests caught exactly that.
  for (const rel of ['clean/common/models/order.json', 'broken/common/models/order.json']) {
    const p = join(FIX, rel);
    const r = gate({ path: p, text: readFileSync(p, 'utf8'), languageId: 'json' });
    assert.equal(r.linted, true, `${rel} must be linted`);
    assert.equal(r.kind, 'model-json');
  }
});
