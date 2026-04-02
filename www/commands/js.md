---
title: js - ///_hyperscript
---

## The `js` Command (inline)

**Note:** This page is about the inline JS command. \_hyperscript also supports [JS blocks at the top level](/features/js/).

The `js` command lets you embed JavaScript code directly in your hyperscript. The return value of the JS block becomes `it` for the next command. If the block returns a promise, the following hyperscript code will wait for it to resolve.

`this` inside a `js` block is the global scope (`window`, or `self` in workers).

### Passing Variables

If your JS block needs to use variables from the surrounding hyperscript, you must explicitly declare them in a parameter list:

```html
<button
  _="on click
           set text to #input.value
           js(me, text)
               if ('clipboard' in window.navigator) {
               	 return navigator.clipboard.writeText(text)
               	   .then(() => 'Copied')
               	   .catch(() => me.parentElement.remove(me))
               }
           end
           put message in my.innerHTML "
></button>
```

### Examples

```html
<button
  _="on click
           js
               if ('clipboard' in window.navigator) {
               	 return navigator.clipboard.readText()
               }
           end
           put it in my.innerHTML "
></button>
```

{% include "js_end.md" %}

### Syntax

```ebnf
js [(<param-list>)] <js-body> end
```

- `<param-list>` -- comma-separated list of hyperscript variable names to pass into the JS block
- `<js-body>` -- JavaScript code whose return value becomes `it`
