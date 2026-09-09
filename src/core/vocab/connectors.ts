// Derived from loopback-datasource-juggler@3.36.1
//   lib/connectors/memory.js, lib/connectors/kv-memory.js,
//   lib/connectors/transient.js  the connectors bundled with juggler itself
// plus the published `loopback-connector-*` packages on the npm registry
// (registry.npmjs.org), cross-checked against
// loopback.io/doc/en/lb3/Database-connectors-reference.html and
// loopback.io/doc/en/lb3/Common-connector-parameters-reference.html on
// 2026-09-09. Each entry below is the package name with the
// `loopback-connector-` prefix stripped, verified to exist on the
// registry as of that date (`GET /loopback-connector-<name>` returned 200).
//
// Two package names printed by the doc-fetch summary do not exist on the
// registry and were corrected against the registry itself:
//   'sqlserver' -> actual package is loopback-connector-mssql
//   'db2zos'    -> actual package is loopback-connector-db2z
//
// 'memory', 'kv-memory' and 'transient' are NOT separate npm packages --
// they ship inside loopback-datasource-juggler@3.36.1 itself
// (lib/connectors/memory.js, lib/connectors/kv-memory.js,
// lib/connectors/transient.js) and are the connector used by nearly every
// LoopBack 3 tutorial and test datasource. They are included here even
// though they fall outside the literal "published loopback-connector-*
// package" scope, because omitting 'memory' would flag the single most
// common `"connector"` value in datasources.json as invalid.
//
// This list reflects official/first-party and well-known connectors only;
// it is NOT a closed set (the registry has 100+ long-tail community
// `loopback-connector-*` packages). The consuming rule must not flag an
// unrecognized connector name outright -- only near-misses of these.
export const CONNECTORS: readonly string[] = [
  'memory',
  'kv-memory',
  'transient',
  'mysql',
  'postgresql',
  'mongodb',
  'oracle',
  'mssql',
  'db2',
  'db2z',
  'db2iseries',
  'cassandra',
  'cloudant',
  'couchdb',
  'couchdb2',
  'dashdb',
  'informix',
  'redis',
  'kv-redis',
  'arangodb',
  'neo4j',
  'grpc',
  'openapi',
  'mqlight',
  'remote',
  'rest',
  'soap',
  'swagger',
  'zosconnectee',
];
