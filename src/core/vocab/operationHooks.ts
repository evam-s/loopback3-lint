// Derived from loopback-datasource-juggler@3.36.1, the notifyObserversOf
// call sites in lib/*.js, cross-checked against
// loopback.io/doc/en/lb3/Operation-hooks.html
//
// IMPORTANT: this list is NOT a closed set. lib/observer.js:228 and :240
// build hook names by concatenation ('before ' + operation), so connectors
// may legitimately register names not listed here. The consuming rule must
// therefore fire only on near-misses of these seven, never on absence.
// lib/transaction.js contributes 'timeout', 'commit', 'execute' and
// 'rollback', which are transaction observers rather than model operation
// hooks and are excluded.
export const OPERATION_HOOKS: readonly string[] = [
  'access',
  'before save',
  'after save',
  'before delete',
  'after delete',
  'loaded',
  'persist',
];
