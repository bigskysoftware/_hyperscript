---
title: increment - ///_hyperscript
---

## The `increment` Command

The `increment` command adds to an existing variable, property, or attribute. It defaults to adding `1`, but you can change the amount with the `by` modifier. If the target variable is null, it's assumed to be `0` before incrementing. This is the opposite of the [`decrement` command](/commands/decrement).

### Examples

```hyperscript
set counter to 5
increment counter by 2 -- counter is now 7

increment newVariable -- newVariable is defaulted to zero, then incremented to 1
```

### Syntax

```ebnf
increment <target> [by <expression>]
```
