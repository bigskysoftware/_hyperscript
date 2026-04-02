---
title: string - ///_hyperscript
---

## The `string` Expression

Strings in hyperscript work like JavaScript strings, supporting single quotes, double quotes, and template literals with backticks. Template literals use `$` or `${}` to interpolate expressions.

Note that in some places you can use "naked strings", which are strings without quotes, delimited by whitespace: `/example`

### Examples

```hyperscript
  set x to "foo" -- double quotes
  set y to 'bar' -- single quotes
  set foobar to `$foo$bar` -- template strings (back ticks) using "$"
  set hello to `hello ${name}` -- template strings using "${}"
```

```html
<div _="on click log 'hello world'">Hello World!</div>
```

### Syntax

```ebnf
(<single-quoted-string> | <double-quoted-string> | <template-literal>)
```
