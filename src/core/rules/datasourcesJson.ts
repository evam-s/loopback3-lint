import type { Finding } from '../types';
import type { ObjLike } from '../adapters';
import { suggest } from '../util/nearMiss';
import { CONNECTORS } from '../vocab/connectors';

export function checkDatasourcesJson(root: ObjLike): Finding[] {
  const out: Finding[] = [];
  for (const ds of root.props) {
    for (const field of ds.value.object?.props ?? []) {
      if (field.key !== 'connector' || field.value.kind !== 'string') continue;
      const actual = field.value.stringValue!;
      if (CONNECTORS.includes(actual)) continue;
      // An unfamiliar connector may be a private or community package.
      // Only a near-miss of a known one is worth reporting.
      const near = suggest(actual, CONNECTORS);
      if (near) {
        out.push({
          ruleId: 'lb3/unknown-connector',
          message: `'${actual}' is not a known connector. Did you mean '${near}'?`,
          range: field.value.range, severity: 'warn', suggestion: near,
        });
      }
    }
  }
  return out;
}
