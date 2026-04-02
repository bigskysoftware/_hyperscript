---
title: time - ///_hyperscript
---

## The `time` Expression

The time expression lets you express durations in a readable way. A bare number means milliseconds; add `s` or `seconds` to multiply by 1000.

### Examples

```html
<div _="on click wait 2s then log 'hello world'">Hello World!</div>
```

### Syntax

```ebnf
<number> [ms | milliseconds | s | seconds]
```
