---
title: remove - ///_hyperscript
---

## The `remove` Command

### Syntax

```ebnf
remove <expression> [from <expression>]
```

### Description

The `remove` command allows you to remove an element from the DOM or to remove
a class or property from an element node.

### Examples

```html
<div _="on click remove me">Remove Me!</div>

<div _="on click remove .not-clicked">Remove Class From Me!</div>

<div _="on click remove .not-clacked from #another-div">
  Remove Class From Another Div!
</div>

<div _="on click remove .foo .bar from #another-div">
  Remove Class From Another Div!
</div>

<button _="on click remove @disabled from the next <button/>">Un-Disable The Next Button</button>
<button _="on click call alert('world')" disabled>Hello!</button>
```
