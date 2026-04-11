---
layout: pattern.njk
title: Reactive Character Counter
description: A textarea, a counter, and a submit button - each declared with `bind` against one shared variable, no event wiring.
tags: [reactivity, forms]
difficulty: beginner
---

A textarea, a live character count that color-changes near the limit, and a
submit button that disables when over the limit or empty. Three independent
elements, no direct references between them - each one declares what it
shows in terms of a single shared reactive variable.

{% example "Type to see the counter update live" %}
<div class="char-counter">
    <textarea rows="3" placeholder="Write a short message…"
              _="bind $msg to me"></textarea>
    <div class="char-counter-meta">
        <span class="counter"
              _="live put $msg.length + ' / 280' into me
                 bind .warn to $msg.length > 240
                 bind .over to $msg.length > 280"></span>
        <button _="bind @disabled to $msg.length > 280 or $msg is empty">
            Post
        </button>
    </div>
</div>
<style>
.char-counter {
    max-width: 26rem;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f9f9f9;
}
.char-counter textarea {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
    font-family: inherit;
}
.char-counter-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
}
.char-counter .counter {
    font-family: var(--font-heading);
    font-size: 0.85rem;
    color: #888;
    transition: color 0.15s;
}
.char-counter .counter.warn { color: #c47a00; }
.char-counter .counter.over { color: #c43a3a; font-weight: bold; }
.char-counter button {
    padding: 6px 14px;
    background: #4a84c4;
    color: white;
    border: 1px solid #4a84c4;
    border-radius: 4px;
    font-family: inherit;
    cursor: pointer;
}
.char-counter button[disabled] { background: #ccc; border-color: #ccc; cursor: not-allowed; }
</style>
{% endexample %}

The whole pattern is four `bind`s and one `live`:

~~~ hyperscript
bind $msg to me           -- on the textarea

live put $msg.length + ' / 280' into me   -- on the counter
bind .warn to $msg.length > 240
bind .over to $msg.length > 280

bind @disabled to $msg.length > 280 or $msg is empty   -- on the button
~~~

## How this works

`bind $msg to me` two-way-binds the textarea's value to a global reactive
variable `$msg`. Type into the textarea, `$msg` updates. Set `$msg` from
anywhere, the textarea updates. Now the counter and the button can both
subscribe to it without ever touching the textarea directly.

The counter combines one `live` and two `bind`s:

- **`live put $msg.length + ' / 280' into me`** - auto-tracks `$msg.length`
  as a dependency and re-runs the `put` whenever it changes, so the text
  always reflects the current count.
- **`bind .warn to $msg.length > 240`** - reactively binds the `.warn`
  class to a boolean expression. When the expression flips to `true`, the
  class is added; when it flips to `false`, the class is removed. The
  runtime tracks `$msg.length` as a dependency automatically.
- **`bind .over to $msg.length > 280`** - same idea, second class for the
  hard-limit state.

The submit button has just one `bind`:

- **`bind @disabled to $msg.length > 280 or $msg is empty`** - reactively
  binds the `disabled` attribute to a boolean. When the message is empty
  or over the limit, the attribute is present; otherwise it's removed. The
  button has no idea the textarea exists - it only depends on `$msg`.

The mental model: **every UI element declares what it shows in terms of
reactive variables, and the runtime wires the dependencies for you**.
`bind` covers four bindings:

| Form                              | Effect |
|-----------------------------------|--------|
| `bind $var to me`                 | Two-way: variable ↔ input value |
| `bind .className to [boolean]`    | One-way: class present iff expression true |
| `bind @attrName to [boolean]`     | One-way: attribute present iff expression true |
| `bind @attrName to [expression]`  | One-way: attribute set to expression result |

Adding a fourth element that depends on `$msg` (a preview, a word count,
an emoji indicator) requires zero changes to anything else - just write
its own `bind` or `live` against `$msg`.
