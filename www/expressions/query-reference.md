---
title: query reference - ///_hyperscript
---

## The `query reference` Expression

A query reference lets you embed an arbitrary [CSS selector](https://www.w3schools.com/cssref/css_selectors.asp) directly in your hyperscript. It evaluates to all matching elements.

### Examples

```html
<div _="on click add .clicked to <button/>">Add .clicked to all buttons</div>

<div _="on click add .clicked to <button:not(.clicked)/>">
  Add .clicked to all buttons that don't have .clicked on it already...
</div>
```

### Syntax

```ebnf
<<css-selector>/>
```
