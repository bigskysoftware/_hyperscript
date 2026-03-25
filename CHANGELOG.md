# Changelog

## 0.9.90 — Unreleased

### Breaking Changes

- Extensions moved to `dist/ext/` — `dist/hdb.js` → `dist/ext/hdb.js`, same for socket, template, worker, eventsource, tailwind
- `dist/_hyperscript.js` is now IIFE (was UMD) — still works with plain `<script>` tags, no change needed for most users
- ESM available as `dist/_hyperscript.esm.js` — use this for `import` statements
- `processNode()` deprecated — use `process()` instead (alias still works)

### New Features

- `breakpoint` command in core — pauses in browser DevTools without needing hdb extension
- `toggle between` attributes — `toggle between [@data-state='active'] and [@data-state='inactive']`
- htmx 4 support — listens for `htmx:after:process` event in addition to `htmx:load`
  - htmx 4 morph swap support — `process()` detects when `_=` attribute changed (via script hash) and reinitializes automatically
- `cleanup()` API — `_hyperscript.cleanup(elt)` removes all event listeners, disconnects observers, clears timers, recursively cleans children. Called automatically before reinitialization.
- htmx inspired lifecycle events — `hyperscript:before:init`, `hyperscript:after:init`, `hyperscript:before:cleanup`, `hyperscript:after:cleanup` fired per element. `before:init` is cancelable via `preventDefault()`.
- htmx inspired `data-hyperscript-powered` attribute — set on all initialized elements for fast querying and morph compatibility
- htmx inspired `config.logAll` — when `true`, logs all hyperscript events to console (matches htmx's `logAll`)
- Platform scripts — `node-hyperscript.js`, `deno-hyperscript.js`, `bun-hyperscript.js` for running `.hs` files outside the browser

### Internal

- Complete ESM rewrite of all source files (45 modules)
- **Element state on `elt._hyperscript`** — all hyperscript state stored directly on elements (inspectable in DevTools), aligned with htmx's `elt._htmx` pattern
- Named args for all parse elements (`this.args = { name: expr }` and `resolve(ctx, { name })`)
- Tokenizer cleanup — private fields, removed duplicate methods, ~50% smaller
- All extensions converted to proper class-based parse elements
- Removed IE/legacy browser compatibility code
- Runtime split into focused modules (runtime, collections, conversions, cookies)
- Parse tree is now immutable — mutable event state (execCount, debounced, lastExec) moved from parsed eventSpec objects to per-element storage
- Event listeners and observers tracked in `elt._hyperscript.listeners` and `elt._hyperscript.observers` for proper cleanup
- Test suite migrated to Playwright (~9s, from ~250s with old runner), 888 tests passing
- IIFE + ESM dual builds with minified + brotli variants for core and all extensions
- Clean dist structure: no source tree mirror, just bundled files

### Bug Fixes

- Fixed EventSource reconnection backoff (`^` → `**` for exponentiation)
- Fixed EventSource not using `closed` flag to prevent reconnection after explicit close
- Fixed `AttributeRef` not stripping single-quoted values
- Fixed `ElementCollection.id` getter calling `className` as a method
- Fixed string throws (7 instances) — now throw proper `Error` objects with stack traces
- Fixed silent failure when command doesn't return next element — now throws instead of logging and returning undefined

---

## 0.9.14 — 2025-02-01

- Short-circuit evaluation for `and`/`or` expressions
- `append` command handles DOM elements properly
- Support tilde (`~`) in query selectors
- Support `$=` selectors
- Support escaping in class literals (Tailwind compatibility)
- Negative numbers work with postfix units (`-10px`)

## 0.9.13 — 2024-10-20

- Maintenance release

## 0.9.12 — 2023-10-20

- `take` command supports multiple class literals
- Hex escape support in strings
- Fixed socket message context scoping
- Fixed `go` command scroll offset handling

## 0.9.11 — 2023-08-04

- Maintenance release

## 0.9.10 — 2023-08-04

- Maintenance release

## 0.9.9 — 2023-06-30

- Expanded comparison operators (`is equal to`, `is really equal to`, etc.)
- Cookie API improvements
- Attribute support for `take` command
- Fixed `send` command to use implicit loop

## 0.9.8 — 2023-03-02

- Maintenance release

## 0.9.7 — 2022-07-18

- Improved comment ergonomics (multi-line `-- ... --` comments)
- Null-safe `on` targets

## 0.9.6 — 2022-07-12

- `pick` command for extracting items, characters, and regex matches
- Missing.css integration for documentation site

## 0.9.5 — 2022-02-22

- `beep!` debugging tool
- `when` clause for `add` command
- `Values:JSON` and `Values:Form` conversions
- Fixed `closest` to work with arrays

## 0.9.4 — 2022-01-14

- Prism syntax highlighting theme

## 0.9.3 — 2021-12-25

- Bug fix release

## 0.9.2 — 2021-12-25

- Bug fix release

## 0.9.1 — 2021-11-28

- `otherwise` as alias for `else`
- Global scope requires explicit declaration
- Error message for `return` without value

## 0.8.0 — 2021-06-13

- `halt` command
- Class and ID template literals (`.${expr}`, `#${expr}`)
- Query literal element interpolation
- String event names
- Assignable expressions
