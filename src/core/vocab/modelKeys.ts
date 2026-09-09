// Derived from loopback-datasource-juggler@3.36.1 and loopback@3.28.0.
//   lib/registry.js:101-262 (loopback)         config.{name,properties,
//     relations,acls,options,dataSource,methods} read from model config
//   lib/model-builder.js:147-360 (juggler)      settings.{strict,forceId,
//     idInjection,excludeBaseProperties}
//   lib/model-utils.js:269 (juggler)            settings.protected
//   lib/model-definition.js:197-204 (juggler)   settings.indexes
//   lib/persisted-model.js:39,640 (loopback)    base 'PersistedModel';
//     options.replaceOnPUT
//   lib/application.js:145, persisted-model.js:54 (loopback) settings.trackChanges
//   lib/plugins/mixin.js:126-127 (loopback-boot) model.definition.mixins
//   lib/relations.js:271,302,405,442 (juggler)  "validations": [] in every
//     canonical model.json example in the module's own doc comments; this
//     is what `yo loopback:model` scaffolds into generated models
//   loopback/common/models/acl.js:75            settings.defaultPermission
//   lib/dao.js:192 (juggler)                    definition.settings.scope
//   lib/model-utils.js:260,269 (juggler)        settings.hiddenProperties,
//     settings.protectedProperties (long forms of settings.hidden/.protected)
//   lib/dao.js:2570, model-builder.js:581-582, model.js:108 (juggler)
//     settings.persistUndefinedAsNull
//   lib/dao.js:550-555 (juggler)                settings.validateUpsert
//   lib/dao.js:364,551-552 (juggler)             settings.automaticValidation
//   lib/dao.js:1986,2469,2494 (juggler)          settings.strictDelete
//   lib/dao.js:1135,1662 (juggler)               settings.applyDefaultsOnReads
//   lib/dao.js:410,2938 (juggler)                settings.updateOnLoad
// Cross-checked against
// loopback.io/doc/en/lb3/Model-definition-JSON-file.html on 2026-09-09,
// which additionally documents 'base', 'plural', 'description', 'hidden',
// 'http', 'remoting', 'scopes' as top-level keys and the property
// attribute keys applyDefaultOnWrites/columnName/dataLength/dataPrecision/
// dataScale/dataType/default/defaultFn/description/generated/id/index/
// lowercase/nullable/persistDefaultValues/required/trim/type/uppercase/
// useDefaultIdType. 'limit' (property attribute, e.g. `{type: String,
// limit: 150}`) is additionally confirmed at
// lib/model-builder.js:107 (juggler, JSDoc example).
//
// THIS SET IS OPEN, NOT CLOSED. lib/registry.js:130-147 (loopback),
// `buildModelOptionsFromConfig()`, copies EVERY top-level key of a model
// config except 'name', 'properties' and 'options' straight into the
// model's settings object (`for (const key in config) { ... options[key]
// = config[key]; }`). LoopBack 3 therefore accepts arbitrary top-level
// keys by construction -- a key's absence from this list is never by
// itself evidence of a typo. Like OPERATION_HOOKS (operationHooks.ts) and
// CONNECTORS (connectors.ts), this list exists to drive near-miss
// suggestions (e.g. 'propreties' -> 'properties') only; the consuming
// rule must stay silent on any unrecognized key that isn't a near-miss of
// one of these.
export const MODEL_TOP_LEVEL_KEYS: readonly string[] = [
  'name',
  'base',
  'plural',
  'description',
  'properties',
  'options',
  'hidden',
  'hiddenProperties',
  'protected',
  'protectedProperties',
  'relations',
  'acls',
  'methods',
  'mixins',
  'indexes',
  'scopes',
  'scope',
  'http',
  'remoting',
  'replaceOnPUT',
  'excludeBaseProperties',
  'trackChanges',
  'forceId',
  'idInjection',
  'strict',
  'validations',
  'defaultPermission',
  'persistUndefinedAsNull',
  'validateUpsert',
  'automaticValidation',
  'strictDelete',
  'applyDefaultsOnReads',
  'updateOnLoad',
];

/** Keys valid inside a single property definition object. */
export const PROPERTY_ATTRIBUTE_KEYS: readonly string[] = [
  'type',
  'id',
  'required',
  'default',
  'defaultFn',
  'description',
  'generated',
  'useDefaultIdType',
  'persistDefaultValues',
  'applyDefaultOnWrites',
  'trim',
  'lowercase',
  'uppercase',
  'nullable',
  'index',
  'columnName',
  'dataType',
  'dataLength',
  'dataPrecision',
  'dataScale',
  'limit',
];
