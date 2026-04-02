---
title: of - ///_hyperscript
---

## The `of` Expression

The `of` expression lets you reverse the normal order of property access for more natural, readable code. Instead of `window.location`, you can write `the location of the window`.

### Examples

So this:

```html
<button _="on click call window.location.reload()">
  Reload the Location
</button>
```

Can be rewritten like this:

```html
<button _="on click reload() the location of the window">
  Reload the Location
</button>
```

Where we have converted `window.location` into the form `the location of the window`.

### Syntax

```ebnf
<expression> of <expression>
```
