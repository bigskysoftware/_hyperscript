---
title: comparison operator - ///_hyperscript
---

## The `comparison operator` Expression

### Syntax

```ebnf
<expr> < <expr>
<expr> is less than <expr>
<expr> <= <expr>
<expr> is less than or equal to <expr>
<expr> > <expr>
<expr> is greater than <expr>
<expr> >= <expr>
<expr> is greater than or equal to <expr>
<expr> == <expr>
<expr> === <expr>
<expr> is <expr>
<expr> is equal to <expr>
<expr> is really equal to <expr>
<expr> is not <expr>
<expr> is not equal to <expr>
<expr> is not really equal to <expr>
<expr> equals <expr>
<expr> really equals <expr>
<expr> is empty
<expr> is not empty
I match <expr>
<expr> matches <expr>
I do not match <expr>
<expr> does not match <expr>
I contain <expr>
<expr> contains <expr>
<expr> is in <expr>
I do not contain <expr>
<expr> does not contain <expr>
<expr> includes <expr>
I do not include <expr>
<expr> does not include <expr>
<expr> starts with <expr>
<expr> does not start with <expr>
<expr> ends with <expr>
<expr> does not end with <expr>
<expr> is between <expr> and <expr>
<expr> is not between <expr> and <expr>
<expr> precedes <expr>
<expr> does not precede <expr>
<expr> follows <expr>
<expr> does not follow <expr>
<expr> is empty
<expr> is not empty
<expr> is a <type name>
<expr> is not a <type name>
<expr> exists
<expr> does not exist
<comparison> ignoring case
```

### Description

Many comparison operators are similar to comparison operators in javascript. In addition to the usual comparison operators, hyperscript includes the english terms `is` and `is not` for `==` and `!=` respectively.

The `really` modifier switches a comparison to use `===` or `!==`, depending on what it modifies.

Hyperscript also includes additional operations: `match`, `contain`, `include`, `starts with`, `ends with`, and `exists`, with various syntaxes depending on what is being tested. `match` will test if the left hand side matches the CSS query or Regular Expression string.  `contains` will test if the left hand side contains OR includes the right hand side (invoking `contains()` or `includes()`).  `includes` is identical to `contains`.  `starts with` and `ends with` test string prefixes and suffixes respectively.  `is between X and Y` tests if a value falls within an inclusive range.  `precedes` and `follows` test DOM document order — whether one element appears before or after another in the document tree.  `exist` tests if the left hand side
is not null and, if it is a collection of elements, it contains any elements.

The `is in` test effectively flips the left hand side and right hand side of the `contains` comparison.

You can also test if a value exists or not using the `is empty` and `is not empty` comparisons. Hyperscript considers "empty" values to be `undefined`, `null`, empty strings, and zero length arrays and objects. This works in the same way as the [`no` expression](/expressions/no).

Finally, you can test if a value is of a given type with the `is a` form.

Any comparison can be made case-insensitive by appending `ignoring case`:

```hyperscript
  if name is "admin" ignoring case ...
  if title contains "hello" ignoring case ...
  if input matches "yes" ignoring case ...
```

Note that all comparison operators have the same precedence, but if multiple distinct operators are used the
expression must be parenthesized to avoid ambiguity.

### Examples

```html
<div
  _="on click if <button/>.length > 1
                   log 'found multiple buttons!'"
>
  Find buttons
</div>

<div
  _="on click if I match .active
                   log 'I'm active!'"
>
  Check if active
</div>

<input _="on keyup
            if my value is 'quit' ignoring case
              put 'Goodbye!' into the next <output/>"/>

<input _="on keyup
            if my value starts with 'http'
              add .valid-url to me
            else
              remove .valid-url from me"/>

<input type="number" _="on change
            if my value as Int is between 1 and 100
              remove .error from me
            else
              add .error to me"/>

<div _="on click
         if I precede #footer
           log 'I am above the footer'">
  Check Position
</div>
```
