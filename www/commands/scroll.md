---
title: scroll - ///_hyperscript
---

## The `scroll` Command

### Syntax

```ebnf
scroll to [the] [top|middle|bottom] [left|center|right] [of] <expression> [(+|-) <number> [px]] [smoothly|instantly]
```

### Description

The `scroll` command scrolls an element into view. You can control the scroll position with vertical modifiers
(`top`, `middle`, `bottom`) and horizontal modifiers (`left`, `center`, `right`).

The animation can be controlled with `smoothly` (animated) or `instantly` (immediate jump).

You can add a pixel offset with `+` or `-` to pad the final scroll position.

### Examples

```html
<button _="on click scroll to #my-section">
  Go To Section
</button>

<button _="on click scroll to the top of #my-section smoothly">
  Smooth Scroll To Top
</button>

<button _="on click scroll to the top of #header - 20px">
  Scroll With Padding
</button>

<button _="on click scroll to the bottom right of #content instantly">
  Jump To Bottom Right
</button>
```
