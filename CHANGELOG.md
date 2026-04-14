# Changelog

## 0.9.91 - 2026-04-14

Bugfixes from the 0.9.90 release:

- Fix `on resize from window` / `on resize from document` — non-Element targets now fall through to the native `resize` event instead of using a `ResizeObserver`
- The toggle commands `for <duration>` modifier no longer consumes a following for-in loop
- Fix `${}` template expressions hanging the playground iframe due to leftover debug logging
- Fix `npx hyperscript.org --validate` (and the `bun`/`deno` platform scripts) crashing with `ERR_MODULE_NOT_FOUND`. (#667)

## 0.9.90 - 2026-04-13

Hoooooo doggie, it's been a year of on and off work, and we finally had some time to focus on hyperscript!

This is a *major* change/upgrade, including restructuring the entire codebase to be much more understandable by my students
as well as anyone else interested in the langauge.

Here we go...

### Breaking Changes

- Extensions moved to `dist/ext/` - `dist/hdb.js` → `dist/ext/hdb.js`, same for socket, template, worker, eventsource, tailwind
- `dist/_hyperscript.js` is now IIFE (was UMD) - still works with plain `<script>` tags, no change needed for most users
- ESM available as `dist/_hyperscript.esm.js` - use this for `import` statements
- `processNode()` deprecated - use `process()` instead (alias still works)
- `as JSON` is now `JSON.parse` - replace `as JSON` with `as JSONString` if you were using it to stringify
- `Values:JSON` and `Values:Form` removed - use `as Values | JSONString` and `as Values | FormEncoded`
- `default` uses nullish check instead of truthy - no longer overwrites `0` and `false`
- `go to url ...` deprecated - use `go to /path` or `go to "url"` instead
- `go to the top of ...` scroll form deprecated - use `scroll to the top of ...` instead
- `async` keyword removed - had opposite meaning from JavaScript's `async`, was confusing
- `/* */` block comments removed - enables patterns like `/api/*` in expressions; use `--` or `//` line comments instead
- `transition` requires `*` style refs - `transition width` → `transition *width`; `transition element #foo` → `transition #foo's`
- `fetch` throws on non-2xx responses by default - add `do not throw` or use `as Response` to restore old behavior
- `[@attr]` bracket-style attribute access deprecated - use `@attr` instead

### New Features

- A new reactivity system by @scriptogre! `live`, `when ... changes`, `bind` features for automatic dependency tracking and UI updates
- Reworked templates now in core by @iforgotmylogin - `render` command with `<template>` elements, `${}` interpolation, `#for`/`#if`/`#else`/`#end` control flow
- `morph` command by @Latent22 - DOM morphing (idiomorph-based) that preserves focus, scroll, form state
- A new components system - custom elements with reactive templates, slots, and scope isolation via `<template component="name">`
- DOM-scoped variables (`^name`) - scoped to the element, inherited by descendants
- `open` / `close` commands - dialogs, details, popovers, fullscreen
- `focus` / `blur` commands - set or remove keyboard focus
- `empty` / `clear` command - smart clearing of elements, inputs, forms, arrays, sets, maps
- `reset` command - restore form or input to its default value
- `swap` command - exchange values of two assignable expressions
- `select` command - select text content of inputs/textareas
- `ask` / `answer` commands - prompt(), alert(), confirm() wrappers
- `speak` command - text-to-speech via Web Speech API
- `breakpoint` command in core - pauses in browser DevTools without needing hdb extension
- `toggle between` attributes - `toggle between [@data-state='active'] and [@data-state='inactive']`
- `toggle <target> between <val1>, <val2> and <valN>` - cycle any writable value through N values: `toggle *display of #panel between 'none' and 'flex'`, `toggle $mode between 'edit', 'preview' and 'publish'`
- Collection expressions for sorting, filtering, etc - `where`, `sorted by`, `mapped to`, `split by`, `joined by`
- `clipboard` and `selection` magic symbols
- `on resize` synthetic event (via ResizeObserver)
- `on first click` modifier - fires event handler only once
- `view transition` command - wrap DOM updates in the View Transitions API
- `intercept` feature - service worker DSL for caching strategies and offline support
- `--validate` CLI tool - `npx hyperscript.org --validate` scans HTML files for parse errors
- `hyperscript-max` bundle - `dist/_hyperscript-max.js` includes core + all extensions in a single file
- htmx 4 support - listens for `htmx:after:process` event in addition to `htmx:load`
  - htmx 4 morph swap support - `process()` detects when `_=` attribute changed (via script hash) and reinitializes automatically
- `cleanup()` API - `_hyperscript.cleanup(elt)` removes all event listeners, disconnects observers, clears timers, recursively cleans children. Called automatically before reinitialization.
- htmx inspired lifecycle events - `hyperscript:before:init`, `hyperscript:after:init`, `hyperscript:before:cleanup`, `hyperscript:after:cleanup` fired per element. `before:init` is cancelable via `preventDefault()`.
- htmx inspired `data-hyperscript-powered` attribute - set on all initialized elements for fast querying and morph compatibility
- htmx inspired `config.logAll` - when `true`, logs all hyperscript events to console (matches htmx's `logAll`)
- Pipe operator for conversions - chain with `|`: `#myForm as Values | JSONString`
- `as JSON` parses a JSON string, `as JSONString` stringifies, `as FormEncoded` URL-encodes
- `when` clause on `remove` and `hide` commands (async-safe, matching `add`/`show`)
- `scroll to` command for scrolling elements into view (replaces scroll form of `go`)
- `repeat ... until x end` and `repeat ... while x end` bottom-tested loops
- `ignoring case` modifier on comparisons
- `between` comparison - `if x is between 1 and 10`
- `starts with` / `ends with` comparisons
- `put null into @attr` removes the attribute
- DOM expressions (`#id`, `.class`, `<query/>`) are writable via `.replaceWith()`
- `set` supports array concatenation - `set arr to arr + [1, 2]`
- Short-circuit evaluation for `and`/`or` with proper async promise handling
- `llms-full.txt` - LLM-friendly documentation endpoint at `/llms-full.txt`
- Platform scripts - `node-hyperscript.js`, `deno-hyperscript.js`, `bun-hyperscript.js` for running `.hs` files outside the browser

### Internal

- Complete ESM rewrite of all source files (45 modules)
- Runtime split into focused modules (runtime, collections, conversions, cookies)
- Removed IE/legacy browser compatibility code
- Test suite migrated to Playwright (~9s, from ~250s with old runner), 1332 tests
- IIFE + ESM dual builds with minified + brotli variants for core and all extensions

### Bug Fixes

- Fixed `AttributeRef` not stripping single-quoted values
- Fixed `ElementCollection.id` getter calling `className` as a method
- Fixed silent failure when command doesn't return next element - now throws instead of logging and returning undefined
- Fixed `add`, `remove`, `toggle` not working with ElementCollections as targets
- Fixed `repeat` erroring on `undefined` iterator (now skips gracefully)

---

## 0.9.14 - 2025-02-01

- Short-circuit evaluation for `and`/`or` expressions
- `append` command handles DOM elements properly
- Support tilde (`~`) in query selectors
- Support `$=` selectors
- Support escaping in class literals (Tailwind compatibility)
- Negative numbers work with postfix units (`-10px`)

## 0.9.13 - 2024-10-20

- Maintenance release

## 0.9.12 - 2023-10-20

- `take` command supports multiple class literals
- Hex escape support in strings
- Fixed socket message context scoping
- Fixed `go` command scroll offset handling

## 0.9.11 - 2023-08-04

- Maintenance release

## 0.9.10 - 2023-08-04

- Maintenance release

## 0.9.9 - 2023-06-30

- Expanded comparison operators (`is equal to`, `is really equal to`, etc.)
- Cookie API improvements
- Attribute support for `take` command
- Fixed `send` command to use implicit loop

## 0.9.8 - 2023-03-02

- Maintenance release

## 0.9.7 - 2022-07-18

- Improved comment ergonomics (multi-line `-- ... --` comments)
- Null-safe `on` targets

## 0.9.6 - 2022-07-12

- `pick` command for extracting items, characters, and regex matches
- Missing.css integration for documentation site

## 0.9.5 - 2022-02-22

- `beep!` debugging tool
- `when` clause for `add` command
- `Values:JSON` and `Values:Form` conversions
- Fixed `closest` to work with arrays

## 0.9.4 - 2022-01-14

- Prism syntax highlighting theme

## 0.9.3 - 2021-12-25

- Bug fix release

## 0.9.2 - 2021-12-25

- Bug fix release

## 0.9.1 - 2021-11-28

- `otherwise` as alias for `else`
- Global scope requires explicit declaration
- Error message for `return` without value

## 0.8.0 - 2021-06-13

- `halt` command
- Class and ID template literals (`.${expr}`, `#${expr}`)
- Query literal element interpolation
- String event names
- Assignable expressions
