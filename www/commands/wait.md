
## The `wait` Command

### Syntax

```ebnf
wait (<time expression> | for (<event> [from <source>]) [or ...] )
```

### Description

The `wait` command can either wait for an event to occur or for a fixed amount of time

In the form `wait for <event> {or <event>} [from <source>]` the hyperscript will pause until the element receives
any of the specified events.

Events may destructure properties into local variables using the `eventName(property1, property2, ...)` form.

In the `wait <time-expr>` form, it waits the given amount of time, which can be in the following formats:

- `10` - 10 milliseconds
- `100 ms` - 100 milliseconds
- `100 milliseconds` - 100 milliseconds
- `1 s` - 1000 milliseconds
- `1 seconds` - 1000 milliseconds

You can also mix timeouts and delays, which can be useful to avoid waiting forever for an event:

```hyperscript
-- Fail if the thing doesn't load after 1s.
wait for load or 1s 
if the result is not an Event
  throw 'Took too long to load.'
end

-- Parens are required for dynamic timeouts.
wait for click or (config.clickTimeout) ms
```

This command is asynchronous. All commands that follow it will be delayed until the wait completes.

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
