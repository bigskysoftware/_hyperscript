---
title: blur - ///_hyperscript
---

## The `blur` Command

The `blur` command removes focus from an element. If you don't specify a target, it blurs the current element (`me`).

### Examples

```html
<input _="on keydown[key is 'Escape'] blur" />

<button _="on click blur #search-input">Dismiss</button>
```

### Syntax

```ebnf
blur [<expression>]
```
