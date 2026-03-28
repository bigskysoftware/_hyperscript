---
title: Copy to Clipboard
tags: [interaction, dom]
difficulty: intermediate
---

{% example "Copy text and show feedback" %}
<code id="snippet">npm install hyperscript.org</code>
<button _="on click
             writeText(#snippet's innerText) on navigator.clipboard
             put 'Copied!' into me
             wait 1s
             put 'Copy' into me">
  Copy
</button>
{% endexample %}

Use the browser's clipboard API directly from hyperscript. Combine with `wait` for timed feedback.
