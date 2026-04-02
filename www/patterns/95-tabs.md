---
title: Tab Navigation
tags: [interaction, dom]
difficulty: intermediate
---

{% example "Click tabs to switch content" %}
<div class="tabs">
  <button class="active" _="on click take .active from .tabs > button for me then
                                      put 'Content for Tab 1' into #tab-content">Tab 1</button>
  <button _="on click take .active from .tabs > button for me then
                       put 'Content for Tab 2' into #tab-content">Tab 2</button>
  <button _="on click take .active from .tabs > button for me then
                       put 'Content for Tab 3' into #tab-content">Tab 3</button>
</div>
<div id="tab-content" style="padding: 1em; border: 1px solid #ddd; margin-top: -1px;">Content for Tab 1</div>
<style>.tabs button { padding: 8px 16px; border: 1px solid #ddd; background: #f5f5f5; cursor: pointer; }
.tabs button.active { background: white; border-bottom-color: white; }</style>
{% endexample %}

The `take` command moves a class from one set of elements to another — perfect for active states.
