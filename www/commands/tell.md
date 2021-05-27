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

You can refer to the target as `you`, `your` or `yourself`

### Examples

```html
<div
  _="on click tell <p/> in me 
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
