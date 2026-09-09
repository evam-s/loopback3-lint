import type { Node as JsoncNode } from 'jsonc-parser';
import type { Range } from './types';

export type ValKind =
  | 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null' | 'other';

export interface ValLike {
  kind: ValKind;
  range: Range;
  /** Present when kind === 'string'. */
  stringValue?: string;
  /** Present when kind === 'object'. */
  object?: ObjLike;
  /** Present when kind === 'array'. */
  items?: ValLike[];
}

export interface PropLike {
  key: string;
  keyRange: Range;
  value: ValLike;
}

export interface ObjLike {
  range: Range;
  props: PropLike[];
}

function jsoncRange(node: JsoncNode): Range {
  return { start: node.offset, end: node.offset + node.length };
}

function jsoncValue(node: JsoncNode): ValLike {
  const range = jsoncRange(node);
  switch (node.type) {
    case 'object':
      return { kind: 'object', range, object: fromJsonc(node) };
    case 'array':
      return { kind: 'array', range, items: (node.children ?? []).map(jsoncValue) };
    case 'string':
      return { kind: 'string', range, stringValue: String(node.value) };
    case 'number':
      return { kind: 'number', range };
    case 'boolean':
      return { kind: 'boolean', range };
    case 'null':
      return { kind: 'null', range };
    default:
      return { kind: 'other', range };
  }
}

export function fromJsonc(node: JsoncNode | undefined): ObjLike | undefined {
  if (!node || node.type !== 'object') return undefined;
  const props: PropLike[] = [];
  for (const prop of node.children ?? []) {
    const [keyNode, valueNode] = prop.children ?? [];
    if (!keyNode || !valueNode) continue;
    props.push({
      key: String(keyNode.value),
      keyRange: jsoncRange(keyNode),
      value: jsoncValue(valueNode),
    });
  }
  return { range: jsoncRange(node), props };
}

interface EstreeNode {
  type: string;
  range: [number, number];
  [key: string]: any;
}

function estreeRange(node: EstreeNode): Range {
  return { start: node.range[0], end: node.range[1] };
}

function estreeValue(node: EstreeNode): ValLike {
  const range = estreeRange(node);
  if (node.type === 'ObjectExpression') {
    return { kind: 'object', range, object: fromEstree(node) };
  }
  if (node.type === 'ArrayExpression') {
    return {
      kind: 'array',
      range,
      items: (node.elements as (EstreeNode | null)[])
        .filter((e): e is EstreeNode => e !== null)
        .map(estreeValue),
    };
  }
  if (node.type === 'Literal') {
    const v = node.value;
    if (typeof v === 'string') return { kind: 'string', range, stringValue: v };
    if (typeof v === 'number') return { kind: 'number', range };
    if (typeof v === 'boolean') return { kind: 'boolean', range };
    if (v === null) return { kind: 'null', range };
  }
  return { kind: 'other', range };
}

export function fromEstree(node: EstreeNode | undefined): ObjLike | undefined {
  if (!node || node.type !== 'ObjectExpression') return undefined;
  const props: PropLike[] = [];
  for (const prop of node.properties as EstreeNode[]) {
    if (prop.type !== 'Property') continue;
    // A computed key cannot be read statically. Sequelize's [Op.gt] lands
    // here, and skipping it is what keeps us quiet on Sequelize code.
    if (prop.computed) continue;
    const key = prop.key.type === 'Identifier'
      ? prop.key.name
      : prop.key.type === 'Literal' ? String(prop.key.value) : undefined;
    if (key === undefined) continue;
    props.push({
      key,
      keyRange: estreeRange(prop.key),
      value: estreeValue(prop.value),
    });
  }
  return { range: estreeRange(node), props };
}
