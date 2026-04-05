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
  put it into #container
  ~~~

Template lines are output as-is. `${expr}` interpolates hyperscript expressions with HTML escaping by default
(use `${unescaped expr}` for raw output). Lines starting with `#` are control flow: `#for`, `#if`, `#else`, `#end`.

You can also use inline conditionals inside an expression:

  ~~~ html
  <template id="status">
  <td>${user.name}</td>
  <td>${user.role if user.active else "Inactive"}</td>
  </template>
  ~~~

`#for` loops support an `#else` clause that renders when the collection is empty or null, and
`#break` and `#continue` for loop control:

  ~~~ html
  <template id="user-list">
  <ul>
  #for user in users
    #if user.hidden
      #continue
    #end
    <li>${user.name}</li>
  #else
    <li>No users found</li>
  #end
  </ul>
  </template>
  ~~~

Named arguments passed via `with` become local variables in the template. See the
[`render` command](/commands/render) for full details.

### Morphing {#morphing}

Morphing is a technique where, rather than replacing an entire section of the DOM with new content, the existing
content is modified to match the new content, reusing existing nodes as much as possible. There are many variants
of DOM morphing, from the original [morphdom](https://github.com/patrick-steele-idem/morphdom) to our own
[idiomorph](https://github.com/bigskysoftware/idiomorph) algorithm.

The advantage of morphing is that it preserves things like focus in the DOM as you dynamically update content.

Hyperscript has a [`morph` command](/commands/morph) that implements a variant of the idiomorph algorithm:

  ~~~ hyperscript
  render #user-list with users: userData
  morph #container to it
  ~~~

This differs from `put it into #container`, which replaces `innerHTML` and throws away
the existing nodes. `morph` walks the old and new trees and only mutates what changed.

Focus, scroll position, form state, and in-flight CSS transitions on nodes that still
exist are kept intact.

You can use `morph` when you want to re-render a view from data without disturbing the user's
state. You can use `put` (or `set my innerHTML to ...`) when you want a clean replacement.

Note that `morph` composes naturally with templates and with [reactivity](/docs/reactivity/). 

A [`live`](/features/live) block that renders a template and morphs the result will update the DOM in 
place whenever its dependencies change:

  ~~~ hyperscript
  live
    render #user-list with users: $users
    morph #container to it
  end
  ~~~

This forms the basis of [hyper-components](/docs/components/).

<div class="docs-page-nav">
<a href="/docs/getting-around/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Getting Around</strong></a>
<a href="/docs/reactivity/" class="next"><strong>Reactivity</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
