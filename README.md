# LoopBack 3 Lint

LoopBack 3 accepts a lot of malformed input without complaining. A misspelled
hook name is not called, an unknown property attribute is dropped, an ACL
entry with a typo'd role is never enforced — and the app boots and runs as if
nothing were wrong. This extension flags those mistakes in the file you have
open, as you edit it.

## What it catches

**A hook that never runs, and never says so.** LoopBack 3's operation hooks
are `'access'`, `'before save'`, `'after save'`, `'before delete'`,
`'after delete'`, `'loaded'`, and `'persist'` — space-separated, lowercase.
Anything close to one of those but not exact is silently registered and
silently never called:

```js
Order.observe('beforeSave', fn);   // never fires — LoopBack 3 wants 'before save'
```

**Another framework's query vocabulary.** `$gt`, `select`, and `sort` all
mean something in Mongo or Mongoose. In a LoopBack 3 filter they mean
nothing, so the fields are ignored and the query runs as if you never wrote
them:

```js
Order.find({
  where: { total: { $gt: 100 } },  // MongoDB. LoopBack 3 uses gt, no $
  select: ['id'],                  // Mongoose. LoopBack 3 uses fields
  sort: 'total DESC',              // MongoDB. LoopBack 3 uses order
});
```

**Config keys that are silently ignored.** None of the four mistakes below
raise an error at boot. The model loads with a base class that doesn't
exist, a `required` constraint that isn't required, a relation that
juggler doesn't recognize, and an ACL rule that never matches an access
type:

```json
{
  "base": "PersistantModel",
  "properties": { "total": { "type": "number", "requred": true } },
  "relations": { "customer": { "type": "belongsto", "model": "Customer" } },
  "acl": [{ "accessType": "REED", "principalType": "ROLE", "permission": "ALOW" }]
}
```

Each finding names the rule, points at the exact token, and — where a close
match exists in the real vocabulary — suggests the fix as a quick action.

## What it does not do

It reads only the file you have open. It does not index your project, so it
will never tell you that a relation points at a model you never defined, or
trace a config value across files.

It stays quiet when it is not sure. An unfamiliar connector name, a custom
base model, an operation hook registered by a connector rather than core —
all left alone. A linter that flags valid code is worse than no linter, so
every rule here only fires on a *near miss* of real LoopBack 3 vocabulary,
never on the mere fact that something is unrecognized.

## Settings

| Setting | Default | Purpose |
|---|---|---|
| `lb3lint.enable` | `true` | Turn the extension off |
| `lb3lint.exclude` | `[]` | Glob patterns for files that are never linted |
| `lb3lint.rules` | `{}` | Per-rule severity, keyed by rule id: `"error"`, `"warn"`, `"off"` |

Run **LoopBack 3 Lint: Explain detection for this file** from the command
palette to see why a file is — or is not — being linted.

## Turning off a noisy rule

Every diagnostic carries its rule id — `lb3/unknown-connector`, and so on —
shown alongside the message. Any single rule can be silenced without
disabling the extension:

```json
"lb3lint.rules": {
  "lb3/unknown-connector": "off"
}
```

## Status

**Preview.** The rules are covered by a fixture suite and by integration
tests that run the extension inside a real VS Code instance, but it has not
yet been exercised against a large production LoopBack 3 codebase. The risk
is not that it breaks — it is that a dictionary has a gap and the extension
is noisier than it should be on code that is perfectly correct.

If you get a warning on valid LoopBack 3 code, that is a bug, and the most
useful kind to report. Please
[open an issue](https://github.com/evam-s/loopback3-lint/issues) with the
rule id from the message and the snippet it flagged. Mute that rule as shown
above in the meantime.

LoopBack 3 reached end of life in December 2020; LoopBack 4 is its
successor. This extension exists for the applications still running on
LoopBack 3 that have not migrated.
