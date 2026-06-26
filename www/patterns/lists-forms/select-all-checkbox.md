---
layout: pattern.njk
title: Select All Checkbox
description: A header checkbox that selects all rows in a table, with an indeterminate state when only some are checked.
tags: [forms, dom, reactivity]
difficulty: intermediate
---

A header checkbox that selects or deselects every row in a table. When only some rows are checked,
the header shows an indeterminate ("&minus;") state.

{% example "Select all with indeterminate state" %}
<table>
<thead>
  <tr>
    <th>
      <input type="checkbox"
        _="on change
             set checked of <input[type=checkbox]/> in the next <tbody/> to my checked
           live
             set checked to <:checked/> in the next <tbody/>
             set all to <input[type=checkbox]/> in the next <tbody/>
             if checked is empty
               set my indeterminate to false then set my checked to false
             else if checked.length equals all.length
               set my indeterminate to false then set my checked to true
             else
               set my indeterminate to true
             end">
    </th>
    <th>Task</th>
    <th>Status</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td><input type="checkbox"></td>
    <td>Write documentation</td>
    <td>In progress</td>
  </tr>
  <tr>
    <td><input type="checkbox"></td>
    <td>Fix login bug</td>
    <td>Open</td>
  </tr>
  <tr>
    <td><input type="checkbox"></td>
    <td>Deploy to staging</td>
    <td>Pending</td>
  </tr>
  <tr>
    <td><input type="checkbox"></td>
    <td>Review pull request</td>
    <td>Open</td>
  </tr>
  <tr>
    <td><input type="checkbox"></td>
    <td>Update dependencies</td>
    <td>Open</td>
  </tr>
</tbody>
</table>
<style>
table { border-collapse: collapse; width: 100%; }
th, td { padding: 0.5rem 0.75rem; border-bottom: 1px solid #ddd; text-align: left; }
th { background: #f5f5f5; }
</style>
{% endexample %}

All the logic lives on the header checkbox:

- **`on change`** bulk-sets every row checkbox to match the header.

- **`live`** reactively queries the DOM for checked and total checkboxes
  in the tbody. When any row checkbox changes, the queries re-evaluate
  and the header updates its checked/indeterminate state automatically.
  No event delegation needed -- the `live` block watches the DOM directly.
