---
layout: layout.njk
title: ///_hyperscript
---

## The `take` Command

### Syntax

`take <class-ref> [from <target-expression>] [for <target-expression>]`

### Description

The `take` command allows you to take a class from a set of elements (or all elements) and add it to the
current element (or the targeted element).

### Examples

```html
<div _="on click take .active">Activate Me!</div>

<div _="on click take .active from .tab for event.target">
    <a class="tab active">Tab 1</a>
    <a class="tab">Tab 2</a>
    <a class="tab">Tab 3</a>
</div>
```