---
layout: layout.njk
title: ///_hyperscript
---

## The `id reference` Expression

### Syntax

`#elementId`


### Description

The id reference expression uses a syntax similar to CSS selectors to reference elements by Id.  It evaluates to a single 
node in the DOM.

### Examples

```html
<div _="on click add .clicked to #another-div">Add the .clicked class to another div!</div>
```