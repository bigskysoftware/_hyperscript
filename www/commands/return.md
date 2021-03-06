---
layout: layout.njk
title: ///_hyperscript
---

## The `return` Command

### Syntax

```ebnf
return <expression>
```

### Description

The `return` command returns a value from a function in hyperscript

### Examples

```html
<script type="text/hyperscript">
-- return the answer
def theAnswer()
  return 42
end
</script>
```