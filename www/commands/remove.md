---
layout: layout.njk
title: ///_hyperscript
---

## The `remove` Command

### Syntax

`remove <id-ref or class-ref or attribute-ref> [from <target-expression>]`

### Description

The `remove` command allows you to remove an element (via an [id ref](/expresssions/class-ref)), or a class 
 (via a [class ref](/expresssions/class-ref)) or an attribute (via an [attribute ref](/expresssions/attribute-ref)) from  
the current element or, if a [target expression](/expressions/target) is provided, from the targeted element(s).

### Examples

```html
<!-- we use the 'me' keyword for clarity, it could be omitted as it is the default -->
<div _="on click remove me">Remove Me!</div>

<div _="on click remove .not-clicked">Remove Class From Me!</div>

<div _="on click remove .not-clacked to #another-div">Remove Class From Another Div!</div>

<button _="on click remove [disabled]">Un-Disable Me!</button>
```