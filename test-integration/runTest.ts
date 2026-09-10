import { resolve } from 'node:path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  const extensionDevelopmentPath = resolve(__dirname, '..', '..');
  const extensionTestsPath = resolve(__dirname, 'suite', 'index');
  const workspace = resolve(extensionDevelopmentPath, 'test', 'fixtures');
  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [workspace, '--disable-extensions'],
  });
}

main().catch((err) => {
  console.error('integration tests failed', err);
  process.exit(1);
});
