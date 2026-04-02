---
title: open - ///_hyperscript
---

## The `open` Command

The `open` command opens an element, automatically detecting its type and calling the right API.

It handles the following element types:

- `<dialog>` — calls `showModal()`
- `<details>` — sets the `open` attribute
- Elements with a `popover` attribute — calls `showPopover()`
- `fullscreen` — calls `requestFullscreen()` on the target, or on `document.documentElement` if no target is given
- Other elements — calls `.open()` as a fallback

If no target is given, it defaults to `me`.

### Examples

```html
<button _="on click open #my-dialog">Open Dialog</button>
<dialog id="my-dialog">
  <p>Hello!</p>
  <button _="on click close #my-dialog">Close</button>
</dialog>

<button _="on click open #info">Show Details</button>
<details id="info"><summary>Info</summary><p>Details here</p></details>

<button _="on click open fullscreen">Go Fullscreen</button>
<button _="on click open fullscreen #video">Fullscreen Video</button>
```

### Syntax

```ebnf
open [fullscreen] [<expression>]
```
