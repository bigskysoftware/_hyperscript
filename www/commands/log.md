---
title: log - ///_hyperscript
---

## The `log` Command

The `log` command logs one or more expressions to `console.log`. You can use the `with` clause to log to a different function, like `console.debug`.

### Examples

```html
<div _="on click log 'clicked'">Click Me!</div>

<div _="on click log 'clicked', 'clacked'">Click Me!</div>

<div _="on click log 'clicked' with console.debug">Click Me!</div>
```

### Syntax

```ebnf
log <expression> (, <expression>)* [with <expression>]
```
