
## The `set` Command

### Syntax

```ebnf
  set <expression> to <expression>
  set <object literal> on <expression>
```

### Description

The `set` command allows you to set a value of a variable, property or the DOM. It is similar to the [`put` command](/commands/put)
but reads more naturally for operations like setting variables.

It can also be used to set many properties at once using the `set {...} on` form.

### Symbol Resolution

When setting a symbol, such as `x`, the following rules are used:

* If a symbol `x` exists in the current local scope, set the locally scoped value
* If not, if a symbol `x` exists in the current element-local scope, set the element-local scoped value
* If not, create a new locally scoped symbol named `x` with the value

Note that if you wish to set a global variable you must explicitly use the `global` modifier unless the symbol starts
with a `$`:

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
