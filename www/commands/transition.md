---
layout: layout.njk
title: ///_hyperscript
---

## The `transition` Command

### Syntax

```ebnf
transition [<transition target>]
  {<property name> [from <string>} to <string>}
[over <time expression> | using <expression>]
```

### Description

The `transition` command allows you to transition properties on an element from one value to another.

If you use the form `transition <transition target>` the transition will take place on the specified target, otherwise
it is done on the current `me`.

The transition target can be a pseudo-possessive:

```hyperscript
  transition my opacity to 0
  transition the div's opacity to 0
  transition #anotherDiv's opacity to 0
  transition .aClass's opacity to 0
```

If the target is a symbol it will need to be preceded by a `the` or the keyword `element` to distinguish the symbol from a
property name:

```
  transition element foo's opacity to 0
```

Following the start is a series of transitions, starting with a style property name, followed optionally by
a `from` and an initial value. If this is omitted, the current calculated value of the property is used.

Next comes a required `to` followed by a final value to transition the property too. Note that you can use
either strings or naked strings.

You can optionally set the transition time by using the `over` clause and passing in a time expression such as
`500ms` or `2 seconds`.

Finally, if you don't specify a transition time, you can optionally set the transition style by using the `using`
clause and passing in a string that specifies a transformation specification, e.g. `all 1s ease-in`.

By default, hyperscript will use the value specified in `_hyperscript.config.defaultTransition`, which is
set to `all 500ms ease-in`. You may update this property to change the default.

The transition command provides a special value, `initial` that can be used. When a transition first
occurs on an element it will snapshot the original value of that style property and keep it for future
reference via the `initial` keyword.

Note that this command is asynchronous and will block until the transition ends.

### Examples

```html
<div _="on click transition my opacity to 0 then remove me">
  Fade then remove me
</div>
```
