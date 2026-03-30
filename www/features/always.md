---
title: always - ///_hyperscript
---

## The `always` Feature

The `always` feature declares reactive commands that re-run whenever their dependencies
change.

For reacting to changes with side effects, see [`when`](/features/when).
For two-way sync, see [`bind`](/features/bind).

### Syntax

```ebnf
always <command>

always
    {<command>}
end
```

### Why Not Just Use `on`?

For simple cases, `on` works great:

```html
<button id="inc" _="on click increment $count">+1</button>
<output _="on click from #inc put $count into me">
```

But what if `$count` can be changed by multiple buttons, a keyboard shortcut, a timer,
or an htmx response? With `on`, you have to list every source:

```html
<output _="on click from #inc or #dec or #reset put $count into me
           on keyup[key=='ArrowUp'] from window put $count into me
           on htmx:afterSwap from body put $count into me">
```

With `always`, you just say what you want and it stays in sync no matter what changes
`$count`:

```html
<output _="always put $count into me">
```

Add a new source of change tomorrow and the `always` version just works.

### Single Statement

```html
<button _="on click increment $count">+1</button>
<button _="on click decrement $count">-1</button>
<button _="on click set $count to 0">Reset</button>
<output _="always put 'Count: ' + $count into me"></output>
```

Works with any command:

```html
<!-- Derived variable -->
<span _="always set $total to (#price's value * #qty's value)">

<!-- Computed DOM update -->
<span _="always put '$' + $total into me">

<!-- Reactive attribute -->
<div _="always set my @data-theme to $theme">

<!-- Reactive style -->
<div _="always set *opacity to $visible and 1 or 0">

<!-- Conditional class -->
<div _="always if $active add .on to me else remove .on from me end">
```

### Block Form

Group multiple reactive commands in a block. All commands run top to bottom
as one unit, just like any other block in _hyperscript:

```html
<div _="always
          set $subtotal to (#price's value * #qty's value)
          set $total to ($subtotal + $tax)
          put '$' + $total into me
          if $total > 100 add .expensive to me else remove .expensive from me end
        end">
```

When any dependency changes (`$price`, `$qty`, `$tax`), the entire block re-runs.

### Independent Effects

If you want each reactive command to track its own dependencies independently,
use separate `always` statements:

```html
<div _="always set $subtotal to (#price's value * #qty's value) end
        always set $total to ($subtotal + $tax) end
        always put '$' + $total into me end
        always if $total > 100 add .expensive to me else remove .expensive from me end">
```

### How It Works

The block runs with automatic dependency tracking. Whatever it reads
during execution (variables, properties, attributes) becomes its dependencies.
When any dependency changes, the block re-runs.

### Cleanup

When the element is removed from the DOM, all its `always` effects are automatically
stopped.

### Choosing Between `always`, `when`, and `bind`

| I want to... | Use |
|---|---|
| Keep the DOM in sync with values | `always` |
| React to a change with side effects or chained logic | `when` |
| Keep a variable and a form input in sync | `bind` |

For simple cases where you know the exact source of a change, `on` is still the
right tool.
