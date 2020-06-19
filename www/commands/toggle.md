---
layout: layout.njk
title: ///_hyperscript
---

## The `toggle` Command

### Syntax

`toggle <class-ref or attribute-ref> [on <target-expression>]`

### Description

The `toggle` command allows you to toggle a class (via a [class ref](/expresssions/class-ref)) or an attribute
(via an [attribute ref](/expresssions/attribute-ref)) on either the current element or, if a [target expression](/expressions/target)
is provided, to the targeted element(s).

### Examples

```html
<div _="on click toggle .toggled">Toggle Me!</div>

<div _="on click add .toggled to #another-div">Toggle Another Div!</div>

<button _="on click toggle [disabled='true']">Toggle Disabled!</button>
```