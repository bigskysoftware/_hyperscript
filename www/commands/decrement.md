---
layout: layout.njk
title: ///_hyperscript
---

## The `decrement` Command

### Syntax

```ebnf
decrement <target> [by <number>]
```

### Description

The `decrement` command adds to an existing variable, property, or attribute. It defaults to adding the value `1`, but this can be changed using the `by` modifier. If the target variable is null, then it is assumed to be `0`, and then decremented by the specified amount. The `decrement` command is the opposite of the [`increment` command](/commands/increment) command.

### Example

If you target a string variable, then `decrement` uses `+=` to add the string to the end of the target variable.

```hyperscript
set counter to 5
decrement counter by 2 -- counter is now 3

decrement newVariable -- newVariable is defaulted to zero, then decremented to -1
```
