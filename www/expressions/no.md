---
layout: layout.njk
title: ///_hyperscript
---

## The `no` Expression

### Syntax

```ebnf
  no <expr>
```

### Description

The `no` operator returns true if the value of the expression is `null` or an
object of length 0 (an empty string or array).

### Examples

```html
<div _="on click 
          if no .tabs log 'No tabs found!'">
  Check for Tabs
</div>
```