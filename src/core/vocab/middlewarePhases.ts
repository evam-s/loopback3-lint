// Derived from loopback@3.28.0
//   lib/server-app.js:119  comment listing the built-in phase order:
//     "initial, session, auth, parse, routes, files, final"
// Cross-checked against loopback.io/doc/en/lb3/Defining-middleware.html
// on 2026-09-09, which documents the same seven phases.
//
// NOTE: the design brief for this task pointed at loopback-boot@3.3.1 as
// the source. That package's middleware plugin
// (lib/plugins/middleware.js:37, `for (phase in config)`) merges whatever
// phase keys an app's middleware.json declares into the phase list
// generically -- it does not itself define or hardcode the built-in seven.
// The actual built-in phase names originate in the `loopback` package
// (lib/server-app.js), so that is what this file cites.
//
// Only the bare phase names are stored here; the `:before` and `:after`
// subphase suffixes are appended by the consuming rule, not stored.
export const MIDDLEWARE_PHASES: readonly string[] = [
  'initial',
  'session',
  'auth',
  'parse',
  'routes',
  'files',
  'final',
];
