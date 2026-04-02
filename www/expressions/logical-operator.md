---
title: logical operator - ///_hyperscript
---

## The `logical operator` Expression

Logical operators work like their JavaScript counterparts but use English words (`and`, `or`, `not`) instead of symbols.

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

### Syntax

```ebnf
<expression> and <expression>
<expression> or <expression>
not <expression>
```
