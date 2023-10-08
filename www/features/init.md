---
title: init - ///_hyperscript
---

## The `init` Feature

### Syntax

```ebnf
init [immediately]
  {<command>}
end
```

The `init` keyword allows you to run some hyperscript when an element initializes.  By default, it will execute after
all features have been evaluated.  If you add the `immediately` modifier, it will run immediately, which can be useful
from a timing perspective, but note that features defined after the `init` (e.g. functions) will not be available.

```html
<div _="init wait 2s then add .explode">
  This div will explode after 2 seconds...
</div>
```
