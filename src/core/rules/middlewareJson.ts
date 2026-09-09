import type { Finding } from '../types';
import type { ObjLike } from '../adapters';
import { suggest } from '../util/nearMiss';
import { MIDDLEWARE_PHASES } from '../vocab/middlewarePhases';

const SUFFIXES = ['before', 'after'];

export function checkMiddlewareJson(root: ObjLike): Finding[] {
  const out: Finding[] = [];
  for (const entry of root.props) {
    const [phase, suffix, ...rest] = entry.key.split(':');
    if (rest.length > 0) continue;
    if (suffix !== undefined && !SUFFIXES.includes(suffix)) continue;
    if (MIDDLEWARE_PHASES.includes(phase!)) continue;

    const near = suggest(phase!, MIDDLEWARE_PHASES);
    out.push({
      ruleId: 'lb3/invalid-middleware-phase',
      message: near
        ? `'${phase}' is not a middleware phase. Did you mean '${near}'?`
        : `'${phase}' is not a middleware phase. Valid phases are ${MIDDLEWARE_PHASES.join(', ')}.`,
      range: entry.keyRange, severity: 'error',
      ...(near ? { suggestion: near } : {}),
    });
  }
  return out;
}
