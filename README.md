# claferlang

VS Code plugin for [Clafer](https://github.com/gsdlab/clafer). Provides:
- Syntax highlighting for `.cfr` files
- Command to run `clafer` on the current file

## Installation

1. Make sure you have [Clafer](https://github.com/gsdlab/clafer) installed on your system and accessible in your `PATH`.
2. Install this extension in VS Code:
   - Press `F1`, then type `Extensions: Install from VSIX...` or search on the VS Code Marketplace if published.
3. Open any `.cfr` file to see syntax highlighting.
4. Run the command "Run Clafer on Current File" (`claferlang.runClafer`) to compile and see any errors highlighted.

## Usage

- Open a `.cfr` file.  
- Press `Ctrl+Shift+P` (Win/Linux) or `Cmd+Shift+P` (macOS) and select **Run Clafer on Current File**.
- If Clafer finds errors, they will be underlined, and you’ll see a message in the status bar / output pane.

