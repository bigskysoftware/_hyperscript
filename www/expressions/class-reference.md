---
layout: layout.njk
title: ///_hyperscript
---

## The `class reference` Expression

### Syntax

`.className`


### Description

The class reference expression uses a syntax similar to CSS selectors to reference the class name.  It typically
evaluates to a NodeList of all matching classes, unless it is used as the value of an assignment.

### Examples

```html
<div _="on click add .clicked">Add the .clicked class to me!</div>

<div _="on click log .button">Log all buttons in the DOM</div>
```