---
layout: layout.njk
title: ///_hyperscript
---

## The `comparison operator` Expression

### Syntax

`x < y`
`x <= y`
`x > y`
`x >= y`
`x == y`
`x === y`

### Description

Comparison operators are similar to comparison operators in javascript.

Note that all comparison operators have the same precedence, but if multiple distinct operators are used the
expression must be parenthesized to avoid ambiguity.

### Examples

```html
<div _="on click if .button.length > 1 log 'found multiple buttons!'">Find buttons</div>
```