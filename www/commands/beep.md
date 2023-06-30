---
layout: layout.njk
title: beep - ///_hyperscript
---

## The `beep!` Statement

### Syntax

```ebnf
  beep! <expression> {, <expression>}
```

### Description

The `beep!` command allows you to debug an expression (or multiple expressions) by printing
the source of the expression, its result and the type of the result to the console.  This is
quick and convenient mechanism for print-debugging in hyperscript.

Note that the syntax is slightly different than the [beep! expression](/expressions/beep), which binds
to unary expressions rather than general expressions.

Note that you can also print the value of multiple expressions in a single `beep!` command.
Note that you can also print the value of multiple expressions in a single `beep!` command.

### Examples

```hyperscript
beep! <.foo/>
beep! <.foo/>, <.foo/> in <.bar/>
```
