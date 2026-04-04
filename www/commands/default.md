---
title: default - ///_hyperscript
---

## The `default` Command

The `default` command sets a variable or property to a given value only if it is currently `null`, `undefined`, or an empty string (`""`).

### Example

```hyperscript
    -- default an attribute to a value
    default @foo to 'bar'

   -- default a variable to a value
   default x to 10
```

### Syntax

```ebnf
default <target> to <expression>
```
