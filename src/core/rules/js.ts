import type { Finding } from '../types';
import { fromEstree } from '../adapters';
import { suggest } from '../util/nearMiss';
import { checkFilter } from './filter';
import { OPERATION_HOOKS } from '../vocab/operationHooks';

const FINDER_METHODS = [
  'find', 'findOne', 'findById', 'count', 'updateAll',
  'destroyAll', 'findOrCreate', 'upsertWithWhere',
];

const REMOTE_METHOD_OPTIONS = [
  'accepts', 'returns', 'http', 'description', 'notes',
  'isStatic', 'accessType', 'documented', 'shared',
];

const LB4_IMPORT = /@loopback\//;
const LB4_DECORATORS = /@(?:model|property|repository|inject|authenticate)\s*[(\s]/;

/**
 * Text-level, deliberately independent of the parser.
 *
 * A file full of LoopBack 4 decorators will not parse as a LoopBack 3 script
 * at all, so an AST-dependent check would produce nothing on exactly the
 * files this rule targets. lintText calls this outside the parse try/catch.
 */
export function checkLb4Syntax(text: string): Finding[] {
  const out: Finding[] = [];
  for (const pattern of [LB4_IMPORT, LB4_DECORATORS]) {
    const m = pattern.exec(text);
    if (!m) continue;
    out.push({
      ruleId: 'lb3/loopback4-syntax',
      message: `'${m[0].trim()}' is LoopBack 4 syntax and has no effect in a LoopBack 3 application.`,
      range: { start: m.index, end: m.index + m[0].length },
      severity: 'warn',
    });
  }
  return out;
}

interface AnyNode { type: string; range: [number, number]; [k: string]: any }

function walk(node: AnyNode, visit: (n: AnyNode) => void): void {
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'range' || key === 'parent') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const c of child) if (c && typeof c.type === 'string') walk(c, visit);
    } else if (child && typeof child.type === 'string') {
      walk(child, visit);
    }
  }
}

export function checkJs(ast: unknown): Finding[] {
  const out: Finding[] = [];
  const filtersChecked = new Set<number>();

  walk(ast as AnyNode, (node) => {
    if (node.type === 'ObjectExpression') {
      const obj = fromEstree(node);
      if (obj?.props.some((p) => p.key === 'where') && !filtersChecked.has(node.range[0])) {
        filtersChecked.add(node.range[0]);
        out.push(...checkFilter(obj));
      }
      return;
    }

    if (node.type !== 'CallExpression' || node.callee?.type !== 'MemberExpression') return;
    const method = node.callee.property?.name as string | undefined;
    const args = node.arguments as AnyNode[];
    if (!method || args.length === 0) return;

    if (method === 'observe') {
      const first = args[0]!;
      if (first.type !== 'Literal' || typeof first.value !== 'string') return;
      const hook = first.value as string;
      if (OPERATION_HOOKS.includes(hook)) return;
      const near = suggest(hook, OPERATION_HOOKS);
      if (!near) return; // open-ended namespace; absence is not an error
      out.push({
        ruleId: 'lb3/invalid-operation-hook',
        message: `'${hook}' is not an operation hook, so this handler never runs. Did you mean '${near}'?`,
        range: { start: first.range[0], end: first.range[1] },
        severity: 'error',
        suggestion: near,
      });
      return;
    }

    if (method === 'remoteMethod' && args.length >= 2) {
      const options = fromEstree(args[1]!);
      for (const opt of options?.props ?? []) {
        if (REMOTE_METHOD_OPTIONS.includes(opt.key)) continue;
        const near = suggest(opt.key, REMOTE_METHOD_OPTIONS);
        if (!near) continue;
        out.push({
          ruleId: 'lb3/unknown-remote-method-option',
          message: `'${opt.key}' is not a remoteMethod option. Did you mean '${near}'?`,
          range: opt.keyRange, severity: 'warn', suggestion: near,
        });
      }
      return;
    }

    if (FINDER_METHODS.includes(method)) {
      const first = args[0]!;
      if (first.type !== 'ObjectExpression' || filtersChecked.has(first.range[0])) return;
      filtersChecked.add(first.range[0]);
      const obj = fromEstree(first);
      if (obj) out.push(...checkFilter(obj));
    }
  });

  return out;
}
