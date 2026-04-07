---
title: Keyboard Shortcuts
tags: [events, interaction]
difficulty: intermediate
---

{% example "Listen for keyboard events" %}
<input type="text" placeholder="Type here, press Escape to clear"
       _="on keyup[key is 'Escape'] clear then blur" />
{% endexample %}

Event filters in square brackets let you match specific key presses, modifier keys, or any event property.
