---
layout: layout.njk
title: ///_hyperscript
---

## The `math operator` Expression

### Syntax

`x + y`
`x - y`
`x * y`
`x / y`

### Description

Math operators are similar to math operators in javascript.

Note that the `+` operator is overloaded to mean string concatenation, as in javascript.

Note that all math operators have the same precedence, but if multiple distinct operators are used the
expression must be parenthesized to avoid ambiguity.

### Examples

```html
<div _="on click log 40 + 2" ">Log the answer</div>
<div _="on click log 'The Answer Is: ' + (40 + 2)" ">Log the answer string</div>
```