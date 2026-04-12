---
layout: pattern.njk
title: Select All Component
description: The select-all checkbox wrapped in a reusable `<master-checkbox>` component you can drop into any table.
tags: [forms, dom, component]
difficulty: intermediate
---

The [Select All Checkbox](/patterns/lists-forms/select-all-checkbox/) pattern wrapped in a reusable
component. Drop a `<master-checkbox>` into any table header and it just works.

{% example "Master checkbox component" %}
<script type="text/hypertemplate" component="master-checkbox">
  <input type="checkbox" _="set :checkboxes to <input[type=checkbox]/> in the closest <table/> where it is not me
            on change
               set checked of the :checkboxes to my checked
             on change from the closest <table/>
               if no :checkboxes where it is checked
                 set my indeterminate to false
                 set my checked to false
               else if no :checkboxes where it is not checked
                 set my indeterminate to false
                 set my checked to true
               else
                 set my indeterminate to true
               end">
</script>
<table>
<thead>
  <tr>
    <th><master-checkbox></master-checkbox></th>
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

The component extends `<input>` behavior -- since `<master-checkbox>` has no template body,
it renders as an empty custom element, but the hyperscript on the component definition
runs on each instance. It finds all checkboxes in `the closest <table/>`, excluding itself
with `where it is not me`.

Because the scope is `the closest <table/>` rather than `the next <tbody/>`, the component
works regardless of where it's placed in the table structure. Drop it into any `<th>` and
it automatically controls the checkboxes in the same table.
