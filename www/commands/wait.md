---
layout: layout.njk
title: ///_hyperscript
---

## The `wait` Command

### Syntax

`wait <time-expr>`

### Description

The `wait` command waits the given amount of time, which can be in the following formats:

* `10` - 10 milliseconds
* `100ms` - 100 milliseconds
* `1s` - 1000 milliseconds

This command is asynchronous.  All commands that follow it will be delayed until the wait timeout completes.

### Examples

```html
<div _='on click ajax GET /example then put response into my.innerHTML'>
  Get from /example!
</div>

<div _='on click ajax POST {answer:42} to /example then put response into my.innerHTML'>
  Post to /example!
</div>
```  