---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Templates & Morphing {#templates-and-morphing}

### Templates {#templates}

The [`render`](/commands/render) command lets you generate HTML strings from `<template>` elements with interpolation
and control flow:

  ~~~ html
  <template id="user-list">
  <ul>
  #for user in users
    <li>${user.name} (${user.role})</li>
  #end
  </ul>
  </template>
  ~~~

  ~~~ hyperscript
  render #user-list with users: userData
  put it into #container.innerHTML
  ~~~

Template lines are output as-is. `${expr}` interpolates hyperscript expressions with HTML escaping by default
(use `${unescaped expr}` for raw output). Lines starting with `#` are control flow: `#for`, `#if`, `#else`, `#end`.

Named arguments passed via `with` become local variables in the template. See the
[`render` command](/commands/render) for full details.

### Morphing {#morphing}

TODO: `morph` command, DOM preservation, integration with templates and reactivity

<div class="docs-page-nav">
<a href="/docs/dom/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Working With The DOM</strong></a>
<a href="/docs/network/" class="next"><strong>Network & Async</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
