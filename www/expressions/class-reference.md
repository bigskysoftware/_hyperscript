---
title: class reference - ///_hyperscript
---

## The `class reference` Expression

A class reference uses CSS selector syntax to refer to a class. It typically evaluates to a NodeList of all elements with that class, unless it's used on the right-hand side of an assignment (where it refers to the class itself).

### Examples

```html
<div _="on click add .clicked">Add the .clicked class to me!</div>

<div _="on click log .clicked">
  Log all elements with the clicked class on it in the DOM
</div>
```

### Syntax

```ebnf
.<class-name>
```
