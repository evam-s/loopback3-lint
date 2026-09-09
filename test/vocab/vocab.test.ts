import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WHERE_OPERATORS, FILTER_KEYS } from '../../src/core/vocab/whereOperators';
import { RELATION_TYPES } from '../../src/core/vocab/relationTypes';
import { OPERATION_HOOKS } from '../../src/core/vocab/operationHooks';
import { FOREIGN_IDIOMS, FOREIGN_OPERATORS } from '../../src/core/vocab/foreignIdioms';

const VOCAB_DIR = join(__dirname, '..', '..', 'src', 'core', 'vocab');

test('every vocab module cites its source in a header comment', () => {
  for (const file of readdirSync(VOCAB_DIR).filter((f) => f.endsWith('.ts'))) {
    if (file === 'foreignIdioms.ts') continue; // hand-authored by design
    const head = readFileSync(join(VOCAB_DIR, file), 'utf8').slice(0, 600);
    assert.match(head, /@\d+\.\d+\.\d+/, `${file} must name a package version`);
    assert.match(head, /\.js|\.json|common\/models/, `${file} must name a source file`);
  }
});

test('where operators include the three separately-handled families', () => {
  // Regression guard for the design-time finding that these live outside
  // the `operators` map and are missed by a single-source extraction.
  for (const op of ['eq', 'and', 'or', 'nor', 'near']) {
    assert.ok(WHERE_OPERATORS.includes(op), `${op} must be present`);
  }
});

test('relation types exclude the runtime-derived hasManyThrough', () => {
  assert.ok(!RELATION_TYPES.includes('hasManyThrough'));
  assert.equal(RELATION_TYPES.length, 7);
});

test('operation hooks exclude transaction observers and concatenation fragments', () => {
  for (const bad of ['timeout', 'commit', 'execute', 'rollback', 'before ', 'after ']) {
    assert.ok(!OPERATION_HOOKS.includes(bad), `${bad} must not be a model hook`);
  }
  assert.equal(OPERATION_HOOKS.length, 7);
});

test('no dictionary contains duplicates', () => {
  for (const list of [WHERE_OPERATORS, FILTER_KEYS, RELATION_TYPES, OPERATION_HOOKS]) {
    assert.equal(new Set(list).size, list.length);
  }
});

test('foreign idioms never collide with real LoopBack vocabulary', () => {
  // If a foreign idiom were also valid LoopBack, the rule would flag valid code.
  for (const key of Object.keys(FOREIGN_IDIOMS)) {
    assert.ok(!FILTER_KEYS.includes(key), `${key} is a real filter key`);
  }
  for (const key of Object.keys(FOREIGN_OPERATORS)) {
    assert.ok(!WHERE_OPERATORS.includes(key), `${key} is a real operator`);
  }
});
