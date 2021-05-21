---
layout: layout.njk
title: ///_hyperscript
---

## The `tell` Command

### Syntax

```ebnf
tell <expression>
```

### Description

The `tell` command can be used to temporarily change the default target for commands like `add`.

Within `tell` blocks, keywords `you`, `your`, and `yourself` can be used to identify the individual element being referenced.

### Examples

```html
<div _="on click tell <p/> in me add .highlight end">
    Clicking this will add the .highlight class
    to every <p> tag within this element.
</div>

<div _="on click tell <.hidden/> remove yourself then end">
    Clicking this will remove all elements with the .hidden class
</div>
```
