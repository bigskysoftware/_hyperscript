---
title: Hello World - concat two strings
---

{% example "Concatenate two strings in _hyperscript" %}
<p id="first">Hello</p>
<p id="second">World</p>
<button class="btn primary" _="on click set my.innerText to #first.innerText + ' ' + #second.innerText">
  Concat
</button>
{% endexample %}

This example illustrates how to use an event handler to fetch state from other elements, perform
a simple operation, and then store that state in another location.
