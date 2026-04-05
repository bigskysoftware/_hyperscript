---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Reactivity {#reactivity}

Reactivity in hyperscript means: when a value changes, things that depend on it
update automatically. You declare the relationship once, and the runtime keeps
the DOM in sync.

Hyperscript tracks reads and writes of these reactive values:

- Global variables (`$name`)
- Element-scoped variables (`:count`)
- DOM-scoped variables (`^total`)
- Attribute reads and writes
- Mutations to arrays, sets, and maps (via `push`, `splice`, etc.)

Regular local variables (`set x to ...`) are not reactive.

### `live` {#live}

The [`live`](/features/live) feature declares commands that re-run whenever their
dependencies change. Whenever the value is written anywhere in the app, the block
re-runs. You do not need to list the sources of change.

{% example "Live derived value" %}
<div _="init set $count to 0">
  <button _="on click increment $count">+1</button>
  <button _="on click decrement $count">-1</button>
  <button _="on click set $count to 0">Reset</button>
  <output _="live put 'Count: ' + $count into me">Count: 0</output>
</div>
{% endexample %}

Click any button. The output re-renders, even though it does not listen for clicks.

Use `live` for derived values and simple DOM updates.

### `when` {#when}

The [`when`](/features/when) feature runs commands in response to a value change,
with access to the new value via `it`. `when` is about *reacting* with side
effects, while `live` is about *declaring* what the DOM should look like.

{% example "Reacting to a change" %}
<input id="price" type="number" value="10" style="width: 6em;" />
x
<input id="qty" type="number" value="3" style="width: 6em;" />
=
<span _="when (#price's value * #qty's value) changes
           put '$' + it into me">$30</span>
{% endexample %}

### `bind` {#bind}

The [`bind`](/features/bind) feature keeps two values in sync, both ways. Useful
for form inputs and shared state.

{% example "Two-way binding" %}
<input id="name-input" type="text" placeholder="Type a name" />
<input id="name-mirror" type="text" placeholder="Mirrored here"
       _="bind my value to #name-input's value" />
{% endexample %}

Type into either input and the other updates. The binding runs in both directions.

### Arrays {#arrays}

Hyperscript tracks in-place mutations on arrays, sets, and maps. A `live` block
reading `^items` will re-run whenever a mutating method (`push`, `pop`, `splice`,
`sort`, and so on) runs on it.

{% example "Reactive array" %}
<div _="init set ^items to []">
  <button _="on click call ^items.push(`item ${^items.length + 1}`)">Add</button>
  <button _="on click call ^items.pop()">Remove</button>
  <button _="on click set ^items to []">Clear</button>
  <ul _="live
           set my innerHTML to ''
           for item in ^items
             append `<li>${item}</li>` to my innerHTML
           end"></ul>
  <p _="live put 'Total: ' + ^items.length into me">Total: 0</p>
</div>
{% endexample %}

Both the list and the total re-render whenever the array changes. Neither one
lists events: they just read `^items`, and the runtime handles the rest.

Note that in this example we use a DOM-scoped variable, `^items` rather than a global variable. This encapsulates
the reactivity in just this small bit of HTML. Generally we recommend using DOM-scoped variables when possible.

### Reactivity vs. Events

Reactivity is a neat feature and is useful when you have complicated dependencies in your UI that affect many different
elements, and you don't want to track and reconcile them yourself.

However, it is overkill for many features. We recommend using plain event handlers as a default and only reaching for
reactivity when the situation demands it:

  ~~~ html
  <button _="on click put 'hello' into the next <output/>">Click</button>
  <output>--</output>
  ~~~

Sometimes a click handler is just a click handler.

<div class="docs-page-nav">
<a href="/docs/components/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Components</strong></a>
<a href="/docs/extensions/" class="next"><strong>Extensions</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
