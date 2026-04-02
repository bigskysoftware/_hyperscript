---
title: call - ///_hyperscript
---

## The `call` Command

The `call` command evaluates an expression and stores its value in the `it` variable. `get` is an alias for `call` — use whichever reads more naturally in context.

### Examples

```html
<div _="on click call myJavascriptFunction()">Click Me!</div>

<div
  _="on click get prompt('Enter your age')
                 put 'You entered: $it' into my.innerHTML"
>
  Click Me!
</div>
```

### Syntax

```ebnf
call <expression>
get <expression>
```
