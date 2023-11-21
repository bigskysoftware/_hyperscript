---
title: render - ///_hyperscript
---

## The `render` command

### Installing

Note: if you want the template command, you must include the /dist/template.js file in addition to the hyperscript script
  ~~~ html
  <script src="https://unpkg.com/hyperscript.org@0.9.12/dist/template.js"></script>
  ~~~

### Syntax

`render <template> with (<arg list>)`

where

- `<template>` is an HTML element containing a template

### Description

The `render` command implements a simple template language. This language has two rules:

- You can use `${}` string interpolation, just like in [template literals](). However, bare `` `$var` `` interpolation is not supported.
- Interpolated expressions will be HTML-escaped, unless they are preceded by `unescaped`.
- Any line starting with `@` is executed as a \_hyperscript statement.

The result of rendering the template will be stored in the `result` (or `it`) variable.

For example, if we want to render a list of colors:

```html
<button
  _="on click
    render #color-template with (colors: getColors())
    then put it into #colors"
>
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
      <li style="background: ${bg}; color: ${unescaped fg}">${bg}</li>
    @end
  </ul>
</template>
```
