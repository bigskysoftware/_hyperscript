---
title: Initialize native datepicker with min date of today
---

{% example "Initialize native datepicker with min date of today in _hyperscript" %}
<input
  type="date"
  name="date"
  id="date-picker"
  value=""
  _="init make a Date called today set @min to today.toISOString().split('T')[0]"
/>
{% endexample %}

This example illustrates how to use an init block on a datepicker, to set
its own dynamic attribute from new Date instance.
