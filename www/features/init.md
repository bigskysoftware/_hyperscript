---
title: init - ///_hyperscript
---

## The `init` Feature

The `init` feature runs hyperscript when an element is first initialized. By default it executes after all other features on the element have been evaluated. If you add the `immediately` modifier, it runs right away -- but note that features defined after the `init` (e.g. functions) won't be available yet.

### Examples

```html
<div _="init wait 2s then add .explode">
  This div will explode after 2 seconds...
</div>
```

### Syntax

```ebnf
init [immediately]
  <command>+
end
```
