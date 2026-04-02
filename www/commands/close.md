---
title: close - ///_hyperscript
---

## The `close` Command

The `close` command closes an element by automatically detecting its type and calling the appropriate API. If you don't specify a target, it defaults to `me`.

The element type determines the behavior:

- `<dialog>` — calls `close()`
- `<details>` — removes the `open` attribute
- Elements with a `popover` attribute — calls `hidePopover()`
- `fullscreen` — calls `document.exitFullscreen()`
- Other elements — calls `.close()` as a fallback

### Examples

```html
<dialog id="my-dialog">
  <p>Hello!</p>
  <button _="on click close #my-dialog">Close</button>
</dialog>

<button _="on click close fullscreen">Exit Fullscreen</button>
```

### Syntax

```ebnf
close [fullscreen] [<expression>]
```
