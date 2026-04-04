---
title: breakpoint - ///_hyperscript
---

## The `breakpoint` Command

The `breakpoint` command pauses execution in the browser DevTools by triggering the JavaScript `debugger` statement. This is built into core and does not require the hdb extension.

When DevTools are open, execution will pause at the breakpoint, letting you inspect the current state. When DevTools are closed, the command has no effect.

### Examples

```html
<button _="on click
  set x to 42
  breakpoint
  put x into me
">Debug</button>
```

### Syntax

```ebnf
breakpoint
```
