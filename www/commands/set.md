---
layout: layout.njk
title: ///_hyperscript
---

## The `set` Command

### Syntax

```ebnf
  set <expression> to <expression>
```

### Description

The `set` command allows you to set a value of a variable, property or the DOM.  It is similar to the [`put` command](/commands/put)
but reads more naturally for operations like setting variables.

### Examples

```html
<div _="on click set x to 'foo' then log x">
  Click Me!
</div>

<div _="on click set my.style.color to 'red'">
  Click Me!
</div>
```
