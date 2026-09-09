export type Severity = 'error' | 'warn' | 'off';

/** Character offsets into the source text. Never line/column. */
export interface Range {
  start: number;
  end: number;
}

export interface Finding {
  ruleId: string;
  message: string;
  range: Range;
  severity: Exclude<Severity, 'off'>;
  /** Replacement token offered as a quick fix, when one is known. */
  suggestion?: string;
}

export type FileKind =
  | 'model-json'
  | 'model-config-json'
  | 'datasources-json'
  | 'middleware-json'
  | 'js';

export interface GateResult {
  linted: boolean;
  kind?: FileKind;
  /** Human-readable signals that matched, for the explain command. */
  signals: string[];
  /** Present only when linted is false. */
  reason?: string;
}

export interface LintInput {
  text: string;
  /** Forward-slash separated path. Callers normalize before passing. */
  path: string;
  languageId: string;
}

export type RuleSeverities = Record<string, Severity>;
