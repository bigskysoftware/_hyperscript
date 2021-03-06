---
layout: layout.njk
title: ///_hyperscript
---

## The `id reference` Expression

### Syntax

```ebnf
#<id value>
```

### Description

An id reference expression uses a syntax from to CSS selectors to reference elements by directly by the `id` property.  It evaluates to a single 
node in the DOM with the given identifier

### Examples

```html
<div _="on click add .clicked to #another-div">
  Add the .clicked class to another div!
</div>
```