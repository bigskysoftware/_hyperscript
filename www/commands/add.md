---
layout: layout.njk
title: ///_hyperscript
---

## The `add` Command

### Syntax

```ebnf
add <class-ref or attribute-ref or object-literal> [to <target-expression>]
```

### Description

The `add` command allows you to add a class (via a [class ref](/expressions/class-reference)), an attribute
(via an [attribute ref](/expressions/attribute-ref)) or CSS attributes (via an object literal) to either the current element or to another element.

**Note:** Hyperscript supports hyphens in object property names, so you can write `add { font-size: '2em' }`. However, double hyphens (`--`) mark comments in hyperscript, so if you need to use them for [CSS Custom Properties][], use quotes -- `add { '--big-font-size': '2em' }`.

### Examples

```html
<div _="on click add .clicked">Click Me!</div>

<div _="on click add .clacked to #another-div">Click Me!</div>

<button _="on click add [disabled='true']">Disable Me!</button>

<input type=color _="on change add { '--accent-color': my.value } to document.body">
```
