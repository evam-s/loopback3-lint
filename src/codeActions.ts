import * as vscode from 'vscode';
import { lintText } from './core/lint';
import type { RuleSeverities } from './core/types';

class Lb3QuickFix implements vscode.CodeActionProvider {
  static readonly kinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const ours = context.diagnostics.filter((d) => d.source === 'lb3lint');
    if (ours.length === 0) return [];

    // Suggestions are recovered by re-linting, not by reading a property off
    // the Diagnostic: VS Code guarantees `code` and `range` survive its
    // marshalling, and nothing else. This runs only when the user opens the
    // lightbulb, on a file already in memory.
    const rules = vscode.workspace
      .getConfiguration('lb3lint')
      .get<RuleSeverities>('rules', {});
    const findings = lintText(
      {
        text: document.getText(),
        path: document.uri.fsPath,
        languageId: document.languageId,
      },
      rules,
    );

    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of ours) {
      const start = document.offsetAt(diagnostic.range.start);
      const end = document.offsetAt(diagnostic.range.end);
      const match = findings.find(
        (f) =>
          f.ruleId === diagnostic.code &&
          f.range.start === start &&
          f.range.end === end,
      );
      const suggestion = match?.suggestion;
      if (suggestion === undefined) continue;

      const existing = document.getText(diagnostic.range);
      // Preserve the quoting of whatever we are replacing: a JSON key comes
      // through as "requred" including its quotes, a JS identifier does not.
      const quote = existing.startsWith('"') ? '"' : existing.startsWith("'") ? "'" : '';
      const replacement = `${quote}${suggestion}${quote}`;

      const action = new vscode.CodeAction(
        `Replace with ${replacement}`,
        vscode.CodeActionKind.QuickFix,
      );
      action.edit = new vscode.WorkspaceEdit();
      action.edit.replace(document.uri, diagnostic.range, replacement);
      action.diagnostics = [diagnostic];
      action.isPreferred = true;
      actions.push(action);
    }

    return actions;
  }
}

export function registerCodeActions(context: vscode.ExtensionContext): void {
  for (const language of ['javascript', 'json', 'jsonc']) {
    context.subscriptions.push(
      vscode.languages.registerCodeActionsProvider(
        { language, scheme: 'file' },
        new Lb3QuickFix(),
        { providedCodeActionKinds: Lb3QuickFix.kinds },
      ),
    );
  }
}
