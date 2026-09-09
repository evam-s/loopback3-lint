// Derived from loopback-datasource-juggler@3.36.1
//   lib/types.js:59-71  the type-registration block: registerType() calls
//     for Text, JSON, Any, String, Number, Boolean, Date, DateString,
//     Buffer (alias 'Binary'), Array, GeoPoint, Object
// Cross-checked against loopback.io/doc/en/lb3/LoopBack-types.html on
// 2026-09-09, which documents the same set (case-insensitively) plus
// 'null' as a valid JSON value type name.
// Type names are case-insensitive per lib/model-builder.js
// (`ModelBuilder.schemaTypes[prop.toLowerCase()]`); the consuming rule is
// expected to compare case-insensitively.
export const PROPERTY_TYPES: readonly string[] = [
  'Text',
  'JSON',
  'Any',
  'String',
  'Number',
  'Boolean',
  'Date',
  'DateString',
  'Buffer',
  'Binary',
  'Array',
  'GeoPoint',
  'Object',
  'null',
];
