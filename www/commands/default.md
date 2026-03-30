---
title: default - ///_hyperscript
---

## The `default` Command

### Syntax

```ebnf
default <target> to <expr>
```

### Description

The `default` command sets a variable or property to a given value if it is currently `null`, `undefined`, or empty string (`""`).

### Example

```hyperscript
    -- default an attribute to a value
    default @foo to 'bar'

   -- default a variable to a value
   default x to 10
```
