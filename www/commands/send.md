---
layout: layout.njk
title: ///_hyperscript
---

## The `send` Command

### Syntax

`send <event-name>[(<named-arg-list)] [to <target-expr>] `

### Description

The `send` command sends an event to the given target.  Arguments can optionally provided in a named argument list 
and will be passed in the `event.detail` object.

### Examples

```html
<div _="on click send doIt(answer:42) to #div1">Click Me!</div>
<div id="div1" _="on doIt(answer) log 'The answer is ' + answer">Check the console for the answer...</div>
```