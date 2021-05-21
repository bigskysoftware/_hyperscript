---
layout: layout.njk
title: ///_hyperscript
---

## The `block literal` Expression

### Syntax

`\ [<parameters-list>] -> <expression>`

### Description

Block expressions are anonymous functions that return a value (the right hand side expression).

### Examples

```html
<div _="on click setTimeout(\->console.log('called!'), 1000)">Log 'called!' in a second</div>
```
