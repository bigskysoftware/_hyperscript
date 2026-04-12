---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Components {#components}

Components let you define reusable custom elements using a `<script type="text/hyperscript-template">` tag.
You write markup with `${}` interpolation, attach hyperscript with `_=`, and the
runtime handles reactive re-rendering via morphing.

Components is an extension and must be loaded separately after hyperscript.

See the [component feature page](/features/components) for installation details.

### Defining a Component {#defining}

A component is a `<script type="text/hyperscript-template">` with a `component` attribute. The value is the
tag name you will use (it must contain a dash, per the custom elements spec):

{% example "A component" %}
<script type="text/hyperscript-template" component="hello-world">
  <span>Hello World</span>
</script>

<hello-world></hello-world>
<hello-world></hello-world>
{% endexample %}

Place the `<script type="text/hyperscript-template">` anywhere on the page. The tag becomes available from then on,
so you can use it multiple times. Each instance is independent.

### Template Body {#template-body}

Component templates use hyperscript's template syntax. `${expr}` interpolates an
expression. `#for`, `#if`, `#else`, and `#end` give you loops and conditionals.

  ~~~ html
  <script type="text/hyperscript-template" component="user-card" _="init set ^user to attrs.data">
    <h3>${^user.name}</h3>
    #if ^user.admin
      <span class="badge">admin</span>
    #end
    <ul>
      #for tag in ^user.tags
        <li>${tag}</li>
      #end
    </ul>
  </script>
  ~~~

Interpolated values are HTML-escaped by default. Use `${unescaped expr}` when you
need raw HTML (use with care).

### Component State {#state}

Use DOM-scoped variables (`^var`) for component state. Each component instance gets
its own isolated DOM scope, so two instances do not share state.

{% example "Component state" %}
<script type="text/hyperscript-template" component="click-counter" _="init set ^count to 0">
  <style>
    .label { margin-left: 1em; }
  </style>
  <button _="on click increment ^count">+</button>
  <span class="label">Clicks: ${^count}</span>
</script>

<click-counter></click-counter>
<br>
<click-counter></click-counter>
{% endexample %}

Clicking one counter does not affect the other. The `init` block on the component
runs once per instance and is the usual place to set initial state.

### Reactive Rendering {#reactive-rendering}

Template expressions are reactive. When a `^var` they read changes, the template
re-renders. Rendering uses morphing, so focus, scroll position, and event handlers
are preserved across updates.

{% example "Reactive rendering" %}
<script type="text/hyperscript-template" component="live-greeter" _="init set ^name to 'World'">
  <input type="text" _="bind ^name to my value" />
  <p>Hello, ${^name}!</p>
</script>

<live-greeter></live-greeter>
{% endexample %}

Typing in the input updates `^name`, which re-renders the paragraph. The input
itself keeps its focus and cursor position because morphing preserves it.

### Accessing Attribute Values

A component can read values from its own HTML attributes via the `attrs` object.

An attribute access is lazily is parsed as a hyperscript expression in the *parent's* scope.

This allows you to pass variables and objects as naturally as you would any hyperscript expression:

{% example "Passing data via attrs" %}
<script type="text/hyperscript-template" component="user-card" _="init set ^user to attrs.data">
  <style>
    h3, p { margin: 0; }
  </style>
  <h3>${^user.name}</h3>
  <p>${^user.email}</p>
</script>

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
<script type="text/hyperscript-template" component="my-card">
  <style>
    :scope { display: block; }
    .frame {
      border: 1px solid #ccc;
      padding: 1em;
      border-radius: 4px;
    }
    p { margin: 0; }
  </style>
  <div class="frame">
    <slot/>
  </div>
</script>

<my-card>
  <p>This paragraph ends up inside the card.</p>
</my-card>
{% endexample %}

Named slots let you project multiple regions:

{% example "Named slots" %}
<script type="text/hyperscript-template" component="my-layout">
  <style>
    :scope { display: block; }
    .frame { border: 1px solid #ccc; border-radius: 4px; }
    header, footer { padding: 0.5em; background: #f0f0f0; }
    footer { font-size: 0.85em; }
    main { padding: 1em; }
    p { margin: 0; }
  </style>
  <div class="frame">
    <header><slot name="title"/></header>
    <main><slot/></main>
    <footer><slot name="footer"/></footer>
  </div>
</script>

<my-layout>
  <strong slot="title">Page Title</strong>
  <p>This goes into the default slot.</p>
  <span slot="footer">Footer text</span>
</my-layout>
{% endexample %}

Slotted content is scoped to the *parent*, not the component. A `^var` in slotted
markup resolves against the parent's scope, not the component's. This is usually
what you want: the caller's content should see the caller's variables.

### Scoped Styles {#scoped-styles}

A `<style>` block placed inside a component definition is automatically
scoped to the component's tag name. At registration time, hyperscript lifts
the `<style>` out of the template, wraps its contents in a CSS
[`@scope`](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope) rule,
and inserts a single `<style>` element immediately after the component definition.

{% example "Scoped styles" %}
<script type="text/hyperscript-template" component="badge-pill">
  <style>
    :scope {
      display: inline-block;
      padding: 0.2em 0.7em;
      border-radius: 999px;
      background: #2b6b1f;
      color: white;
      font-size: 0.85em;
    }
    .count { font-weight: 600; margin-left: 0.3em; }
  </style>
  <slot/><span class="count">${attrs.count}</span>
</script>

<badge-pill count="3">Inbox</badge-pill>
<badge-pill count="12">Drafts</badge-pill>

<p class="count">This outer <code>.count</code> is unaffected by the component's styles.</p>
{% endexample %}

Inside a scoped style block:

- **Bare selectors** like `.count` or `[role=tab]` match descendants of any
  instance of the component.
- **`:scope`** targets the component root itself.

That means you write `:scope { display: block }` instead of
`badge-pill { display: block }`, and `.count` instead of `badge-pill .count` -
the `@scope` wrapper does the prefixing for you.

The wrapped style block is emitted once per component definition, not
per instance, so a hundred `<badge-pill>` elements on the page still share
a single stylesheet.

### DOM Isolation {#dom-isolation}

Each component instance gets `dom-scope="isolated"`, which stops `^var` lookups at
the component boundary. This keeps component state private and avoids collisions
with outer scopes. See [`dom-scope`](/docs/language/#names_and_scoping) in the
language docs for all the scoping options.

### Example: Filterable List {#example-filter}

A component with reactive state, `attrs` input, and two-way binding:

{% example "Filterable List" %}
<script type="text/hyperscript-template" component="filter-list"
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
</script>

<filter-list items="[{name:'Macintosh 128K'}, {name:'Macintosh Plus'}, {name:'Macintosh SE'},
                      {name:'Macintosh II'}, {name:'PowerBook 100'}, {name:'Quadra 700'}]"></filter-list>
{% endexample %}

Typing in the input updates `^query`, which re-runs the `#for` comprehension,
which re-renders the list. 

When there are no matches, the `#else` branch shows the "No matches" message.

### Behaviors {#behaviors}

Components are one way to package reusable logic. Hyperscript also has a
lighter-weight sibling: [`behavior`](/features/behavior). A behavior is a block
of hyperscript that you `install` onto an existing element, rather than a new
custom element you instantiate.

  ~~~ hyperscript
  behavior Removable
    on click
      remove me
    end
  end
  ~~~

They can accept arguments:

  ~~~ hyperscript
  behavior Removable(removeButton)
    on click from removeButton
      remove me
    end
  end
  ~~~

They are installed onto an element with `install`:

  ~~~ html
  <div class="banner" _="install Removable(removeButton: #close-banner)">
    ...
  </div>
  ~~~

For a more substantial example, see the [Drag to Reorder](/patterns/lists-forms/drag-to-reorder/) pattern.

#### Behaviors vs. Components

Behaviors and components solve two different problems:

|            | Behaviors                                      | Components                              |
|------------|------------------------------------------------|-----------------------------------------|
| Definition | A block of hyperscript                         | A `<script type="text/hyperscript-template">` with markup and `_=` |
| Use        | `install` on any existing element              | Place a custom tag in your HTML         |
| Markup     | No, attaches to existing DOM                   | Yes, renders its own markup             |
| State      | Shares the host element's scope                | Isolated DOM scope per instance         |
| Reactive   | No, plain hyperscript                          | Yes, template re-renders on change      |

Use a behavior when you have a bit of logic you want to compose onto arbitrary elements. 

Use a component when you want a self-contained piece of UI with its own markup and state.

<div class="docs-page-nav">
<a href="/docs/reactivity/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Reactivity</strong></a>
<a href="/docs/extensions/" class="next"><strong>Extensions</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
