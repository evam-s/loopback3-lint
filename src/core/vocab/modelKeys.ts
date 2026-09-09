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
export const MODEL_TOP_LEVEL_KEYS: readonly string[] = [
  'name',
  'base',
  'plural',
  'description',
  'properties',
  'options',
  'hidden',
  'protected',
  'relations',
  'acls',
  'methods',
  'mixins',
  'indexes',
  'scopes',
  'http',
  'remoting',
  'replaceOnPUT',
  'excludeBaseProperties',
  'trackChanges',
  'forceId',
  'idInjection',
  'strict',
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
