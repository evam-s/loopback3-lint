import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTree } from 'jsonc-parser';
import * as espree from 'espree';
import { fromJsonc, fromEstree } from '../src/core/adapters';

test('fromJsonc normalizes an object literal', () => {
  const text = '{ "where": { "gt": 5 }, "limit": 10 }';
  const obj = fromJsonc(parseTree(text)!)!;
  assert.equal(obj.props.length, 2);
  assert.equal(obj.props[0]!.key, 'where');
  assert.equal(obj.props[0]!.value.kind, 'object');
  assert.equal(obj.props[1]!.value.kind, 'number');
  // Key range must cover the quoted key so the squiggle lands on it.
  assert.equal(text.slice(obj.props[0]!.keyRange.start, obj.props[0]!.keyRange.end), '"where"');
});

test('fromEstree normalizes an object expression', () => {
  const code = 'Order.find({ where: { gt: 5 }, limit: 10 });';
  const ast = espree.parse(code, { ecmaVersion: 2022, loc: false, range: true });
  const arg = ast.body[0].expression.arguments[0];
  const obj = fromEstree(arg)!;
  assert.equal(obj.props.length, 2);
  assert.equal(obj.props[0]!.key, 'where');
  assert.equal(obj.props[0]!.value.kind, 'object');
  assert.equal(code.slice(obj.props[0]!.keyRange.start, obj.props[0]!.keyRange.end), 'where');
});

test('fromEstree reads string-literal keys as well as identifiers', () => {
  const code = 'x({ "$gt": 5 });';
  const ast = espree.parse(code, { ecmaVersion: 2022, range: true });
  const obj = fromEstree(ast.body[0].expression.arguments[0])!;
  assert.equal(obj.props[0]!.key, '$gt');
});

test('fromEstree skips computed keys, which cannot be read statically', () => {
  const code = 'x({ [Op.gt]: 5, limit: 1 });';
  const ast = espree.parse(code, { ecmaVersion: 2022, range: true });
  const obj = fromEstree(ast.body[0].expression.arguments[0])!;
  assert.equal(obj.props.length, 1);
  assert.equal(obj.props[0]!.key, 'limit');
});

test('fromEstree returns undefined for a non-object node', () => {
  const ast = espree.parse('x(5);', { ecmaVersion: 2022, range: true });
  assert.equal(fromEstree(ast.body[0].expression.arguments[0]), undefined);
});
