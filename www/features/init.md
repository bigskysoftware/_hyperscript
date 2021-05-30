
## The `init` Feature

### Syntax

```ebnf
init
  {<command>}
end
```

The `init` keyword allows you to run some hyperscript immediately when an element initializes.

```html
<div _="init wait 2s then add .explode">
  This div will explode after 2 seconds...
</div>
```
