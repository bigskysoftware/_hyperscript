---
title: continue - ///_hyperscript
---

## The `continue` Command

### Syntax

```ebnf
continue
```

### Description

The `continue` command works inside any `repeat` block.  It exits the current iteration of the loop and begins at the top of the next iteration.

### Example

```hyperscript
repeat 3 times
    append "works " to #message -- this command will execute
    continue
    append "skipped " to #message -- this command will be skipped
 end
```
