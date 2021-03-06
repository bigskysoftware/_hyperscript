---
layout: layout.njk
title: ///_hyperscript
---

## The `time` Expression

### Syntax

```
  <number> ['ms', 'milliseconds', 's', 'seconds']
```

### Description

The time expression can be used in some commands to express a number of milliseconds in a clearer manner.  

If the numeric value is followed by `s` or `seconds` the number will be multiplied by 1000

### Examples

```html
<div _="on click wait 2s then log 'hello world'">Hello World!</div>
```