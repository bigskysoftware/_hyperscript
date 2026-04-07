---
title: Show / Hide an Element
tags: [basics, dom]
difficulty: beginner
---

{% example "Click to show and hide" %}
<button _="on click toggle the *display of the next <div/> between 'none' and 'block'">Toggle Panel</button>
<div id="panel" style="display:none; padding: 1em; background: #f0f0f0; margin-top: 0.5em;">
  I appear and disappear!
</div>
{% endexample %}

Toggle visibility by switching the `display` style. You can also use `show` and `hide` commands for more control.
