---
title: decrement - ///_hyperscript
---

## The `decrement` Command

The `decrement` command subtracts from an existing variable, property, or attribute. It defaults to subtracting `1`, but you can change the amount with `by`. If the target is null, it's treated as `0` before decrementing. This is the opposite of the [`increment` command](/commands/increment).

### Example

```hyperscript
set counter to 5
decrement counter by 2 -- counter is now 3

decrement newVariable -- newVariable is defaulted to zero, then decremented to -1
```

### Syntax

```ebnf
decrement <target> [by <number>]
```
