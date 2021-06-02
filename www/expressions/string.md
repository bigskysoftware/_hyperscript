
## The `string` Expression

### Syntax

```hyperscript
  set x to "foo" -- double quotes
  set y to 'bar' -- single quotes
  set foobar to `$foo$bar` -- template strings (back ticks) using "$"
  set hello to `hello ${name} -- template strings using "${}"
```

### Description

String expressions are similar to string expressions in javascript, and support both a quote and double quote delimiter.

Hyperscript supports [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals)
like in Javascript by using the back-tic character, and you can use either a `$` or `${}` to include an expression value in the template.

Note that in some places you can use "naked strings", which are strings that do not have a starting quote or double quote.
Instead they are delimited by whitespace: `/example`

### Examples

```html
<div _="on click log 'hello world'">Hello World!</div>
```
