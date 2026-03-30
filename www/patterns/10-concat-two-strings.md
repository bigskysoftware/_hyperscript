---
title: Concatenate Strings
tags: [basics, strings]
difficulty: beginner
---

{% example "Read values from elements and combine them" %}
<p id="first">Hello</p>
<p id="second">World</p>
<button class="btn primary" _="on click set my.innerText to #first.innerText + ' ' + #second.innerText">
  Concat
</button>
{% endexample %}

Fetch state from other elements by ID, combine with `+`, and write the result back.
