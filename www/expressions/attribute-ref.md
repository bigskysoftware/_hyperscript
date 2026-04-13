---
title: attribute reference - ///_hyperscript
---

## The `attribute reference` Expression

Attribute references get and set HTML attributes on elements. The form is
`@<name>` for the attribute itself, or `@<name>='<value>'` to specify a value for commands like `add` and `toggle`.

### Examples

```html
<button _="on click add @disabled">Disable Me!</button>

<button _="on click remove @disabled">Enable Me!</button>

<button type="button" _="on click add @type='submit'">Change My Type!</button>

<button type="button" _="on click set my @type to 'submit'">Change My Type As Well!</button>
```

Attribute references can be read with the possessive or `of` form:

```hyperscript
set x to my @data-x
set x to the @data-x of #other
```

### Syntax

```ebnf
@<name>[='<value>']
```
