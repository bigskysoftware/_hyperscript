---
title: attribute reference - ///_hyperscript
---

## The `attribute reference` Expression

### Syntax

`[<name>[=<value>]]`

### Description

Attribute references are similar to CSS attribute references, and may or may not include a value.

### Examples

```html
<button _="on click add @disabled">Disable Me!</button>

<button _="on click remove [@disabled]">Enable Me!</button>

<button type="button" _="on click add [@type='submit']">Change My Type!</button>

<button type="button" _="on click my @type to 'submit'">Change My Type As Well!</button>
```
