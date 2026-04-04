---
title: return - ///_hyperscript
---

## The `return` Command

The `return` command returns a value from a function or stops an event handler from continuing. You can use `exit` to return without a value.

### Examples

```html
<script type="text/hyperscript">
  -- return the answer
  def theAnswer()
    return 42
  end
</script>
```

### Syntax

```ebnf
return <expression>
exit
```
