
## The `return` Command

### Syntax

```ebnf
return <expression>
exit
```

### Description

The `return` command returns a value from a function in hyperscript or stops an event handler from continuing.

You may use the `exit` form to return no value.

### Examples

```html
<script type="text/hyperscript">
  -- return the answer
  def theAnswer()
    return 42
  end
</script>
```
