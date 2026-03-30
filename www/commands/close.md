---
title: close - ///_hyperscript
---

## The `close` Command

### Syntax

```ebnf
close [fullscreen] [<expression>]
```

### Description

The `close` command closes an element. It automatically detects the element type and calls the right API:

- `<dialog>` — calls `close()`
- `<details>` — removes the `open` attribute
- Elements with a `popover` attribute — calls `hidePopover()`
- `fullscreen` — calls `document.exitFullscreen()`
- Other elements — calls `.close()` as a fallback

If no target is given, defaults to `me`.

### Examples

```html
<dialog id="my-dialog">
  <p>Hello!</p>
  <button _="on click close #my-dialog">Close</button>
</dialog>

<button _="on click close fullscreen">Exit Fullscreen</button>
```
