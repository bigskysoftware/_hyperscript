---
title: Confirm Before Action
tags: [interaction, events]
difficulty: beginner
---

{% example "Ask for confirmation before removing" %}
<button _="on click
             call window.confirm('Are you sure?')
             if it remove me">
  Delete (with confirm)
</button>
{% endexample %}

Call any JavaScript function with `call`. The return value is available as `it` for the next command.
