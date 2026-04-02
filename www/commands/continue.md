---
title: continue - ///_hyperscript
---

## The `continue` Command

The `continue` command skips the rest of the current iteration in a `repeat` loop and jumps to the top of the next iteration.

### Example

```hyperscript
repeat 3 times
    append "works " to #message -- this command will execute
    continue
    append "skipped " to #message -- this command will be skipped
 end
```

### Syntax

```ebnf
continue
```
