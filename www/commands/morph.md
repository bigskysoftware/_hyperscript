---
title: morph - ///_hyperscript
---

## The `morph` Command

The `morph` command morphs an existing DOM element to match new content, updating only the differences rather than replacing the entire element. This preserves event listeners, focus state, and other DOM properties that would be lost with a full replacement.

### Examples

```html
<button _="on click morph #greeting to '<h1>Hello World!</h1>'">
  Morph It
</button>
<div id="greeting"><h1>Hi!</h1></div>
```

### Syntax

```ebnf
morph <expression> to <expression>
```
