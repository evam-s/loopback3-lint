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
    const doc = await open('broken/common/models/order.json');
    const found = lb3(doc.uri);
    assert.ok(found.length > 0, 'expected diagnostics on the broken fixture');
    assert.ok(found.some((d) => d.code === 'lb3/unknown-base-model'));
  });

  test('publishes nothing for the clean model file', async () => {
    const doc = await open('clean/common/models/order.json');
    assert.deepEqual(lb3(doc.uri), []);
  });

  test('publishes nothing for the Sequelize file', async () => {
    const doc = await open('non-loopback/sequelize-model.js');
    assert.deepEqual(lb3(doc.uri), []);
  });

  test('offers a quick fix carrying the suggested replacement', async () => {
    const doc = await open('broken/common/models/order.json');
    const target = lb3(doc.uri).find((d) => d.code === 'lb3/unknown-base-model');
    assert.ok(target, 'expected the base-model diagnostic');
    const actions = await vscode.commands.executeCommand<vscode.CodeAction[]>(
      'vscode.executeCodeActionProvider', doc.uri, target!.range);
    assert.ok(actions?.some((a) => a.title.includes('PersistedModel')));
  });

  // A test proving diagnostics clear on close was deliberately removed here,
  // not softened. Investigated with both `workbench.action.closeActiveEditor`
  // and `workbench.action.closeAllEditors`, polling `vscode.workspace.textDocuments`
  // for up to 10s after the close: the document never leaves that list (even
  // though `visibleTextEditors` drops to 0 immediately), so
  // `onDidCloseTextDocument` never fires and diagnostics never have a chance
  // to clear. The same non-firing was observed for a listener registered
  // directly by the test, independent of extension.ts's own handler, so this
  // is the test harness holding the document open, not a defect in
  // extension.ts's close handling. Full investigation:
  // .superpowers/sdd/2026-09-09-loopback3-lint/task-11-fix-round-2-report.md
});
