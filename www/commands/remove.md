---
title: remove - ///_hyperscript
---

## The `remove` Command

### Syntax

```ebnf
remove <class-ref+ or attribute-ref or object-literal or expression> [from <target-expression>] [when <expr>]
```

### Description

The `remove` command allows you to remove an element from the DOM, or to remove
a class, property, or CSS properties from an element node.

The `when` clause allows you to filter what elements have the class, property or CSS removed in the `target`.  The expression will be evaluated for
each element in `target` and, if the result is true, the value will be removed.  If it is false, the value
will be added back.  The `it` symbol will be set to the current element, allowing you to express conditions against each element
in `target`.

### Examples

```html
<div _="on click remove me">Remove Me!</div>

<div _="on click remove .not-clicked">Remove Class From Me!</div>

<div _="on click remove .not-clacked from #another-div">
  Remove Class From Another Div!
</div>

<div _="on click remove .foo .bar from #another-div">
  Remove Multiple Classes From Another Div!
</div>

<button _="on click remove @disabled from the next <button/>">Un-Disable The Next Button</button>
<button _="on click call alert('world')" disabled>Hello!</button>

<div style="color: red; font-weight: bold"
     _="on click remove {color} from me">
  Remove CSS Property!
</div>

<div _="on click remove .highlight from .item when it matches .old">
  Conditionally Remove Class!
</div>
```
