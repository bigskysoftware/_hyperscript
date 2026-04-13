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

```
remove item from myArray                 -- finds by value, splices
remove item from mySet                   -- set.delete(item)
remove key from myMap                    -- map.delete(key)
```

### Properties and indices

Without a `from` clause, `remove` on an assignable expression (a property
access or indexed access) deletes the target in place:

```
remove :arr[1]         -- splices index 1 out of the array
remove :arr[-1]        -- splices the last element (negative indices allowed)
remove :obj.field      -- delete obj.field
remove field of :obj   -- same, using the `of` form
```

For arrays the index form uses `splice`, so subsequent indices shift
down. For plain objects the property form uses JavaScript `delete`.

{% note "DOM fallthrough" %}
If the expression's value happens to be a DOM node (e.g.
`remove :wrapper.el` where `.el` holds an element), `remove` falls
through to the usual "detach from the DOM" behavior instead of deleting
the property. This keeps the common case `remove firstChild of me`
doing what you'd expect.
{% endnote %}

### See also

- [`add`](/commands/add) -- the inverse operation
- [`take`](/commands/take) -- move a class or attribute from one element to another
- [`toggle`](/commands/toggle) -- flip a class or attribute on and off
- [`show`](/commands/show) / [`hide`](/commands/hide) -- also support the `when` clause for per-element filtering

### Syntax

```ebnf
remove (<class-ref>+ | <attribute-ref> | <object-literal> | <expression>) [from <expression>] [when <expression>]
```
