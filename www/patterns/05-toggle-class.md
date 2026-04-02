---
title: Toggle a Class
tags: [basics, dom]
difficulty: beginner
---

{% example "Toggle a CSS class on click" %}
<button _="on click toggle .active on me">Toggle Active</button>
<style>.active { background: #4a84c4; color: white; }</style>
{% endexample %}

The simplest hyperscript pattern: listen for an event, toggle a class. The element targets itself with `me`.
