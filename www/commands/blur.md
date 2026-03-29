---
title: blur - ///_hyperscript
---

## The `blur` Command

### Syntax

```ebnf
blur [<expression>]
```

### Description

The `blur` command removes focus from an element. If no target is given, it blurs the current element (`me`).

### Examples

```html
<input _="on keydown[key is 'Escape'] blur" />

<button _="on click blur #search-input">Dismiss</button>
```
