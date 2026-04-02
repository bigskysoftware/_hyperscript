---
title: Update Text on Click
tags: [basics, dom]
difficulty: beginner
---

{% example "Put text into another element" %}
<button _="on click put 'Hello!' into the next <output/>">Say Hello</button>
<output>--</output>
{% endexample %}

The `put` command is the primary way to update DOM content. Target elements with `the next <tag/>`, `previous`, `closest`, or any CSS selector.
