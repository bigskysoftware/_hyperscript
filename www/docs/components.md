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

### The `attrs` Proxy {#attrs}

TODO: attribute evaluation in parent scope, bidirectional binding

### Reactive Rendering {#reactive-rendering}

TODO: automatic re-render via morph when dependencies change

### DOM Isolation {#dom-isolation}

TODO: `dom-scope="isolated"`, `^var` scoping boundaries

### Examples {#component-examples}

#### Filterable List Component

  ~~~ html
  <template hyper-component="filter-list" _="set ^list to attrs.items">
    <input type="text" placeholder="Search..."
           _="on input
                hide #no-match
                show <li:not(#no-match)/> in closest <filter-list/>
                  when its textContent contains my value
                  ignoring case
                show #no-match when the result is empty" />
    <ul>
    #for item in ^list
      <li><a href="${item.url}">${item.name}</a></li>
    #end
      <li id="no-match" style="display:none; color:var(--text-muted)">No results</li>
    </ul>
  </template>
  ~~~

Usage:

  ~~~ html
  <filter-list items="[{name: 'Macintosh 128K', url: 'https://en.wikipedia.org/wiki/Macintosh_128K'},
                        {name: 'Macintosh Plus', url: 'https://en.wikipedia.org/wiki/Macintosh_Plus'},
                        ...]">
  </filter-list>
  ~~~

Demo:

<div>
<template hyper-component="filter-list" _="set ^list to attrs.items">
    <input type="text" placeholder="Search..."
           _="on input
                hide #no-match
                show <li:not(#no-match)/> in closest <filter-list/>
                  when its textContent contains my value
                  ignoring case
                show #no-match when the result is empty" />
    <ul>
    #for item in ^list
      <li><a href="${unescaped item.url}">${item.name}</a></li>
    #end
      <li id="no-match" style="display:none; color:var(--text-muted)">No results</li>
    </ul>
</template>
<filter-list items="[
  {name: 'Macintosh 128K', url: 'https://en.wikipedia.org/wiki/Macintosh_128K'},
  {name: 'Macintosh 512K', url: 'https://en.wikipedia.org/wiki/Macintosh_512K'},
  {name: 'Macintosh Plus', url: 'https://en.wikipedia.org/wiki/Macintosh_Plus'},
  {name: 'Macintosh SE', url: 'https://en.wikipedia.org/wiki/Macintosh_SE'},
  {name: 'Macintosh SE/30', url: 'https://en.wikipedia.org/wiki/Macintosh_SE/30'},
  {name: 'Macintosh II', url: 'https://en.wikipedia.org/wiki/Macintosh_II'},
  {name: 'Macintosh Classic', url: 'https://en.wikipedia.org/wiki/Macintosh_Classic'},
  {name: 'PowerBook 100', url: 'https://en.wikipedia.org/wiki/PowerBook_100'},
  {name: 'PowerBook 170', url: 'https://en.wikipedia.org/wiki/PowerBook_170'},
  {name: 'Quadra 700', url: 'https://en.wikipedia.org/wiki/Macintosh_Quadra_700'},
  {name: 'Quadra 950', url: 'https://en.wikipedia.org/wiki/Macintosh_Quadra_950'}
]">
</filter-list>
</div>

#### Reactive Filterable List

The same component using reactive rendering instead of show/hide. The `#if` inside `#for` filters
at render time: when `^query` changes, the template re-renders and the result is morphed in.  If no
matches are found it will show a "No Results" item.

  ~~~ html
  <template hyper-component="reactive-filter-list"
          _="set ^list to attrs.items
             set ^query to ''">
    <input type="text" placeholder="Search..." _="bind me to ^query" />
    <ul>
      #for item in ^list where its name contains the ^query ignoring case
        <li><a href="${unescaped item.url}">${item.name}</a></li>
      #else
        <li>No Results</li>
      #end
    </ul>
  </template>
  ~~~

Demo:

<div>
  <template hyper-component="reactive-filter-list"
          _="set ^list to attrs.items
             set ^query to ''">
    <input type="text" placeholder="Search..." _="bind me to ^query" />
    <ul>
      #for item in ^list where its name contains the ^query ignoring case
        <li><a href="${unescaped item.url}">${item.name}</a></li>
      #else
        <li>No Results</li>
      #end
    </ul>
  </template>

<reactive-filter-list items="[
  {name: 'Macintosh 128K', url: 'https://en.wikipedia.org/wiki/Macintosh_128K'},
  {name: 'Macintosh 512K', url: 'https://en.wikipedia.org/wiki/Macintosh_512K'},
  {name: 'Macintosh Plus', url: 'https://en.wikipedia.org/wiki/Macintosh_Plus'},
  {name: 'Macintosh SE', url: 'https://en.wikipedia.org/wiki/Macintosh_SE'},
  {name: 'Macintosh SE/30', url: 'https://en.wikipedia.org/wiki/Macintosh_SE/30'},
  {name: 'Macintosh II', url: 'https://en.wikipedia.org/wiki/Macintosh_II'},
  {name: 'Macintosh Classic', url: 'https://en.wikipedia.org/wiki/Macintosh_Classic'},
  {name: 'PowerBook 100', url: 'https://en.wikipedia.org/wiki/PowerBook_100'},
  {name: 'PowerBook 170', url: 'https://en.wikipedia.org/wiki/PowerBook_170'},
  {name: 'Quadra 700', url: 'https://en.wikipedia.org/wiki/Macintosh_Quadra_700'},
  {name: 'Quadra 950', url: 'https://en.wikipedia.org/wiki/Macintosh_Quadra_950'}
]"></reactive-filter-list>

</div>

<div class="docs-page-nav">
<a href="/docs/advanced/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Advanced</strong></a>
<a href="/docs/" class="next"><strong>Docs Home</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14m-7-7l7 7 7-7"/></svg></a>
</div>