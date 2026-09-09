import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levenshtein, suggest } from '../../src/core/util/nearMiss';

const OPS = ['gt', 'gte', 'inq', 'neq', 'between', 'regexp'] as const;

test('levenshtein counts single edits', () => {
  assert.equal(levenshtein('gt', 'gt'), 0);
  assert.equal(levenshtein('inq', 'in'), 1);
  assert.equal(levenshtein('regexp', 'regex'), 1);
});

test('suggest returns undefined for an exact match', () => {
  assert.equal(suggest('gt', OPS), undefined);
});

test('suggest catches a case-only difference at any length', () => {
  assert.equal(suggest('BETWEEN', OPS), 'between');
  assert.equal(suggest('belongsto', ['belongsTo', 'hasMany']), 'belongsTo');
});

test('suggest allows distance 1 for short tokens', () => {
  assert.equal(suggest('in', OPS), 'inq');
  assert.equal(suggest('ne', OPS), 'neq');
});

test('suggest allows distance 2 for tokens of six characters or more', () => {
  assert.equal(suggest('regex', OPS), 'regexp');
  assert.equal(suggest('betwen', OPS), 'between');
});

test('suggest stays silent when nothing is close', () => {
  assert.equal(suggest('customer', OPS), undefined);
  assert.equal(suggest('zzz', OPS), undefined);
});

test('suggest prefers the nearest candidate', () => {
  assert.equal(suggest('gte1', ['gt', 'gte']), 'gte');
});
