---
title: empty - ///_hyperscript
---

## The `empty` Command

The `empty` command removes all child nodes from an element, or clears a collection. If no target is given, it empties the current element (`me`).

For arrays, sets, and maps, `empty` clears all entries:

```hyperscript
empty myArray                            -- splices to length 0
empty mySet                              -- set.clear()
empty myMap                              -- map.clear()
```

### Examples

```html
<button _="on click empty #results">Clear Results</button>

<div _="on click empty">Click to clear me</div>

<button _="on click empty .messages">Clear All Messages</button>
```

### Syntax

```ebnf
empty [<expression>]
```
