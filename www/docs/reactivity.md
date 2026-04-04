---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Reactivity {#reactivity}

Hyperscript has several mechanisms for making your UI respond automatically to changes in data, without
requiring manual DOM updates or complex state management.

### The `bind` Feature {#bind}

The [`bind` feature](/features/bind) lets you bind an expression to a target, keeping the target in sync
whenever the expression's value changes:

  ~~~ html
  <input type="text" _="bind my.value to #output's innerHTML" />
  <div id="output"></div>
  ~~~

Bindings are automatically updated when the underlying data changes, with no manual wiring needed.

You can bind to attributes, properties, or styles:

  ~~~ hyperscript
  bind @disabled of #submit to myForm.invalid
  bind *opacity of #panel to if visible then 1 else 0
  ~~~

### The `when` Modifier {#when}

The [`when` modifier](/features/when) on event handlers provides a declarative way to conditionally
handle events based on reactive conditions:

  ~~~ html
  <button _="on click when #terms.checked
               call submitForm()">
    Submit
  </button>
  ~~~

The button only responds to clicks when the checkbox is checked.

### The `observe` Command {#observe}

The [`observe` command](/commands/observe) lets you watch for mutations on elements and respond to them:

  ~~~ hyperscript
  observe childList of #container
    log "Children changed!"
  end
  ~~~

This uses the [MutationObserver API](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
under the covers, but with a much simpler syntax.

### Event-Driven Reactivity {#event-driven}

Hyperscript's event system is itself a form of reactivity.  Custom events let you build reactive
data flows:

  ~~~ html
  <input type="range" _="on input send valueChanged(value: my.value) to the next <output/>" />
  <output _="on valueChanged put event.value into me"></output>
  ~~~

Combined with [async transparency](/docs/async/), this gives you reactive behavior without any
framework overhead.

<div class="docs-page-nav">
<a href="/docs/components/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Components</strong></a>
<a href="/docs/extensions/" class="next"><strong>Extensions</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
