---
layout: layout.njk
title: ///_hyperscript
---

## The `on` Feature

### Syntax

`on <event-name>[(<param-list>)] <command-list> [end]`

* `event-name` can be a symbol, a dot-separated symbol or a string that names the event to respond to
* `param-list` is a comma separated list of parameter names
* `command-list` is a list of [commands](/docs#commands), optionally separated by the `then` keyword
* `end` is optional

### Description

The `on` feature is the primary way to hook hyperscript into the DOM event system.  It is typically placed on
DOM elements directly, using the `_`, `script` or `data-script` attribute.

The `on` handler can specify parameters.  The value of these parameters will be taken from the `event.detail` object of
the triggering event and matched by name.  So if an event has the value `event.detail.foo = "bar"` then the `on` declaration
could look like this:

```html
<div _="on anEvent(foo) log foo">
  Log Foo
</div>
```

The `event` symbol is always available in an `on` feature and is set to the triggering event.  So the above could
be written in the following more long-winded manner:

```html
<div _="on anEvent log event.detail.foo">
  Log Foo
</div>
```

### Examples

```html

<div _="on click call alert('You clicked me!')">Click Me!</div>

<div _="on mouseenter add .visible to #help end
        on mouseleave remove .visible from #help end">
  Mouse Over Me!
</div>
<div id="help"> I'm a helpful message!</div>

```

