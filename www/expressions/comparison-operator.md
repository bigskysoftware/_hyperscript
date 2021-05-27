---
layout: layout.njk
title: ///_hyperscript
---

## The `comparison operator` Expression

### Syntax

```ebnf
<expr> < <expr>
<expr> <= <expr>
<expr> > <expr>
<expr> >= <expr>
<expr> == <expr>
<expr> === <expr>
<expr> is <expr>
<expr> is not <expr>
<expr> is empty
<expr> is not empty
I match <expr>
<expr> matches <expr>
I do not match <expr>
<expr> does not match <expr>
I contain <expr>
<expr> contains <expr>
I do not contain <expr>
<expr> does not contain <expr>
<expr> is empty
<expr> is not empty
<expr> is a <type name>
<expr> is not a <type name>
```

### Description

Many comparison operators are similar to comparison operators in javascript. In addition to the usual comparison operators, hyperscript includes the english terms `is` and `is not` for `==` and `!=` respectively.

Hyperscript also includes two additional operations, `match` and `contain` and various syntaxes depending on what is being tested against. `match` will test if the left hand side matches the CSS query, where `contains` will test if the left hand side contains any matches of the given CSS query.

You can also test if a value exists or not using the `is empty` and `is not empty` comparisons. Hyperscript considers "empty" values to be `undefined`, `null`, empty strings, and zero length arrays and objects. This works in the same way as the [`no` expression](/expressions/no).

Finally, you can test if a value is of a given type with the `is a` form

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
```
