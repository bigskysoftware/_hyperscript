---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Advanced Features {#advanced-features}

We have covered the basics (and not-so-basics) of hyperscript.  Now we come to the more advanced
features of the language.

### Behaviors {#behaviors}

Behaviors allow you to bundle together some hyperscript code (that would normally go in the \_ attribute of an element) so that it can be "installed" on any other. They are defined with [the `behavior` keyword](/features/behavior):

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

They can be installed as shown:

  ~~~ html
  <div class="banner" _="install Removable(removeButton: #close-banner)">
    ...
  ~~~

For a better example of a behavior, check out [Draggable.\_hs](https://gist.github.com/dz4k/6505fb82ae7fdb0a03e6f3e360931aa9).

### Web Workers {#workers}

[WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) can be defined
inline in hyperscript by using the [`worker` keyword](/features/worker).

The worker does not share a namespace with other code, it is in its own isolated sandbox. However, you may interact
with the worker via function calls, passing data back and forth in the normal manner.

  ~~~ html
  <script type="text/hyperscript">
    worker Incrementer
      def increment(i)
        return i + 1
      end
    end
  </script>
  <button _="on click call Incrementer.increment(41) then put 'The answer is: ' + it into my.innerHTML">
    Call a Worker...
  </button>
  ~~~

This makes it very easy to define and work with web workers.

Note that you can use the inline js feature discussed next if you want to use JavaScript in your worker. You might
want to do this if you need better performance on calculations than hyperscript provides, for example.

### Web Sockets {#sockets}

[Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) allow for two-way communication with
a web server, and are becoming increasingly popular for building web applications. Hyperscript provides a simple way to
create them, as well as a simple [Remote Procedure Call (RPC)](https://en.wikipedia.org/wiki/Remote_procedure_call) mechanism
layered on top of them, by using the [`socket` keyword](/features/socket).

Here is a simple web socket declaration in hyperscript:

  ~~~ hyperscript
  socket MySocket ws://myserver.com/example
    on message as json
      log message
  end
  ~~~

This socket will log all messages that it receives as a parsed JSON object.

You can send messages to the socket by using the normal [`send`](/commands/send) command:

  ~~~ hyperscript
  send myMessage(foo: "bar", doh: 42) to MySocket
  ~~~

You can read more about the RPC mechanism on the [`socket` page](/features/socket#rpc).

### Event Source {#event-source}

[Server Sent Events](https://en.wikipedia.org/wiki/Server-sent_events) are a simple way for your web server to push
information directly to your clients that is [supported by all modern browsers](https://caniuse.com/eventsource).

They provide real-time, uni-directional communication from your server to a browser. Server Sent Events cannot send
information back to your server. If you need two-way communication, consider using [sockets](/features/socket/) instead.

You can declare an SSE connection by using the [`eventsource` keyword](/features/event-source) and can dynamically change
the connected URL at any time without having to reconnect event listeners.

Here is an example event source in hyperscript:

  ~~~ hyperscript
  eventsource ChatUpdates from http://myserver.com/chat-updates

    on message as string
      put it into #div
    end

    on open
      log "connection opened."
    end

  end
  ~~~

This event source will put all `message` events in to the `#div` and will log when an `open` event occurs.
This feature also publishes events, too, so you can listen for Server Sent Events from other parts of your code.

## Debugging {#debugging}

Debugging hyperscript can be done a few different ways.  The simplest and most familiar way for most developers to debug
 hyperscript is the use of the [`log`](/commands/log) command to log intermediate results.  This is
the venerable "print debugging":

```hyperscript
get <div.highlighted/> then log the result
```

This is a reasonable way to start debugging but it is, obviously, fairly primitive.

### Beeping

An annoying aspect of print debugging is that you are often required to extract bits of expressions in order to
print them out, which can interrupt the flow of code.  Consider this example of hyperscript:

```hyperscript
  add .highlighted to <p/> in <div.hilight/>
```

If this wasn't behaving as you expect and you wanted to debug the results, you might break it up like so:

```hyperscript
  set highlightDiv to <div.hilight/>
  log highlightDiv
  set highlightParagraphs to <p/> in highlightDiv
  log highlightParagraphs
  add .highlighted to highlightParagraphs
```

This is a fairly violent code change and it obscures what the actual logic is.

To avoid this, hyperscript offers a [`beep!`](/expressions/beep) operator.  The `beep!` operator can be thought of
as a pass-through expression: it simply passes the value of whatever expression comes afterwards through unmodified.

However, along the way, it logs the following information to the console:

* The source code of the expression
* The value of the expression
* The type of the expressions

So, considering the above code, rather than breaking things up, we might just try this:

```hyperscript
  add .highlighted to <p/> in beep! <div.hilight/>
```

Here we have added a `beep!` just before the `<div.hilight/>` expression.  Now when the code runs
we will see the following in the console:

```
///_ BEEP! The expression (<div.hilight/>) evaluates to: [div.hilight] of type ElementCollection
```

You can see the expressions source, its value (which you can right click on and assign to a temporary value to work
with in most browsers) as well as the type of the value.  All of this had no effect on the evaluation of the expression
or statement.

Let's store the `ElementCollection` as a temporary value, `temp1`.

We could now move the `beep!` out to the `in` expression like so:

```hyperscript
  add .highlighted to beep! <p/> in <div.hilight/>
```

And we might see results like this:

```
///_ BEEP! The expression (<p/> in <div.hilight/>) evaluates to: [] of type Array
```

Seeing this, we realize that no paragraphs elements are being returned by the `in` expression, which is why the class is
 not being added to them.

In the console we check the length of the original `ElementCollection`:

```
> temp1.length
0
```

And, sure enough, the length is zero.  On inspecting the divs in question, it turns out we had misspelled the class name
`hilight` rather than `highlight`.

After making the fix, we can remove the `beep!` (which is *obviously* not supposed to be there!):

```hyperscript
  add .highlighted to <p/> in <div.highlight/>
```

And things work as expected.

As you can see, `beep!` allows us to do much more sophisticated print debugging, while not disrupting code nearly as
drastically as traditional print debugging would require.

You can also use `beep!` [as a command](/commands/beep) to assist in your debugging.

### HDB - The Hyperscript Debugger

An even more sophisticated debugging technique is to use [hdb](/hdb), the Hyperscript Debugger, which allows you to
debug by inserting `breakpoint` commands in your hyperscript.

**Note: The hyperscript debugger is in alpha and, like the rest of the language, is undergoing active development**

To use it you need to include the `dist/ext/hdb.js` file. You can then add `breakpoint` commands in your hyperscript
to trigger the debugger.

{% example "Debugging" %}
<button _="
  on click
  tell next <output/>
    breakpoint
    put 'You can click <kbd><samp>Step Over</samp></kbd> to execute the command' into you
    put 'Click the <kbd><samp>&rdca;</kbd></samp> button to skip to a command'   into you
    put 'Click <kbd><samp>Continue</samp></kbd> when you’re done'                into you
    put '--'                                                                     into you
">Debug</button>
<output>--</output>
{% endexample %}


## Extending {#extending}

Hyperscript has a pluggable grammar that allows you to define new features, commands and certain types of expressions.

Here is an example that adds a new command, `foo`, that logs "A Wild Foo Was Found!" if the value of its expression
was "foo":

  ~~~ javascript
  // register for the command keyword "foo"
  _hyperscript.addCommand('foo', function(parser) {

    // A foo command must start with "foo".
    if(!parser.matchToken('foo')) return

    // Parse an expression.
    const expr = parser.requireElement('expression');

    return {
      // All expressions needed by the command to execute.
      // These will be evaluated and the results passed to resolve().
      args: { value: expr },

      // Implement the logic of the command.
      // Can be synchronous or asynchronous.
      // @param {Context} context The runtime context, contains local variables.
      // @param {Object} args The evaluated args, keyed by name.
      resolve(context, { value }) {
        if (value == "foo") {
          console.log("A Wild Foo Was Found!")
        }
        // Return the next command to execute.
        return context.meta.runtime.findNext(this, context)
      }
    }
  })
  ~~~

With this command defined you can now write the following hyperscript:

```hyperscript
  def testFoo()
    set str to "foo"
    foo str
  end
```

And "A Wild Foo Was Found!" would be printed to the console.

## Security {#security}

Hyperscript allows you to define logic directly in your DOM. This has a number of advantages, the
largest being [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/) making your system
more coherent.

One concern with this approach, however, is security. This is especially the case if you are injecting user-created
content into your site without any sort of HTML escaping discipline.

You should, of course, escape all 3rd party untrusted content that is injected into your site to prevent, among other
issues, [XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting). The `_`, `script` and `data-script` attributes,
as well as inline `<script>` tags should all be filtered.

Note that it is important to understand that hyperscript is _interpreted_ and, thus, does not use eval (except for the inline js
features). You (or your security team) may use a [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
that disallows inline scripting. This will have _no effect_ on hyperscript functionality, and is almost certainly not
what you (or your security team) intends.

To address this, if you don't want a particular part of the DOM to allow for hyperscript interpretation, you may place a
`disable-scripting` or `data-disable-scripting` attribute on the enclosing element of that area.

This will prevent hyperscript from executing within that area in the DOM:

```html
  <div data-disable-scripting>
    <%= user_content %>
  </div>
```

This approach allows you enjoy the benefits of [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/)
while still providing additional safety if your HTML-escaping discipline fails.

## Language History {#history}

The initial motivation for hyperscript came when I ported [intercooler.js](https://intercoolerjs.org) to
htmx.  Intercooler had a feature, [`ic-action`](https://intercoolerjs.org/attributes/ic-action.html) that
allowed for some simple client-side interactions.  One of my goals with htmx was to remove non-core functionality
from intercooler, and really focus it in on the hypermedia-exchange concept, so `ic-action` didn't make the
cut.

However, I couldn't shake the feeling that there was something there: an embedded, scripty way of doing light
front end coding.  It even had some proto-async transparent features.  But, with my focus on htmx, I had to
set it aside.

As I developed htmx, I included an extensive [event model](https://htmx.org/reference/#events). Over time,
I realized that I wanted to have a clean way to utilize these events naturally and directly within HTML.  HTML supports `on*` attributes for handling standard DOM events (e.g. `onClick`) of course, but they don't work for custom events like `htmx:load`.

The more I looked at it, the more I thought that there was a need for a small, domain specific language that was
event oriented and made DOM scripting efficient and fun.  I had programmed in [HyperTalk](https://en.wikipedia.org/wiki/HyperTalk), the scripting language for [HyperCard](https://en.wikipedia.org/wiki/HyperCard), when I was younger and remembered that it integrated events very well into the language.  So I dug up some old documentation on it and began work on hyperscript, a HyperTalk-derived scripting language for the web.

And here we are.  I hope you find the language useful, or, at least, funny.  :)

<div class="docs-page-nav">
<a href="/docs/network/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Network & Async</strong></a>
<a href="/docs/components/" class="next"><strong>Components</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
