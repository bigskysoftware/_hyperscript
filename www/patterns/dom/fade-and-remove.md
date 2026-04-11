---
layout: pattern.njk
title: Fade & Remove
description: Fade an element to zero opacity using `transition`, then remove it from the DOM.
tags: [animation, dom]
difficulty: beginner
---

If you wish to fade an element out and remove it from the DOM, you can use something like this:

{% example "Using the transition command" %}
<div>
<button _="on click transition *opacity to 0 then remove me">
  Fade & Remove
</button>
</div>
{% endexample %}
