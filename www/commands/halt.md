---
title: halt - ///_hyperscript
---

## The `halt` Command

The `halt` command prevents an event from bubbling and/or performing its default action. Depending on the form you use, it may also exit the current event handler.

Here are the different forms:

- `halt` -- halts both bubbling and default, then exits the event handler (like [`exit`](/commands/return))
- `halt the event` -- halts both bubbling and default, but continues execution of the handler
- `halt the event's bubbling` -- halts only bubbling, continues execution
- `halt the event's default` -- halts only the default action, continues execution
- `halt bubbling` -- halts only bubbling, then exits the handler
- `halt default` -- halts only the default action, then exits the handler

### Examples

```html
<script type="text/hyperscript">
  on mousedown
    halt the event -- prevent text selection...
    -- do other stuff...
  end
</script>
```

### Syntax

```ebnf
halt [the event['s] (bubbling | default)]
halt [(bubbling | default)]
```
