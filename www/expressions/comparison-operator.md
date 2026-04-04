---
title: comparison operator - ///_hyperscript
---

## The `comparison operator` Expression

Hyperscript provides a rich set of comparison operators, including the usual symbolic ones (`<`, `>`, `==`) along with English-language alternatives that make your scripts read more naturally.

In addition to the standard numeric and equality checks, hyperscript includes `match`, `contain`/`include`, `starts with`, `ends with`, `is between`, `precedes`/`follows`, and `exists`. Here's what each does:

- **`is` / `is not`** -- equivalent to `==` and `!=`. The `really` modifier switches to `===` / `!==`.
- **`matches`** -- tests if the left side matches a CSS selector or regular expression.
- **`contains`** / **`includes`** -- calls `.contains()` or `.includes()` on the left side. These are interchangeable.
- **`is in`** -- flips the operands of `contains`, so `x is in y` means `y contains x`.
- **`starts with`** / **`ends with`** -- tests string prefixes and suffixes.
- **`is between X and Y`** -- tests if a value falls within an inclusive range.
- **`precedes`** / **`follows`** -- tests DOM document order: whether one element appears before or after another in the document tree.
- **`exists`** -- tests if the value is not null and, for collections, contains at least one element.
- **`is empty`** / **`is not empty`** -- considers `undefined`, `null`, empty strings, and zero-length arrays/objects as "empty." Works the same way as the [`no` expression](/expressions/no).
- **`is a`** -- tests if a value is of a given type.

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

### Syntax

```ebnf
<expression> (< | <= | > | >= | == | ===) <expression>
<expression> is [not] [really] [equal to] <expression>
<expression> (equals | really equals) <expression>
<expression> is [not] empty
<expression> (matches | does not match) <expression>
(I match | I do not match) <expression>
<expression> (contains | does not contain) <expression>
(I contain | I do not contain) <expression>
<expression> (includes | does not include) <expression>
(I include | I do not include) <expression>
<expression> is [not] in <expression>
<expression> (starts with | does not start with) <expression>
<expression> (ends with | does not end with) <expression>
<expression> is [not] between <expression> and <expression>
<expression> (precedes | does not precede) <expression>
<expression> (follows | does not follow) <expression>
<expression> is [not] a <type-name>
<expression> (exists | does not exist)
<comparison> ignoring case
```
