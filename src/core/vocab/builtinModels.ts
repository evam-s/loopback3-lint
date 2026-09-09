// Derived from loopback@3.28.0
//   common/models/*.json  the 11 built-in model definition files, whose
//     `name` fields are: AccessToken, ACL, Application, Change, Checkpoint,
//     Email, KeyValueModel, RoleMapping, Role, Scope, User
//   lib/builtin-models.js:13-66  confirms these are exactly the models
//     registered onto the registry (no more, no less)
//
// EXTENSION beyond the literal file-listing: 'Model' and 'PersistedModel'
// are added below even though they are not JSON files under
// common/models/. They are the two foundational base classes every model.json
// legitimately uses as its `"base"` value:
//   lib/persisted-model.js:22,39 (loopback)     `registry.getModel('Model')`,
//     `Model.extend('PersistedModel')`
//   lib/model-builder.js:53 (loopback-datasource-juggler)
//     `this.defaultModelBaseClass` registered under the name 'Model'
// Omitting them would flag `"base": "PersistedModel"` -- the single most
// common base value in LoopBack 3 apps -- as invalid. Silence beats a
// false alarm.
export const BUILTIN_MODELS: readonly string[] = [
  'AccessToken',
  'ACL',
  'Application',
  'Change',
  'Checkpoint',
  'Email',
  'KeyValueModel',
  'RoleMapping',
  'Role',
  'Scope',
  'User',
  'Model',
  'PersistedModel',
];
