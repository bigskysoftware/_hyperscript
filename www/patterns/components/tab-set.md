---
layout: pattern.njk
title: Tab Set Component
description: The tabs pattern wrapped as a `<tab-set>` custom element with a named slot for the tab bar and the default slot for panels. Drop it in anywhere.
tags: [component, dom, take, navigation, accessibility]
difficulty: intermediate
---

The [Tabs with `take`](/patterns/dom/tabs/) pattern wrapped as a reusable
custom element. Users put their tab buttons in a named `tab-bar` slot and
their panels in the default slot - the component handles the click logic,
ARIA wiring, and selection state automatically.

{% example "A reusable tab-set component" %}
<template component="tab-set"
  _="on click
       set tab to the closest <[role=tab]/> to the target
       if no tab exit end
       take @aria-selected='true' from <[role=tab]/> in me giving 'false' for tab
       add @hidden to <[role=tabpanel]/> in me when its @id is not (tab's @aria-controls)">
  <div class="ts-bar" role="tablist">
    <slot name="tab-bar"/>
  </div>
  <div class="ts-panels">
    <slot/>
  </div>
</template>

<tab-set>
  <button slot="tab-bar" role="tab" aria-selected="true" aria-controls="ts-features">Features</button>
  <button slot="tab-bar" role="tab" aria-selected="false" aria-controls="ts-pricing">Pricing</button>
  <button slot="tab-bar" role="tab" aria-selected="false" aria-controls="ts-faq">FAQ</button>

  <div id="ts-features" role="tabpanel">
    <p>Everything you'd want from a tab set, and nothing you wouldn't.</p>
  </div>
  <div id="ts-pricing" role="tabpanel" hidden>
    <p>Free for the first 30 days, then $9/mo. Cancel any time.</p>
  </div>
  <div id="ts-faq" role="tabpanel" hidden>
    <p>Yes, it works in all the browsers you care about.</p>
  </div>
</tab-set>
<style>
:scope { display: block; max-width: 32rem; }
.ts-bar {
    display: flex;
    border-bottom: 1px solid #ccc;
    padding: 0 0.5rem;
}
[role=tab] {
    padding: 10px 18px;
    background: #f3f4f6;
    border: 1px solid #ccc;
    border-bottom: none;
    border-radius: 6px 6px 0 0;
    margin-right: 4px;
    margin-bottom: -1px;
    font-family: inherit;
    font-size: 0.95rem;
    color: #666;
    cursor: pointer;
    border-top: 3px solid transparent;
}
[role=tab]:hover { color: #222; background: #e8eaed; }
[role=tab][aria-selected="true"] {
    background: white;
    color: #2b6b1f;
    font-weight: 600;
    border-top-color: #2b6b1f;
    position: relative;
    z-index: 1;
}
[role=tabpanel] {
    padding: 1.25rem;
    border: 1px solid #ccc;
    border-top: none;
    background: white;
}
[role=tabpanel][hidden] { display: none; }
</style>
{% endexample %}

## How it works

The component template defines two slot positions and attaches the click
handler to the component itself:

~~~ html
<template component="tab-set"
  _="on click
       set tab to the closest <[role=tab]/> to the target
       if no tab exit end
       take @aria-selected='true' from <[role=tab]/> in me giving 'false' for tab
       add @hidden to <[role=tabpanel]/> in me when its @id is not (tab's @aria-controls)">
  <div class="ts-bar" role="tablist">
    <slot name="tab-bar"/>
  </div>
  <div class="ts-panels">
    <slot/>
  </div>
</template>
~~~

The handler is **identical** to the standalone tabs pattern. Wrapping it in
a component doesn't change the logic; it just gives users a single tag to
drop in instead of having to remember the markup structure and the
`_="..."` attribute.

## Using it

~~~ html
<tab-set>
  <button slot="tab-bar" role="tab" aria-selected="true" aria-controls="t1">One</button>
  <button slot="tab-bar" role="tab" aria-selected="false" aria-controls="t2">Two</button>

  <div id="t1" role="tabpanel">First panel content.</div>
  <div id="t2" role="tabpanel" hidden>Second panel content.</div>
</tab-set>
~~~

Two requirements on the consumer:

1. **Each tab button gets `slot="tab-bar"`** so it lands inside the
   `<slot name="tab-bar"/>` placeholder. The component injects them into
   a `role="tablist"` wrapper for free.
2. **Each tab's `aria-controls` matches a panel's `id`** in the default
   slot. This is the wiring the component reads at click time - no
   index-pairing or position-matching, just plain ARIA.

Set the initial state in markup (one panel without `hidden`, one tab
with `aria-selected="true"`) and the component takes over from there.

## Scoped styles

A `<style>` block inside a component definition is **automatically scoped**
to the component's tag name. At registration time, hyperscript lifts the
`<style>` out of the template, wraps its contents in
`@scope (tab-set) { ... }`, and inserts it right after the `<template>`
element (so the styles stay co-located with the definition for debugging).

Inside the block:

- Bare selectors like `[role=tab]` match descendants of any `<tab-set>`.
- Use `:scope` to target the component root itself.

That's why the styles above use `:scope { display: block; ... }` and
`[role=tab] { ... }` instead of `tab-set` and `tab-set [role=tab]` - the
`@scope` wrapper does the prefixing for you.

The wrapped style block is emitted **once per component definition**, not
per instance, so a hundred `<tab-set>` elements on the page still share a
single stylesheet.

> If you need truly hard encapsulation (e.g. publishing a third-party
> component library), Shadow DOM is the only option, and it's not
> currently part of the hyperscript component system. For everything
> built inside an app, `@scope` is enough.
