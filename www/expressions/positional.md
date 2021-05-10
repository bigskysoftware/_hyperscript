
## The `positional` Expressions

### Syntax

```ebnf
  (first | last | random) [(in | of | from)] <expression>
```

### Description

Positional expressions allow you to select an element from an array or array-like object.  If they are applied to a
DOM element, the children of the DOM object will be used.

```html
<div _="on click log first in me">
  ...
  Log my first child
  ...
</div>

<div _="on click log last in me">
  ...
  Log my last child
  ...
</div>
```
