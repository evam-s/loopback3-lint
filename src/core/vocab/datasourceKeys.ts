// Derived from loopback-datasource-juggler@3.36.1
//   lib/model-definition.js:84  `property[connectorType].column ||
//     property[connectorType].columnName` -- the generic pattern juggler
//     uses to read a per-connector override block nested inside a
//     property definition (e.g. `{ type: String, mysql: { dataType:
//     'varchar' } }`). `connectorType` is any connector short name.
// Values below mirror src/core/vocab/connectors.ts (CONNECTORS) -- any
// connector short name may legitimately appear as a namespaced override
// block inside a property definition, so this list must never be
// narrower than that one. Kept as a separate literal list (rather than
// importing CONNECTORS) so each vocab module stays self-contained and
// independently auditable; see connectors.ts for the full derivation and
// npm-registry verification of each name.
// Note: per controller ruling, DATASOURCE_COMMON_KEYS is intentionally
// not implemented here -- nothing in the project consumes it (YAGNI).
export const CONNECTOR_NAMESPACES: readonly string[] = [
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
