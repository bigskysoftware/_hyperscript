---
title: focus - ///_hyperscript
---

## The `focus` Command

### Syntax

```ebnf
focus [<expression>]
```

### Description

The `focus` command focuses an element. If no target is given, it focuses the current element (`me`).

### Examples

```html
<button _="on click focus #search-input">Search</button>

<input _="on click focus" />
```
