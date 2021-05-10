
## The `toggle` Command

### Syntax

```ebnf
toggle ({<class-ref>} | attribute-ref | between <class-ref> and <class-ref>)
 [on <expression>] 
  [(for <time expression>) | 
   (until <event name> [from <expression>]]`
```

### Description

The `toggle` command allows you to toggle a class or set of classes (via a [class ref](/expresssions/class-ref)) or an attribute
(via an [attribute ref](/expresssions/attribute-ref)) on either the current element or, if a [target expression](/expressions/target)
is provided, to the targeted element(s).

You can also use the form `toggle between .class1 and .class2` to flip between two classes.

If you provide a `for <time expression>` the class or attribute will be
toggled for that amount of time.

If you provide an `until <event name>` the class or attribute will be
toggled until the given event is received.

### Examples

```html
<div _="on click toggle .toggled">
  Toggle Me!
</div>

<div _="on click toggle .toggled on #another-div">
  Toggle Another Div!
</div>

<button _="on click toggle [disabled='true']">
  Toggle Disabled!
</button>

<div _="on click toggle .toggled for 2s">
  Toggle for 2 seconds
</div>

<div _="on mouseenter toggle .visible on #help until mouseleave">
  Mouse Over Me!
</div>
<div id="help"> I'm a helpful message!</div>

<div _="on click toggle between .enabled and .disabled">
  Toggle Me!
</div>
```
