---
title: Draggable Behavior
tags: [behaviors, interaction, dom]
difficulty: intermediate
---

A reusable [`behavior`](/features/behavior) that makes any element draggable by a
handle. Installs on the element, listens to pointer events on the handle, and
updates `left`/`top` as the pointer moves.

{% example "Drag the titlebar to move the window" %}
<script type="text/hyperscript">
  behavior Draggable(dragHandle)
    init
      if no dragHandle set the dragHandle to me
    end
    on pointerdown(clientX, clientY) from dragHandle
      halt the event
      trigger draggable:start
      measure my x, y
      set xoff to clientX - x
      set yoff to clientY - y
      repeat until event pointerup from document
        wait for pointermove(pageX, pageY) or
                 pointerup(pageX, pageY) from document
        add { left: ${pageX - xoff}px; top: ${pageY - yoff}px; }
        trigger draggable:move
      end
      trigger draggable:end
  end
</script>

<div style="position: relative; height: 180px; border: 1px dashed #ccc;">
  <div _="install Draggable(dragHandle: .titlebar in me)"
       style="position: absolute; left: 20px; top: 20px; width: 180px;
              border: 1px solid #888; background: white; box-shadow: 2px 2px 0 #0004;">
    <div class="titlebar"
         style="background: #ccc; padding: 4px 8px; cursor: move;
                border-bottom: 1px solid #888; user-select: none;">
      Drag me
    </div>
    <div style="padding: 8px;">Window body</div>
  </div>
</div>
{% endexample %}

### How it works

`install Draggable(dragHandle: .titlebar in me)` attaches the behavior, passing
the titlebar element as the drag handle. When the behavior initializes, it
falls back to `me` (the installed element itself) if no handle is given.

On `pointerdown`, the behavior measures the element's current position, records
the offset between the pointer and the element's origin, then loops over
`pointermove` events until `pointerup` fires on the document. Each move appends
a `left`/`top` style update.

The behavior also triggers `draggable:start`, `draggable:move`, and
`draggable:end` custom events, so callers can react to drag state — for
example, adding a drop shadow while dragging:

  ~~~ html
  <div _="install Draggable
          on draggable:start add .shadow
          on draggable:end   remove .shadow">
    ...
  </div>
  ~~~
