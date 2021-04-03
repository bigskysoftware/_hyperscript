---
layout: layout.njk
title: ///_hyperscript
---

## The `default` Command

### Syntax

```ebnf
default <target> to <expr>
```

### Description

The `default` command defaults a variable or property to a given value.

### Example

```hyperscript
    -- default an attribute to a value
    default @foo to 'bar'

   -- default a variable to a value
   default x to 10
```