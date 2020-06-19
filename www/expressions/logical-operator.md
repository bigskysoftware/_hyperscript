---
layout: layout.njk
title: ///_hyperscript
---

## The `logical operator` Expression

### Syntax

`x and y`
`x or y`
`not x`

### Description

Logical operators are similar to comparison operators in javascript, but use the english words rather than symbols.

Note that all logical operators have the same precedence, but if multiple distinct operators are used the
expression must be parenthesized to avoid ambiguity.

### Examples

```html
<div _="on click if .button.length > 0 and .tab > 0 log 'found buttons and tabs!" ">Find buttons & tabs</div>
```