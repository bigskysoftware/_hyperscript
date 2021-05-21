---
layout: layout.njk
title: ///_hyperscript
---

## The `query reference` Expression

### Syntax

`<<css query>/>'

### Description

The query reference expression allows you to embed arbitary [CSS selectors](https://www.w3schools.com/cssref/css_selectors.asp) in hyperscript.  It will evaluate to all matching elements.

### Examples

```html
<div _="on click add .clicked to <button/>">
  Add .clicked to all buttons
</div>

<div _="on click add .clicked to <button:not(.clicked)/>">
  Add .clicked to all buttons that don't have 
  .clicked on it already...
</div>
```
