import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as path from 'path';

let diagnosticCollection: vscode.DiagnosticCollection;
let runClaferTimeout: NodeJS.Timeout | undefined;

/**
 * Called by VS Code upon extension activation
 */
export function activate(context: vscode.ExtensionContext) {
    diagnosticCollection = vscode.languages.createDiagnosticCollection('clafer');
    context.subscriptions.push(diagnosticCollection);

    // For example, run on save or use a command, etc.
    vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.languageId === 'clafer') {
            runClaferOn(doc);
        }
    }, null, context.subscriptions);
}

/**
 * Example function to run Clafer on a document and parse `stdout` for errors
 */
function runClaferOn(document: vscode.TextDocument) {
    diagnosticCollection.clear();
    
    const filePath = document.fileName;
    // IMPORTANT: We parse errors from stdout, so we ignore stderr below.
    const cmd = `clafer "${filePath}"`;

    cp.exec(cmd, (error, stdout, stderr) => {
        // If the 'clafer' command isn’t found, handle that gracefully
        if (error && !stdout) {
            // Possibly Clafer not installed or not in PATH
            vscode.window.showErrorMessage(
                `Could not run Clafer: ${error.message || 'Unknown error'}`
            );
            return;
        }
        
        // Parse the standard output
        const diagnostics = parseClaferOutput(stdout, document);
        diagnosticCollection.set(document.uri, diagnostics);

        // If nothing matched, show an info message
        if (diagnostics.length === 0) {
            vscode.window.showInformationMessage("Clafer finished (no diagnostics).");
        }
    });
}

/**
 * Parse stdout lines for errors of these forms:
 *
 *  1)  "Parse failed at line 15 column 2..."
 *      or "Compile error at line 15 column 2..."
 *      (we do have column info)
 *
 *  2)  "syntax error at line 15 before dfjsjlk ..."
 *      (no column info, so we default column 0)
 */
function parseClaferOutput(stdout: string, document: vscode.TextDocument): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // 1) For lines like: "Parse failed at line 15 column 2..."
    //                    "Compile error at line 20 column 5..."
    //    We'll allow for 2 or 3 dots at the end, so we do `\.\.\.?`
    const mainPattern = /(Parse failed|Compile error) at line (\d+) column (\d+)\.\.\.?/g;

    // 2) For lines like: "syntax error at line 15 before dfjsjlk..."
    //    We'll capture the line number only; column is unknown, default = 0
    //    You can refine if Clafer sometimes prints a column number.
    const syntaxPattern = /syntax error at line (\d+) before (.*)/g;

    let match: RegExpExecArray | null;

    // -- Pattern A: "Parse failed..." or "Compile error..."
    while ((match = mainPattern.exec(stdout)) !== null) {
        // match[1]: "Parse failed" or "Compile error"
        // match[2]: line number
        // match[3]: column number
        const lineNum = parseInt(match[2], 10) - 1;  // convert 1-based to 0-based
        const colNum  = parseInt(match[3], 10) - 1;  
        const message = match[0]; // full matched text, or build your own

        // Create a safe range (in case line/col is out of bounds)
        const range = makeRangeSafe(document, lineNum, colNum);
        const diagnostic = new vscode.Diagnostic(
            range,
            message,
            vscode.DiagnosticSeverity.Error
        );
        diagnostics.push(diagnostic);
    }

    // -- Pattern B: "syntax error at line 15 before..."
    while ((match = syntaxPattern.exec(stdout)) !== null) {
        // match[1]: line number
        // match[2]: text after "before"
        const lineNum = parseInt(match[1], 10) - 1;
        // No column given, so default to 0
        const colNum = 0;

        const message = match[0]; // the entire matched line
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
 * Make sure line/column is valid for the document. 
 * If not, clamp to the nearest valid line/column.
 */
function makeRangeSafe(document: vscode.TextDocument, lineNum: number, colNum: number): vscode.Range {
    const maxLine = document.lineCount - 1;
    const safeLine = Math.max(0, Math.min(lineNum, maxLine));

    const textLine = document.lineAt(safeLine);
    const maxCol = textLine.text.length;
    const safeCol = Math.max(0, Math.min(colNum, maxCol));

    // We highlight from colNum to end of line
    return new vscode.Range(safeLine, safeCol, safeLine, maxCol);
}

export function deactivate() {
    diagnosticCollection.dispose();
}
