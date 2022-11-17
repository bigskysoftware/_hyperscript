---
title: relative positional expression - ///_hyperscript
---

## The `relative positional` Expression

### Syntax

```ebnf
  (next|previous) <css expression> [from <expression>] [within <expression>] [with wrapping]
```

### Description

Relative positional expressions allow you to select an element relative to another element in the DOM, using the
`next` and `previous` keywords.  The command will scan forward (`next`) or backwards (`previous`) in a linear depth-first
walk over the DOM, including elements adjacent to parent elements.

You can use the `from` clause to start the linear forward search from another element.  The default element to start
the search from is the current element that the script is on.

You can use the `within` clause to restrict the search to a given subset of the DOM.  The default is the entire document.

You can have the search wrap around by adding the `with wrapping` clause at the end of the expression.

These expressions can be used, for example, to create a custom focus ring.

```html
<button _="on click toggle .hidden on the next <div/>">Toggle Hidden</button>
<div class="hidden">
  ...
</div>
```
