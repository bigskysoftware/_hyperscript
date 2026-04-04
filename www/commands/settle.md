---
title: settle - ///_hyperscript
---

## The `settle` Command

The `settle` command pauses execution until a CSS transition completes on an element. If no element is specified, it settles on `me`.

If no `transitionstart` event is received within 500ms, the command continues, assuming no transition will occur.

### Examples

```html
<style>
  #pulsar {
    transition: all 800ms ease-in-out;
  }
  .red {
    background: red;
  }
</style>
<div
  id="pulsar"
  _="on load repeat 6 times
                toggle .red then settle"
>
  You thought the blink tag was dead?
</div>
```

### Syntax

```ebnf
settle [<expression>]
```
