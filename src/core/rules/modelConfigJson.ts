import type { Finding } from '../types';
import type { ObjLike } from '../adapters';
import { suggest } from '../util/nearMiss';

const ENTRY_KEYS = ['dataSource', 'public', 'options', 'relations', 'mixins'];

export function checkModelConfigJson(root: ObjLike): Finding[] {
  const out: Finding[] = [];
  for (const entry of root.props) {
    if (entry.key === '_meta') continue;
    for (const field of entry.value.object?.props ?? []) {
      if (ENTRY_KEYS.includes(field.key)) continue;
      const near = suggest(field.key, ENTRY_KEYS);
      if (near) {
        out.push({
          ruleId: 'lb3/unknown-model-config-key',
          message: `'${field.key}' is not a model-config key. Did you mean '${near}'?`,
          range: field.keyRange, severity: 'warn', suggestion: near,
        });
      }
    }
  }
  return out;
}
