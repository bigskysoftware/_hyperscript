---
title: block literal - ///_hyperscript
---

## The `block literal` Expression

Block literals are anonymous functions that evaluate and return a single expression. They're useful when you need to pass a callback to a JavaScript function.

### Examples

```html
<div _="on click setTimeout(\->console.log('called!'), 1000)">
  Log 'called!' in a second
</div>
```

### Syntax

```ebnf
\ [<parameter-list>] -> <expression>
```
