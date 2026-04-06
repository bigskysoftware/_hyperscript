---
title: remove - ///_hyperscript
---

## The `remove` Command

The `remove` command removes an element from the DOM, or removes classes, attributes, or CSS properties from elements.

The `when` clause lets you filter which elements are affected. The expression is evaluated for each element in the target -- if it returns true, the value is removed; if false, it's added back. Use `it` to refer to the current element.

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

### Collections

`remove` also works with arrays, sets, and maps:

```hyperscript
remove item from myArray                 -- finds by value, splices
remove item from mySet                   -- set.delete(item)
remove key from myMap                    -- map.delete(key)
```

### Syntax

```ebnf
remove (<class-ref>+ | <attribute-ref> | <object-literal> | <expression>) [from <expression>] [when <expression>]
```
