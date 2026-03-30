---
title: exit - ///_hyperscript
---

## The `exit` Command

### Syntax

```ebnf
exit
```

### Description

The `exit` command exits the current event handler or function without returning a value. It is equivalent
to `return` with no expression.

### Examples

```html
<button _="on click
  if I match .disabled
    exit
  end
  put 'clicked!' into me
">Click Me</button>
```
