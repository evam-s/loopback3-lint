import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  WHERE_OPERATORS, FILTER_KEYS, ARRAY_VALUED_OPERATORS,
} from '../../src/core/vocab/whereOperators';
import { RELATION_TYPES, RELATION_KEYS } from '../../src/core/vocab/relationTypes';
import { OPERATION_HOOKS } from '../../src/core/vocab/operationHooks';
import { FOREIGN_IDIOMS, FOREIGN_OPERATORS } from '../../src/core/vocab/foreignIdioms';
import { MODEL_TOP_LEVEL_KEYS, PROPERTY_ATTRIBUTE_KEYS } from '../../src/core/vocab/modelKeys';
import { PROPERTY_TYPES } from '../../src/core/vocab/propertyTypes';
import { ACL_ACCESS_TYPES, ACL_PRINCIPAL_TYPES, ACL_PERMISSIONS } from '../../src/core/vocab/aclEnums';
import { BUILTIN_MODELS } from '../../src/core/vocab/builtinModels';
import { CONNECTORS } from '../../src/core/vocab/connectors';
import { CONNECTOR_NAMESPACES } from '../../src/core/vocab/datasourceKeys';
import { MIDDLEWARE_PHASES } from '../../src/core/vocab/middlewarePhases';

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
  const allLists: readonly (readonly string[])[] = [
    WHERE_OPERATORS, FILTER_KEYS, ARRAY_VALUED_OPERATORS,
    RELATION_TYPES, RELATION_KEYS,
    OPERATION_HOOKS,
    MODEL_TOP_LEVEL_KEYS, PROPERTY_ATTRIBUTE_KEYS,
    PROPERTY_TYPES,
    ACL_ACCESS_TYPES, ACL_PRINCIPAL_TYPES, ACL_PERMISSIONS,
    BUILTIN_MODELS,
    CONNECTORS, CONNECTOR_NAMESPACES,
    MIDDLEWARE_PHASES,
  ];
  for (const list of allLists) {
    assert.equal(new Set(list).size, list.length, `duplicate in: ${list.join(', ')}`);
  }
});

test('every connector namespace is a real connector', () => {
  // datasourceKeys.ts states in prose that CONNECTOR_NAMESPACES must never
  // be narrower than CONNECTORS, then duplicates all 29 entries by hand to
  // stay self-contained. Nothing previously checked that the two lists had
  // not drifted apart.
  for (const namespace of CONNECTOR_NAMESPACES) {
    assert.ok(
      CONNECTORS.includes(namespace),
      `'${namespace}' is in CONNECTOR_NAMESPACES but not in CONNECTORS -- the dictionaries have drifted`,
    );
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
