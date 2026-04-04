---
layout: layout.njk
title: beep - ///_hyperscript
---

## The `beep!` Expression

The `beep!` expression is a debugging helper that logs a value to the console and then returns it unchanged. You can insert it into any expression without disrupting evaluation -- it acts as an identity function that happens to log.

### Examples

```hyperscript
add .highlighted to the <p/> in beep! <div.highlight/> -- logs the result of <div.highlight/>
add .highlighted to beep! the <p/> in <div.highlight/> -- logs the result of the <p/> in <div.highlight/>
```

### Syntax

```ebnf
beep! <expression>
```
