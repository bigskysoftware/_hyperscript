---
title: clear - ///_hyperscript
---

## The `clear` Command

### Syntax

```ebnf
clear <expression> [from <expression>]
```

### Description

The `clear` command allows you to clear an element's children or content.

### Examples

```html
<div _="on click clear me">Clear Me!</div>

<div _="on click clear the first <span/>">Clear This <span>Span</span> Content!</div>

<div _="on click clear <p/>">
    Clear <p>This</p> <span>Not This</span> <p>This Too</p>!
</div>

<div _="on click clear #another-div">
  Clear Another Div!
</div>

```
