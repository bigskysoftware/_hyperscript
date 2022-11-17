---
title: log - ///_hyperscript
---

## The `log` Command

### Syntax

```ebnf
 log <expression> {, <expression>} [with <expression>]
```

### Description

The `log` command logs an expression to `console.log` or whatever value is provided with the `with` clause.

### Examples

```html
<div _="on click log 'clicked'">Click Me!</div>

<div _="on click log 'clicked', 'clacked'">Click Me!</div>

<div _="on click log 'clicked' with console.debug">Click Me!</div>
```
