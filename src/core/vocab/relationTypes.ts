// Derived from loopback-datasource-juggler@3.36.1
//   lib/relation-definition.js:26  the `RelationTypes` enum
// Note: `RelationClasses` immediately below the enum also lists
// `hasManyThrough`, which is derived at runtime from `hasMany` plus a
// `through` option and is not written by hand in model.json. It is
// deliberately excluded here; see test/vocab/vocab.test.ts.
export const RELATION_TYPES: readonly string[] = [
  'belongsTo',
  'hasMany',
  'hasOne',
  'hasAndBelongsToMany',
  'referencesMany',
  'embedsOne',
  'embedsMany',
];

/** Keys valid inside a single relation definition object. */
export const RELATION_KEYS: readonly string[] = [
  'type', 'model', 'foreignKey', 'through', 'keyThrough', 'primaryKey',
  'polymorphic', 'as', 'options', 'scope', 'properties', 'discriminator',
];
