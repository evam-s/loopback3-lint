import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

test('core never imports vscode', () => {
  const core = join(__dirname, '..', 'src', 'core');
  for (const file of walk(core).filter((f) => f.endsWith('.ts'))) {
    const text = readFileSync(file, 'utf8');
    assert.ok(!/from ['"]vscode['"]|require\(['"]vscode['"]\)/.test(text),
      `${file} imports vscode; core must stay editor-agnostic`);
  }
});
