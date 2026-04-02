---
title: some - ///_hyperscript
---

## The `some` Expression

The `some` expression tests whether a value is "not empty." It returns `true` if the value is non-null, non-undefined, and not an empty string, array, or object -- essentially the opposite of the [`no`](/expressions/no) expression.

You can use `some` anywhere you need a boolean check for the presence of a value. It works the same way as `no`, just inverted: `some x` is equivalent to `not no x`.

### Examples

```html
<button _="on click if some <.active/> log 'found active elements'">
  Check
</button>
```

```html
<input _="on keyup
            if some my value
              add .has-content to me
            else
              remove .has-content from me"/>
```

### Syntax

```ebnf
some <expression>
```
