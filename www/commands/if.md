---
title: if - ///_hyperscript
---

## The `if` Command

The `if` command gives you standard conditional control flow. You can optionally include `else` (or `otherwise`) branches, and the whole block ends with `end`.

Note that a leading `if` on a separate line from an `else` statement will be treated as a nested if within the else:

```hyperscript
...
else
  if false   -- does not bind to the else on the previous line as an "else if"
    log 'foo'
  end
  log 'bar'
end
```

### Examples

```html
<div
  _="on click if I do not match .disabled
                   add .clicked"
>
  Click Me!
</div>
```

### Syntax

```ebnf
if <conditional> [then] <command-list> [(else | otherwise) <command-list>] end
```
