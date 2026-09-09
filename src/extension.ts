import * as vscode from 'vscode';
import { lintText } from './core/lint';
import { gate } from './core/gate';
import type { Finding, RuleSeverities } from './core/types';

const DEBOUNCE_MS = 500;

let diagnostics: vscode.DiagnosticCollection;
let output: vscode.OutputChannel;
const pending = new Map<string, NodeJS.Timeout>();

function settings() {
  const config = vscode.workspace.getConfiguration('lb3lint');
  return {
    enable: config.get<boolean>('enable', true),
    exclude: config.get<string[]>('exclude', []),
    rules: config.get<RuleSeverities>('rules', {}),
  };
}

function excluded(doc: vscode.TextDocument, patterns: string[]): boolean {
  return patterns.some((p) =>
    vscode.languages.match({ pattern: p }, doc) > 0);
}

function toDiagnostic(doc: vscode.TextDocument, f: Finding): vscode.Diagnostic {
  const range = new vscode.Range(doc.positionAt(f.range.start), doc.positionAt(f.range.end));
  const d = new vscode.Diagnostic(
    range,
    f.message,
    f.severity === 'error'
      ? vscode.DiagnosticSeverity.Error
      : vscode.DiagnosticSeverity.Warning,
  );
  d.source = 'lb3lint';
  d.code = f.ruleId;
  return d;
}

function lint(doc: vscode.TextDocument): void {
  const { enable, exclude, rules } = settings();
  if (!enable || excluded(doc, exclude)) {
    diagnostics.delete(doc.uri);
    return;
  }
  if (doc.languageId !== 'javascript' && doc.languageId !== 'json' && doc.languageId !== 'jsonc') {
    return;
  }

  try {
    const findings = lintText(
      { text: doc.getText(), path: doc.uri.fsPath, languageId: doc.languageId },
      rules,
    );
    diagnostics.set(doc.uri, findings.map((f) => toDiagnostic(doc, f)));
  } catch (err) {
    // One bad file must never break the extension for every other file.
    output.appendLine(`[lb3lint] ${doc.uri.fsPath}: ${String(err)}`);
    diagnostics.delete(doc.uri);
  }
}

function scheduleLint(doc: vscode.TextDocument): void {
  const key = doc.uri.toString();
  const existing = pending.get(key);
  if (existing) clearTimeout(existing);
  pending.set(key, setTimeout(() => {
    pending.delete(key);
    lint(doc);
  }, DEBOUNCE_MS));
}

export function activate(context: vscode.ExtensionContext): void {
  diagnostics = vscode.languages.createDiagnosticCollection('lb3lint');
  output = vscode.window.createOutputChannel('LoopBack 3 Lint');
  context.subscriptions.push(diagnostics, output);

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(lint),
    vscode.workspace.onDidSaveTextDocument(lint),
    vscode.workspace.onDidChangeTextDocument((e) => {
      // Only matters under autosave; an explicit save is handled above.
      if (!e.document.isDirty) scheduleLint(e.document);
    }),
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnostics.delete(doc.uri);
      pending.delete(doc.uri.toString());
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('lb3lint')) {
        vscode.workspace.textDocuments.forEach(lint);
      }
    }),
    vscode.commands.registerCommand('lb3lint.explainDetection', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No active editor.');
        return;
      }
      const doc = editor.document;
      const result = gate({
        text: doc.getText(), path: doc.uri.fsPath, languageId: doc.languageId,
      });
      const detail = result.linted
        ? `Linted as ${result.kind}. Signals: ${result.signals.join('; ')}.`
        : `Not linted. ${result.reason}` +
          (result.signals.length ? ` Partial signals: ${result.signals.join('; ')}.` : '');
      output.appendLine(`[lb3lint] ${doc.uri.fsPath}\n  ${detail}`);
      output.show(true);
    }),
  );

  vscode.workspace.textDocuments.forEach(lint);
}

export function deactivate(): void {
  for (const timer of pending.values()) clearTimeout(timer);
  pending.clear();
}
