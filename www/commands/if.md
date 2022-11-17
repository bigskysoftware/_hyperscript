---
title: if - ///_hyperscript
---

## The `if` Command

### Syntax

```ebnf
  if <conditional> [then] <command-list> [(else | otherwise) <command-list>] end`
```

### Description

The `if` command provides the standard if-statement control flow.

### Examples

```html
<div
  _="on click if I do not match .disabled
                   add .clicked"
>
  Click Me!
</div>
```
