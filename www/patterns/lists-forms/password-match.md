---
layout: pattern.njk
title: Password Match Validation
description: Two password fields validated against each other as the user types - shown as a class first, then as real form validation via `setCustomValidity`.
tags: [reactivity, forms, validation]
difficulty: beginner
---

A "new password" and "confirm password" pair where the second field is
validated against the first as the user types. Two takes on the same idea:
a quick visual hint with a class, then the proper version that hooks into
the browser's [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation)
so form submission is actually blocked.

## Visual hint

The simplest version: bind a `.mismatch` class on the confirm field whenever
the two values differ.

{% example "Try typing different passwords" %}
<form class="pw-form" onsubmit="event.preventDefault()">
    <label>
        New password
        <input type="password" _="bind $pw to me">
    </label>
    <label>
        Confirm password
        <input type="password"
               _="bind $confirm to me
                  bind .mismatch to $confirm is not '' and $confirm is not $pw">
    </label>
    <button type="submit">Sign up</button>
</form>
<style>
.pw-form {
    max-width: 22rem;
    padding: 1.25rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f9f9f9;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
.pw-form label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-family: var(--font-heading), sans-serif;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #666;
}
.pw-form input {
    font-size: 1rem;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    transition: border-color 0.15s, background 0.15s;
}
.pw-form input.mismatch {
    border-color: #c43a3a;
    background: #fdecec;
}
.pw-form button {
    padding: 8px 14px;
    background: #4a84c4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    align-self: flex-start;
}
</style>
{% endexample %}

The code:

~~~ hyperscript
bind $pw to me      -- on the first input

bind $confirm to me                                  -- on the confirm input
bind .mismatch to $confirm is not '' and $confirm is not $pw
~~~

`bind .mismatch to <boolean>` adds the class when the expression is true and
removes it when false. The runtime tracks both `$pw` and `$confirm` as
dependencies, so the class re-evaluates whenever either field changes - even
if the user goes back and edits the first field after typing the second.

The `$confirm is not ''` guard keeps the field from going red the moment it
gains focus before the user types anything.

## Real validation

The class version is fine for visual feedback but the form will still
submit. To actually block submission, use the Constraint Validation API -
`setCustomValidity` makes the input report as invalid until the message is
cleared, and the browser handles the rest (focus on submit, error tooltip,
`:invalid` pseudo-class).

{% example "Submit blocks until passwords match" %}
<form class="pw-form-2" onsubmit="event.preventDefault(); alert('Submitted!')">
    <label>
        New password
        <input type="password" required _="bind $pw2 to me">
    </label>
    <label>
        Confirm password
        <input type="password" required
               _="bind $confirm2 to me
                  live if $confirm2 is not '' and $confirm2 is not $pw2
                         call my.setCustomValidity('Passwords do not match')
                       else
                         call my.setCustomValidity('')
                       end">
    </label>
    <button type="submit">Sign up</button>
</form>
<style>
.pw-form-2 {
    max-width: 22rem;
    padding: 1.25rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background: #f9f9f9;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
.pw-form-2 label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-family: var(--font-heading), sans-serif;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #666;
}
.pw-form-2 input {
    font-size: 1rem;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
}
.pw-form-2 input:invalid:not(:placeholder-shown) {
    border-color: #c43a3a;
    background: #fdecec;
}
.pw-form-2 button {
    padding: 8px 14px;
    background: #4a84c4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    align-self: flex-start;
}
</style>
{% endexample %}

The confirm input now uses a `live` block:

~~~ hyperscript
bind $confirm to me
live if $confirm is not '' and $confirm is not $pw
       call my.setCustomValidity('Passwords do not match')
     else
       call my.setCustomValidity('')
     end
~~~

`live` re-runs every time `$pw` or `$confirm` changes, calling
`setCustomValidity` with either the error message or an empty string. An
input with a non-empty validity message participates in form submission as
"invalid" - the browser refuses to submit, focuses the field, and shows the
message in a native tooltip. The CSS `:invalid` pseudo-class also matches,
so you can style it the same way as the class-based version with no JS class
toggling at all.

## Why both?

The class-based version is two lines and shows up immediately as visual
feedback. Use it when you just want a hint and the form has its own backend
validation that catches the real case.

The `setCustomValidity` version integrates with the browser's form pipeline:
the submit button stops working, screen readers get the error, and the
field shows up correctly in `:invalid` styling. Use it when you want the
form to actually behave correctly.

Both versions live entirely on the *confirm* field. The first password
field knows nothing about validation - it just publishes its value to
`$pw`. Add a third field (a "current password" check, an email, anything)
and the same pattern works without touching the existing fields.
