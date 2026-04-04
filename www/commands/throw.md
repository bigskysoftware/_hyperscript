---
title: throw - ///_hyperscript
---

## The `throw` Command

The `throw` command throws an exception, just like in JavaScript.

### Examples

```html
<script type="text/hyperscript">
  def throwsIfTrue(value)
    if value throw "Yep!"
  end
</script>
```

### Syntax

```ebnf
throw <expression>
```
