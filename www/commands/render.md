---
title: render - ///_hyperscript
---

## The `render` Command

### Syntax

```ebnf
render <template-element> [with <name>: <expr>, ...]
```

### Description

The `render` command implements a template language for generating HTML strings from `<template>` elements.
The result is placed into `it` / `the result`.

Templates have three rules:

- Lines are output as-is (template text)
- `${expr}` interpolates a hyperscript expression, HTML-escaped by default. Use `${unescaped expr}` to output raw HTML.
- Lines starting with `#` are control flow: `#for`, `#if`, `#else`, `#end`

Named arguments passed via `with` are available as local variables inside the template.

### Control Flow

```
#for item in collection
  ...template lines...
#end

#if condition
  ...template lines...
#else
  ...template lines...
#end
```

### Examples

Render a list of colors:

```html
<template id="color-template">
#for color in colors
  <li style="background: ${color}">${color}</li>
#end
</template>

<button _="on click
  render #color-template with colors: ['red', 'green', 'blue']
  put it into #color-list">
  Show Colors
</button>
<ul id="color-list"></ul>
```

Conditional rendering:

```html
<template id="greeting">
#if name
  <p>Hello, ${name}!</p>
#else
  <p>Hello, stranger!</p>
#end
</template>

<button _="on click
  render #greeting with name: 'World'
  put it into #output">
  Greet
</button>
<div id="output"></div>
```

Escaping and unescaped output:

```html
<template id="demo">
  Escaped: ${html}
  Raw: ${unescaped html}
</template>
```

With `html` set to `"<b>bold</b>"`, this produces:

```
  Escaped: &lt;b&gt;bold&lt;/b&gt;
  Raw: <b>bold</b>
```
