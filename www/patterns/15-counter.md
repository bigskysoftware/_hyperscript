---
title: Click Counter
tags: [basics, state]
difficulty: beginner
---

{% example "Count clicks with an element-scoped variable" %}
<button _="on click increment :count then put it into the next <output/>">Click Me</button>
<output>0</output>
{% endexample %}

Element-scoped variables (`:count`) persist across events on the same element. `increment` returns the new value as `it`.
