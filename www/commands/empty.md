---
title: empty - ///_hyperscript
---

## The `empty` Command

The `empty` command removes all child nodes from an element. If no target is given, it empties the current element (`me`).

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
