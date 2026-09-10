import { parseTree } from 'jsonc-parser';
import type { GateResult, LintInput } from './types';
import { fromJsonc } from './adapters';
import { suggest } from './util/nearMiss';
import { MIDDLEWARE_PHASES } from './vocab/middlewarePhases';

const MODEL_DIRS = ['common/models/', 'server/models/'];
const MODEL_SHAPE_KEYS = ['name', 'properties', 'base', 'relations', 'acls'];
const BOOT_DIR = 'server/boot/';

const LOOPBACK_REQUIRE =
  /(?:require\(|from\s+)['"](loopback|loopback-boot|loopback-datasource-juggler|loopback-connector-[\w-]+)['"]/;

const MODEL_MODULE_SHAPE =
  /module\.exports\s*=\s*function\s*\(\s*\w+\s*(?:,\s*\w+\s*)?\)/;

const DISTINCTIVE_CALLS =
  /\.(?:remoteMethod|beforeRemote|afterRemote|afterRemoteError|disableRemoteMethodByName)\s*\(/;

/**
 * `.observe(` alone is not evidence: resizeObserver.observe(el) and
 * intersectionObserver.observe(node) are everywhere in browser code. Only a
 * string-literal first argument is LoopBack-shaped.
 */
const OBSERVE_WITH_STRING = /\.observe\s*\(\s*['"]/;

function normalize(p: string): string {
  return p.replace(/\\/g, '/');
}

/** Matches when the token equals a candidate or is a near-miss of one. */
function matchesLoosely(token: string, candidates: readonly string[]): boolean {
  return candidates.includes(token) || suggest(token, candidates) !== undefined;
}

function gateJs(input: LintInput, path: string): GateResult {
  const signals: string[] = [];
  if (LOOPBACK_REQUIRE.test(input.text)) signals.push('imports a loopback package');

  const inModelDir = MODEL_DIRS.some((d) => path.includes(d));
  const inBootDir = path.includes(BOOT_DIR);
  if ((inModelDir || inBootDir) && MODEL_MODULE_SHAPE.test(input.text)) {
    signals.push('module.exports = function (Model) in a models or boot directory');
  }
  if (DISTINCTIVE_CALLS.test(input.text)) signals.push('calls a LoopBack remoting method');
  if (OBSERVE_WITH_STRING.test(input.text)) signals.push('calls .observe() with a string literal');

  return signals.length > 0
    ? { linted: true, kind: 'js', signals }
    : { linted: false, signals, reason: 'No LoopBack 3 signal found in this JavaScript file.' };
}

function gateJson(input: LintInput, path: string): GateResult {
  const base = path.slice(path.lastIndexOf('/') + 1);
  const root = fromJsonc(parseTree(input.text));
  if (!root) {
    return { linted: false, signals: [], reason: 'File is not a JSON object.' };
  }

  if (base === 'datasources.json') {
    const hit = root.props.some(
      (p) => p.value.object?.props.some((q) => matchesLoosely(q.key, ['connector'])),
    );
    return hit
      ? { linted: true, kind: 'datasources-json', signals: ['datasources.json with a connector key'] }
      : { linted: false, signals: ['filename datasources.json'],
          reason: 'No top-level value carries a connector key.' };
  }

  if (base === 'model-config.json') {
    const hasMeta = root.props.some((p) => p.key === '_meta');
    const hasDs = root.props.some(
      (p) => p.value.object?.props.some((q) => matchesLoosely(q.key, ['dataSource'])),
    );
    return hasMeta || hasDs
      ? { linted: true, kind: 'model-config-json', signals: ['model-config.json with _meta or dataSource'] }
      : { linted: false, signals: ['filename model-config.json'],
          reason: 'No _meta block and no entry carrying a dataSource key.' };
  }

  if (base === 'middleware.json') {
    const hit = root.props.some((p) => {
      const bare = p.key.split(':')[0]!;
      return matchesLoosely(bare, MIDDLEWARE_PHASES);
    });
    return hit
      ? { linted: true, kind: 'middleware-json', signals: ['middleware.json with a recognized phase'] }
      : { linted: false, signals: ['filename middleware.json'],
          reason: 'No top-level key resembles a middleware phase.' };
  }

  // A model definition: identified by folder plus at least one key that
  // loosely resembles a top-level model key. Relying on `name` alone was
  // still broken even once matched loosely -- `name` is itself a
  // MODEL_TOP_LEVEL_KEYS entry that `unknown-model-key` exists to catch
  // typos of, so a single mistyped `name` (e.g. a transposition like
  // 'nmae', which sits outside the shared near-miss threshold for a
  // 4-character word) could still hide the whole file with zero
  // diagnostics -- worse than a normal miss, because loopback-boot can
  // derive a model's name from its filename, so the app runs fine while
  // linting silently gives up on it. The fix is not a looser threshold on
  // `name` (that just moves the same failure one edit further away and
  // reintroduces a second, ad hoc near-miss policy); it is not depending on
  // any single key. Five independent, loosely-matched signals mean a typo
  // in any one of them still leaves four others standing, so no single
  // mistake can hide the file. No value-shape is required of the matched
  // key -- existence of a plausible key is the signal, not its content.
  if (/\/models\/[^/]+\.json$/.test(path)) {
    const hit = root.props.some((p) => matchesLoosely(p.key, MODEL_SHAPE_KEYS));
    return hit
      ? { linted: true, kind: 'model-json',
          signals: ['json in a models directory with a model-shaped key'] }
      : { linted: false, signals: ['json in a models directory'],
          reason: 'No key resembling name, properties, base, relations, or acls.' };
  }

  return { linted: false, signals: [], reason: 'Filename is not a LoopBack 3 configuration file.' };
}

export function gate(input: LintInput): GateResult {
  const path = normalize(input.path);
  if (/^\/\/\s*lb3lint-disable\b/.test(input.text)) {
    return { linted: false, signals: [], reason: 'File opts out with // lb3lint-disable.' };
  }
  if (path.endsWith('.js')) return gateJs(input, path);
  if (path.endsWith('.json')) return gateJson(input, path);
  return { linted: false, signals: [], reason: 'Unsupported file extension.' };
}
