---
layout: layout.njk
title: ///_hyperscript
---

## The `target` Expression

### Syntax

`root[.property]*`

`x`
`#myDiv.parent`
`.buttons.innerHTML`

### Description

A target expressions consists of a root expression that can be either a symbol, an [id ref](/expresssions/id-ref) or
a [class ref](/expresssions/class-ref).  Following that is an optional number of property invocations forming a property chain.

The root expression is evaluated.  If there is a property chain, the root value is iterated over (if it is a list) using 
the property chain as the final target.

### Examples

```html
<div _="on click set .button.style.color to 'red'">Set All Buttons To Red</div>
```
