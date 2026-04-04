---
title: add - ///_hyperscript
---

## The `add` Command

The `add` command lets you add a CSS class, an HTML attribute, or inline CSS properties to an element. If you don't specify a target, it applies to the current element.

You can add classes via a [class ref](/expressions/class-reference), attributes via an [attribute ref](/expressions/attribute-ref), or CSS properties via an object literal.

The `when` clause lets you filter which elements in the target actually get the addition. The expression is evaluated for each element in the target — if it returns true, the value is added; if false, the value is removed. The `it` symbol is set to the current element being evaluated, so you can express conditions against each element.

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

### Syntax

```ebnf
add (<class-ref>+ | <attribute-ref> | <object-literal>) [to <target-expression>] [when <expression>]
```
