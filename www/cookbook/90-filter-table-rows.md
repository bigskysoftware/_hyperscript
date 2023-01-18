---
title: Filter table rows
---

You can filter rows from a table:

```html
<table>
  <thead><tr><th><input _="on input
   show <tbody>tr/> in closest <table/>
     when its textContent.toLowerCase() contains my value.toLowerCase()
  "/></th></tr></thead>
  <tbody style="height:10em;display:block;overflow-y:scroll">
    <tr><td>Foo Bar</td><td>Item 1</td></tr>
    <tr><td>Boo Bar</td><td>Item 2</td></tr>
    <tr><td>Gru Bar</td><td>Item 3</td></tr>
    <tr><td>Zoo Bar</td><td>Item 4</td></tr>
    <tr><td>Foo Bar</td><td>Item 5</td></tr>
  </tbody>
</table>
```

Here we use the `show` command along with `when` and `with` clauses to filter
rows. Note that we use a query selector to ensure we only perform operation
over the body of the table instead of on the input. We set a static height for
the `<tbody>` element and set scrollbars for overflow-y to avoid reflow for the
rest of the page during filtering.

<table>
  <thead><tr><th><input _="on input
   show <tbody>tr/> in closest <table/>
     when its textContent.toLowerCase() contains my value.toLowerCase()
  "/></th></tr></thead>
  <tbody style="height:10em;display:block;overflow-y:scroll">
    <tr><td>Foo Bar</td><td>Item 1</td></tr>
    <tr><td>Boo Bar</td><td>Item 2</td></tr>
    <tr><td>Gru Bar</td><td>Item 3</td></tr>
    <tr><td>Zoo Bar</td><td>Item 4</td></tr>
    <tr><td>Foo Bar</td><td>Item 5</td></tr>
  </tbody>
</table>
