---
layout: pattern.njk
title: Modal Dialog
description: Open and close `<dialog>` elements, with optional click-outside dismissal and an unsaved-changes warning.
tags: [interaction, dom]
difficulty: intermediate
---

The [`open`](/commands/open) and [`close`](/commands/close) commands work
with `<dialog>` elements, calling `showModal()` and `close()` automatically.

## Plain modal

{% example "Open and close a modal dialog" %}
<div>
<button _="on click open the next <dialog/>">Open Modal</button>
<dialog>
    <div class="modal-header">
        <h3>Contact Info</h3>
        <button _="on click close the closest <dialog/>">&times;</button>
    </div>
    <input autofocus type="text" placeholder="First Name">
    <input type="text" placeholder="Last Name">
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed bibendum a tellus et hendrerit.</p>
</dialog>
</div>
<style>
dialog {
    border: 1px solid #ccc; border-radius: 8px; padding: 1.5rem; max-width: 28rem; width: 100%;
}
dialog::backdrop { background: rgba(0,0,0,0.4); }
.modal-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
}
.modal-header h3 { margin: 0; }
.modal-header button { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
dialog input { display: block; width: 100%; padding: 8px; font-size: 1rem; margin-bottom: 0.75rem; box-sizing: border-box; }
dialog p { color: #555; line-height: 1.5; }
</style>
{% endexample %}

`the next <dialog/>` and `the closest <dialog/>` target the dialog without
needing IDs.

## Click outside to close

When a `<dialog>` is opened with `showModal()`, the backdrop is part of the
dialog element itself - there's no separate backdrop node. Clicks on the
dialog content fire with `event.target` set to the inner element you clicked;
clicks on the backdrop fire with `event.target` equal to the dialog.

So a click-outside handler is just an event filter:

{% example "Click the backdrop to dismiss" %}
<div>
<button _="on click open the next <dialog/>">Open Modal</button>
<dialog _="on click[target is me] close me">
    <div class="modal-header">
        <h3>Click outside to close</h3>
        <button _="on click close the closest <dialog/>">&times;</button>
    </div>
    <p>Try clicking on the dimmed backdrop area outside this dialog.</p>
</dialog>
</div>
<style>
dialog {
    border: 1px solid #ccc; border-radius: 8px; padding: 1.5rem; max-width: 28rem; width: 100%;
}
dialog::backdrop { background: rgba(0,0,0,0.4); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.modal-header h3 { margin: 0; }
.modal-header button { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
dialog p { color: #555; line-height: 1.5; }
</style>
{% endexample %}

`on click[target is me] close me` - the `[target is me]` filter only matches
when the click landed directly on the dialog (the backdrop), not on any of
its descendants. No coordinate math required.

## Warn on unsaved changes

For an editing dialog, you usually want to warn the user before throwing away
their changes - but only if they actually made any, and never when they
explicitly save. Track dirtiness in an element-scoped variable, route every
dismissal path through one custom event, and have the save button bypass it.

{% example "Try editing then closing without saving" %}
<div>
<button _="on click open the next <dialog/>">Edit Contact</button>
<dialog _="
    on input from <input,textarea/> in me set :dirty to true

    on closeRequested
      if :dirty
        if confirm('Discard unsaved changes?')
          set :dirty to false then close me
        end
      else
        close me
      end

    on click[target is me] send closeRequested to me
    on cancel halt the event then send closeRequested to me
">
    <div class="modal-header">
        <h3>Edit Contact</h3>
        <button _="on click send closeRequested to closest <dialog/>">&times;</button>
    </div>
    <input autofocus type="text" placeholder="First Name">
    <input type="text" placeholder="Last Name">
    <textarea placeholder="Notes"></textarea>
    <div class="modal-actions">
        <button _="on click send closeRequested to closest <dialog/>">Cancel</button>
        <button class="primary" _="on click
            -- (this is where you'd POST to the server)
            set :dirty to false then close closest <dialog/>">Save</button>
    </div>
</dialog>
</div>
<style>
dialog {
    border: 1px solid #ccc; border-radius: 8px; padding: 1.5rem; max-width: 28rem; width: 100%;
}
dialog::backdrop { background: rgba(0,0,0,0.4); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.modal-header h3 { margin: 0; }
.modal-header button { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; }
dialog input, dialog textarea {
    display: block; width: 100%; padding: 8px; font-size: 1rem; margin-bottom: 0.75rem; box-sizing: border-box;
    border: 1px solid #ccc; border-radius: 4px; font-family: inherit;
}
dialog textarea { min-height: 4rem; resize: vertical; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
.modal-actions button { padding: 6px 14px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; }
.modal-actions .primary { background: #4a84c4; color: white; border-color: #4a84c4; }
</style>
{% endexample %}

The mental model:

| Path                       | Routes through `closeRequested`? | Dirty check fires? |
|----------------------------|---------------------------------|--------------------|
| Backdrop click             | yes                             | yes                |
| Esc key (`cancel` event)   | yes                             | yes                |
| X button                   | yes                             | yes                |
| Cancel button              | yes                             | yes                |
| Save button (success)      | no - direct `close`             | no - `:dirty` cleared first |

Pieces worth calling out:

- **`on input from <input,textarea/> in me set :dirty to true`** - listens
  for any input event from any descendant input or textarea, flips the
  element-scoped flag. `:dirty` (element-scoped) lives and dies with this
  dialog instance, so reopening starts clean.
- **`on cancel halt the event`** - the [`cancel`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/cancel_event)
  event fires when the user presses Esc on a modal dialog; its default
  action is to close. `halt the event` prevents that default so we can
  route Esc through the dirty check too. Without it, Esc would close the
  dialog regardless of unsaved changes.
- **One `closeRequested` event** - the X, Cancel button, backdrop click,
  and Esc all `send closeRequested to me`. The dirty check exists in
  exactly one place. Save bypasses by calling `close` directly, after
  resetting `:dirty`.

{% note "If your dialog has zero custom logic" %}
The new [Invoker Commands API](https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API)
lets you open and close dialogs with no JavaScript at all using
`command="show-modal"` and `command="close"` button attributes. If your modal
is purely presentational with no validation, dirty tracking, or async work,
that's the simplest path. The moment you need any of the patterns above,
hyperscript is the lighter option.
{% endnote %}
