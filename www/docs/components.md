---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Components {#components}

Hyper-components let you define reusable custom elements using a `<template>` tag.
You write markup with `${}` interpolation, attach hyperscript with `_=`, and the
runtime handles reactive re-rendering via morphing.

### Defining a Component {#defining}

A component is a `<template>` with a `hyper-component` attribute. The value is the
tag name you will use (it must contain a dash, per the custom elements spec):

{% example "A component" %}
<template hyper-component="hello-world">
  <span>Hello World</span>
</template>

<hello-world></hello-world>
<hello-world></hello-world>
{% endexample %}

Place the `<template>` anywhere on the page. The tag becomes available from then on,
so you can use it multiple times. Each instance is independent.

### Template Body {#template-body}

Component templates use hyperscript's template syntax. `${expr}` interpolates an
expression. `#for`, `#if`, `#else`, and `#end` give you loops and conditionals.

  ~~~ html
  <template hyper-component="user-card" _="init set ^user to attrs.data">
    <h3>${^user.name}</h3>
    #if ^user.admin
      <span class="badge">admin</span>
    #end
    <ul>
      #for tag in ^user.tags
        <li>${tag}</li>
      #end
    </ul>
  </template>
  ~~~

Interpolated values are HTML-escaped by default. Use `${unescaped expr}` when you
need raw HTML (use with care).

### Component State {#state}

Use DOM-scoped variables (`^var`) for component state. Each component instance gets
its own isolated DOM scope, so two instances do not share state.

{% example "Component state" %}
<template hyper-component="click-counter" _="init set ^count to 0">
  <button _="on click increment ^count">+</button>
  <span style="margin-left: 1em;">Clicks: ${^count}</span>
</template>

<click-counter></click-counter>
<br>
<click-counter></click-counter>
{% endexample %}

Clicking one counter does not affect the other. The `init` block on the template
runs once per instance and is the usual place to set initial state.

### Reactive Rendering {#reactive-rendering}

Template expressions are reactive. When a `^var` they read changes, the template
re-renders. Rendering uses morphing, so focus, scroll position, and event handlers
are preserved across updates.

{% example "Reactive rendering" %}
<template hyper-component="live-greeter" _="init set ^name to 'World'">
  <input type="text" _="bind ^name to my value" />
  <p>Hello, ${^name}!</p>
</template>

<live-greeter></live-greeter>
{% endexample %}

Typing in the input updates `^name`, which re-renders the paragraph. The input
itself keeps its focus and cursor position because morphing preserves it.

### Accessing Attribute Values

A component can read values from its own HTML attributes via the `attrs` object.

An attribute access is lazily is parsed as a hyperscript expression in the *parent's* scope.

This allows you to pass variables and objects as naturally as you would any hyperscript expression:

{% example "Passing data via attrs" %}
<template hyper-component="user-card" _="init set ^user to attrs.data">
  <h3 style="margin: 0;">${^user.name}</h3>
  <p style="margin: 0;">${^user.email}</p>
</template>

<div _="init set $currentUser to { name: 'Carson', email: 'carson@example.com' }">
  <user-card data="$currentUser"></user-card>
</div>
{% endexample %}

Here `attrs.data` reads the `data` attribute (`"$currentUser"`), parses it as a hyperscript
expression, and evaluates it against the enclosing scope. The component receives the
actual object, not a string.

If you want the raw attribute string instead, use the usual `@attr` syntax. `@data`
gives you `"$currentUser"` as a string, while `attrs.data` gives you the resolved value.

Note that reactive bindings work through the `attrs` object, so you can bind external values to
internal component state.

### Slots {#slots}

`<slot/>` elements let callers pass content into a component. The parent's markup
is projected into the template at the slot position:

{% example "Default slot" %}
<template hyper-component="my-card">
  <div style="border: 1px solid #ccc; padding: 1em; border-radius: 4px;">
    <slot/>
  </div>
</template>

<my-card>
  <p style="margin: 0;">This paragraph ends up inside the card.</p>
</my-card>
{% endexample %}

Named slots let you project multiple regions:

{% example "Named slots" %}
<template hyper-component="my-layout">
  <div style="border: 1px solid #ccc; border-radius: 4px;">
    <header style="padding: 0.5em; background: #f0f0f0;"><slot name="title"/></header>
    <main style="padding: 1em;"><slot/></main>
    <footer style="padding: 0.5em; background: #f0f0f0; font-size: 0.85em;"><slot name="footer"/></footer>
  </div>
</template>

<my-layout>
  <strong slot="title">Page Title</strong>
  <p style="margin: 0;">This goes into the default slot.</p>
  <span slot="footer">Footer text</span>
</my-layout>
{% endexample %}

Slotted content is scoped to the *parent*, not the component. A `^var` in slotted
markup resolves against the parent's scope, not the component's. This is usually
what you want: the caller's content should see the caller's variables.

### DOM Isolation {#dom-isolation}

Each component instance gets `dom-scope="isolated"`, which stops `^var` lookups at
the component boundary. This keeps component state private and avoids collisions
with outer scopes. See [`dom-scope`](/docs/language/#names_and_scoping) in the
language docs for all the scoping options.

### Example: Filterable List {#example-filter}

A component with reactive state, `attrs` input, and two-way binding:

{% example "Filterable List" %}
<template hyper-component="filter-list"
        _="init set ^items to attrs.items
                   set ^query to ''">
  <input type="text" placeholder="Search..." _="bind ^query to my value" />
  <ul>
    #for item in ^items where its name contains ^query ignoring case
      <li>${item.name}</li>
    #else
      <li>No matches</li>
    #end
  </ul>
</template>

<filter-list items="[{name:'Macintosh 128K'}, {name:'Macintosh Plus'}, {name:'Macintosh SE'},
                      {name:'Macintosh II'}, {name:'PowerBook 100'}, {name:'Quadra 700'}]"></filter-list>
{% endexample %}

Typing in the input updates `^query`, which re-runs the `#for` comprehension,
which re-renders the list. 

When there are no matches, the `#else` branch shows the "No matches" message.

<div class="docs-page-nav">
<a href="/docs/reactivity/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Reactivity</strong></a>
<a href="/docs/async/" class="next"><strong>Async Transparency</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
