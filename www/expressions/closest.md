---
title: closest - ///_hyperscript
---

## The `closest` Expression

The `closest` expression finds the nearest ancestor element matching a CSS selector. By default it starts from the current element, but you can specify a different starting point with the `to` clause.

### Examples

```html
<div _="on click add .clicked to the closest <section/>">...</div>

<div _="on click add .clicked to the closest <div/> to the parentElement of me">
  ...
</div>
```

### Syntax

```ebnf
closest <css-selector> [to <expression>]
```
