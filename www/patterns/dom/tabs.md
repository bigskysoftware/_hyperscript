---
layout: pattern.njk
title: Tabs with `take`
description: A classic tab strip with one centralized handler on the parent. The `take` command moves the active state from sibling tabs to the clicked one in a single statement.
tags: [dom, take, navigation, accessibility]
difficulty: beginner
---

A classic tab strip - click a tab, that tab becomes active and its panel
shows. One handler on the parent uses event delegation to catch any tab
click, then [`take`](/commands/take) moves the `aria-selected` state to the
clicked tab and `add ... when` toggles the `hidden` attribute on the panels.

{% example "Click a tab" %}
<div class="tabs" _="on click
    set tab to the closest <[role=tab]/> to the target
    if no tab exit end
    take @aria-selected='true' from <[role=tab]/> in me giving 'false' for tab
    add @hidden to <[role=tabpanel]/> in me when its @id is not (tab's @aria-controls)">

    <div class="tab-bar" role="tablist">
        <button class="tab" role="tab" aria-selected="true" aria-controls="panel-overview">Overview</button>
        <button class="tab" role="tab" aria-selected="false" aria-controls="panel-specs">Specs</button>
        <button class="tab" role="tab" aria-selected="false" aria-controls="panel-reviews">Reviews</button>
    </div>

    <div class="panel" id="panel-overview" role="tabpanel">
        <p>A medium-roast coffee with notes of caramel, dried fruit, and dark
        chocolate. Sourced from a small cooperative in Huila, Colombia.</p>
    </div>
    <div class="panel" id="panel-specs" role="tabpanel" hidden>
        <ul>
            <li>Origin: Huila, Colombia</li>
            <li>Roast: Medium</li>
            <li>Process: Washed</li>
            <li>Altitude: 1,650-1,950m</li>
        </ul>
    </div>
    <div class="panel" id="panel-reviews" role="tabpanel" hidden>
        <p><strong>★★★★★</strong> "My new daily driver." — Jamie</p>
        <p><strong>★★★★☆</strong> "Bright, clean, lovely finish." — Riley</p>
    </div>
</div>
<style>
.tabs { max-width: 32rem; }
.tab-bar {
    display: flex;
    border-bottom: 1px solid #ccc;
    padding: 0 0.5rem;
}
.tab {
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
    transition: color 0.15s, background 0.15s;
}
.tab:hover { color: #222; background: #e8eaed; }
.tab[aria-selected="true"] {
    background: white;
    color: #2b6b1f;
    font-weight: 600;
    border-top-color: #2b6b1f;
    position: relative;
    z-index: 1;
}
.panel {
    padding: 1.25rem;
    border: 1px solid #ccc;
    border-top: none;
    background: white;
}
.panel[hidden] { display: none; }
.panel ul { margin: 0; padding-left: 1.25rem; }
.panel p { margin: 0 0 0.5rem; }
.panel p:last-child { margin-bottom: 0; }
</style>
{% endexample %}

The whole tab strip is one handler on the parent:

~~~ hyperscript
on click
  set tab to the closest <[role=tab]/> to the target
  if no tab exit end
  take @aria-selected='true' from <[role=tab]/> in me giving 'false' for tab
  add @hidden to <[role=tabpanel]/> in me when its @id is not (tab's @aria-controls)
~~~

Four lines, in order:

1. **`set tab to the closest <[role=tab]/> to the target`** — find the tab the user clicked. `the target` is the click event's `event.target`, and `closest` walks up to find the nearest ancestor (or self) matching the selector. If they clicked outside any tab, `tab` is `null`.

2. **`if no tab exit end`** — bail out cleanly when the click wasn't on a tab.

3. **`take @aria-selected='true' from <[role=tab]/> in me giving 'false' for tab`** — the `take` shibboleth, in its richest form:
    - **`@aria-selected='true'`** is what gets added to the `for` target
    - **`from <[role=tab]/> in me`** is the source set, scoped to descendants of this tablist
    - **`giving 'false'`** is what the `from` elements get instead of having the attribute removed (`giving` is an alias for `with`, and reads more naturally in this position)
    - **`for tab`** is the destination
   
   Net effect: every tab in this component gets `aria-selected="false"`, then the clicked tab gets `aria-selected="true"`. The browser styles it via `[aria-selected="true"]` in CSS - no `.active` class needed.

4. **`add @hidden to <[role=tabpanel]/> in me when its @id is not (tab's @aria-controls)`** — for each tabpanel, add `@hidden` if its id doesn't match the active tab's `aria-controls`, and remove it if it does. `add ... when` toggles in both directions, so one statement handles all panels at once.

## Why ARIA, not `.active`

- **`role="tablist"` / `role="tab"` / `role="tabpanel"`** tell screen readers
  this is a tab strip, not just a row of buttons. Users get keyboard
  navigation hints and the right reading order.
- **`aria-selected="true"`** is the announced state. CSS can target it
  directly with `[aria-selected="true"]`, so the visual state and the
  accessibility state are the same attribute - they can never drift.
- **`aria-controls="panel-id"`** wires each tab to its panel without
  needing a separate data attribute. The same string serves the screen
  reader and our `add ... when` predicate.
- **The native `hidden` attribute** does what we want for free: it
  applies `display: none` via the UA stylesheet, AND it makes the panel
  inert and unannounced. No `aria-hidden` needed.

This is the rare case where the accessible markup is also the *shorter*
markup: one handler, two statements, zero JS classes to manage.

## Why `take` shines here

The vanilla equivalent of just the active-tab toggle is six lines:

~~~ js
document.querySelectorAll('[role=tab]').forEach(t => t.setAttribute('aria-selected', 'false'));
clickedTab.setAttribute('aria-selected', 'true');
document.querySelectorAll('[role=tabpanel]').forEach(p => p.hidden = true);
document.getElementById(clickedTab.getAttribute('aria-controls')).hidden = false;
~~~

Hyperscript collapses each `forEach + set` into one statement because
that's the operation `take` was named for: take this attribute (with
this value) away from a group, give it to one element. Tabs, segmented
controls, "selected row" highlights, mode switches, breadcrumb-style
step indicators - any mutually-exclusive UI state is a `take` away.

> **Heads up:** the component version of this pattern lives at
> [Tab Set Component](/patterns/components/tab-set/), which wraps the
> same logic into a `<tab-set>` custom element.
