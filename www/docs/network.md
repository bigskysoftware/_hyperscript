---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Remote Content {#remote-content}

Hyperscript is primarily designed for front end scripting, local things like toggling a class on a div and so on,
and is designed to pair well with [htmx](https://htmx.org), which uses a hypermedia approach for interacting with
servers.

Broadly, we recommend that approach: you stay firmly within the original REST-ful model of the web, keeping things
simple and consistent, and you can use hyperscript for small bits of front end functionality.  htmx and hyperscript
integrate seamlessly, so any hyperscript you return to htmx will be automatically initialized without any additional
work on your part.

### Fetch {#fetch}

However, there are times when calling out to a remote server is useful from a scripting context, and hyperscript
supports the [`fetch` command](/commands/fetch) for doing so:

{% example "Issue a Fetch Request" %}
<button _="on click fetch /clickedMessage then
                    put the result into the next <output/>">
  Fetch It
</button>
<output>--</output>
{% endexample %}

The fetch command uses the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) and allows you
configure the fetch as you want, including passing along headers, a body, and so forth.

Additionally, you may notice that the `fetch` command, in contrast with the `fetch()` function, does not require
that you deal with a Promise.   Instead, the hyperscript runtime deals with the promise for you: you can simply
use the `result` of the fetch as if the fetch command was blocking.

This is thanks to the [async transparency](#async) of hyperscript, discussed below.

### Going Places {#go}

While using ajax is exciting, sometimes you simply wish to navigate the browser to a new location.  To support this
hyperscript has a [`go` command](/commands/go) that allows you to navigate locally or to new URLs, depending on how it
is used:

You can also use it to navigate to another web page entirely:

{% example "Going Elsewhere" %}
<button _="on click go to https://htmx.org">
              Go Check Out htmx
</button>
{% endexample %}

### Scrolling {#scrolling}

The [`scroll`](/commands/scroll) command scrolls an element into view:

  ~~~ hyperscript
  scroll to #target
  scroll to the top of #target smoothly
  scroll to the bottom of me instantly
  ~~~

You can specify vertical alignment (`top`, `middle`, `bottom`) and horizontal alignment (`left`, `center`, `right`),
as well as an offset:

  ~~~ hyperscript
  scroll to the top of #target +50px smoothly
  ~~~

Use `in` to scroll within a specific container without affecting outer scroll:

  ~~~ hyperscript
  scroll to #item in #sidebar smoothly
  ~~~

The `scroll by` form scrolls by a relative amount.  The direction defaults to `down` if omitted:

  ~~~ hyperscript
  scroll down by 200px
  scroll #panel left by 100px smoothly
  ~~~

{% example "Scrolling Around" %}
<button _="on click
              scroll to the top of the body smoothly
              wait 2s
              scroll to the bottom of me smoothly">
              Take A Trip
</button>
{% endexample %}

## Async Transparency {#async}

One of the most distinctive features of hyperscript is that it is "async transparent".  What that means is that,
for the most part, you, the script writer, do not need to worry about asynchronous behavior.  In the [`fetch`](#fetch)
section, for example, we did not need to use a `.then()` callback or an `await` keyword, as you would need to
in JavaScript: we simply fetched the data and then inserted it into the DOM.

To make this happen, the hyperscript runtime handles [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) under the covers for you, resolving them internally, so that
asynchronous behavior simply looks linear.

This dramatically simplifies many coding patterns and effectively
[decolors functions](http://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/) (and event handlers) in hyperscript.

Furthermore, this infrastructure allows hyperscript to work extremely effectively with events, allowing for
*event driven* control flow, explained below.

### Waiting {#wait}

In JavaScript, if you want to wait some amount of time, you can use the venerable `setTimeout()` function:

  ~~~ javascript
  console.log("Start...")
  setTimeout(function(){
    console.log("Finish...")
  }, 1000);
  ~~~

This code will print `"Start"` to the console and then, after a second (1000 milliseconds) it will print `"Finish"`.

To accomplish this in JavaScript requires a closure, which acts as a callback.  Unfortunately this API is awkward,
containing a lot of syntactic noise and placing crucial information, how long the delay is, at the end.  As this
logic becomes more complex, that delay information gets further and further away from where, syntactically, the delay
starts.

Contrast that with the equivalent hyperscript, which uses the [`wait` command](/commands/wait):

  ~~~ hyperscript
  log "Start..."
  wait 1s
  log "Finish..."
  ~~~

You can see how this reads very nicely, with a linear set of operations occurring in sequence.

Under the covers, the hyperscript runtime is still using that `setTimeout()` API, but you, the script writer, are
shielded from that complexity, and you can simply write linear, natural code.

This flexible runtime allows for even more interesting code.  The `wait` command, for example, can wait for an *event*
not just a timeout:

  {% example "Waiting On Events" %}
  <button _="on click put 'Started...' into the next <output/>
                      wait for a continue   -- wait for a continue event...
                      put 'Finished...' into the next <output/>
                      wait 2s
                      put '' into the next <output/>">
    Start
  </button>
  <button _="on click send continue to the previous <button/>">
    Continue
  </button>
  <output>--</output>
  {% endexample %}

Now we are starting to see how powerful the async transparent runtime of hyperscript can be: with it you are able to
integrate events directly into your control flow while still writing scripts in a natural, linear fashion.

Let's add a timeout to that previous example:

{% example "Waiting On Events With A Timeout" %}
<button _="on click put 'Started...' into the next <output/>
                    wait for a continue or 3s   -- wait for a continue event...
                    if the result's type is 'continue'
                      put 'Finished...' into the next <output/>
                    otherwise
                      put 'Timed Out...' into the next <output/>
                    end
                    wait 2s
                    put '--' into the next <output/>">
  Start
</button>
<button _="on click send continue to the previous <button/>">
  Continue
</button>
<output>--</output>
{% endexample %}


If you click the Continue button within 3 seconds, the `wait` command resume, setting the `result` to the event,
so `the result's type` will be `"continue"`.

If, on the other hand, you don't click the Continue button within 3 seconds, the `wait` command resume based
on the timeout, setting the `result` to `null`, so `the result's type` will be null.

### Toggling {#toggling}

Previously we looked at the `toggle` command.  It turns out that it, too, can work with events:

{% example "Toggle A Class With Events" %}
<div _="on mouseenter toggle .red until mouseleave">
  Mouse Over Me To Turn Me Red!
</div>
{% endexample %}

You can, of course, toggle the class on other elements, or toggle an attribute, or use different events: the
possibilities are endless.

### Loops {#async_loops}

You can add async behavior to a loop by adding a `wait` command in the body, but loops can also have a *loop
condition* based on receiving an event.

Consider this hyperscript:

{% example "An Event-Driven Loop" %}
<button class="pulsar"
        _="on click repeat until event stop
                    add .pulse then settle
                    remove .pulse then settle">
  Click me to Pulse...
</button>
<button _="on click send stop to the previous <button/>">
  Cancel
</button>
{% endexample %}
<style>
button.pulsar {
  transition: all 1s ease-in;
}
.pulsar.pulse {
  background-color: indianred;
}
</style>

The loop will check if the given event, `stop`, has been received at the start of every iteration.  If not,
the loop will continue.  This allows the cancel button to send an event to stop the loop.

However, note that the CSS transition is allowed to finish smoothly, rather than abruptly,
because the event listener that terminates the loop is only consulted once a complete loop is made, adding
and removing the class and settling cleanly.

### The `async` keyword {#async-keyword}

Sometimes you do want something to occur asynchronously.    Hyperscript provides an `async` keyword that will
tell the runtime _not_ to synchronize on a value.

So, if you wanted to invoke a method that returns a promise, say `returnsAPromise()` but not wait on it to return, you write code like this:

  ~~~ html
  <button _="on click async call returnsAPromise() put 'I called it...' into the next <output/>">
    Get The Answer...
  </button>
  ~~~

Hyperscript will immediately put the value "I called it..." into the next output element, even if the result
from `returnsAPromise()` has not yet resolved.

## Using JavaScript {#js-migration}

Hyperscript is directly integrated with JavaScript, providing ways to use them side by side and migrate with ease.

### Shared Comment Syntax {#js-comments}

`//` and `/* ... */` comments are supported, and ideal for migrating lines of code from JavaScript to Hyperscript "in-place". The multi-line comment may be used to "block out" code and write documentation comments.

### Calling JavaScript {#js-call}

Any JavaScript function may be called directly from Hyperscript. See: [calling functions](/docs/language/#calling-functions).

  ~~~ html
  <button _="on click call alert('Hello from JavaScript!')">
    Click me.
  </button>
  ~~~

### Inline JavaScript {#js-inline}

Inline JavaScript may be defined using the [`js` keyword](/features/js).

  ~~~ html
  <div _="init js alert('Hello from JavaScript!') end"></div>
  ~~~

Return values are supported.

  ~~~ html
  <button _="on click js return 'Success!' end then put it into my.innerHTML">
   Click me.
  </button>
  ~~~

Parameters are supported.

  ~~~ html
  <button _="on click set foo to 1 js(foo) alert('Adding 1 to foo: '+(foo+1)) end">
   Click me.
  </button>
  ~~~

JavaScript at the top-level may be defined using the same [`js` command](/commands/js), exposing it to the global scope.

You may use inline JavaScript for performance reasons, since the Hyperscript runtime is more focused on flexibility, rather than performance.

This feature is useful in [workers](/docs/advanced/#workers), when you want to pass JavaScript across to the worker's
implementation:

  ~~~ html
  <script type="text/hyperscript">
    worker CoinMiner
      js
        function mineNext() {
          // a JavaScript implementation...
        }
      end
      def nextCoin()
        return mineNext()
      end
    end
  </script>
  ~~~

<div class="docs-page-nav">
<a href="/docs/templates/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Templates & Morphing</strong></a>
<a href="/docs/advanced/" class="next"><strong>Advanced</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
