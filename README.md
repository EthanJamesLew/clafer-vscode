# ClaferLang

**ClaferLang** is a VS Code extension that adds syntax highlighting, error-checking, and convenient commands for [Clafer](https://github.com/gsdlab/clafer) files (`.cfr`). It helps you write Clafer models faster by highlighting syntax and automatically running the `clafer` compiler to detect errors.

---

## Features

- **Syntax highlighting** for `.cfr` files based on a TextMate grammar.
- **Automatic error detection**: When you save or edit a `.cfr` file, the extension runs `clafer` in the background and underlines errors in your code (line and column).
- **Line/column diagnostics**: If Clafer reports something like `Parse failed at line X column Y`, you’ll see underlined text and a hover message in VS Code.
- **Comment and string highlighting**, plus recognized keywords for Clafer’s cardinalities and operators.

---

## Installation

### 1. Download the `.vsix` from Releases

1. **Go to the [Releases page](./releases)** of this repository.  
2. **Download** the latest `.vsix` file (e.g. `claferlang-0.0.1.vsix`).  

### 2. Install the `.vsix` in VS Code

1. Open VS Code.  
2. Press `Ctrl + Shift + P` (Windows/Linux) or `Cmd + Shift + P` (macOS) to open the Command Palette.  
3. Type **Extensions: Install from VSIX...** and select the downloaded `.vsix` file.  
4. Once installed, VS Code will prompt you to **reload** the window—do so to activate the extension.

---

## Usage

1. **Open** any Clafer file (`.cfr`).  
2. The extension will automatically enable syntax highlighting.  
3. **Save** or **edit** your `.cfr` file—on each change or save, the extension runs `clafer` behind the scenes to check for errors.  
4. If errors are found, they’re **underlined**, and you’ll see a message in the **Problems** panel.

> **Tip**: You can also manually trigger the command **Claferlang: Run Clafer** from the Command Palette to force a check.

---

## Requirements

1. **Clafer must be installed as a system-wide binary** and on your `PATH`.  
   - Download or build Clafer from [github.com/gsdlab/clafer](https://github.com/gsdlab/clafer).  
   - Ensure you can run `clafer --version` successfully in your terminal or Command Prompt.  
   - If the extension can’t find `clafer`, it will display a warning message and skip error checking.  

2. **VS Code** v1.40.0 or later (recommended).

---

## Contributing

We welcome contributions! Feel free to open issues or submit pull requests to improve the syntax highlighting, error parsing, or additional features related to the Clafer modeling language.

---
