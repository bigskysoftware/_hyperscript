---
title: toggle - ///_hyperscript
---

## The `toggle` Command

The `toggle` command flips classes, attributes, or visibility on and off -- the simplest way to create interactive UI.

You can toggle:

* A class or set of classes (via a [class ref](/expressions/class-reference))
* An attribute (via an [attribute ref](/expressions/attribute-ref))
* The visibility of an element via `opacity`, `visibility`, or `display`

The target defaults to the current element, or you can specify one with `on` (for classes/attributes) or `of` (for visibility).

Use `toggle between .class1 and .class2` to flip between two classes, or `toggle between @attr1='val1' and @attr2='val2'` to flip between two attributes.

If you provide `for <time expression>`, the toggle reverts after that duration. If you provide `until <event name>`, it reverts when that event is received.

### Examples

```html
<button _="on click toggle .toggled">Toggle Me!</button>

<div _="on click toggle .toggled on #another-div">Toggle Another Div!</div>

<button _="on click toggle [@disabled='true']">Toggle Disabled!</button>

<div _="on click toggle .toggled for 2s">Toggle for 2 seconds</div>

<div _="on mouseenter toggle .visible on #help until mouseleave">
  Mouse Over Me!
</div>
<div id="help">I'm a helpful message!</div>

<button _="on click toggle between .enabled and .disabled">
  Toggle Me!
</button>

<button _="on click toggle *display of the next <div/>">
  Toggle Me!
</button>
```

### Syntax

```ebnf
toggle <class-ref>+ [on <expression>]
toggle <attribute-ref> [on <expression>]
toggle between <class-ref> and <class-ref> [on <expression>]
toggle between <attribute-ref> and <attribute-ref> [on <expression>]
toggle [the | my] <visibility> [of <expression>]

Options: [for <time-expression> | until <event-name> [from <expression>]]
```
