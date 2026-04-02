---
title: send - ///_hyperscript
---

## The `send`/`trigger` Command

The `send` command fires an event at a target element. You can pass data along with the event using named arguments, which are available on `event.detail`.

The `trigger` keyword is an equivalent alternative -- use whichever reads more naturally.

### Examples

```html
<div _="on click send doIt(answer:42) to #div1">Send an event</div>
<div
  id="div1"
  _="on doIt(answer) put `The answer is $answer` into my.innerHTML"
>
  Check the console for the answer...
</div>

<div _="on click trigger doIt(answer:42) end
        on doIt(answer) log `The answer is $answer`">
  Click Me!
</div>
```

### Syntax

```ebnf
send <event-name>[(<named-arguments>)] [to <expression>]
trigger <event-name>[(<named-arguments>)] [on <expression>]
```
