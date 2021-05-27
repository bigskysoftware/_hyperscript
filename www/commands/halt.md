---
layout: layout.njk
title: ///_hyperscript
---

## The `halt` Command

### Syntax

```ebnf
halt [the event['s]] (bubbling|default)
exit
```

### Description

The `halt` command prevents an event from bubbling and/or from performing its default action.

The form `halt the event` will halt both the bubbling and default for the event, but continue execution of the
event handler

The form `halt the event's (bubbling|default)` will halt both the bubbling or the default for the event, but continue
execution of the event handler

The form `halt` will halt both the bubbling and default for the event and exit the current event handler, acting the same
as the [`exit`](/commands/return) command.

The form `halt (bubbling|default)` will halt either the bubbling or the default for the event and exit the current event
handler, acting the same as the [`exit`](/commands/return) command.

### Examples

```html
<script type="text/hyperscript">
  on mousedown
    halt the event -- prevent text selection...
    -- do other stuff...
  end
</script>
```
