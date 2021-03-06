---
layout: layout.njk
title: ///_hyperscript
---

## The `with` Command

### Syntax

```ebnf
with expression
```

### Description

The `with` command can be used to temporarily create a new value
for `me`, and, therefore a new default for commands like
`add`

### Examples

```html
<div _='on click with <p/> in me 
                   add .highlight -- adds the highlight class to each p
                                  -- found in this element...
                 end '>
  Click to highlight paragraphs
  <p>Hyperscript is cool!</p>
  <p>Sure is!</p>
</div>
```  