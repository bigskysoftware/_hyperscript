
## The `send` Command

### Syntax

```ebnf
 send <event-name>[(<named arguments)] [to <expression>]
```

### Description

The `send` command sends an event to the given target. Arguments can optionally provided in a named argument list
and will be passed in the `event.detail` object.

### Examples

```html
<div _="on click send doIt(answer:42) to #div1">Send an event</div>
<div
  id="div1"
  _="on doIt(answer) put 'The answer is $answer' into my.innerHTML"
>
  Check the console for the answer...
</div>
```
