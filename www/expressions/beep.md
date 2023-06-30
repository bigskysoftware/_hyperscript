---
layout: layout.njk
title: beep - ///_hyperscript
---

## The `beep!` Expression

### Syntax

```ebnf
  beep! <unary expression>
```

### Description

The `beep!` expression allows you to debug a partial expression value, logging its value to the console and otherwise
acting like an identity function: it simply returns the inner value it logs.  This allows you to insert a `beep!`
into an expression without disrupting its evaluation.

### Examples

```hyperscript
add .highlighted to the <p/> in beep! <div.highlight/> -- logs the result of <div.highlight/>
add .highlighted to beep! the <p/> in <div.highlight/> -- logs the result of the <p/> in <div.highlight/>
```
