---
title: no - ///_hyperscript
---

## The `no` Expression

The `no` operator returns true if a value is `null`, `undefined`, or an object of length 0 (an empty string or array). You can also accomplish the same thing using the [`is empty` and `is not empty` comparison operators](/expressions/comparison-operator).

### Examples

```html
<div
  _="on click
          if no .tabs log 'No tabs found!'"
>
  Check for Tabs
</div>
```

### Syntax

```ebnf
no <expression>
```
