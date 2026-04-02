---
title: possessive expression - ///_hyperscript
---

## The `possessive` Expression

The possessive expression gives you a more natural way to access properties than the dot operator. You can use `my`, `its`, or any expression followed by `'s` to access a property. It also works for getting and setting DOM attributes.

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
  Replace Me w/ Foo's Attribute Data
</button>
```

### Syntax

```ebnf
(my | its | <expression>'s) <property>
(my | its | <expression>'s) attribute <string-like>
```
