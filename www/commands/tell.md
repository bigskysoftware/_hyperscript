---
title: tell - ///_hyperscript
---

## The `tell` Command

The `tell` command temporarily changes the default target for commands like `add`, `remove`, and `toggle` within its block. It's useful when you want to run several commands against the same target.

Within a `tell` block, you can use `you`, `your`, and `yourself` to refer to the individual element being acted on.

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

### Syntax

```ebnf
tell <expression>
  <commands>
end
```
