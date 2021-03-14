---
layout: layout.njk
title: ///_hyperscript
---

## The `event hanlder` Feature

### Syntax

```ebnf
on [every] <event-name>[(<param-list>)][\[<filter>\]] <count> [<debounce> | <throttle>]
   { or [every] <event-name>[(<param-list>)][\[<filter>\]] <count> }
    [queue (all | first | last | none)]
    {<command>} 
[end]
```

If the `every` prefix is used, the event handler will not be synchronized (see [queueing](#queueing) below.)

The `event-name` can be a symbol, a dot-separated symbol or a string that names the event to respond to

The optional `param-list` is a comma separated list of parameter names.  Parameters will be set from properties directly 
on the event or in the `details` property.

The optional `filter` is a boolean expression that will filter the event.  Symbols in the expression will be resolved
against the event first, then against the global scope.

The optional `count` is a count filter with a value of either a specific number, a range or an unbounded start:

```
  on click 1
  on click 2 to 10
  on click 11 and on
```

Finally an event can specify a `debounced at` or `throttled at` value to debounce or throttle the events.

```
  on keyup debounced at 500ms ... -- will wait until 500ms have passed without a keyup to trigger
  on mousemove throttled at 500ms ...  -- will fire every 500ms regardless of the number of events
```

Events can be repeated separated by an `or` to assign one handler to multiple events:

```html
<div _="on click or touchbegin fetch /example then put it into my.innerHTML">
  Fetch it...
</div>
```

The `queue` keyword allows you to specify an event queue strategy across all events for the handler (see [queueing](#queueing) below.)

The body is a list of [commands](/docs#commands), optionally separated by the `then` keyword

The `end` is optional if you are chaining `on` features together

### Description

The `on` feature is the primary way to hook hyperscript into the DOM event system.  It is typically placed on
DOM elements directly, using the `_`, `script` or `data-script` attribute.

The `on` handler can specify parameters.  The value of these parameters will be taken from the `event` or`event.detail` object of
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

### <a name="queueing"></a>[Event Queuing](#queueing)

You can control the event queuing behavior of an event handler by using the `every` and `queue` keyword.

If you prefix the event with `every` then every time the event is triggered the event handler will fire, even
if a previous event has not completed.  The event handlers will run in parallel, and there will be no
queuing of events.

If you postfix the event with `queue` you may pick from one of four strategies:

* `none` - Any events that arrive while the event handler is active will be dropped
* `all` - All events that arrive will be added to a queue and handled in order
* `first` - The first event that arrives will be queued, all others will be dropped
* `last` - The last event that arrives will be queued, all others will be dropped

`queued last` is the default behavior 

### <a name="exceptions"></a>[Exceptions](#exceptions)

If an exception occurs during an event handler, the `exception` event will be triggered on the element, and may 
be handled as a normal event:

```html

<div _="on click call mightThrow()
        on exception(error) log error">
  Click Me!
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

