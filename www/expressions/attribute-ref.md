---
title: attribute reference - ///_hyperscript
---

## The `attribute reference` Expression

Attribute references let you get and set HTML attributes on elements, using a syntax similar to CSS attribute selectors.

### Examples

```html
<button _="on click add @disabled">Disable Me!</button>

<button _="on click remove [@disabled]">Enable Me!</button>

<button type="button" _="on click add [@type='submit']">Change My Type!</button>

<button type="button" _="on click my @type to 'submit'">Change My Type As Well!</button>
```

### Syntax

```ebnf
[@<name>[=<value>]]
```
