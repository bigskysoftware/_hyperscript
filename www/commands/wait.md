---
title: wait - ///_hyperscript
---

## The `wait` Command

The `wait` command pauses execution for a set amount of time or until an event fires. This command is asynchronous -- everything after it is delayed until the wait completes.

### Waiting for Time

In the `wait <time>` form, you can use these formats:

- `10` -- 10 milliseconds
- `100 ms` -- 100 milliseconds
- `100 milliseconds` -- 100 milliseconds
- `1 s` -- 1000 milliseconds
- `1 seconds` -- 1000 milliseconds

### Waiting for Events

In the `wait for <event>` form, execution pauses until the element receives the specified event. You can wait for multiple events with `or`, and destructure event properties into local variables using `eventName(property1, property2, ...)`.

### Mixing Timeouts and Events

You can combine both forms, which is useful to avoid waiting forever:

```hyperscript
-- Fail if the thing doesn't load after 1s.
wait for load or 1s
if the result is not an Event
  throw 'Took too long to load.'
end

-- Parens are required for dynamic timeouts.
wait for click or (config.clickTimeout) ms
```

### Examples

```html
<div _="on click add .example then wait for transitionend">
  Add the class, then wait for the transition to complete
</div>

<div _="on click add .example then wait 2s then remove .example">
  Add and then remove a class
</div>

<div
  _="wait for mousemove(clientX, clientY) or mouseup(clientX, clientY) from document"
>
  Mouse Dragging...
</div>
```

### Syntax

```ebnf
wait <time-expression>
wait for <event-name> [from <expression>] (or <event-name> [from <expression>])*
wait for <event-name> or <time-expression>
```
