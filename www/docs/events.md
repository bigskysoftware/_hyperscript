---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Events & Functions {#event}

[Events](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events) are at the core of hyperscript,
and [event handlers](/features/on) are the primary entry point into most hyperscript code.

hyperscript's event handlers allow you to respond to any event (not just DOM events, as with `onClick` handlers) and
provide a slew of features for making working with events easier.

Here is an example:

{% example "Event Handlers" %}
<style>
.clicked::after {
  content: " ... Clicked!"
}
</style>
<button _="on click add .clicked">
  Add The "clicked" Class To Me
</button>
{% endexample %}

The script above, again, found on the `_` attribute, does, well, almost exactly what it says:

> On the 'click' event for this button, add the 'clicked' class to this button

This is the beauty of hyperscript: you probably knew what it was doing immediately, when reading it.

Event handlers have a *very* extensive syntax that allows you to, for example:

* Control the queuing behavior of events (how do you want events to queue up when an event handler is running?)
* Respond to events only in certain cases, with the `first` modifier (e.g. `on first click`), counts (e.g. `on click 1`) or event filters (`on keyup[key is 'Escape']`)
* Control debounce and throttle behavior
* Respond to events from other elements or from `elsewhere` (i.e. outside the current element)

You can read all the gory details on the [event handler](/features/on) page, but chances are, if you want some special
handling of an event, hyperscript has a nice, clear syntax for doing so.

### Event Queueing {#event_queueing}

By default, the event handler will use the `queue last` strategy, so if the event is triggered again before the event handler
finishes, only the most recent event will be queued and handled when the current event handler completes.

You can modify this behavior in a few different ways:

#### The Every Modifier {#on_every}

An event handler with the `every` modifier will execute the event handler for every event that is received,
 even if the preceding handler execution has not finished.

  ~~~ html
  <button _="on every click add .clicked">
    Add The "clicked" Class To Me
  </button>
  ~~~

This is useful in cases where you want to make sure you get the handler logic for every event going immediately.

#### The Queue Modifier {#on_queue}

The `every` keyword is a prefix to the event name, but for other queuing options, you postfix the event name
with the `queue` keyword.

You may pick from one of four strategies:

* `none` - Any events that arrive while the event handler is active will be dropped
* `all` - All events that arrive will be added to a queue and handled in order
* `first` - The first event that arrives will be queued, all others will be dropped
* `last` - The last event that arrives will be queued, all others will be dropped

`queue last` is the default behavior

{% example "Queue All" %}
<button _="on click queue all
                    increment :count
                    wait 1s then put it into the next <output/>">
  Click Me Quickly...
</button>
<output>--</output>
{% endexample %}

If you click quickly on the button above you will see that the count slowly increases as each event waits 1 second and
then completes, and the next event that has queued up executes.

### Event Destructuring {#event_destructuring}

You can [destructure](https://hacks.mozilla.org/2015/05/es6-in-depth-destructuring/) properties found either on the
 `event` or in the `event.detail` properties by appending a parenthesized list of names after the event name.

This will create a local variable of the same name as the referenced property:

{% example "Event Parameters" %}
<button _="on mousedown(button) put the button into the next <output/>">
  Click Me With Different Buttons...
</button>
<output>--</output>
{% endexample %}

Here the `event.button` property is being destructured into a local variable, which we then put into the next
`output` element

### Event Filters {#event_filters}

You can filter events by adding a bracketed expression after the event name and destructured properties (if any).

The expression should return a boolean value `true` if the event handler should execute.

Note that symbols referenced in the expression will be resolved as properties of the event, then as symbols in the global scope.

This lets you, for example, test for a middle click on the click event, by referencing the `button` property on that event directly:

{% example "Event Filters" %}
  <button _="on mousedown[button==1] add .clicked">
    Middle-Click To Add The "clicked" Class To Me
  </button>
{% endexample %}

### Halting Events {#halting_events}

An event handler can exit with the [`halt`](/commands/halt) command.  By default this command will halt the current event
bubbling, call `preventDefault()` and exit the current event handlers.  However, there are forms available to stop only
the event from bubbling, but continue on in the event handler:

  ~~~ html
  <script type="text/hyperscript">
    on mousedown
      halt the event -- prevent text selection...
      -- do other stuff...
    end
  </script>
  ~~~

You may also use the [`exit`](/commands/exit) command to exit a function, discussed below.

### Sending Events {#sending-events}

hyperscript not only makes it easy to respond to events, but also makes it very easy to send events to other elements
using the [`send`](/commands/send) and [`trigger`](/commands/trigger) commands.  Both commands do the same thing:
sending an event to an element (possibly the current element!) to handle.

Here are a few examples:

{% example "Send, Trigger" %}
<button _="on click send foo to the next <output/>">Send Foo</button>
<button _="on click trigger bar on the next <output/>">Send Bar</button>
<output _="on foo put 'I got a foo event!' into me
           on bar put 'I got a bar event!' into me">
  No Events Yet...
</output>
{% endexample %}

You can also pass arguments to events via the `event.detail` property, and use the destructuring syntax discussed above to parameterize events:

{% example "Send with arguments" %}
<button _="on click send showMessage(message:'Foo!') to the next <output/>">Send Foo</button>
<button _="on click send showMessage(message:'Bar!') to the next <output/>">Send Bar</button>
<output _="on showMessage(message) put `The message '${message}' was sent to me` into me">
  No Events Yet...
</output>
{% endexample %}

As you can see, working with events is very natural in hyperscript.  This allows you to build clear, readable
event-driven code without a lot of fuss.

### Synthetic Events

hyperscript includes a few synthetic events that make it easier to use more complex APIs in JavaScript.

#### Mutation Events {#mutation}

You can listen for mutations on an element with the `on mutation` form. This will use the [Mutation Observer](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
API, but will act more like a regular event handler.

  ~~~ html
  <div _='on mutation of @foo put "Mutated" into me'></div>
  ~~~

This div will listen for mutations of the `foo` attribute on this div and, when one occurs, will put the value
"Mutated" into the element.

Here is a div that is set to `content-editable='true'` and that listens to mutations and updates a mutation count
below:

{% example "Content Editable Mutations" %}
<div contenteditable="true"
     _="on mutation of anything increment :mutationCount then put it into the next <output/>">
  Hello World
</div>
<output>--</output>
{% endexample %}

#### Intersection Events {#intersection}

Another synthetic event is the `intersection` event that uses the [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
API. Again, hyperscript makes this API feel more event-driven:

  ~~~ html
  <img _="on intersection(intersecting) having threshold 0.5
          if intersecting transition *opacity to 1
          else transition *opacity to 0 "
      src="https://placebear.com/200/300"/>
  ~~~

This image will become visible when 50% or more of it has scrolled into view. Note that the `intersecting` property
is destructured into a local symbol, and the `having threshold` modifier is used to specify that 50% of the image
must be showing.

Here is a demo:

<img _="on intersection(intersecting) having threshold 0.5
         if intersecting transition *opacity to 1
         else transition *opacity to 0 "
     src="https://placebear.com/200/300"/>

#### Resize Events {#resize}

You can listen for element resizes using the `on resize` form.  This uses the [Resize Observer](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) API under the covers:

  ~~~ html
  <div _="on resize put `${detail.width}x${detail.height}` into #size">
    Resize me
  </div>
  ~~~

The `detail` object contains `width`, `height`, and the full `contentRect` from the resize entry.

Like mutation and intersection events, the `from` clause can be used to observe a different element:

  ~~~ html
  <div _="on resize from #panel put detail.width into me">
    --
  </div>
  ~~~

## Init Blocks {#init}

If you have logic that you wish to run when an element is initialized, you can use the `init` block to do so:

  ~~~ html
  <div _="init transition my opacity to 100% over 3 seconds">
    Fade Me In
  </div>
  ~~~

The `init` keyword should be followed by a set of commands to execute when the element is loaded.

## Functions {#functions}

Functions in hyperscript are defined by using the [`def` keyword](/features/def).

Functions defined on elements will be available to the element the function is defined on, as well as any
child elements.

Functions can also be defined in a hyperscript `script` tag:

  ~~~ html
  <script type="text/hyperscript">
    def waitAndReturn()
      wait 2s
      return "I waited..."
    end
  </script>
  ~~~

This will define a global function, `waitAndReturn()` that can be invoked from anywhere in hyperscript.

Hyperscript can also be loaded remotely in `._hs` files.

When loaded in this manner, the script tags **must** appear before loading hyperscript:

  ~~~ html
  <script type="text/hyperscript" src="/functions._hs"></script>
  <script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.90/dist/_hyperscript.min.js"></script>
  ~~~

Hyperscript is fully interoperable with JavaScript, and global hyperscript functions can be called from JavaScript as well
as vice-versa:

  ~~~ js
  var str = waitAndReturn();
  str.then(function(val){
    console.log("String is: " + val);
  })
  ~~~

Hyperscript functions can take parameters and return values in the expected way:

  ~~~ html
  <script type="text/hyperscript">
    def increment(i)
      return i + 1
    end
  </script>
  ~~~

You may exit a function using [`return`](/commands/return) if you wish to return a value or
 [`exit`](/commands/exit) if you do not want to return a value.

### Namespacing {#function_namespacing}

You can namespace a function by prefixing it with dot separated identifiers. This allows you to place
functions into a specific namespace, rather than polluting the global namespace:

  ~~~ html
  <script type="text/hyperscript">
    def utils.increment(i)
      return i + 1
    end
  </script>
  <script>
    console.log(utils.increment(41)); // access it from JavaScript
  </script>
  ~~~

## Exception Handling {#exceptions}

Both functions and event handlers may have a `catch` block associated with them:

  ~~~ hyperscript
  def example
    call mightThrowAnException()
  catch e
    log e
  end

  on click
    call mightThrowAnException()
  catch e
    log e
  end
  ~~~

This allows you to handle exceptions that occur during the execution of the function or event handler.

If you do not include a `catch` block on an event handler and an uncaught exception occurs, an `exception` event
will be triggered on the current element and can be handled via an event handler, with the `error` set to the
message of the exception:

  ~~~ hyperscript
  on exception(error)
       log "An error occurred: " + error
  ~~~

Note that exception handling in hyperscript respects the [async-transparent](/docs/async/) behavior of the language.

### Finally Blocks {#finally}

Both functions and event handlers also support a `finally` block to ensure that some cleanup code is executed:

  ~~~ hyperscript
  on click
    add @disabled to me
    fetch /example
    put the result after me
  finally
    remove @disabled from me
  ~~~

In this code we ensure that the `disabled` property is removed from the current element.

### Throwing Exceptions {#throw}

You may throw an exception using the familiar `throw` keyword:

  ~~~ hyperscript
  on click
    if I do not match .selected
      throw "I am not selected!"
    ...
  ~~~

<div class="docs-page-nav">
<a href="/docs/language/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Language</strong></a>
<a href="/docs/dom/" class="next"><strong>Working With The DOM</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
