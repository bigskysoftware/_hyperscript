---
layout: pattern.njk
title: Filterable Table with Cascading Visibility
description: Three lines of `add ... when` filter rows, hide empty groups, and toggle a no-results state.
tags: [forms, dom, search]
difficulty: intermediate
---

A search input that filters table rows, automatically hides any group whose
rows have all been filtered out, and shows a "no results" message when nothing
matches at all with three declarative hyperscript commands.

{% example "Search across departments" %}
<div>
<input type="text" class="employee-search" placeholder="Search employees…"
       _="on input
            add @hidden to <tr.employee-row/>
              when its textContent does not contain my value ignoring case
            add @hidden to <section.employee-group/>
              when <tr.employee-row:not([hidden])/> in it is empty
            add @hidden to #employee-empty
              when <section.employee-group:not([hidden])/> is not empty">

<p id="employee-empty" hidden>No employees match your search.</p>

<section class="employee-group">
<h4>Engineering</h4>
<table class="employee-table">
<tbody>
<tr class="employee-row"><td>Ada Lovelace</td><td>Compiler Lead</td></tr>
<tr class="employee-row"><td>Grace Hopper</td><td>Principal Engineer</td></tr>
<tr class="employee-row"><td>Linus Torvalds</td><td>Kernel Maintainer</td></tr>
</tbody>
</table>
</section>

<section class="employee-group">
<h4>Design</h4>
<table class="employee-table">
<tbody>
<tr class="employee-row"><td>Dieter Rams</td><td>Industrial Designer</td></tr>
<tr class="employee-row"><td>Susan Kare</td><td>Icon Designer</td></tr>
</tbody>
</table>
</section>

<section class="employee-group">
<h4>Operations</h4>
<table class="employee-table">
<tbody>
<tr class="employee-row"><td>Marie Curie</td><td>Lab Director</td></tr>
<tr class="employee-row"><td>Rosalind Franklin</td><td>Imaging Lead</td></tr>
</tbody>
</table>
</section>
</div>
<style>
.employee-search { width: 100%; padding: 8px 12px; font-size: 1rem; box-sizing: border-box; margin-bottom: 1rem; }
.employee-group { margin-bottom: 1.25rem; }
.employee-group h4 { font-family: var(--font-heading); margin: 0 0 0.4rem; padding-bottom: 0.3rem; border-bottom: 1px solid #e5e7eb; font-size: 0.95rem; }
.employee-table { width: 100%; border-collapse: collapse; }
.employee-table td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
.employee-table td:last-child { color: #666; text-align: right; }
#employee-empty { text-align: center; padding: 1rem; color: #999; font-family: var(--font-heading); }
</style>
{% endexample %}

The whole filter is three commands:

~~~ hyperscript
on input
  add @hidden to <tr.employee-row/>
    when its textContent does not contain my value ignoring case
  add @hidden to <section.employee-group/>
    when <tr.employee-row:not([hidden])/> in it is empty
  add @hidden to #employee-empty
    when <section.employee-group:not([hidden])/> is not empty
~~~

## How this works

Each line is a single declarative assertion about the DOM after the input
fires. The magic is that `add ... when` doesn't just *add* the attribute when
the predicate is true: it also *removes* it when false. So one line covers
both directions of the toggle, every time the input fires.

That means each line is a stateless rule:

1. **Row visibility** - `add @hidden to <tr.employee-row/> when its textContent does not contain my value`. After this runs, exactly the matching rows have `hidden` cleared and the rest have it set. No loops, no `if`s, no temp vars.

2. **Group visibility** - `add @hidden to <section.employee-group/> when <tr.employee-row:not([hidden])/> in it is empty`. The predicate references the result of the previous line via `<tr.employee-row:not([hidden])/>` - a CSS selector that only matches rows still visible. If a section has zero such rows, it gets `hidden`.

3. **Empty state** - `add @hidden to #employee-empty when <section.employee-group:not([hidden])/> is not empty`. Same pattern, one level up: hide the empty-state message when at least one section is still visible. Otherwise show it.
