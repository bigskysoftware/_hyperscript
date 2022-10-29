---
title: call - ///_hyperscript
---

## The `call` Command

### Syntax

```ebnf
call <expression>
get <expression>
```

### Description

The `call` command allows you evaluate an expression.

The value of this expression will be put into the `it` variable.

`get` is an alias for `call` and can be used if it more clearly expresses the meaning of the code.

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
