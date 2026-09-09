import type { Finding } from '../types';
import type { ObjLike, ValLike } from '../adapters';
import { suggest } from '../util/nearMiss';
import {
  WHERE_OPERATORS, ARRAY_VALUED_OPERATORS, FILTER_KEYS,
} from '../vocab/whereOperators';
import { FOREIGN_IDIOMS, FOREIGN_OPERATORS } from '../vocab/foreignIdioms';

const LOGICAL = ['and', 'or', 'nor'];

/**
 * Checks a LoopBack 3 filter object.
 *
 * The hard part is telling operators from property names. Inside `where`, a
 * key is a property name unless it is a logical operator; operator keys live
 * one level down, inside the object a property maps to. Getting this backwards
 * would flag every column in every query.
 */
export function checkFilter(obj: ObjLike): Finding[] {
  const out: Finding[] = [];

  for (const prop of obj.props) {
    const { key, keyRange, value } = prop;

    if (FILTER_KEYS.includes(key)) {
      if (key === 'where' && value.object) checkWhere(value.object, out);
      if (key === 'order') checkOrder(value, out);
      if (key === 'limit' || key === 'skip' || key === 'offset') {
        if (value.kind !== 'number') {
          out.push({
            ruleId: 'lb3/filter-value-shape',
            message: `'${key}' must be a number.`,
            range: value.range,
            severity: 'warn',
          });
        }
      }
      continue;
    }

    const foreign = FOREIGN_IDIOMS[key];
    if (foreign) {
      out.push({
        ruleId: 'lb3/foreign-filter-key',
        message: `'${key}' is a ${foreign.origin} filter key. LoopBack 3 uses '${foreign.lb3}'.`,
        range: keyRange,
        severity: 'warn',
        suggestion: foreign.lb3,
      });
      continue;
    }

    const near = suggest(key, FILTER_KEYS);
    if (near) {
      out.push({
        ruleId: 'lb3/unknown-filter-key',
        message: `'${key}' is not a filter key. Did you mean '${near}'?`,
        range: keyRange,
        severity: 'warn',
        suggestion: near,
      });
    }
  }

  return out;
}

function checkWhere(where: ObjLike, out: Finding[]): void {
  for (const prop of where.props) {
    const { key, value } = prop;

    if (LOGICAL.includes(key)) {
      for (const item of value.items ?? []) {
        if (item.object) checkWhere(item.object, out);
      }
      continue;
    }

    // Anything else at this level is a property name, which we cannot judge.
    // Its value may be a literal (equality) or an object of operators.
    if (value.object) checkOperators(value.object, out);
  }
}

function checkOperators(operators: ObjLike, out: Finding[]): void {
  for (const prop of operators.props) {
    const { key, keyRange, value } = prop;

    if (key.startsWith('$')) {
      const bare = key.slice(1);
      const mapped = FOREIGN_OPERATORS[bare]?.lb3
        ?? (WHERE_OPERATORS.includes(bare) ? bare : undefined);
      out.push({
        ruleId: 'lb3/mongo-operator',
        message: mapped
          ? `'${key}' is a MongoDB operator. LoopBack 3 uses '${mapped}'.`
          : `'${key}' is a MongoDB operator. LoopBack 3 has no equivalent.`,
        range: keyRange,
        severity: 'error',
        ...(mapped ? { suggestion: mapped } : {}),
      });
      continue;
    }

    if (WHERE_OPERATORS.includes(key)) {
      if (ARRAY_VALUED_OPERATORS.includes(key) && value.kind !== 'array') {
        out.push({
          ruleId: 'lb3/filter-value-shape',
          message: `'${key}' requires an array value.`,
          range: value.range,
          severity: 'warn',
        });
      }
      else if (key === 'between' && value.kind === 'array'
               && (value.items?.length ?? 0) !== 2) {
        out.push({
          ruleId: 'lb3/filter-value-shape',
          message: `'between' requires exactly 2 values.`,
          range: value.range,
          severity: 'warn',
        });
      }
      continue;
    }

    const foreign = FOREIGN_OPERATORS[key];
    if (foreign) {
      out.push({
        ruleId: 'lb3/foreign-operator',
        message: foreign.lb3
          ? `'${key}' is a ${foreign.origin} operator. LoopBack 3 uses '${foreign.lb3}'.`
          : `'${key}' is a ${foreign.origin} operator with no LoopBack 3 equivalent.`,
        range: keyRange,
        severity: 'warn',
        ...(foreign.lb3 ? { suggestion: foreign.lb3 } : {}),
      });
      continue;
    }

    // Unknown and not close to anything: this is very likely a nested
    // property name, not a mistyped operator. Stay silent.
    const near = suggest(key, WHERE_OPERATORS);
    if (near) {
      out.push({
        ruleId: 'lb3/unknown-operator',
        message: `'${key}' is not a LoopBack 3 operator. Did you mean '${near}'?`,
        range: keyRange,
        severity: 'warn',
        suggestion: near,
      });
    }
  }
}

function checkOrder(value: ValLike, out: Finding[]): void {
  if (value.kind === 'string' || value.kind === 'array') return;
  out.push({
    ruleId: 'lb3/filter-value-shape',
    message: `'order' must be a string such as 'total DESC', or an array of them.`,
    range: value.range,
    severity: 'warn',
  });
}
