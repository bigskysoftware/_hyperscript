---
title: when - ///_hyperscript
---

## The `when` Feature

The `when` feature allows you to run commands whenever an expression's value changes. The runtime
automatically tracks what the expression reads and re-evaluates it when any dependency changes.

### Syntax

```ebnf
when <expression> [or <expression>]* changes
    {<command>}
[end]
```

### Description

The `when` feature watches an expression and runs its body whenever the expression's value changes.
The `it` keyword inside the body refers to the new value of the expression.

If the watched expression already has a value (not `undefined`) when the feature is installed,
the body fires immediately for initial synchronization. If the value is `undefined`, the body
waits until the first write.

When the element is removed from the DOM, the reactive effect is automatically cleaned up.

### Watching Element Properties

You can watch any element's properties directly.

```html
<input type="text" id="name" />
<h1 _="when #name.value changes
           put it into me"></h1>
```

```html
<input type="checkbox" id="toggle" />
<div _="when #toggle.checked changes
            if it is true
                add .active to me
            else
                remove .active from me
            end"></div>
```

Property changes are detected through both user interaction (via `input`/`change` events)
and programmatic changes.

### Watching Attributes

Attribute references (`@data-foo`) are tracked via MutationObserver.

```html
<div data-title="hello"
     _="when @data-title changes
            put it into me"></div>
```

### Watching Variables

Global variables (`$foo`) and element-scoped variables (`:bar`) are also reactive.

```html
<div _="when $username changes
            put it into me"></div>
```

```html
<div _="init set :count to 0 end
        when :count changes
            put it into me
        end
        on click increment :count">0</div>
```

### Compound Expressions

Dependency tracking is automatic, so compound expressions work naturally. The runtime tracks every
value the expression reads and re-evaluates when any of them changes.

```html
<div _="when ($x + $y) changes
            put it into me"></div>
```

If the computed result is unchanged (e.g. `$x` goes from 3 to 5 while `$y` goes from 7 to 5),
the body does not run.

### Multiple Expressions with `or`

You can watch multiple independent expressions separated by `or`. The body runs when any of them
changes, and `it` refers to the value of the expression that triggered the change.

```html
<div _="when $x or $y changes
            put it into me"></div>
```

This is similar to how the [`on`](/features/on) feature handles `or` for events. You can use
three or more expressions:

```html
<div _="when $r or $g or $b changes
            put it into me"></div>
```

### Batching

Multiple synchronous writes are batched into a single effect run. If a handler sets `$x` and
`$y` in the same execution, an effect watching both will only fire once, after both writes
complete.

### Chained Reactivity

Effects can write to variables that other effects watch, creating reactive chains.

```html
<div _="when $celsius changes
            set $fahrenheit to (it * 9 / 5 + 32)"></div>

<div _="when $fahrenheit changes
            put it into me"></div>
```

### Examples

Multiple elements reacting to the same source. Each element independently watches the input,
with no coordination needed between them:

```html
<input type="text" id="src" />
<p _="when #src.value changes put it into me"></p>
<p _="when #src.value changes put it's length + ' chars' into me"></p>
```

A counter driven from multiple sources. The display doesn't know or care how `$count` is changed:

```html
<button _="on click increment $count">+1</button>
<button _="on click decrement $count">-1</button>
<button _="on click set $count to 0">Reset</button>
<output _="when $count changes put it into me">0</output>
```
