---
title: break - ///_hyperscript
---

## The `break` Command

The `break` command exits the current `repeat` loop immediately.

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

### Syntax

```ebnf
break
```
