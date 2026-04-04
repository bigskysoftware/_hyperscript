---
layout: layout.njk
title: beep - ///_hyperscript
---

## The `beep!` Command

The `beep!` command is a quick print-debugging tool. It logs the source of an expression, its result, and the result's type to the console. You can pass multiple expressions separated by commas.

Note that the syntax is slightly different from the [beep! expression](/expressions/beep), which binds to unary expressions rather than general expressions.

### Examples

```hyperscript
beep! <.foo/>
beep! <.foo/>, <.foo/> in <.bar/>
```

### Syntax

```ebnf
beep! <expression> (, <expression>)*
```
