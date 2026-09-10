import * as assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

suite('Bundle', () => {
  test('the built bundle loads without unresolved requires', () => {
    // Regression guard: jsonc-parser's UMD entry once left a runtime
    // require("./impl/format") in the bundle, crashing activation while
    // every unit test passed. Only loading the built artifact catches it.
    const bundle = resolve(__dirname, '..', '..', '..', 'dist', 'extension.js');
    assert.ok(existsSync(bundle), 'dist/extension.js must exist');
    assert.doesNotThrow(() => require(bundle));
  });
});
