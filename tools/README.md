# Hyperscript Tools

This is a directory for tools related to the hyperscript language:

* VS Code extension
* JetBrains plugin (IntelliJ, WebStorm, PyCharm, etc.)
* LSP server (works with any LSP-capable editor)

Unlike the core codebase, this codebase allows aggressive vibe coding because maintaining tools is a difficult and
thankless task, with each vendor having its own specialized APIs

## Overall Architecture

That said, all tools should follow a common pattern:

* Each tool should use the hyperscript javascript parser(s) itself to parse code
  * e.g. for the JetBrains plugin we use GraalVM to host the parser
  * The LSP server loads the parser directly in a Node.js VM
* Common functionality should be hosted in the `/common` directory
  * As much as possible, code should be shared across tools in this directory
* Generally the simplest possible approach should be used, only use complicated solutions if absolutely necessary
* The tools should embed a version of the IIFE version of hyperscript to use in the host javascript implementation
* Every tool should support a .hsrc file in the root of the project directory that allows a user to point at a different
  implementation of hyperscript than the one embedded in the tool.   This should work without issue.
* Tools should be designed for maximum compatibility and not use the latest and greatest APIs if that means only some people can use them

## Shared Code (`common/`)

| File | Purpose |
|------|---------|
| `_hyperscript.iife.js` | Bundled parser (rebuild with `just build-iife`) |
| `browser-stubs.js` | Browser API stubs for non-browser environments |
| `tree-walker.js` | Parse tree walker with FailedCommand/FailedFeature support |
| `completions.js` | Context-sensitive completion logic |
| `hover.js` | Hover documentation lookup |
| `docs.json` | 79 documentation entries from www/ |
| `hyperscript.tmLanguage.json` | TextMate grammar (VS Code, Sublime, etc.) |
| `hyperscript-injection.tmLanguage.json` | TextMate injection grammar for HTML |
| `hyperscript.vim` | Vim/Neovim syntax highlighting |

## Build Commands

Install [just](https://github.com/casey/just) and run from the `tools/` directory:

```sh
just build-iife       # Rebuild the shared IIFE from src/
just install          # Install all tool dependencies
just test-lsp         # Test LSP server modules
just test-jetbrains   # Run JetBrains plugin tests
just run-jetbrains    # Launch JetBrains sandbox IDE
just run-vscode       # Launch VS Code with extension
```

## Editor Setup

### VS Code

Install the extension from `tools/vscode/` (marketplace publishing coming soon), or for development:

```sh
just run-vscode
```

Features: syntax highlighting, parse-error diagnostics, context-sensitive completions, hover docs, go-to-definition for `#id` references.

### JetBrains (IntelliJ, WebStorm, PyCharm)

Build and install the plugin from `tools/jetbrains/`, or for development:

```sh
just run-jetbrains
```

Same features as VS Code plus `Cmd-B` navigation for `#id` references.

### Neovim

1. Copy `common/hyperscript.vim` to your Neovim syntax directory:
   ```sh
   cp tools/common/hyperscript.vim ~/.config/nvim/syntax/hyperscript.vim
   ```

2. Add LSP configuration (using `nvim-lspconfig` or manual setup):
   ```lua
   vim.api.nvim_create_autocmd('FileType', {
     pattern = 'html',
     callback = function()
       vim.lsp.start({
         name = 'hyperscript',
         cmd = { 'node', '/path/to/_hyperscript/tools/lsp/server.js' },
         root_dir = vim.fs.dirname(vim.fs.find({ '.hsrc', '.git' }, { upward = true })[1]),
       })
     end,
   })
   ```

Features: diagnostics, completions, hover docs, go-to-definition (via LSP).

### Vim

Copy `common/hyperscript.vim` to `~/.vim/syntax/hyperscript.vim` for standalone `.hs` file highlighting.

### Sublime Text

Copy `common/hyperscript.tmLanguage.json` to your Sublime packages directory for syntax highlighting.

### Other Editors

Any editor that supports LSP can use the hyperscript language server:

```sh
node /path/to/_hyperscript/tools/lsp/server.js
```

The server communicates over stdio and supports: diagnostics, completions (trigger on `#`), hover, and go-to-definition.
