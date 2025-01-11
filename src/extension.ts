import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

let diagnosticCollection: vscode.DiagnosticCollection;
let runClaferTimeout: NodeJS.Timeout | undefined;
let claferInstalled = false;

/**
 * Called by VS Code upon extension activation
 */
export async function activate(context: vscode.ExtensionContext) {
    // 1) Create the diagnostic collection
    diagnosticCollection = vscode.languages.createDiagnosticCollection('clafer');
    context.subscriptions.push(diagnosticCollection);

    // 2) Check if Clafer is installed (only once)
    claferInstalled = await checkClaferInstalled();
    if (!claferInstalled) {
        vscode.window.showWarningMessage(
            "Clafer is not installed or not found on your PATH. " +
            "This extension will not be able to compile .cfr files until you install Clafer."
        );
    }

    // 3) Register a manual command to run Clafer
    const runClaferCommand = vscode.commands.registerCommand('claferlang.runClafer', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const document = editor.document;
        if (document.languageId === 'clafer') {
            runClaferOn(document);
        } else {
            vscode.window.showErrorMessage('Active editor is not a .cfr file.');
        }
    });
    context.subscriptions.push(runClaferCommand);

    // 4) Automatically run Clafer on save
    vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.languageId === 'clafer') {
            runClaferOn(doc);
        }
    }, null, context.subscriptions);
}

/**
 * Check if `clafer` is available by running `clafer --version`.
 * Returns `true` if installed, otherwise `false`.
 */
async function checkClaferInstalled(): Promise<boolean> {
    return new Promise((resolve) => {
        cp.exec('clafer --version', (error, stdout, stderr) => {
            if (error) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * Runs 'clafer' on the given document and collects any errors from stdout
 */
function runClaferOn(document: vscode.TextDocument) {
    // If Clafer isn’t installed, skip running it (don’t pester user again).
    if (!claferInstalled) {
        return;
    }

    // Clear old diagnostics first
    diagnosticCollection.clear();
    
    const filePath = document.fileName;
    // We'll parse errors from stdout
    const cmd = `clafer "${filePath}"`;

    cp.exec(cmd, (error, stdout, stderr) => {
        // If the 'clafer' command isn’t found or other system error
        if (error && !stdout) {
            vscode.window.showErrorMessage(
                `Could not run Clafer: ${error.message || 'Unknown error'}`
            );
            return;
        }

        // Parse Clafer's standard output to collect errors
        const diagnostics = parseClaferOutput(stdout, document);
        diagnosticCollection.set(document.uri, diagnostics);

        if (diagnostics.length === 0) {
            vscode.window.showInformationMessage("Clafer finished (no diagnostics).");
        }
    });
}

/**
 * Parse stdout lines for errors of these forms:
 *
 *  1) "Parse failed at line 15 column 2..."
 *     or "Compile error at line 15 column 2..."
 *  2) "syntax error at line 15 before dfjsjlk ..."
 */
function parseClaferOutput(stdout: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Pattern A: "Parse failed at line X column Y..." or "Compile error at line X column Y..."
    // We'll allow 2 or 3 dots: `\.\.\.?`
    const mainPattern = /(Parse failed|Compile error) at line (\d+) column (\d+)\.\.\.?/g;

    // Pattern B: "syntax error at line X before <stuff>"
    // No column info, so we default col = 0
    const syntaxPattern = /syntax error at line (\d+) before (.*)/g;

    let match: RegExpExecArray | null;

    // -- Pattern A
    while ((match = mainPattern.exec(stdout)) !== null) {
        const lineNum = parseInt(match[2], 10) - 1;  // 1-based -> 0-based
        const colNum  = parseInt(match[3], 10) - 1;
        const message = match[0];

        const range = makeRangeSafe(document, lineNum, colNum);
        diagnostics.push(new vscode.Diagnostic(
            range,
            message,
            vscode.DiagnosticSeverity.Error
        ));
    }

    // -- Pattern B
    while ((match = syntaxPattern.exec(stdout)) !== null) {
        const lineNum = parseInt(match[1], 10) - 1; 
        const colNum = 0; // No column provided
        const message = match[0];

        const range = makeRangeSafe(document, lineNum, colNum);
        diagnostics.push(new vscode.Diagnostic(
            range,
            message,
            vscode.DiagnosticSeverity.Error
        ));
    }

    return diagnostics;
}

/**
 * Clamp line/column to valid ranges, preventing out-of-bounds errors
 */
function makeRangeSafe(document: vscode.TextDocument, lineNum: number, colNum: number): vscode.Range {
    const maxLine = document.lineCount - 1;
    const safeLine = Math.max(0, Math.min(lineNum, maxLine));

    const textLine = document.lineAt(safeLine);
    const maxCol = textLine.text.length;
    const safeCol = Math.max(0, Math.min(colNum, maxCol));

    return new vscode.Range(safeLine, safeCol, safeLine, maxCol);
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
    diagnosticCollection.dispose();
    if (runClaferTimeout) {
        clearTimeout(runClaferTimeout);
    }
}
