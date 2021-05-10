
## The `throw` Command

### Syntax

```ebnf
throw <expression> 
```

### Description

The `throw` command throws an exception.

### Examples

```html
<script type="text/hyperscript">
def throwsIfTrue(value)
  if value throw "Yep!"
end
</script>
