// Derived from loopback-datasource-juggler@3.36.1.
//   lib/model-utils.js:72   the `operators` map
//   lib/model-utils.js:380  logical operators and/or/nor
//   lib/geo.js              the `near` geospatial operator
// The list spans three code paths; a single-source extraction omits five
// valid operators and produces false positives on correct queries.
export const WHERE_OPERATORS: readonly string[] = [
  'eq', 'gt', 'gte', 'lt', 'lte',
  'between', 'inq', 'nin', 'neq',
  'like', 'nlike', 'ilike', 'nilike', 'regexp',
  'and', 'or', 'nor',
  'near',
];

/** Operators requiring an array value. */
export const ARRAY_VALUED_OPERATORS: readonly string[] = ['inq', 'nin', 'between'];

/** Top-level filter keys. Closed set. */
export const FILTER_KEYS: readonly string[] = [
  'where', 'include', 'fields', 'order', 'limit', 'skip', 'offset',
];
