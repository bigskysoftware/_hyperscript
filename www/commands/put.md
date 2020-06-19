---
layout: layout.njk
title: ///_hyperscript
---

## The `put` Command

### Syntax

`put <expression> into <target-expression>`
`put <expression> before <target-expression>`
`put <expression> at start of <target-expression>`
`put <expression> at end of <target-expression>`
`put <expression> after <target-expression>`

### Description

The `put` command allows you to insert content into a variable, property or the DOM.

### Examples

```html
<div _="on click put 'Clicked!' into my.innerHTML">Click Me!</div>

<div _="on click put 'Clicked!' after me">Click Me!</div>
```