---
title: add - ///_hyperscript
---

## The `add` Command

### Syntax

```ebnf
add <class-ref+ or attribute-ref or object-literal> [to <target-expression>] [where <expr>]
```

### Description

The `add` command allows you to add a class (via a [class ref](/expressions/class-reference)), an attribute
(via an [attribute ref](/expressions/attribute-ref)) or CSS attributes (via an object literal) to either the current element or to another element.

The `where` clause allows you filter what elements have the class or property added in the `target`.  The expression will be evaluated for
each element in `target` and, if the result is true, the element class or property will be added.  If it is false, the class
or property will be removed.  The `it` symbol will be set to the current element, allowing you to express conditions against each element
in `target`.  Note that this clause only works with classes and properties.

### Examples

```html
<div _="on click add .clicked">Click Me!</div>

<div _="on click add .clicked to #another-div">Click Me!</div>

<button _="on click add @disabled">Disable Me!</button>

<input
  type="color"
  _="on change add { --accent-color: my.value } to document.body"
/>

<button _="on click add [@disabled='true'] to <button/> when it is not me">Disable Other Buttons</button>

<button _"on click add .{'-foo-bar'} to #that">Add Class With A Dash Prefix!</button>

```
