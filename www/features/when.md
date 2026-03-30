---
title: when - ///_hyperscript
---

## The `when` Feature

The `when` feature runs commands in response to a value change. Use it when you need to
*react* with side effects or chained effects.

For declaring relationships (derived values, DOM updates), see [`live`](/features/live).
For two-way sync, see [`bind`](/features/bind).

### Syntax

```ebnf
when <expression> [or <expression>]* changes
    {<command>}
[end]
```

### Description

The `when` feature watches an expression and runs its body whenever the expression's value changes.
The `it` keyword inside the body refers to the new value of the expression.

If the watched expression already has a value when the feature is installed,
the body fires immediately for initial synchronization. If the value is `undefined`
or `null`, the body waits until the first write.

When the element is removed from the DOM, the reactive effect is automatically cleaned up.

### Examples

A variable that can be changed from multiple places. The display doesn't know or care
how `$count` was changed:

```html
<button _="on click increment $count">+1</button>
<button _="on click decrement $count">-1</button>
<button _="on click set $count to 0">Reset</button>
<output _="when $count changes put it into me">0</output>
```

Chained effects where one derived value drives another:

```html
<div _="when $source changes set $derived to (it * 2)"></div>
<div _="when $derived changes put it into me"></div>
```

Watching a compound expression across multiple inputs:

```html
<span _="when (#price's value * #qty's value) changes
             put '$' + it into me"></span>
```

### Watching Variables

Global variables (`$foo`) and element-scoped variables (`:bar`) are reactive.

```html
<div _="when $username changes put it into me"></div>
```

```html
<div _="init set :count to 0 end
        when :count changes put it into me end
        on click increment :count">0</div>
```

### Watching Properties and Attributes

Element properties and attributes are tracked automatically. Unlike `on input` or `on change`,
reactive tracking also detects programmatic assignments (e.g. `set #input's value to 'x'`):

```html
<span _="when #name-input's value changes put it into me"></span>

<div data-title="hello" _="when @data-title changes put it into me"></div>
```

### Multiple Expressions with `or`

You can watch multiple independent expressions separated by `or`. The body runs when any of them
changes, and `it` refers to the value of the expression that triggered the change.

```html
<div _="when $x or $y changes put it into me"></div>
```

### Batching

Multiple synchronous writes are batched into a single effect run. If a handler sets `$x` and
`$y` in the same execution, an effect watching both will only fire once, after both writes
complete.

### Notes

Style references (`*opacity`, `*computed-width`) are not tracked. To react to
visual changes, track the variable or class that drives the style instead.
