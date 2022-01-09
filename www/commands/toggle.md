
## The `toggle` Command

### Syntax

```ebnf
toggle ({<class-ref>} | <attribute-ref> | between <class-ref> and <class-ref>)
 [on <expression>]
  [(for <time expression>) |
   (until <event name> [from <expression>]]`

toggle [the | my] ('*opacity' | '*visibility' | '*display')
 [of <expression>]
  [(for <time expression>) |
   (until <event name> [from <expression>]]`
```

### Description

The `toggle` command allows you to toggle:

 * A class or set of classes (via a [class ref](/expresssions/class-reference))

* An attribute (via an [attribute ref](/expressions/attribute-ref))

* Or the visibility of an element via `opacity`, `visibility` or `display`

on either the current element or, if a [target expression](/expressions)
is provided, to the targeted element(s).

You can use the form `toggle between .class1 and .class2` to flip between two classes.

If you provide a `for <time expression>` the class or attribute will be toggled for that amount of time.

If you provide an `until <event name>` the class or attribute will be toggled until the given event is received.

### Examples

```html
<button _="on click toggle .toggled">Toggle Me!</button>

<div _="on click toggle .toggled on #another-div">Toggle Another Div!</div>

<button _="on click toggle [disabled='true']">Toggle Disabled!</button>

<div _="on click toggle .toggled for 2s">Toggle for 2 seconds</div>

<div _="on mouseenter toggle .visible on #help until mouseleave">
  Mouse Over Me!
</div>
<div id="help">I'm a helpful message!</div>

<button _="on click toggle between .enabled and .disabled">
  Toggle Me!
</button>

<button _="on click toggle *display on the next <div/>">
  Toggle Me!
</button>
```
