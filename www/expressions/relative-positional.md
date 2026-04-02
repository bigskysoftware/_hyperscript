---
title: relative positional expression - ///_hyperscript
---

## The `relative positional` Expression

Relative positional expressions let you find an element relative to another element in the DOM using `next` and `previous`. The search does a linear depth-first walk over the DOM, including elements adjacent to parent elements.

You can use the `from` clause to start the search from a different element (defaults to the current element). The `within` clause restricts the search to a subtree of the DOM (defaults to the entire document). Add `with wrapping` to have the search wrap around.

These are useful for things like building a custom focus ring.

### Examples

```html
<button _="on click toggle .hidden on the next <div/>">Toggle Hidden</button>
<div class="hidden">
  ...
</div>
```

### Syntax

```ebnf
(next | previous) <css-selector> [from <expression>] [within <expression>] [with wrapping]
```
