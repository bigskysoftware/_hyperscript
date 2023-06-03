---
title: take - ///_hyperscript
---

## The `take` Command

### Syntax

```ebnf
 take <class-ref or attribute-ref [with <expression>]> [from <expression>] [for <expression>]
```

### Description

The `take` command allows you to take a class or an attribute from a set of elements (or all elements) and add it to the current element (or the targeted element).

When using `take` with attributes, elements matching `from` expression will have their attributes with the same name removed regardless of value.
You can specify a new value to be assigned instead via `with` clause (in this case the attribute will be added even if the element didn't have it originally).
### Examples

```html
<div _="on click take .active">Activate Me!</div>

<div _="on click take .active from .tab for event.target">
  <a class="tab active">Tab 1</a>
  <a class="tab">Tab 2</a>
  <a class="tab">Tab 3</a>
</div>

<div _="on click take [@aria-curent=page] from .step for event.target">
  <a class="step">Step 1</a>
  <a class="step">Step 2</a>
  <a class="step">Step 3</a>
</div>

<div _="on click take [@aria-selected=true] with 'false' from .item for event.target">
  <a class="item">Option 1</a>
  <a class="item">Option 2</a>
  <a class="item">Option 3</a>
</div>
```
