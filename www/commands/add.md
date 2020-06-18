## The `add` Command

### Syntax

`add <class-ref or attribute-ref> [to <target-expression>]`

### Description

The `add` command allows you to add a class (via a [class ref](/expresssions/class-ref)) or an attribute
(via an [attribute ref](/expresssions/attribute-ref)) to either the current element or, if a [target expression](/expressions/target)
is provided, to the targeted element(s).

### Examples

```html

<div _="on click add .clicked">Click Me!</div>

<div _="on click add .clacked to #another-div">Click Me!</div>

<button _="on click add [disabled='true']">Disable Me!</button>

```