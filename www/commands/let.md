
## The `let` Command

### Syntax

```ebnf
  let <symbol> [be|=] <expression>
```

### Description

The `let` command allows you to define a new variable.  The new variable will default to the local scope unless
a [variable scope modifier](/docs#variables_and_scope) is used.

### Examples

```html
<div _="on click let x be 'foo' then log x">
  Click Me!
</div>
```
