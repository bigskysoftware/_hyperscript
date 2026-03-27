# Reactivity Design Notes

Internal reference for the reactive features: `always`, `when`, and `bind`.

## Why this works without explicit signals

SolidJS (and most JS reactive frameworks) use explicit signal primitives:

```js
const [count, setCount] = createSignal(0);
count()      // read — registers a subscription
setCount(5)  // write — notifies subscribers
```

This is necessary because JavaScript has no way to intercept plain variable
reads and writes. `myVar = 5` is invisible to framework code. So Solid must
wrap values in function calls to run custom logic on access.

_hyperscript doesn't have this constraint. It is its own language with its own
execution engine. Every variable read goes through `resolveSymbol()` in the
runtime, and every write goes through `setSymbol()`. The runtime is already
the middleman for all variable access, so we hook tracking and notification
directly into these existing paths:

- **Read** (`resolveSymbol`): if an effect is currently evaluating, record the
  variable as a dependency.
- **Write** (`setSymbol`): notify all effects that depend on this variable.

The user gets reactive behavior without any API ceremony. `$count` is just a
variable. Writing `when $count changes ...` is all it takes to make it watched.

## The JS interop boundary

This approach is airtight for pure _hyperscript code, but leaky at the JS
boundary:

- **Writes from JS** (`window.$count = 99`) bypass `setSymbol`, so no
  notification fires.
- **Reads inside `js()` blocks** (`js(x) return window.$price * window.$qty end`)
  bypass `resolveSymbol`, so no dependencies are tracked.
- **`Object.assign` in the js feature** writes directly to `globalScope`,
  also bypassing `setSymbol`.

This is an accepted trade-off. For typical _hyperscript usage the reactivity
is invisible and correct. Users mixing JS interop with reactive expressions
should be aware that the tracking boundary is the _hyperscript runtime.

## What creates reactivity

Variables are not signals. `set $count to 0` just stores a value on
`globalScope` (i.e. `window`). Nothing reactive happens.

Reactivity is created by `always`, `when`, and `bind`. All three use
`createEffect()` under the hood, which evaluates code with tracking
enabled. During that evaluation, `resolveSymbol` sees that an effect
is active and records dependencies. Future writes via `setSymbol` notify
all subscribed effects.

The variable itself has no idea it's being watched. The reactivity lives
entirely in the effect and the subscription maps.

## The three reactive features

Each serves a distinct purpose:

- **`always`** declares relationships. The block runs as one unit with
  automatic dependency tracking and re-runs when any dependency changes.
  Used for derived values, DOM updates, and conditional state. For
  independent tracking, use separate `always` statements.

- **`when`** reacts to changes. Watches a specific expression and runs a
  command body when the value changes. `it` refers to the new value. Used
  for side effects, async work, and events.

- **`bind`** syncs two values bidirectionally. Includes same-value dedup to
  prevent infinite loops. Used for form inputs and shared state.

`always` runs its entire command block inside the tracking context (the
block IS the effect). `when` separates the tracked expression from the
handler commands. `bind` creates two `when`-style effects pointing at
each other.

## Why styles and computed styles are not tracked

`*opacity`, `*computed-width`, and other style references are not reactive.
There is no efficient DOM API for "notify me when a computed style changes."
`MutationObserver` only catches inline style attribute edits, not changes
from classes, media queries, CSS animations, or the cascade. No reactive
framework (SolidJS, Vue, Svelte) tracks computed styles either.

To react to style-affecting changes, track the cause instead: the variable,
attribute, or class that drives the style.
