import type { Finding } from '../types';
import type { ObjLike } from '../adapters';
import { suggest, levenshtein } from '../util/nearMiss';
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

function suggestPropertyType(token: string): string | undefined {
  const near = suggest(token.toLowerCase(), PROPERTY_TYPES_LOWER);
  if (!near) return undefined;
  return PROPERTY_TYPES[PROPERTY_TYPES_LOWER.indexOf(near)];
}

// nearMiss.suggest() caps its edit-distance threshold at 2 for any token six
// characters or longer (see util/nearMiss.ts and its test suite, which pins
// that cap). That cap was tuned against short filter-operator tokens like
// 'regexp' and 'between'. BUILTIN_MODELS entries are longer compound class
// names, and a realistic misspelling of one can land a third edit away --
// 'PersistantModel' is 3 edits from 'PersistedModel' (two substitutions plus
// an insertion), not 2. Rather than loosen the shared nearMiss threshold
// (which would affect every other rule using it, including short tokens
// where a 3-edit "near miss" would be a real false alarm), base-model
// matching gets its own threshold that scales one step further for long
// tokens, continuing nearMiss's own progression (1 below 6 chars, 2 from 6
// to 11) with a third tier (3 from 12 chars up).
function suggestBaseModel(token: string): string | undefined {
  if (BUILTIN_MODELS.includes(token)) return undefined;
  const lower = token.toLowerCase();
  for (const c of BUILTIN_MODELS) {
    if (c.toLowerCase() === lower) return c;
  }
  const threshold = token.length < 6 ? 1 : token.length < 12 ? 2 : 3;
  let best: string | undefined;
  let bestDistance = Infinity;
  for (const c of BUILTIN_MODELS) {
    const d = levenshtein(token, c);
    if (d <= threshold && d < bestDistance) {
      best = c;
      bestDistance = d;
    }
  }
  return best;
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
      const near = suggestBaseModel(value.stringValue!);
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
