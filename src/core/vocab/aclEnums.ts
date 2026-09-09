// Derived from loopback@3.28.0
//   lib/access-context.js:99-111  AccessContext.{ALL,READ,REPLICATE,WRITE,
//     EXECUTE,DEFAULT,ALLOW,ALARM,AUDIT,DENY} constants
//   lib/access-context.js:113-119 AccessContext.permissionOrder
//   lib/access-context.js:289-292 Principal.{USER,APP,APPLICATION,ROLE,SCOPE}
//   common/models/acl.js           usage of the above in ACL resolution logic
// Cross-checked against loopback.io/doc/en/lb3/Controlling-data-access.html
// on 2026-09-09.
//
// The official doc page lists only READ/WRITE/EXECUTE for accessType and
// only USER/APP/ROLE for principalType. The source shows two more real
// values in each case that the doc omits:
//   - accessType 'REPLICATE': AccessContext.REPLICATE, and acl.js's EXECUTE
//     and WRITE fallthrough cases explicitly match REPLICATE.
//   - accessType '*' (AccessContext.ALL): the wildcard used when accessType
//     is unset.
//   - principalType 'SCOPE': Principal.SCOPE, for OAuth-scope-based ACLs.
// A dictionary built from the doc page alone would flag valid ACL entries.
//
// Note: `Principal.APP = Principal.APPLICATION = 'APP'` assigns the SAME
// string value ('APP') to both property names -- 'APPLICATION' is never
// itself a valid principalType string, so it is not listed below.
//
// permission values include ALARM and AUDIT in addition to the commonly
// documented ALLOW/DENY; DEFAULT ("not specified") is also a real constant.
export const ACL_ACCESS_TYPES: readonly string[] = ['READ', 'WRITE', 'EXECUTE', 'REPLICATE', '*'];

export const ACL_PRINCIPAL_TYPES: readonly string[] = ['USER', 'APP', 'ROLE', 'SCOPE'];

export const ACL_PERMISSIONS: readonly string[] = ['ALLOW', 'DENY', 'ALARM', 'AUDIT', 'DEFAULT'];
