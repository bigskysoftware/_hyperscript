---
layout: layout.njk
title: ///_hyperscript
---

## The `add` Command

### Syntax

```ebnf
add <class-ref or attribute-ref> [to <target-expression>]
```

### Description

The `add` command allows you to add a class (via a [class ref](/expressions/class-reference)) or an attribute
(via an [attribute ref](/expressions/attribute-ref)) to either the current element or, if a [target expression](/expressions/target)
is provided, to the targeted element(s).

### Examples

```html
<div _="on click add .clicked">Click Me!</div>

<div _="on click add .clacked to #another-div">Click Me!</div>

<button _="on click add [disabled='true']">Disable Me!</button>
```
