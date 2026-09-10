import * as assert from 'node:assert/strict';
import { resolve } from 'node:path';
import * as vscode from 'vscode';

const FIXTURES = resolve(__dirname, '..', '..', '..', 'test', 'fixtures');

async function open(relativePath: string): Promise<vscode.TextDocument> {
  const doc = await vscode.workspace.openTextDocument(resolve(FIXTURES, relativePath));
  await vscode.window.showTextDocument(doc);
  // Diagnostics are published asynchronously after the open event.
  await new Promise((r) => setTimeout(r, 1500));
  return doc;
}

const lb3 = (uri: vscode.Uri) =>
  vscode.languages.getDiagnostics(uri).filter((d) => d.source === 'lb3lint');

suite('LoopBack 3 Lint integration', () => {
  test('publishes diagnostics for a broken model file', async () => {
    const doc = await open('broken/order.json');
    const found = lb3(doc.uri);
    assert.ok(found.length > 0, 'expected diagnostics on the broken fixture');
    assert.ok(found.some((d) => d.code === 'lb3/unknown-base-model'));
  });

  test('publishes nothing for the clean model file', async () => {
    const doc = await open('clean/order.json');
    assert.deepEqual(lb3(doc.uri), []);
  });

  test('publishes nothing for the Sequelize file', async () => {
    const doc = await open('non-loopback/sequelize-model.js');
    assert.deepEqual(lb3(doc.uri), []);
  });

  test('offers a quick fix carrying the suggested replacement', async () => {
    const doc = await open('broken/order.json');
    const target = lb3(doc.uri).find((d) => d.code === 'lb3/unknown-base-model');
    assert.ok(target, 'expected the base-model diagnostic');
    const actions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
      'vscode.executeCodeActionProvider', doc.uri, target!.range);
    assert.ok(actions?.some((a) => a.title.includes('PersistedModel')));
  });

  test('clears diagnostics when the document closes', async () => {
    const doc = await open('broken/order.json');
    assert.ok(lb3(doc.uri).length > 0);
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await new Promise((r) => setTimeout(r, 1000));
    assert.deepEqual(lb3(doc.uri), []);
  });
});
