---
layout: pattern.njk
title: Click-Outside-to-Close Dropdown
description: A dropdown menu built on a non-modal `<dialog>` that closes when you click anywhere outside it.
tags: [interaction, dom]
difficulty: beginner
---

A dropdown menu opens on click and closes when the user clicks anywhere
outside it. Built on a non-modal `<dialog>` so it gets keyboard accessibility
and using hyperscript's `elsewhere` modifier for the click-outside behavior.

{% example "Click outside the menu to close it" %}
<div class="dropdown">
<button _="on click show the next <dialog/> then halt">Account ▾</button>
<dialog class="dropdown-menu"
    _="on click elsewhere close me
       on keyup[key is 'Escape'] from window close me">
    <a>Profile</a>
    <a>Settings</a>
    <a>Help</a>
    <hr>
    <a>Sign out</a>
</dialog>
</div>
<style>
.dropdown { position: relative; display: inline-block; }
.dropdown-menu {
    position: absolute; top: 100%; left: 0; margin: 0.25rem 0 0;
    border: 1px solid #ccc; border-radius: 6px; padding: 0.5rem 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1); min-width: 12rem; background: white;
}
.dropdown-menu[open] { display: flex; flex-direction: column; }
.dropdown-menu a {
    padding: 0.5rem 1rem; text-decoration: none; color: #333; font-size: 0.95rem;
}
.dropdown-menu a:hover { background: #f3f4f6; }
.dropdown-menu hr { border: none; border-top: 1px solid #e5e7eb; margin: 0.25rem 0; }
</style>
{% endexample %}

Three pieces of hyperscript do all the work:

- **`on click show the next <dialog/> then halt`** on the trigger
  button. [`show`](/commands/show) calls `dialog.show()` (non-modal), which leaves the dialog
  in the document flow so `position: absolute` anchors it to its parent. `halt` stops 
  the click from bubbling up to `document` to prevent the `on click from elsewhere` handler
  on the dialog from firing.

- **`on click elsewhere close me`** on the `<dialog>`. The `elsewhere` modifier
  is a hyperscript features that listens for the event at the document level and only fires
  when the click target is *not* inside this element. `close me` closes the dropdown.

- **`on keyup[key is 'Escape'] from window close me`** adds keyboard dismissal.
  _Modal_ dialogs get Esc handling from the browser, but non-modal `show()` does
  not.  Easy fix with a bit of hyperscript.
