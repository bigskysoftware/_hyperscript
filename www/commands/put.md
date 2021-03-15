---
layout: layout.njk
title: ///_hyperscript
---

## The `put` Command

### Syntax

```ebnf
put <expression> (into | before | at start of | at end of | after)  <expression>`
```

### Description

The `put` command allows you to insert content into a variable, property or the DOM.

### Examples

```html
<div _="on click put 'Clicked!' into me">Click Me!</div>

<!-- equivalent to the above -->
<div _="on click put 'Clicked!' into my.innerHTML">Click Me!</div>

<div _="on click put 'Clicked!' after me">Click Me!</div>
```