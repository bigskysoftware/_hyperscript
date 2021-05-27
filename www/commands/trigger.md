---
layout: layout.njk
title: ///_hyperscript
---

## The `trigger` Command

### Syntax

```ebnf
trigger <event-name>[(<named-arg-list)]
```

### Description

The `trigger` is similar to the [`send` command](/commands/send) but triggers the event on the current element.

Arguments can optionally provided in a named argument list and will be passed in the `event.detail` object.

### Examples

```html
<div
  _="on click trigger doIt(answer:42)
        on doIt(answer) log 'The answer is $answer'"
>
  Click Me!
</div>
```
