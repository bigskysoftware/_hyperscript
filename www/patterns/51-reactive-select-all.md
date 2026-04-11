---
title: Reactive Select All Checkbox
tags: [forms, dom, reactivity]
difficulty: intermediate
---

A reactive take on the [Select All Checkbox](/patterns/50-select-all-checkbox) pattern.
Instead of querying the DOM on every change, each row checkbox maintains a shared `$selectedCount`
variable and the header reactively derives its state with `when ... changes`.

{% example "Reactive select all" %}
<table>
<thead>
  <tr>
    <th>
      <input type="checkbox"
        _="bind $selectedCount to the length of <:checked/> in the next <tbody/>
           when $selectedCount changes
             set total to <input[type=checkbox]/> in the next <tbody/>
             if $selectedCount is 0
               set my indeterminate to false
               set my checked to false
             else if $selectedCount is total.length
               set my indeterminate to false
               set my checked to true
             else
               set my indeterminate to true
             end"> <span _="live put $selectedCount into me">-</span>
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

Each row checkbox increments or decrements `$selectedCount` on change, using `I am checked`
as a natural boolean property test. The header uses `when $selectedCount changes` to reactively
update its checked and indeterminate state — no DOM scanning needed.

This pattern works well when other parts of the page also need to react to the selection count,
since `$selectedCount` is a shared reactive variable that any element can observe.
