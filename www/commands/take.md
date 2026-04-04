---
title: take - ///_hyperscript
---

## The `take` Command

The `take` command removes a class or attribute from a set of elements and adds it to the targeted element -- perfect for "active tab" or "selected item" patterns.

When using `take` with attributes, elements matching the `from` expression have the attribute removed regardless of value. You can specify a replacement value with the `with` clause (in which case the attribute is added even if the element didn't have it originally).

### Examples

```html
<div _="on click take .active">Activate Me!</div>

<div _="on click take .active from .tab for the event's target">
  <a class="tab active">Tab 1</a>
  <a class="tab">Tab 2</a>
  <a class="tab">Tab 3</a>
</div>

<div _="on click take [@aria-current=page] from .step for the event's 'target">
  <a class="step">Step 1</a>
  <a class="step">Step 2</a>
  <a class="step">Step 3</a>
</div>

<div _="on click take [@aria-selected=true] with 'false' from .item for the event's 'target">
  <a class="item">Option 1</a>
  <a class="item">Option 2</a>
  <a class="item">Option 3</a>
</div>
```

### Syntax

```ebnf
take (<class-ref>+ | <attribute-ref> [with <expression>]) [from <expression>] [for <expression>]
```
