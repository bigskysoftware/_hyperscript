---
layout: layout.njk
title: ///_hyperscript
---

## The `wait` Command

### Syntax

`wait for <event> [from <source>]`

`wait <time-expr>`

### Description

The `wait` command can either wait for an event to occur or for a fixed amount of time

In the form `wait for <event> [from <source>]` the hyperscript will pause until the element receives the specified event. 

In the `wait <time-expr>` form, it waits the given amount of time, which can be in the following formats:

* `10` - 10 milliseconds
* `100 ms` - 100 milliseconds
* `100 milliseconds` - 100 milliseconds
* `1 s` - 1000 milliseconds
* `1 seconds` - 1000 milliseconds

This command is asynchronous.  All commands that follow it will be delayed until the wait completes.

### Examples

```html
<div _='on click add .example then wait for '>
  Add the class, then wait for the transition to complete 
</div>

<div _='on click add .example then wait 2s then remove .example'>
  Add and then remove a class
</div>
```  