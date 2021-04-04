---
layout: layout.njk
title: ///_hyperscript
---

## The `render` command

### Syntax

`render <template> with (<arg list>)`

where

* `<template>` is an HTML element containing a template

### Description

The `render` command implements a simple template language. This language has two rules:

* You can use `${}` string interpolation, just like in [template literals]().
* Any line starting with `@` is executed as a _hyperscript statement.

The result of rendering the template will be stored in the `result` (or `it`) variable.

For example, if we want to render a list of colors:

```html
<button _="on click
  render #color-template with (colors: getColors()) then put it into #colors">
  Get the colors
</button>
```

Our template might look like this:

```html
<template id="color-template">
  <ul>
    @repeat in colors
      @set bg to it
      @set fg to getContrastingColor(it)
      <li style="background: ${bg}; color: ${fg}">${bg}</li>
    @end
  </ul>
</template>
```

**Warning:** Hyperscript templates currently perform **no** HTML escaping. Do not include untrusted (e.g. user-generated) data into your templates.
