
## The `init` Feature

### Syntax

```ebnf
init [immediately]
  {<command>}
end
```

The `init` keyword allows you to run some hyperscript when an element initializes.  By default, it will execute after
all features have been evaluated.  If you add the `immedately` modifier, it will run immediately.

```html
<div _="init wait 2s then add .explode">
  This div will explode after 2 seconds...
</div>
```
