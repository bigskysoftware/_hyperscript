---
title: Delayed Action
tags: [async, basics]
difficulty: beginner
---

{% example "Wait before executing a command" %}
<button _="on click
             put 'Working...' into me
             wait 2s
             put 'Done!' into me">
  Start
</button>
{% endexample %}

The `wait` command pauses execution. No callbacks, no promises — hyperscript handles async transparently.
