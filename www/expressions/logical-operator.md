---
title: logical operator - ///_hyperscript
---

## The `logical operator` Expression

### Syntax

`x and y`
`x or y`
`not x`

### Description

Logical operators are similar to logical operators in javascript, but use the english words rather than symbols.

Note that all logical operators have the same precedence, but if multiple distinct operators are used the expression must be parenthesized to avoid ambiguity.

### Examples

```html
<div
  _="on click
          if I do not match .active and I do not contain .active
            add .active"
>
  Activate Me
</div>
```
