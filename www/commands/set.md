---
title: set - ///_hyperscript
---

## The `set` Command

The `set` command assigns a value to a variable, property, or DOM element. It's similar to [`put`](/commands/put) but reads more naturally for assignment operations like `set x to 10`.

You can also set many properties at once using the `set {...} on` form.

### Symbol Resolution

When setting a symbol like `x`, hyperscript follows these rules:

* If `x` exists in the current local scope, set the locally scoped value
* If not, if `x` exists in the current element-local scope, set the element-local scoped value
* If not, create a new locally scoped symbol named `x` with the value

To set a global variable, you must use the `global` modifier (unless the symbol starts with `$`):

```hyperscript
  set global globalVar to 10
```

### Examples

```html
<div _="on click set x to 'foo' then log x">
  Click Me!
</div>

<div _="on click set my.style.color to 'red'">
  Click Me!
</div>

<button _="on click set { disabled: true, innerText: "Don't click me!" } on me">
  Click Me!
</button>
```

### Syntax

```ebnf
set <expression> to <expression>
set <object-literal> on <expression>
```
