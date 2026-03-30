---
title: select - ///_hyperscript
---

## The `select` Command

### Syntax

```ebnf
select [<expression>]
```

### Description

The `select` command selects the text content of an input or textarea by calling `.select()` on the target element.
If no target is given, defaults to `me`.

### Examples

```html
<input id="search" value="hello world" />
<button _="on click select #search">Select All</button>

<input _="on focus select" value="click to select" />
```
