---
title: Infinite Scroll
tags: [htmx, async]
difficulty: advanced
---

Trigger an htmx request when an element scrolls into view:

{% example "Load more content on scroll" %}
<div style="height:150px;overflow-y:auto;border:1px solid #ddd;padding:8px">
  <p>Scroll down for more...</p>
  <p>Item 1</p><p>Item 2</p><p>Item 3</p><p>Item 4</p><p>Item 5</p>
  <div _="on intersection(intersecting) having threshold 0.5
            if intersecting put 'Loading...' into me
            wait 500ms
            put '<p>New item!</p>' before me">
    ⏳ Load more
  </div>
</div>
{% endexample %}

Use the `on intersection` event to detect when an element enters the viewport. Combine with htmx's `hx-get` for real server-driven infinite scroll.
