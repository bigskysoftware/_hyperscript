---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Components {#components}

### Overview {#components-overview}

TODO

### Defining a Component {#defining}

TODO: `<template hyper-component="tag-name">`

### Template Body {#template-body}

TODO: `${}` interpolation, `#for`, `#if`

### Slots {#slots}

TODO: default slots, named slots

### The `args` Proxy {#args}

TODO: attribute evaluation in parent scope, bidirectional binding

### Reactive Rendering {#reactive-rendering}

TODO: automatic re-render via morph when dependencies change

### DOM Isolation {#dom-isolation}

TODO: `dom-scope="isolated"`, `^var` scoping boundaries

### Examples {#component-examples}

#### Filterable List Component

  ~~~ html
  <template hyper-component="filter-list" _="set ^list to args.items">
    <input type="text" placeholder="Search..."
           _="on input
                hide #no-match
                show <li:not(#no-match)/> in closest <filter-list/>
                  when its textContent contains my value
                  ignoring case
                show #no-match when the result is empty" />
    <ul>
    #for item in ^list
      <li>${item}</li>
    #end
      <li id="no-match" style="display:none; color:var(--text-muted)">No results</li>
    </ul>
  </template>
  ~~~

Usage:

  ~~~ html
  <filter-list items="['Macintosh 128K', 'Macintosh Plus', 'Macintosh SE',
                        'Macintosh II', 'Macintosh Classic', 'PowerBook 100',
                        'PowerBook 170', 'Quadra 700', 'Quadra 950']">
  </filter-list>
  ~~~

Demo:

<div>
<template hyper-component="filter-list" _="set ^list to args.items">
    <input type="text" placeholder="Search..."
           _="on input
                hide #no-match
                show <li:not(#no-match)/> in closest <filter-list/>
                  when its textContent contains my value
                  ignoring case
                show #no-match when the result is empty" />
    <ul>
    #for item in ^list
      <li>${item}</li>
    #end
      <li id="no-match" style="display:none; color:var(--text-muted)">No results</li>
    </ul>
</template>
<filter-list items="['Macintosh 128K', 'Macintosh Plus', 'Macintosh SE',
                    'Macintosh II', 'Macintosh Classic', 'PowerBook 100',
                    'PowerBook 170', 'Quadra 700', 'Quadra 950']">
</filter-list>
</div>

<div class="docs-page-nav">
<a href="/docs/advanced/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Advanced</strong></a>
<a href="/docs/" class="next"><strong>Docs Home</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7l7 7 7-7"/></svg></a>
</div>