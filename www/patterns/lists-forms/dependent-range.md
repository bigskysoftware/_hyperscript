---
layout: pattern.njk
title: Dependent Field Range
description: Two date inputs (or any pair) where each field's `min`/`max` constraints are reactively bound to the other field's value.
tags: [reactivity, forms, validation]
difficulty: beginner
---

A start date and an end date where the picker for each one is constrained
by the other - end can't be before start, start can't be after end. The
browser's native date picker greys out the invalid days automatically once
the constraint is set, so the user is steered toward a valid range without
any custom UI.

{% example "Pick a start date, then an end date" %}
<form class="range-form" onsubmit="event.preventDefault()">
    <label>
        Start
        <input type="date" value="2026-04-15"
               _="bind $start to me
                  bind @max  to $end">
    </label>
    <label>
        End
        <input type="date" value="2026-04-22"
               _="bind $end to me
                  bind @min to $start">
    </label>
</form>
<style>
.range-form {
    max-width: 24rem;
    padding: 1.25rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f9f9f9;
    display: flex;
    gap: 1rem;
}
.range-form label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    font-family: var(--font-heading), sans-serif;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #666;
}
.range-form input {
    font-size: 1rem;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: inherit;
}
</style>
{% endexample %}

The whole form is four `bind`s:

~~~ hyperscript
bind $start to me      -- on the start input
bind @max  to $end

bind $end to me        -- on the end input
bind @min to $start
~~~

Each input does two things: publishes its own value as a reactive variable,
and pulls the *other* field's value into one of its constraint attributes.
Open either picker after typing a value into the other and you'll see the
out-of-range dates greyed out in the calendar UI.

The fourth row of the [`bind`](/features/bind)
table is the one in play here:

| Form                              | Effect |
|-----------------------------------|--------|
| `bind @attrName to [expression]`  | One-way: attribute set to expression result |

When `$start` changes, `bind @min to $start` re-runs and sets the end
input's `min` attribute to the new value. When the user types into end, the
input fires a change event, the `bind $end to me` two-way binding writes
the value into `$end`, and the start input's `bind @max to $end` reactively
updates *its* `max`. No event handlers wired between the two inputs - they
talk through `$start` and `$end`.

## Same pattern for number ranges

Swap the input types and the same four `bind`s work for any min/max range:

~~~ html
<input type="number" _="bind $low to me
                        bind @max to $high">
<input type="number" _="bind $high to me
                        bind @min to $low">
~~~

Useful for price filters, age brackets, two-handle slider replacements, or
anywhere the user is selecting an interval. The browser's number input does
the right thing with `min`/`max` (validation, spinner constraints, the
`:out-of-range` pseudo-class), so the same pattern gives you real form
validation for free.

{% note "What about empty values?" %}
On first load, `$start` and `$end` haven't been written yet, so the bindings
that pull from them set `@min`/`@max` to `undefined` - which the browser
treats as "no constraint." Once the user types into either field, the
constraint kicks in. If you want a constraint from the very first render,
either initialize the variables in an [`init`](/features/init) block or set the attributes
in the markup as a default.
{% endnote %}
