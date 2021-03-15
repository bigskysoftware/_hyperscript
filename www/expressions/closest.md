---
layout: layout.njk
title: ///_hyperscript
---

## The `closest` Expression

### Syntax

```ebnf
  closest <css expression> [to <expression>]
```

### Description

The `closest` expression allows you to find the closest matching element to a given DOM element.  By default
it will use the current element.

```html
<div _="on click add .clicked to the closest <section/>">
  ...
</div>

<div _="on click add .clicked to the closest div to the parentElement of me">
  ...
</div>
```