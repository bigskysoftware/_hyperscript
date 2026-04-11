---
title: open - ///_hyperscript
---

## The `open` Command

The `open` command opens an element, automatically detecting its type and calling the right API.

It handles the following element types:

- `<dialog>` — calls `showModal()` (modal: backdrop, focus trap, top layer)
- `<details>` — sets the `open` attribute
- Elements with a `popover` attribute — calls `showPopover()`
- `fullscreen` — calls `requestFullscreen()` on the target, or on `document.documentElement` if no target is given
- Other elements — calls `.open()` as a fallback

If no target is given, it defaults to `me`.

> **Modal vs. non-modal `<dialog>`**
>
> `open <dialog/>` calls `showModal()`, which puts the dialog in the
> [top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer).
> Top-layer elements are positioned relative to the viewport, *not* their
> DOM parent — so `position: absolute; top: 100%` won't anchor below a
> trigger button the way you'd expect. For dropdown-style menus where you
> want the dialog rendered inline at its DOM position, use the
> [`show`](/commands/show) command instead, which calls the non-modal
> `dialog.show()`.

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
