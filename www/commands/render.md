---
title: render - ///_hyperscript
---

## The `render` Command

The `render` command generates HTML strings from `<template>` elements using a simple template language. The result is placed into `it` / `the result`.

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

#for item in collection
  ...template lines...
#else
  ...shown when collection is empty or null...
#end

#if condition
  ...template lines...
#else
  ...template lines...
#end
```

The `#for...#else` clause runs when the collection is empty or null — useful for
"no results" messages without a separate `#if` check.

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

Empty collection handling with `#for...#else`:

```html
<template id="results">
#for item in items
  <li>${item.name}</li>
#else
  <li class="empty">No results found</li>
#end
</template>

<button _="on click
  render #results with items: searchResults
  put it into #list">
  Search
</button>
<ul id="list"></ul>
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

Inline conditional expressions:

```html
<template id="user-row">
  <td>${user.name}</td>
  <td>${user.role if user.active else "Inactive"}</td>
  <td>${user.email if user.showEmail}</td>
</template>
```

`${value if condition}` renders the value only when the condition is truthy (empty string otherwise).
`${value if condition else fallback}` renders the fallback when the condition is falsy.

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

### Syntax

```ebnf
render <template-element> [with <name>: <expression>, ...]
```
