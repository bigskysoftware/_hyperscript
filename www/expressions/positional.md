---
title: positional expression - ///_hyperscript
---

## The `positional` Expressions

Positional expressions let you pick an element out of an array or array-like object by position. If applied to a DOM element, the element's children are used.

### Examples

```html
<div _="on click log first in me">... Log my first child ...</div>

<div _="on click log last in me">
  ...
  Log my last child
  ...
</div>
```

### Syntax

```ebnf
(first | last | random) [in | of | from] <expression>
```
