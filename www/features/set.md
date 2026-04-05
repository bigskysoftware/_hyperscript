---
title: set - ///_hyperscript
---

## The `set` Feature

The `set` feature lets you declare variables with initial values on an element. 

When used as a top-level feature, only element and DOM-scoped variables are supported.

See the [`set` command](/commands/set) for more information.

### Example

```html
<div _="set :count to 0
        on click increment :count then put :count into me">0</div>
```

### Syntax

```ebnf
set <expression> to <expression>
```
