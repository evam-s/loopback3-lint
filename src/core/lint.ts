import { parseTree } from 'jsonc-parser';
import * as espree from 'espree';
import type { Finding, LintInput, RuleSeverities, Severity } from './types';
import { gate } from './gate';
import { fromJsonc } from './adapters';
import { checkModelJson } from './rules/modelJson';
import { checkModelConfigJson } from './rules/modelConfigJson';
import { checkDatasourcesJson } from './rules/datasourcesJson';
import { checkMiddlewareJson } from './rules/middlewareJson';
import { checkJs, checkLb4Syntax } from './rules/js';

export const ALL_RULE_IDS: readonly string[] = [
  'lb3/foreign-filter-key', 'lb3/unknown-filter-key', 'lb3/mongo-operator',
  'lb3/foreign-operator', 'lb3/unknown-operator', 'lb3/filter-value-shape',
  'lb3/unknown-model-key', 'lb3/unknown-property-attribute',
  'lb3/unknown-property-type', 'lb3/invalid-relation-type',
  'lb3/unknown-relation-key', 'lb3/invalid-acl-value', 'lb3/unknown-base-model',
  'lb3/unknown-model-config-key', 'lb3/unknown-connector',
  'lb3/invalid-middleware-phase', 'lb3/invalid-operation-hook',
  'lb3/unknown-remote-method-option', 'lb3/loopback4-syntax',
];

/**
 * Runs one checker in isolation. A rule that throws must not discard the
 * findings of the rules that succeeded, nor the file.
 */
function safely<T>(run: () => T, fallback: T): T {
  try {
    return run();
  } catch {
    return fallback;
  }
}

export function lintText(input: LintInput, severities: RuleSeverities = {}): Finding[] {
  const decision = gate(input);
  if (!decision.linted || !decision.kind) return [];

  const findings: Finding[] = [];

  if (decision.kind === 'js') {
    // Text-level, and deliberately before the parse: a file of LoopBack 4
    // decorators never parses as a LoopBack 3 script, and that file is
    // exactly what this rule is for.
    findings.push(...safely(() => checkLb4Syntax(input.text), []));

    // A parse failure is not our business: the editor already reports syntax
    // errors, and half-typed code is not a vocabulary mistake.
    const ast = safely(
      () => espree.parse(input.text, {
        ecmaVersion: 2022, range: true, sourceType: 'script',
      }),
      undefined,
    );
    if (ast) findings.push(...safely(() => checkJs(ast), []));
  } else {
    const root = safely(() => fromJsonc(parseTree(input.text)), undefined);
    if (!root) return [];
    const byKind = {
      'model-json': checkModelJson,
      'model-config-json': checkModelConfigJson,
      'datasources-json': checkDatasourcesJson,
      'middleware-json': checkMiddlewareJson,
    } as const;
    const check = byKind[decision.kind as keyof typeof byKind];
    findings.push(...safely(() => check(root), []));
  }

  const resolved: Finding[] = [];
  for (const f of findings) {
    const severity: Severity = severities[f.ruleId] ?? f.severity;
    if (severity === 'off') continue;
    resolved.push({ ...f, severity });
  }
  return resolved.sort((a, b) => a.range.start - b.range.start);
}
