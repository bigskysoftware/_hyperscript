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
<div _="on click tell <p/> in me
                   add .highlight -- adds the highlight class to each p
                                  -- found in this element...
                   log your textContent
                 end "
>
  Click to highlight paragraphs
  <p>Hyperscript is cool!</p>
  <p>Sure is!</p>
</div>
```
