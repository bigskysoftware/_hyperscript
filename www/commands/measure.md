
## The `measure` Command

### Syntax

```ebnf
 measure <possessive> [measurement {, measurement}
```

### Description

The `measure` command gets the measurements for a given element using `getBoundingClientRect()` as well as the
`scroll*` properties. It will place the result into the `result` variable.

You may also specify particular measurements to be saved into local variables, by name.

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
