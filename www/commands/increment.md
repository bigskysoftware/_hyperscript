
## The `increment` Command

### Syntax

```ebnf
increment <target> [by <number>]
```

### Description

The `increment` command adds to an existing variable, property, or attribute. It defaults to adding the value `1`, but this can be changed using the `by` modifier. If the target variable is null, then it is assumed to be `0`, and then incremented by the specified amount. The `increment` command is the opposite of the [`decrement` command](/commands/decrement) command.

### Example

If you target a string variable, then `increment` uses `+=` to add the string to the end of the target variable.

```hyperscript
set counter to 5
increment counter by 2 -- counter is now 7

increment newVariable -- newVariable is defaulted to zero, then incremented to 1
```
