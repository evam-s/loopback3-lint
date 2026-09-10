import type { Finding } from '../types';
import type { ObjLike } from '../adapters';
import { suggest } from '../util/nearMiss';
import { checkFilter } from './filter';
import { MODEL_TOP_LEVEL_KEYS, PROPERTY_ATTRIBUTE_KEYS } from '../vocab/modelKeys';
import { PROPERTY_TYPES } from '../vocab/propertyTypes';
import { RELATION_TYPES, RELATION_KEYS } from '../vocab/relationTypes';
import { ACL_ACCESS_TYPES, ACL_PRINCIPAL_TYPES, ACL_PERMISSIONS } from '../vocab/aclEnums';
import { BUILTIN_MODELS } from '../vocab/builtinModels';
import { CONNECTOR_NAMESPACES } from '../vocab/datasourceKeys';

// Property type names are matched case-insensitively at runtime
// (lib/model-builder.js: `ModelBuilder.schemaTypes[prop.toLowerCase()]`,
// see vocab/propertyTypes.ts). `suggest()` itself is case-sensitive for
// its Levenshtein pass, so comparing raw casing here would both (a) flag
// perfectly valid lowercase types like "string" as near-misses of
// "String", and (b) fail to catch genuine typos like "stirng" whose
// case-sensitive distance to "String" exceeds the threshold even though
// its distance to "string" does not. Comparing lowercased forms throughout
// and mapping the result back to the canonical casing avoids both.
const PROPERTY_TYPES_LOWER = PROPERTY_TYPES.map((t) => t.toLowerCase());

// LoopBack 3 lets any model name be used as a property type (`{ "type":
// "Order" }` for a belongsTo-style embedded reference), so a short built-in
// name is indistinguishable from an ordinary short model name one edit away
// -- 'Data' is not a typo of 'date', it is a model. A four-letter dictionary
// word cannot be told apart from a four-letter model name, so for property
// types specifically we only offer a near-miss suggestion against candidates
// of six characters or more. This deliberately gives up catching typos of
// the short built-ins (any, json, text, null, date, array); that is the
// safe direction, and is the point.
const PROPERTY_TYPES_FOR_SUGGESTION = PROPERTY_TYPES_LOWER.filter((t) => t.length >= 6);

function suggestPropertyType(token: string): string | undefined {
  const near = suggest(token.toLowerCase(), PROPERTY_TYPES_FOR_SUGGESTION);
  if (!near) return undefined;
  return PROPERTY_TYPES[PROPERTY_TYPES_LOWER.indexOf(near)];
}

export function checkModelJson(root: ObjLike): Finding[] {
  const out: Finding[] = [];

  for (const prop of root.props) {
    const { key, keyRange, value } = prop;

    if (!MODEL_TOP_LEVEL_KEYS.includes(key)) {
      const near = suggest(key, MODEL_TOP_LEVEL_KEYS);
      if (near) {
        out.push({
          ruleId: 'lb3/unknown-model-key',
          message: `'${key}' is not a model definition key. Did you mean '${near}'?`,
          range: keyRange, severity: 'warn', suggestion: near,
        });
      }
    }

    if (key === 'base' && value.kind === 'string') {
      const near = suggest(value.stringValue!, BUILTIN_MODELS);
      if (near) {
        out.push({
          ruleId: 'lb3/unknown-base-model',
          message: `'${value.stringValue}' is not a built-in model. Did you mean '${near}'?`,
          range: value.range, severity: 'warn', suggestion: near,
        });
      }
    }

    if (key === 'properties' && value.object) checkProperties(value.object, out);
    if (key === 'relations' && value.object) checkRelations(value.object, out);
    if ((key === 'acls' || key === 'acl') && value.items) checkAcls(value.items, out);
    if (key === 'scope' && value.object) out.push(...checkFilter(value.object));
    if (key === 'scopes' && value.object) {
      for (const scope of value.object.props) {
        if (scope.value.object) out.push(...checkFilter(scope.value.object));
      }
    }
  }

  return out;
}

function checkProperties(properties: ObjLike, out: Finding[]): void {
  for (const property of properties.props) {
    const def = property.value.object;
    if (!def) continue;

    for (const attr of def.props) {
      // Connector-specific blocks are opaque to us and must never be flagged.
      if (CONNECTOR_NAMESPACES.includes(attr.key)) continue;

      if (!PROPERTY_ATTRIBUTE_KEYS.includes(attr.key)) {
        const near = suggest(attr.key, PROPERTY_ATTRIBUTE_KEYS);
        if (near) {
          out.push({
            ruleId: 'lb3/unknown-property-attribute',
            message: `'${attr.key}' is not a property attribute. Did you mean '${near}'?`,
            range: attr.keyRange, severity: 'warn', suggestion: near,
          });
        }
      }

      if (attr.key === 'type' && attr.value.kind === 'string') {
        const near = suggestPropertyType(attr.value.stringValue!);
        if (near) {
          out.push({
            ruleId: 'lb3/unknown-property-type',
            message: `'${attr.value.stringValue}' is not a property type. Did you mean '${near}'?`,
            range: attr.value.range, severity: 'warn', suggestion: near,
          });
        }
      }
    }
  }
}

function checkRelations(relations: ObjLike, out: Finding[]): void {
  for (const relation of relations.props) {
    const def = relation.value.object;
    if (!def) continue;

    for (const field of def.props) {
      if (!RELATION_KEYS.includes(field.key)) {
        const near = suggest(field.key, RELATION_KEYS);
        if (near) {
          out.push({
            ruleId: 'lb3/unknown-relation-key',
            message: `'${field.key}' is not a relation key. Did you mean '${near}'?`,
            range: field.keyRange, severity: 'warn', suggestion: near,
          });
        }
      }

      if (field.key === 'type' && field.value.kind === 'string') {
        const type = field.value.stringValue!;
        if (!RELATION_TYPES.includes(type)) {
          const near = suggest(type, RELATION_TYPES);
          out.push({
            ruleId: 'lb3/invalid-relation-type',
            message: near
              ? `'${type}' is not a relation type. Did you mean '${near}'?`
              : `'${type}' is not a relation type. Valid types are ${RELATION_TYPES.join(', ')}.`,
            range: field.value.range, severity: 'error',
            ...(near ? { suggestion: near } : {}),
          });
        }
      }

      if (field.key === 'scope' && field.value.object) {
        out.push(...checkFilter(field.value.object));
      }
    }
  }
}

function checkAcls(entries: { object?: ObjLike }[], out: Finding[]): void {
  const enums: Record<string, readonly string[]> = {
    accessType: ACL_ACCESS_TYPES,
    principalType: ACL_PRINCIPAL_TYPES,
    permission: ACL_PERMISSIONS,
  };

  for (const entry of entries) {
    for (const field of entry.object?.props ?? []) {
      const allowed = enums[field.key];
      if (!allowed || field.value.kind !== 'string') continue;
      const actual = field.value.stringValue!;
      if (allowed.includes(actual)) continue;
      const near = suggest(actual, allowed);
      out.push({
        ruleId: 'lb3/invalid-acl-value',
        message: `'${actual}' is not a valid ${field.key}. Valid values are ${allowed.join(', ')}.`,
        range: field.value.range, severity: 'error',
        ...(near ? { suggestion: near } : {}),
      });
    }
  }
}
