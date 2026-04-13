---
title: toggle - ///_hyperscript
---

## The `toggle` Command

The `toggle` command flips classes, attributes, or visibility on and off.

You can toggle:

* A class or set of classes (via a [class ref](/expressions/class-reference))
* An attribute (via an [attribute ref](/expressions/attribute-ref))
* The visibility of an element via `opacity`, `visibility`, or `display`
* Any writable value between a list of values with `between`

The target defaults to the current element, or you can specify one with `on` (for classes/attributes) or `of` (for visibility).

Use `toggle between .class1 and .class2` to flip between two classes, or `toggle between @attr1='val1' and @attr2='val2'` to flip between two attributes.

If you provide `for <time expression>`, the toggle reverts after that duration. If you provide `until <event name>`, it reverts when that event is received.

### Examples

Toggle a class on the current element:

```html
<button _="on click toggle .toggled">Toggle Me!</button>
```

Toggle a class on another element:

```html
<div _="on click toggle .toggled on #another-div">Toggle Another Div!</div>
```

Toggle an attribute:

```html
<button _="on click toggle @disabled='true'">Toggle Disabled!</button>
```

Toggle with a timeout - reverts after the duration:

```html
<div _="on click toggle .toggled for 2s">Toggle for 2 seconds</div>
```

Toggle until an event:

```html
<div _="on mouseenter toggle .visible on #help until mouseleave">
  Mouse Over Me!
</div>
<div id="help">I'm a helpful message!</div>
```

Toggle between two classes:

```html
<button _="on click toggle between .enabled and .disabled">
  Toggle Me!
</button>
```

Toggle visibility of another element:

```html
<button _="on click toggle *display of the next <div/>">
  Toggle Me!
</button>
```

### Cycling Between Values

Use `between` with a style property or any writable expression to cycle through a list of values.  Each click (or trigger) advances to the next value, wrapping around to the first.

Toggle a style property between specific values:

```html
<button _="on click toggle *display of #panel between 'none' and 'flex'">
  Toggle Panel
</button>

<button _="on click toggle *opacity of me between '0', '0.5' and '1'">
  Cycle Opacity
</button>
```

Toggle a global variable between values:

```html
<button _="on click toggle $mode between 'edit' and 'preview'">
  Switch Mode
</button>
```

Cycle through three or more values:

```html
<button _="on click toggle $theme between 'light', 'dark' and 'auto'">
  Cycle Theme
</button>
```

Toggle a property on an element:

```html
<button _="on click toggle my.textContent between 'On' and 'Off'">
  On
</button>
```

### Syntax

```ebnf
toggle <class-ref>+ [on <expression>]
toggle <attribute-ref> [on <expression>]
toggle between <class-ref> and <class-ref> [on <expression>]
toggle between <attribute-ref> and <attribute-ref> [on <expression>]
toggle [the | my] <visibility> [of <expression>]
toggle [the | my] <visibility> [of <expression>] between <value>[, <value>] and <value>
toggle <assignable-expression> between <value>[, <value>] and <value>

Options: [for <time-expression> | until <event-name> [from <expression>]]
```
