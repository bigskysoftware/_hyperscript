---
title: Modal Dialog
tags: [interaction, dom]
difficulty: intermediate
---

The [`open`](/commands/open) and [`close`](/commands/close) commands work with `<dialog>` elements,
calling `showModal()` and `close()` automatically.

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

Use `the next <dialog/>` and `the closest <dialog/>` to target the dialog without needing an ID.
