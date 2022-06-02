
## The `break` Command

### Syntax

```ebnf
break
```

### Description

The `break` command works inside any `repeat` block.  It exits the breaks out of the iteration of the loop.

### Example

```hyperscript
repeat 3 times
    wait 2s
    if my @value is not empty
      break
    end
    append "Value is still empty... <br/>" to #message
 end
```
