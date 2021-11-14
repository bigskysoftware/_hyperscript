
## The `let` Feature

### Syntax

```ebnf
  let <symbol> [be|=] <expression>
```

### Description

The `let` features allows you to define a new [element-scoped]((/docs#variables_and_scope)) variable.  The variable
must be element scoped, either with an explicit `element` scope modifier, or with the `:` prefix.

### Example

```html
<div _='let :theAnswer be 42
        on click put :theAnswer into my innerHTML'></div>
```
