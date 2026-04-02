---
title: scroll - ///_hyperscript
---

## The `scroll` Command

The `scroll` command scrolls elements into view or scrolls by a relative amount, with control over position, animation, and container.

There are two forms. **Scroll to** scrolls an element into view. You can control the scroll position with vertical modifiers
(`top`, `middle`, `bottom`) and horizontal modifiers (`left`, `center`, `right`). Add a pixel offset
with `+` or `-` to pad the final scroll position. Use `in <container>` to scroll within a specific
scrollable parent without affecting outer scroll containers.

**Scroll by** scrolls a target (or the page) by a relative amount. Specify a direction with
`up`, `down`, `left`, or `right` (defaults to `down` if omitted).

Both forms support `smoothly` (animated) or `instantly` (immediate jump).

### Examples

```html
<!-- Scroll to an element -->
<button _="on click scroll to #my-section">
  Go To Section
</button>

<!-- Scroll to top with smooth animation -->
<button _="on click scroll to the top of #my-section smoothly">
  Smooth Scroll To Top
</button>

<!-- Scroll with pixel offset -->
<button _="on click scroll to the top of #header - 20px">
  Scroll With Padding
</button>

<!-- Scroll within a specific container -->
<button _="on click scroll to #item in #sidebar smoothly">
  Scroll In Sidebar
</button>

<!-- Scroll down by a relative amount -->
<button _="on click scroll down by 200px smoothly">
  Scroll Down
</button>

<!-- Scroll a container by a relative amount -->
<button _="on click scroll #panel right by 100px">
  Scroll Panel Right
</button>
```

### Syntax

```ebnf
scroll to [the] [top | middle | bottom] [left | center | right] [of] <expression> [(+ | -) <number> [px]] [in <expression>] [smoothly | instantly]
scroll [<expression>] [up | down | left | right] by <number> [px] [smoothly | instantly]
```
