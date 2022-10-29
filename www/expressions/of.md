---
title: of - ///_hyperscript
---

## The `of` Expression

### Syntax

```ebnf
  <expression> of <expression>
```

### Description

The `of` expression allows you to reverse the normal order of property accessors for clearer code.

So this:

```html
<button _="on click call window.location.refresh()">
  Refresh the Location
</button>
```

Can be rewritten like this:

```html
<button _="on click refresh() the location of the window">
  Refresh the Location
</button>
```

Where we have converted `window.location` into the form `the location of the window`.
