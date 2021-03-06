---
layout: layout.njk
title: ///_hyperscript
---

## The `class reference` Expression

### Syntax

`.<class name>`

### Description

The class reference expression uses a syntax from CSS selectors to reference all elements with a given class.  It typically
evaluates to a NodeList of all matching classes, unless it is used as the 
right hand side of an assignment.

### Examples

```html
<div _="on click add .clicked">
  Add the .clicked class to me!
</div>

<div _="on click log .clicked">
  Log all elements with the clicked class on it in the DOM
</div>
```