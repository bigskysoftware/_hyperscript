---
layout: pattern.njk
title: Drag to Reorder
description: A draggable list using the HTML5 drag-and-drop API and `closest <li/>` to find drop targets - about ten lines of hyperscript.
tags: [forms, dom, interaction]
difficulty: intermediate
---

A list whose items can be reordered by dragging. Built directly on the
HTML5 drag-and-drop API - hyperscript handles the event wiring, and the
DOM's native `before()` and `after()` methods do the actual reinsertion.

{% example "Drag any row to reorder" %}
<ul class="reorder-list" _="
    on dragstart
        set :dragged to closest <li/> to event.target
        add .is-dragging to :dragged
    on dragend
        remove .is-dragging from :dragged
    on dragover
        halt the event
    on drop
        halt the event
        set target to closest <li/> to event.target
        if target and target is not :dragged
            if event.offsetY > target.offsetHeight / 2
                call target.after(:dragged)
            else
                call target.before(:dragged)
            end
        end
">
    <li draggable="true">📝 Write the docs</li>
    <li draggable="true">🎨 Polish the demo</li>
    <li draggable="true">🐛 Triage the bug list</li>
    <li draggable="true">🚀 Cut the release</li>
    <li draggable="true">📣 Post the announcement</li>
</ul>
<style>
.reorder-list {
    list-style: none;
    padding: 0;
    margin: 0;
    max-width: 24rem;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #f9f9f9;
}
.reorder-list li {
    padding: 12px 16px;
    border-bottom: 1px solid #e5e5e5;
    background: white;
    cursor: grab;
    user-select: none;
    transition: background 0.1s;
}
.reorder-list li:last-child { border-bottom: none; }
.reorder-list li:first-child { border-radius: 6px 6px 0 0; }
.reorder-list li:last-child  { border-radius: 0 0 6px 6px; }
.reorder-list li:hover { background: #f3f4f6; }
.reorder-list li:active { cursor: grabbing; }
.reorder-list li.is-dragging {
    opacity: 0.4;
    background: #e8f0fb;
}
</style>
{% endexample %}

The whole list takes one `_=` attribute on the parent `<ul>`:

~~~ hyperscript
on dragstart
  set :dragged to closest <li/> to event.target
  add .is-dragging to :dragged
on dragend
  remove .is-dragging from :dragged
on dragover
  halt the event
on drop
  halt the event
  set target to closest <li/> to event.target
  if target and target is not :dragged
    if event.offsetY > target.offsetHeight / 2
      call target.after(:dragged)
    else
      call target.before(:dragged)
    end
  end
~~~

Each `<li>` just needs `draggable="true"` to opt into the API.

## How it works

The HTML5 drag-and-drop API has four events worth caring about for a
reorder list:

- **`dragstart`** fires on the source when the user starts dragging. We
  stash the dragged element in `:dragged` (element-scoped on the `<ul>`,
  not a global, so multiple lists on the same page don't collide). Also
  [`add`](/commands/add) an `.is-dragging` class for visual feedback.

- **`dragend`** fires on the source after the drag ends, regardless of
  whether the drop succeeded. We use it to clear the visual state.

- **`dragover`** fires on potential drop targets *continuously* while a
  drag is happening over them. **Calling `preventDefault` is required** -
  if you don't, the browser refuses to fire `drop`. `halt the event` does
  exactly that. This is the part of the DnD API that catches everyone
  off guard the first time.

- **`drop`** fires when the user releases on a valid target. We find the
  `<li>` they dropped on, check whether the cursor was in the top or
  bottom half (`offsetY > offsetHeight / 2`), and use the DOM's native
  `before()` or `after()` methods to reinsert the dragged element on the
  appropriate side. The browser handles the actual move - no element
  cloning, no manual removal.

## A few subtleties

- **[`closest`](/expressions/closest) `<li/> to event.target`** is the right way to find the source
  and target items. The drag event's `target` may be a child of the `<li>`
  (a span, a text node, etc.) - `closest` walks up to find the actual
  list item. Without it, dragging over an emoji or text would miss.

- **`:dragged is not target`** prevents the no-op move where the user
  drops an item on itself - without the check, `target.before(:dragged)`
  would still work but trigger an unnecessary DOM mutation (and confuse
  some screen readers).

- **The handler is on the parent `<ul>`**, not on each `<li>`. Drag events
  bubble up, so one set of handlers covers the whole list. Add or remove
  items dynamically and they're picked up automatically - no per-item
  setup, no MutationObserver.

- **Element-scoped `:dragged`** rather than global `$dragged` means
  multiple drag lists on the same page each track their own drag state
  independently. If you want cross-list drag (drag from one list into
  another), use a global, or have both lists share a parent that owns
  the variable.
