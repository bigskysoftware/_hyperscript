---
title: live - ///_hyperscript
---

## The `live` Feature

The `live` feature declares reactive commands that re-run whenever their dependencies
change.

For reacting to changes with side effects, see [`when`](/features/when).
For two-way sync, see [`bind`](/features/bind).

### Syntax

```ebnf
live <command>

live
    {<command>}
end
```

### Events vs. Reactive Solutions

For many cases using simple, plain events with `on` handlers works great:

```html
<button id="inc" _="on click increment $count">+1</button>
<output _="on click from #inc put $count into me">
```

But when things get complicated this approach can, at times, become unwieldy

```html
<output _="on click from #inc or #dec or #reset put $count into me
           on keyup[key=='ArrowUp'] from window put $count into me
           on htmx:afterSwap from body put $count into me">
```

With `live`, you just say what you want, and it stays in sync no matter what changes
`$count`:

```html
<output _="live put $count into me">
```

### Single Statement

```html
<button _="on click increment $count">+1</button>
<button _="on click decrement $count">-1</button>
<button _="on click set $count to 0">Reset</button>
<output _="live put 'Count: ' + $count into me"></output>
```

Works with any command:

```html
<!-- Derived variable -->
<span _="live set $total to (#price's value * #qty's value)">

<!-- Computed DOM update -->
<span _="live put '$' + $total into me">

<!-- Reactive attribute -->
<div _="live set my @data-theme to $theme">

<!-- Reactive style -->
<div _="live set *opacity to $visible and 1 or 0">

<!-- Conditional class -->
<div _="live if $active add .on to me else remove .on from me end">
```

### Block Form

Group multiple reactive commands in a block. All commands run top to bottom
as one unit, just like any other block in _hyperscript:

```html
<div _="live
          set $subtotal to (#price's value * #qty's value)
          set $total to ($subtotal + $tax)
          put '$' + $total into me
          if $total > 100 add .expensive to me else remove .expensive from me end
        end">
```

When any dependency changes (`$price`, `$qty`, `$tax`), the entire block re-runs.

### Independent Effects

If you want each reactive command to track its own dependencies independently,
use separate `live` statements:

```html
<div _="live set $subtotal to (#price's value * #qty's value) end
        live set $total to ($subtotal + $tax) end
        live put '$' + $total into me end
        live if $total > 100 add .expensive to me else remove .expensive from me end">
```

### Implementation

The block runs with automatic dependency tracking. Whatever it reads
during execution (variables, properties, attributes) becomes its dependencies.
When any dependency changes, the block re-runs.

### Conditional Branches

`live` only tracks what it actually *reads* during execution. If a branch
isn't taken, dependencies inside it aren't tracked until the branch runs:

```hyperscript
live
  if $showDetails
    put $details into me   -- not tracked until $showDetails is true
  end
```

If `$showDetails` starts as `false`, changes to `$details` won't trigger a
re-run. Once `$showDetails` flips to `true` and the block re-runs, `$details`
becomes a dependency from that point on.

To avoid surprises, read all the values you depend on before branching:

```hyperscript
live
  if $showDetails then put $details into me
  else put '' into me
```

Or use [`when`](/features/when) for conditional side effects, since `when` only
tracks its expression, not the body.

### Cleanup

When the element is removed from the DOM, all its `live` effects are automatically
stopped.

### Choosing Between `live`, `when`, and `bind`

| I want to... | Use |
|---|---|
| Keep the DOM in sync with values | `live` |
| React to a change with side effects or chained logic | `when` |
| Keep a variable and a form input in sync | `bind` |

For simple cases where you know the exact source of a change, `on` is still the
right tool.
