---
title: components - ///_hyperscript
---

## Components

Components let you define reusable custom elements using a `<template>` tag. You write your markup with `${}` interpolation, attach hyperscript with `_=`, and hyperscript handles reactive re-rendering automatically.

To define a component, create a `<template>` with a `hyper-component` attribute set to your tag name (which must contain a dash, per the custom elements spec). Then use the component anywhere in your page like a normal HTML element.

Component-scoped variables use the `^` prefix (e.g. `^count`). These are local to each component instance -- multiple instances of the same component each get their own scope. The component's `_` attribute runs when the element connects, so `init` is the natural place to set up initial state.

### Slots

Components support content projection through `<slot>` elements. Any children you put inside a component tag get inserted where `<slot/>` appears in the template. You can also use named slots by adding a `slot="name"` attribute to child elements and a `name="name"` attribute to the corresponding `<slot>` in the template.

```html
<template hyper-component="my-card">
  <div class="card">
    <h2><slot name="title"></slot></h2>
    <slot/>
  </div>
</template>

<my-card>
  <span slot="title">Card Title</span>
  This is the default slot content.
</my-card>
```

### The `attrs` Proxy

The `attrs` proxy gives you access to attribute values evaluated as hyperscript expressions in the *parent* scope. This lets a parent pass data into a component through HTML attributes, and the component can read them via `attrs.attributeName`.

```html
<template hyper-component="my-display" _="init set ^val to attrs.initial">
  <span>${^val}</span>
</template>

<my-display initial="$someGlobalVar"></my-display>
```

The attribute value (`$someGlobalVar`) is parsed and evaluated as a hyperscript expression in the parent's context, so the component receives the resolved value.

### Reactive Rendering

Template expressions (`${}`) are re-evaluated automatically whenever the reactive variables they depend on change. When a re-render happens, hyperscript uses DOM morphing to update only what changed, preserving element identity and event handlers.

```html
<template hyper-component="my-counter" _="init set ^count to 0">
  <button _="on click increment ^count">+</button>
  <span>Count: ${^count}</span>
</template>

<my-counter></my-counter>
```

Clicking the button increments `^count`, which triggers a re-render. The `<button>` keeps its event listener because morphing preserves it.

### DOM Isolation

Each component instance gets `dom-scope="isolated"`, which means `^var` lookups stop at the component boundary. This keeps component state private. Slotted content from the parent is automatically annotated so that `^var` references inside it resolve against the parent's scope, not the component's.

### Examples

A simple greeting component:

```html
<template hyper-component="hello-world">
  <span>Hello World</span>
</template>

<hello-world></hello-world>
```

A counter with reactive template rendering:

```html
<template hyper-component="click-counter" _="init set ^count to 0">
  <button _="on click increment ^count">+</button>
  <span>Count: ${^count}</span>
</template>

<click-counter></click-counter>
```

Multiple independent instances, each with their own state:

```html
<click-counter></click-counter>
<click-counter></click-counter>
```

Reading attributes at initialization:

```html
<template hyper-component="start-at" _="init set ^val to @data-start as Int">
  <span>${^val}</span>
</template>

<start-at data-start="42"></start-at>
```

### Syntax

```html
<template hyper-component="<tag-name>" [_="<hyperscript>"]>
  <!-- template body with ${<expression>} interpolation -->
</template>

<tag-name [attribute="value"]*>
  [slot content]
</tag-name>
```
