---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Async Transparency {#async}

One of the most distinctive features of hyperscript is that it is "async transparent". What that means is that,
for the most part, you, the scriptwriter, do not need to worry about asynchronous behavior.

In the [`fetch`](/docs/networking/#fetch) section, for example, we do not need to use a `.then()` callback or an `await`
keyword, as you would need to in JavaScript: we simply fetch the data and insert it into the DOM.

To make this happen, the hyperscript runtime
handles [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) under the
covers for you, resolving them internally, so that asynchronous behavior looks linear.

This dramatically simplifies many coding patterns and effectively
[decolors functions](http://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/) (and event handlers) in
hyperscript.

This infrastructure allows hyperscript to work effectively with events, allowing for
something called event driven control flow demonstrated below.

### Waiting {#wait}

In JavaScript, if you want to wait some amount of time, you can use the venerable `setTimeout()` function:

  ~~~ javascript
  console.log("Start...")
  setTimeout(function(){
    console.log("Finish...")
  }, 1000);
  ~~~

This code will print `"Start"` to the console and then, after a second (1000 milliseconds) it will print `"Finish"`.

To accomplish this in JavaScript requires a closure, which acts as a callback. Unfortunately this API is awkward,
containing a lot of syntactic noise and placing crucial information, namely how long the delay is, at the end. 

As this logic becomes more complex, that delay information gets further and further away from where, syntactically, 
the delay starts.

Contrast that with the equivalent hyperscript, which uses the [`wait` command](/commands/wait):

  ~~~ hyperscript
  log "Start..."
  wait 1s
  log "Finish..."
  ~~~

You can see how this reads very nicely, with a linear set of operations occurring in sequence.

Under the covers, the hyperscript runtime is still using that `setTimeout()` API, but you, the scriptwriter, are
shielded from that complexity, and you can simply write linear, natural code.

This flexible runtime allows for even more interesting code. The `wait` command, for example, can wait for an *event*
not just a timeout:

{% example "Waiting On Events" %}
<button _="on click put 'Started...' into the next <output/>
                    wait for a continue -- wait for a continue event...
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

Now we are starting to see how powerful the async transparent runtime of hyperscript is: you are able to
integrate events directly into your control flow while still writing scripts in a natural, linear fashion.

Let's add a timeout to that previous example:

{% example "Waiting On Events With A Timeout" %}
<button _="on click put 'Started...' into the next <output/>
                    wait for a continue or 3s
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

If you click the Continue button within 3 seconds, the `wait` command resumes, setting the `result` to the event,
so `the result's type` will be `"continue"`.

If, on the other hand, you don't click the Continue button within 3 seconds, the `wait` command resumes based
on the timeout, setting the `result` to `null`, so `the result's type` will be null.

### Toggling {#toggling}

Previously we looked at the `toggle` command. It turns out that it, too, can work with events:

{% example "Toggle A Class With Events" %}
<div _="on mouseenter toggle .red until mouseleave">
  Mouse Over Me To Turn Me Red!
</div>
{% endexample %}

You can, of course, toggle the class on other elements, or toggle an attribute, or use different events: the
possibilities are endless.

### Event Driven Loops {#async_loops}

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

The loop will check if the given event, `stop`, has been received at the start of every iteration. If not,
the loop will continue. This allows the cancel button to send an event to stop the loop.

However, note that the CSS transition is allowed to finish smoothly, rather than abruptly,
because the event listener that terminates the loop is only consulted once a complete loop is made, adding
and removing the class and settling cleanly.

<div class="docs-page-nav">
<a href="/docs/dom/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Working With The DOM</strong></a>
<a href="/docs/networking/" class="next"><strong>Networking</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
