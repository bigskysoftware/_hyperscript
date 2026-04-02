---
title: measure - ///_hyperscript
---

## The `measure` Command

The `measure` command gets measurements for a given element using `getBoundingClientRect()` and the `scroll*` properties. The full result goes into the `result` variable, but you can also specify particular measurements to save into local variables by name.

The available measurements are:

- x
- y
- left
- top
- right
- bottom
- width
- height
- bounds
- scrollLeft
- scrollTop
- scrollLeftMax
- scrollTopMax
- scrollWidth
- scrollHeight
- scroll

### Examples

```html
<div _="on click measure me then log it">Click Me To Measure</div>

<div _="on click measure my top then log top">Click Me To Measure My Top</div>
```

### Syntax

```ebnf
measure <possessive> [<measurement> (, <measurement>)*]
```
