---
layout: pattern.njk
title: Select All Checkbox
description: A header checkbox that selects all rows in a table, with an indeterminate state when only some are checked.
tags: [forms, dom, interaction]
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
        _="set :checkboxes to <input[type=checkbox]/> in the next <tbody/>
           on change
             set checked of the :checkboxes to my checked
           on change from the next <tbody/>
             if no :checkboxes where it is checked
               set my indeterminate to false
               set my checked to false
             else if no :checkboxes where it is not checked
               set my indeterminate to false
               set my checked to true
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

All the logic lives on the header checkbox with two event handlers:

- **`on click`** bulk-sets every row checkbox to match the header using
  `set checked of <input[type=checkbox]/> in the next <tbody/> to my checked`.

- **`on change from the next <tbody/>`** catches bubbled change events from
  any row checkbox. It grabs all the checkboxes with a query literal, then uses
  `where its checked` and `where not its checked` to filter them. If none are checked,
  uncheck the header. If none are unchecked, check it. Otherwise, set `indeterminate`.

No IDs needed - `the next <tbody/>` targets the sibling tbody relative to the header.
