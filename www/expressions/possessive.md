---
title: possessive expression - ///_hyperscript
---

## The `possessive` Expression

### Syntax

```ebnf
  ['my' | 'its' | <expressions>'s] <property>
  ['my' | 'its' | <expressions>'s] attribute <stringLike>
```

### Description

The possessive expression can be used in places to more clearly express intent when compared with the more typical
`.` operator.

The possessive expression can also be used to get and set attributes of an element in the DOM

### Examples

```html
<div _="on click set the window's location to 'https://duck.com'">
  Go to Duck Duck Go
</div>
<div
  id="foo"
  data-demo="Here is some data..."
>
</div>
<button _"on click put #foo's @data-demo into me">
  Replace Me w/ Attribute Data
</button>
```
