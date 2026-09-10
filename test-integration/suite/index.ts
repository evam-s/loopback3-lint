import { resolve } from 'node:path';
import { globSync } from 'glob';
import Mocha from 'mocha';

export function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'tdd', color: true, timeout: 20000 });
  const testsRoot = __dirname;
  for (const file of globSync('**/*.test.js', { cwd: testsRoot })) {
    mocha.addFile(resolve(testsRoot, file));
  }
  return new Promise((res, rej) => {
    mocha.run((failures) => (failures ? rej(new Error(`${failures} test(s) failed`)) : res()));
  });
}
