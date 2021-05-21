---
layout: layout.njk
title: ///_hyperscript
---

## The `settle` Command

### Syntax

```ebnf
  settle [<expression>]
```

### Description

The `settle` command allows you to synchronize on the CSS transition of an element.  It will listen for the
`transitionend` even on the given element (or `me` if no element is given).

If a `transitionstart` event is not received within 500ms, the command will continue assuming that no
transition will occur.

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
<div id="pulsar"
     _="on load repeat 6 times 
                toggle .red then settle">
    You thought the blink tag was dead?
</div>
```
