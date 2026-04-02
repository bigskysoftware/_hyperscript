---
title: breakpoint - ///_hyperscript
---

## The `breakpoint` Command

### Syntax

```ebnf
breakpoint
```

### Description

The `breakpoint` command pauses execution in the browser DevTools by triggering the JavaScript `debugger`
statement. This is built in to core and does not require the hdb extension.

When DevTools are open, execution will pause at the breakpoint, allowing you to inspect the current state.
When DevTools are closed, the command has no effect.

### Examples

```html
<button _="on click
  set x to 42
  breakpoint
  put x into me
">Debug</button>
```
