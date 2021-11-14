<div class="row">
<div class="2 col nav">

**Contents**

<div id="contents">

* [introduction](#introduction)
  * [event handling](#events)
  * [no more promises](#promises)
  * [the syntax](#syntax)
* [install & quick start](#install)
* [the language](#lang)
  * [features](#features)
    * [event handlers](#event_handlers)
    * [variables and scope](#variables_and_scope)
    * [init blocks](#init)
    * [functions](#functions)
    * [behaviors](#behaviors)
    * [workers](#workers)
    * [sockets](#sockets)
    * [event sources](#event_source)
  * [commands](#commands)
  * [expressions](#expressions)
* [async transparency](#async)
  * [async keyword](#async-keyword)
  * [event driven control flow](#event-control-flow)
* [debugging](#debugging)
* [extending](#extending)
* [security](#security)
* [history](#history)

</div>

</div>
<div class="10 col">

## <a name="introduction"></a>[Introduction](#introduction)

Hyperscript is a scripting language for doing front end web development.

### <a name='events'></a>[Event Handling](#events)

A core feature of hyperscript is the ability to embed event handlers directly on HTML elements:

```html
<button _="on click put 'I was clicked!' into me">
  Click Me!
</button>
```

<button class='btn primary'
                  _="on click put 'I was clicked!' into me
                    then wait 2s
                    then put 'Click Me' into my.innerHTML">
Click Me!
</button>

Embedding event handling logic directly on elements in this manner makes it easier to understand what a given element does,
and is in the same vein as many technologies that de-emphasize [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
in favor of [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/), such as [tailwinds](https://tailwindcss.com/),
[AlpineJS](https://github.com/alpinejs/alpine/) and [htmx](https://htmx.org).

Unlike the typical `on*` attributes, such as `onClick`, hyperscript's event handling syntax allows you to
respond to _any event_, even custom events that you create or that are triggered by [other libraries](https://htmx.org/reference/#events),
and it gives you flexible control over how events are queued and filtered with a simple, clean syntax.

Hyperscript is expressive enough that many common UI patterns can be comfortably written directly inline
in event handlers.  If you need to, you can factor logic out to [functions](#functions) as well, and you
can invoke javascript functions directly from hyperscript (and vice-versa). Frequently used or complex
handlers can be streamlined with [behaviors](#behaviors). Behaviors wrap up multiple features (event
handlers, functions, unit blocks, etc.) with a shared state mechanism.

### <a name='promises'></a>[No More Promises](#promises)

While powerful event handling is the most immediately practical feature of hyperscript, the most interesting
technical aspect of the language is that it is _[async transparent](#async)_.

That is, you can write code that is asynchronous, but in the standard _linear_ style.

You may have noticed that the button above reset its text after a few seconds.

Here is what the hyperscript actually looks like on that button:

```html
<button class='btn primary' _="on click put 'I was clicked!' into me
                                        wait 2s
                                        put 'Click Me' into me">
  Click Me!
</button>
```

Note the `wait 2s` command in this hyperscript. This tells hyperscript to, well, to wait for
2 seconds before continuing.

In javascript, this would be equivalent to the following `onClick` attribute:

```js
var self = this;
self.innerHTML = "I was clicked!"
setTimeout(function(){
  self.innerHTML = "Click Me"
}, 2000)
```

In javascript you would either need to write the code in this asynchronous manner or, if you were getting fancy, use
promises and `then` or the `async`/`await` keywords. You need to change your coding style to deal with the asynchronous
nature of the timeout.

In contrast, using hyperscript you can simply write this code in the normal, linear fashion and the hyperscript runtime
works everything out for you.

This means you can mix and match synchronous and asynchronous code freely, without needing to
change coding styles. There is no distinction between [red functions and blue functions](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/)
in hyperscript.

This may seem a little silly for just making `setTimeout()` a little better looking, but async transparency allows you,
for example, to move the message that is put into the button into an ajax call:

```html
<button class='btn primary' _="on click fetch /clickedMessage
                                        put the result into me
                                        wait 2s
                                        put 'Click Me!' into me">
  Click Me!
</button>
```

Try it out, and check out the networking tab in your browsers development console:

<button class='btn primary' _="on click fetch /clickedMessage
                                        then put the result into me
                                        then wait 2s
                                        then put 'Click Me!' into me">
Click Me!
</button>

Pretty neat, eh?

Let's jazz this example up a bit by adding some fade transitions

```html
<button class='btn primary' _="on click fetch /clickedMessage then transition opacity to 0
                                        put the result into me then transition opacity to 1
                                        wait 2s then transition opacity to 0
                                        put 'Click Me!' into me then transition opacity to 1">
  Click Me!
</button>
```

<button class='btn primary' _="on click fetch /clickedMessage then transition opacity to 0
                                        put the result into me then transition opacity to 1
                                        wait 2s then transition opacity to 0
                                        put 'Click Me!' into me then transition opacity to 1">
Click Me!
</button>

Here we are using the `then` keyword to separate commands that are on the same line, grouping
them logically and making the code read really nicely. We use the `transition` command to
transition smoothly between opacities.

Note that the `transition` command is synchronized with the transition: it doesn't complete until the transition is
done. The hyperscript runtime recognizes this and again allows you to write standard,
linear-style code with it.

Now, this example is a little gratuitous, admittedly, but you can imagine what the equivalent javascript would look like:
it would be a mess of confusing callbacks or would need to be transformed into a Promise-based style. The point isn't
that you should use this particular UX pattern, but rather to show how async transparency can be used practically.

### <a name='syntax'></a>[The Syntax](#syntax)

The syntax of hyperscript is very different syntax than most programming languages used today. It is based on an older
and somewhat obscure (today) family of programming languages that originated in [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)
and that used a more natural language than the more familiar Algol-dervived languages we typically use today.

This unusual syntax has advantages, once you get over the initial hump:

* It is distinctive, making it obvious when hyperscript is being used in a web page
* It includes a native event handling syntax
* It reads very easily, even if it can be hard to write at first
* The commands in the language all have a strong start token, making parsing easier and the language easy to extend

Hyperscript favors read time over write time when it comes to code. It can be a bit tricky to get the syntax
right at first (not so bad once you get used to it), but it reads very clearly once the code is written.

OK, let's get on with it...

## <a name="install"></a>[Install & Quick Start](#install)

Hyperscript is a dependency-free javascript library that can be included in a web page without any build steps:

```html
<script src="https://unpkg.com/hyperscript.org@0.8.4"></script>
```

After you've done this, you can begin adding hyperscript to elements:

```html
<div _="on click call alert('You clicked me!')">
  Click Me!
</div>
```

Hyperscript has an open, pluggable grammar & some features do not ship by default (e.g. [workers](#workers)).

To use a feature like workers you can either:

* install the extension directly by including `/dist/workers.js` after you include hyperscript
* use the "Whole 9 Yards" version of hyperscript, which includes everything by default and can be
  found at `/dist/hyperscript_w9y.js`

## <a name="lang"></a>[The Language](#lang)

A language is usually best learned, initially, by looking at examples.

Let's consider a simple event handler in hyperscript

```html
<button _="on click add .aClass to #anotherDiv">
  Click Me!
</button>
```

Here we have a button. The button as an underscore attribute, which is the default attribute that hyperscript will
look for, for scripts. The script contains an [event handler](/features/on) the body of which will be executed
when a `click` event is received.

The body of the event handler begins with an [`add command`](/commands/add), which adds a class or attribute to a
DOM element.

The `add` command takes, among other options, a CSS class literal. In this case the class literal is `.aClass` indicating
that the `aClass` class should be added to something.

That something is specified with the `to` clause of the `add` command. In this case, we are adding the class to an
ID literal, `#anotherDiv` which will look the element with the id `anotherDiv` up.

So, what does this all mean?

> When the button is clicked hyperscript will add the `.aClass` to `#anotherDiv`.

Which is almost exactly what the handler says it does!

This is what hyperscript is designed for: reacting to events and updating DOM elements, acting as a glue language between
various events and elements or components on the page.

#### The Basics

With that introduction, let's look at the broader language.

A `hyperscript` consists of one or more [features](/reference#features).

The primary entry point into hyperscript is an [`event handler`](/features/on), which defines an event listener on a
DOM element.

A feature then contains body which is a a series of [commands](#commands) (aka "statements"), a term taken from HyperTalk.

A command (usually) consists of a starting keyword and then a series of keywords, [expressions](#expressions) and
potentially child commands or command lists.

A command list is a series of commands, optionally separated by the `then` keyword:

```html
<div _="on click add .fadeMe then wait 200ms then remove me">
  Fade & Remove Me
</div>
```

`then` acts roughly like a semi-colon in other languages. It is particularly recommended when multiple commands are on
the same line, for clarity.

Expressions are the root syntactic element. Some should be very familiar to developers:

* Number literals - `1.1`
* String literals = `"hello world"`
* Array literals = `[1, 2, 3]`

Others are a bit more exotic:

* ID Reference = `#foo`
* Class Reference = `.tabs`
* Query Reference = `<div/>`
* Attribute Reference = `@count`

Below you will find an overview of the various features, commands and expressions in hyperscript, as well as links to
more detailed treatments of them.

You may also want to simply head over to the [cookbook](/cookbook) for existing hyperscripts you can start using and
modifying for your own needs.

Or, if you learn best by comparing code with things you already know, you can look at the
[VanillaJS/jQuery/hyperscript comparison](/comparison).

## <a name="features"></a>[Features](#features)

Top level constructs in hyperscript are called "features". They provide entry points into the hyperscript runtime
through functions, event handlers and so forth. Features defined in a `script` tag will be applied to the
document body and the global namespace.

Features defined on an element will be applied to that element and, in the cases of functions, etc. available to all
child elements.

Below are the core features of hyperscript.

### <a name="event_handlers"></a>[Event Handlers](#event_handlers)

[Event handlers](/features/on) allow you to embed hyperscript logic directly in HTML to respond to events:

```html
<button _="on click add .clicked">
  Add The "clicked" Class To Me
</button>
```

While the underscore (`_`) attribute is where the hyperscript runtime looks for hyperscript on an element by default,
you may also use `script` or `data-script` attribute, or configure a different attribute name if you don't like any of
those.

The script above says

> On the 'click' event for this button, add the 'clicked' class to this button

Note that, unlike the previous example, here there is no `to` clause, so the `add` command defaults to "the current element".

The current element can be referred to with the symbol `me` (and also `my`, more on that in a bit).

### <a name="variables_and_scope"></a>[Variables and Scope](#variables_and_scope)

hyperscript has 3 kinds different variable scopes: local, element-scoped, and globals.

* Global variables are globally available (and should be used sparingly)
* Element-scoped variables are local to the element they are declared on, but shared across all features and
  feature executions within that element
* Local scoped variables are scoped to the currently executing event handler, etc

You may use scope modifiers to give symbols particular scopes:

* A variable with a `global` prefix is a global: `let global myGlobal be true`
* A variable with a `element` prefix is element-scoped `let element myElementVar be true`
* A variable with a `element` prefix is locally scoped `let local x be true`

Hyperscript also supports and recommends using prefixes for global and element scoped variables:

* If a variable starts with the `$` character, it will default to the global scope unless it has an explicit scope modifier
* If a variable starts with the `:` character, it will default to the element scope unless it has an explicit scope modifier

By using these prefixes it is easy to tell differently scoped variables from one another without a lot of additional
syntax:

```hyperscript
  let $foo be 10
  let :bar be 20
  let doh be 42
```

Note that hyperscript has a flat local scope, similar to javascripts `var` statement.

#### <a name=scope-examples></a> [Scoping Examples](#scope-examples)

Below are some scoping examles in hyperscript

#### <a name=local-scope></a> [Local Scope](#local-scope)

Consider the following snippet, which declares and increments the variable foo when the button is clicked:

```html
<button _="on click increment foo then set my innerText to foo">Bad Counter</button>
```

<button _="on click increment foo then set my.innerText to foo">Bad Counter</button>

Clicking this button will set the button text to 1, no matter how many times you click. This is because by default, hyperscript uses <dfn>local variables</dfn>, which stop existing when the current event listener (or function, or whatever else) finishes. So, each time you click the button foo is initialized to zero, the button is set
to 1, and then foo disappears.

#### <a name=global-scope></a> [Global Scope](#global-scope)

To make a counter, we can use <dfn>global variables</dfn>:

```html
<button _="on click increment $foo then set my innerText to $foo">Global Counter</button>
```

<button _="on click increment $foo then set my innerText to $foo">Global Counter</button>

Now it works!

Those with programming experience will immediately see the issue. This is a fine pattern if the counter is the only
thing on the page, but if we have two counters, they will increment the same `foo`. Even worse, if two different
components of the page use the name `foo` for two different things, it'll likely be difficult to even figure out
what's happening. See how clicking the counter above makes this identical counter below skip numbers:

<button _="on click increment $foo then set my innerText to $foo">Global Counter</button>

#### <a name=element-scope></a> [Element Scope](#element-scope)

To alleviate this issue, hyperscript also offers <dfn>element-scoped variables</dfn>:

```html
<button _="on click increment :foo then set my innerText to :foo">Isolated Counter</button>
```

<button _="on click increment :foo then set my innerText to :foo">Isolated Counter</button>

Here, the variable `foo` lasts as long as the button exists, and can only be accessed by the code of that element.
This allows elements to have variables that stay around without interfering with one another.

If you set element-scoped variables from within a behavior, those will be visible from within that behavior only. This is to prevent name collisions between behaviors (esp. behaviors written by different people).

#### <a name=variables-attributes></a> [Attributes](#variables-attributes)

Variables are not the only way to hold on to the data you're working on. In the version below, the variable foo is now declared as an HTML attribute of the button (which is also as persistent). Try clicking the counter with the browser inspector open.

Note that attributes can only store strings (anything else you put there will turn to a string, often in ways
that you can't convert them back).

You can remember the @ sign as the *AT*tribute operator.

```html
<button _="on click increment @foo then set my.innerText to @foo">Attribute Counter</button>
```

<button _="on click increment @foo then set my.innerText to @foo">Attribute Counter</button>

By combining these with an id selector, you can trivially manage state across elements. Consider this example,
with two buttons allowing you to increment and decrement an attribute on another element.

```html
<p id="counter">0</p>
<button _="on click increment #counter@foo then set #counter.innerText to #counter@foo">Add</button>
<button _="on click decrement #counter@foo then set #counter.innerText to #counter@foo">Subtract</button>
```

<p id="counter">0</p>
<button _="on click increment #counter@foo then set #counter.innerText to #counter@foo">Add</button>
<button _="on click decrement #counter@foo then set #counter.innerText to #counter@foo">Subtract</button>

Technically, in the examples above, instead of using the foo attribute on the counter element, it might
be easier to just use the counter.innerText instead, as shown below. Where and how you decide to store state
will vary depending on what you are trying to accomplish.

```html
<p id="counterText">0</p>
<button _="on click increment #counterText.innerText">Add</button>
<button _="on click decrement #counterText.innerText">Subtract</button>
```

<p id="counterText">0</p>
<button _="on click increment #counterText.innerText">Add</button>
<button _="on click decrement #counterText.innerText">Subtract</button>

#### <a name="event_queueing"></a>[Event Queueing](#event_queueing)

By default, the event handler will be run synchronously, so if the event is triggered again before the event handler
finished, the new event will be queued and handled only when the current event handler finishes.

You can modify this behavior in a few different ways.

##### <a name="on_every"></a>[The Every Modifier](#on_every)

The with the `every` modifier will execute the event handler for every event that is received even if the preceding
handler execution has not finished (due to some asynchronous operation.)

```html
<button _="on every click add .clicked">
  Add The "clicked" Class To Me
</button>
```

This is useful in cases where you want to make sure you get the handler logic for every event going immediately.

##### <a name="queue"></a>[The Queue Modifier](#on_every)

The `every` keyword is a prefix to the event name, but for other queuing options, you use postfix the event name
with the `queue` keyword.

You may pick from one of four strategies:

* `none` - Any events that arrive while the event handler is active will be dropped
* `all` - All events that arrive will be added to a queue and handled in order
* `first` - The first event that arrives will be queued, all others will be dropped
* `last` - The last event that arrives will be queued, all others will be dropped

`queued last` is the default behavior

#### <a name="event_destructuring"></a>[Event Destructuring](#event_destructuring)

You may [destructure](https://hacks.mozilla.org/2015/05/es6-in-depth-destructuring/) event properties _and details_
by appending a parenthesized list of names after the event name. This can be used to assign properties of either
object to symbols that can be used in the body of the handler.

```html
<button _="on click(button) log button">
  Log the event.button property
</button>
```

#### <a name="event_filters"></a>[Event Filters](#event_filters)

You can filter events by adding a bracketed expression after the event name and destructured properties (if any).

The expression should return a boolean value `true` if the event handler should execute.

Note that symbols referenced in the expression will be resolved as properties of the event, then as symbols in the global scope.

This lets you, for example, test for a middle click on the click event, by referencing the `button` property on that event directly:

```html
<button _="on click[button==1] add .clicked">
  Middle-Click To Add The "clicked" Class To Me
</button>
```

#### <a name="mutation"></a>[Mutation Events](#mutation)

Hyperscript includes a few synthetic events that make use of more complex APIs. For example, you can listen for
mutations on an element with the `on mutation` form. This will use the [Mutation Observer](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
API, but will act more like a regular event handler.

```html
  <div _='on mutation of @foo put "Mutated" into me'></div>
```

This div will listen for mutations of the `foo` attribute on this div and, when one occurs, will put the value
"Mutated" into the element.

#### <a name="intersection"></a>[Intersection Events](#intersection)

Another synthetic event is the `intersection` event that uses the [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
API. Again, hyperscript makes this API feel more event-driven:

```html
<img _="on intersection(intersecting) having threshold 0.5
         if intersecting transition opacity to 1
         else transition opacity to 0 "
     src="https://placebear.com/200/300"/>
```

This image will become visible when 50% or more of it has scrolled into view. Note that the `intersecting` property
is destructured into a local symbol, and the `having threshold` modifier is used to specify that 50% of the image
must be showing.

Here is a demo:

<img _="on intersection(intersecting) having threshold 0.5
         if intersecting transition opacity to 1
         else transition opacity to 0 "
     src="https://placebear.com/200/300"/>

### <a name="init"></a>[Init Blocks](#init)

If you have logic that you wish to run at the point of loading, you may use an `init` block:

```html
  <div _="init transition opacity to 1 over 3 seconds">
    Fade Me In
  </div>
```

The `init` keyword should be followed by a set of commands to execute when the element is loaded.

### <a name="let_feature"></a>[Init Blocks](#let_feature)

If you wish to declare a [element-scoped]((/docs#variables_and_scope)) variable you may do so by using a
`let` feature:

```html
<div _='let :theAnswer be 42
        on click put :theAnswer into my innerHTML'></div>
```

The syntax is identical to the [`let`](/commands/let) command but the variable must be element-scoped.

### <a name="functions"></a>[Functions](#functions)

Functions in hyperscript are defined by using the [`def` keyword](/features/def).

Functions defined on elements will be available to the element the function is defined on, as well as any
child elements.

Functions can also be defined in a hyperscript `script` tag:

```html
<script type="text/hyperscript">
  def waitAndReturn()
    wait 2s
    return "I waited..."
  end
</script>
```

This will define a global function, `waitAndReturn()` that can be
invoked from anywhere in hyperscript.

These scripts can also be loaded remotely, but in that case, they **must**
appear before loading hyperscript:

```
<script type="text/hyperscript" src="/functions._hs"></script>
<script src="https://unpkg.com/hyperscript.org"></script>
```

Global hyperscript functions are available in javascript:

```js
  var str = waitAndReturn();
  str.then(function(val){
    console.log("String is: " + val);
  })
```

In javascript, you must explicitly deal with the `Promise` created by the `wait` command. In hyperscript runtime, the
runtime [takes care of that](#async) for you behind the scenes.

Note that if you have a normal, synchronous function like this:

```html
<script type="text/hyperscript">
  def waitAndReturn()
    return "I waited..."
  end
</script>
```

then javascript could use it the normal, synchronous way:

```js
  var str = waitAndReturn();
  console.log("String is: " + str);
```

hyperscript functions can take parameters and return values in the expected way:

```html
<script type="text/hyperscript">
  def increment(i)
    return i + 1
  end
</script>
```

#### <a name="function_namespacing"></a>[Namespacing](#function_namespacing)

You can namespace a function by prefixing it with dot separated identifiers. This allows you to place functions into a specific
namespace, rather than polluting the global namespace:

```html
<script type="text/hyperscript">
  def utils.increment(i)
    return i + 1
  end
</script>
<script>
  console.log(utils.increment(41)); // access it from javascript
</script>
```

#### <a name="exceptions"></a>[Exceptions](#exceptions)

A function may have one and only one catch block associated with it, in which to handle exceptions that occur
during the execution of the body:

```html
<script type="text/hyperscript">
  def example
    call mightThrowAnException()
  catch e
    log e
  end
</script>
```

### <a name="behaviors"></a>[Behaviors](#behaviors)

Behaviors allow you to bundle together some hyperscript code (that would normally go in the \_ attribute of an element) so that it can be "installed" on any other. They are defined with [the `behavior` keyword](/features/behavior):

```hyperscript
behavior Removable
  on click
    remove me
  end
end
```

They can accept arguments:

```hyperscript
behavior Removable(removeButton)
  on click from removeButton
    remove me
  end
end
```

They can be installed as shown:

```html
<div class="banner" _="install Removable(removeButton: #close-banner)">
  ...
```

For a better example of a behavior, check out [Draggable.\_hs](https://gist.github.com/dz4k/6505fb82ae7fdb0a03e6f3e360931aa9).

### <a name="workers"></a>[Web Workers](#workers)

[WebWorkers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) can be defined
inline in hyperscript by using the [`worker` keyword](/features/worker).

The worker does not share a namespace with other code, it is in it's own isolated sandbox. However, you may interact
with the worker via function calls, passing data back and forth in the normal manner.

```html
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
```

This makes it very easy to define and work with web workers.

Note that you can use the inline js feature discussed next if you want to use javascript in your worker. You might
want to do this if you need better performance on calculations than hyperscript provides, for example.

### <a name="sockets"></a>[Web Sockets](#sockets)

[Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) allow for two-way communication with
a web server, and are becoming increasingly popular for building web applications. Hyperscript provides a simple way to
create them, as well as a simple [Remote Procedure Call (RPC)](https://en.wikipedia.org/wiki/Remote_procedure_call) mechanism
layered on top of them, by using the [`socket` keyword](/features/sockets).

Here is a simple web socket declaration in hyperscript:

```hyperscript
socket MySocket ws://myserver.com/example
  on message as json
    log message
end
```

This socket will log all messages that it receives as a parsed JSON object.

You can send messages to the socket by using the normal [`send`](/commands/send) command:

```hyperscript
    send myMessage(foo: "bar", doh: 42) to MySocket
```

You can read more about the RPC mechanism on the [`socket` page](/features/socket#rpc).

### <a name="event_source"></a>[Event Source](#event_source)

[Server Sent Events](https://en.wikipedia.org/wiki/Server-sent_events) are a simple way for your web server to push
information directly to your clients that is [supported by all modern browsers](https://caniuse.com/eventsource).

They provide real-time, uni-directional communication from your server to a browser. Server Sent Events cannot send
information back to your server. If you need two-way communication, consider using [sockets](/features/socket/) instead.

You can declare an SSE connection by using the [`eventsource` keyword](/features/event-source) and can dynamically change
the connected URL at any time without having to reconnect event listeners.

Here is an example event source in hyperscript:

```hyperscript
eventsource ChatUpdates from http://myserver.com/chat-updates

    on message as string
        put it into #div
    end

    on open
        log "connection opened."
    end

end
```

This event source will put all `message` events in to the `#div` and will log when an `open` event occurs.
This feature also publishes events, too, so you can listen for Server Sent Events from other parts of your code.

### <a name="js"></a>[Inline JS](#js)

Inline javascript may be defined using the [`js` keyword](/features/js). You might do this for performance reasons,
since the hyperscript runtime is more focused on flexibility, rather than performance.

This feature is useful in [workers](#workers), when you want to pass javascript across to the worker's
implementation:

```html
<script type="text/hyperscript">
  worker CoinMiner
    js
      function mineNext() {
        // a javascript implementation...
      }
    end
    def nextCoin()
      return mineNext()
    end
  end
</script>
```

Note that there is also a way to include [inline javascript](/commands/js)
directly within a hyperscript body, for local optimizations.

## <a name="commands"></a>[Commands](#commands)

Commands are the statements of the hyperscript langauge, and make up the bodies of functions, event handlers and so on.

In hyperscript, (almost) all commands start with a term, such as `add`, `remove` or `fetch`.

Commands may be separated with a `then` keyword. This is recommended in one-liner event handlers but is not required.

Note that all commands may be followed by an `unless <expr>` that makes the command conditionally executed.

### <a name="default-commands"></a>[Default Commands](#default-commands)

Below is a table of all commands available by default in the hyperscript language:

{% include commands_table.md %}

Below, we will discuss some of the more commonly used commands.

### <a name="add"></a>[Add](#add)

The [add command](/commands/add) allows you to add classes or properties to an element or multiple elements in the DOM.

Here are some examples:

```html
<!-- adds the .clicked class to the div with id #aDiv -->
<button _="on click add .clicked to #aDiv">
  Click Me
</button>
```

You can add a class to multiple elements by using a class reference instead:

```html
<!-- adds the .clicked class to all elements with the example class on it -->
<button _="on click add .clicked to .example">
  Click Me
</button>
```

If you omit a target, the default will be the current element.

```html
<!-- adds the .clicked class to the button -->
<button _="on click add .clicked">
  Click Me
</button>
```

### <a name="remove"></a>[Remove](#remove)

The [remove command](/commands/remove) allows you to remove classes or properties to an element or multiple elements in the DOM.

Here are some examples:

```html
<!-- removes the .blocked class from the div with id #aDiv -->
<button _="on click remove .blocked from #aDiv">
  Click Me
</button>
```

You can remove a class from multiple elements by using a class reference instead:

```html
<!-- removes the .blocked class from all elements with the .example class on them -->
<button _="on click remove .blocked from .example">
  Click Me
</button>
```

If you omit a target, the default will be the current element.

```html
<!-- removes the .blocked class from the button -->
<button _="on mouseover remove .blocked">
  Click Me
</button>
```

### <a name="toggle"></a>[Toggle](#toggle)

The [toggle command](/commands/toggle) allows you to toggle a class or property on an element or multiple elements in the DOM. Depending on the syntax you pick, the toggle can be for a fixed amount of time, or until the reception of an event.

Here are some examples:

```html
<!-- toggle the .checked class on the button -->
<button _="on click toggle .checked">
  Click Me
</button>
```

You can toggle for a fixed amount of time by using the `for` modifier:

```html
<!-- toggle the .clicked class on the button for 2 seconds -->
<button _="on click toggle .clicked for 2 s">
  Click Me
</button>
```

You can toggle until an event is received by using the `until` modifier:

```html
<!-- toggle the .clicked class on the button for 2 seconds -->
<button _="on click toggle .clicked until transitionend">
  Click Me
</button>
```

As with the [add](#add) and [remove](#remove) commands, you can target other elements:

```html
<!-- toggle the .checked class on the element with the id anotherDiv -->
<button _="on click toggle .checked on #anotherDiv">
  Click Me
</button>
```

### <a name="show"></a>[Show](#show)

The [show command](/commands/show) allows you to show an element in the DOM using various strategies.

Here are some examples:

```html
<!-- show the element after 2 seconds by setting display to block -->
<div _="on load wait 2s then show">
  I will show up in 2 seconds...
</div>
```

```html
<!-- show the element after 2 seconds by setting opacity to 1 -->
<div _="on load wait 2s then show with opacity">
  I will show up in 2 seconds...
</div>
```

```html
<!-- show the element after 2 seconds by setting display to inline-block -->
<div _="on load wait 2s then show with display:inline-block">
  I will show up in 2 seconds as inline-block...
</div>
```

```html
<!-- show another element on click -->
<div _="on click show #anotherDiv">
Show Another Div
</div>
```

You can also plug in custom hide show strategies. See the command details for more information.

### <a name="hide"></a>[Hide](#hide)

The [hide command](/commands/hide) allows you to hide an element in the DOM using various strategies.

Here are some examples:

```html
<!-- Hide the button -->
<button _="on click hide">
  Hide Me...
</button>
```

```html
<!-- Hide the button with opacity set to 0-->
<button _="on click hide with opacity">
  Hide Me...
</button>
```

```html
<!-- hide another element on click -->
<button _="on click hide #anotherDiv">
 Hide A Div
</button>
```

You can also plug in custom hide show strategies. See the command details for more information.

### <a name="wait"></a>[Wait](#wait)

The [wait command](/commands/wait) allows you to wait a fixed amount of time or to wait for an event. Execution will
pause for the given period of time, but it will not block other events from happening.

Here are some examples:

```html
<!-- wait 2 seconds and then remove the button -->
<button _="on click wait 2s then remove me">
  Click Me
</button>
```

```html
<!-- add a fadeOut class, wait for the transition to end, then remove the button -->
<button _="on click add .fadeOut then wait for transitionend then remove me">
  Click Me
</button>
```

### <a name="transition"></a>[Transition](#transition)

The [transition command](/commands/transition) allows you to transition a style attribute from one value to another.

Here are some examples:

```hyperscript
  transition my opacity to 0
  transition the div's opacity to 0
  transition #anotherDiv's opacity to 0 over 2 seconds
  transition .aClass's opacity to 0
```

Note that this command will not complete until the transition is done. This is in contrast with transitions
kicked off by the `add` command adding a class to an element.

### <a name="settle"></a>[Settle](#settle)

The [settle command](/commands/settle) allows transitions that are kicked off by an `add` command to complete
before progressing.

```html
<button _="on click
                repeat 6 times
                  toggle .red then settle">
    You thought the blink tag was dead?
</button>
```

In this code, the `.red` class transitions the button to being red. The `settle` command detects that a transition
has begun and then waits for it to complete, before another run through the loop.

### <a name="send"></a>[Send](#send)

The [send command](/commands/send) sends an event to the current or another element in the DOM. You can pass arguments with the
event via an optional named argument syntax.

Here are some an examples:

```html
<div _="on click send doIt(answer:42) to #div1">Click Me!</div>
<div id="div1" _="on doIt(answer) put 'The answer is ' + answer into my.innerHTML"></div>
```

```html
<div _="on click send remove to #div1">Click Me!</div>
<div id="div1" _="on remove remove me">I will be removed...</div>
```

You can also use the `trigger` keyword, rather than `send` if that reads better:

```html
<div _="on click trigger remove
        on mouseout trigger remove
        on remove add .fadeOut then wait until transitionend then remove Me">Click Me!</div>
```

### <a name="take"></a>[Take](#take)

The [take command](/commands/take) takes a class from another set of elements. This can be used to represent an
active element in a tabbed UI, for example.

Here is an example on a parent element that takes the class `.active` and assigns it to the clicked anchor:

```html
<div _="on click take .active from .tab for event.target">
    <a class="tab active">Tab 1</a>
    <a class="tab">Tab 2</a>
    <a class="tab">Tab 3</a>
</div>
```

### <a name="log"></a>[Log](#log)

The [log command](/commands/log) logs a value to the console.

```html
<div _="on click log me then remove me">
  Click Me
</div>
```

### <a name="call"></a>[Call](#call)

The [call command](/commands/call) calls a function or evaluates an expression and puts the result into the `result`
variable.

```html
<div _="on click call getTheAnswer() then put it into my.innerHTML">
  Click Me
</div>
```

`get` is an alias for `call`:

```html
<div _="on click get getTheAnswer() then put it into my.innerHTML">
  Click Me
</div>
```

You can choose the one that reads more clearly for your use case.

### <a name="put"></a>[Put](#put)

The [put command](/commands/put) puts a value somewhere, either into the DOM, or into a variable or into a property.

Here is a basic example putting 'Clicked' into the divs innerHTML:

```html
<div _="on click put 'Clicked!' into my.innerHTML">
  Click Me
</div>
```

Here is an example putting 'Clicked' _after_ the button: (Additional clicks will keep adding "Clicked")

```html
<div _="on click put 'Clicked!' after me">
  Click Me
</div>
```

Other positional options are:

* `before`
* `at end of`
* `at start of`

### <a name="let"></a>[Let](#let)

The [let command](/commands/let) defines a new variable.

```hyperscript
 let x be 10
 log x
```

Variables defined with let will default to the local scope, unless a [scope modifier](#variables_and_scope) is
used.

### <a name="set"></a>[Set](#set)

The [set command](/commands/set) sets a value somewhere, either into a variable or into a property.

Here is an example function setting a few variables

```html
<script type="text/hyperscript">
  function numberString(total)
    let i be the total
    let str be ""
    repeat while i > 0
      set str to str + i
      set i to i - 1
    end
    return str
  end
</script>
```

Set should be favored for setting local variables, where put should be favored for DOM manipulation.

### <a name="if"></a>[If](#if)

The [if command](/commands/if) allows for conditional execution and works in the expected manner:

```html
<script type="text/hyperscript">
  function isNegative(value)
    if i < 0
      return "The value is negative"
    else
      return "The value is non-negative"
    end
  end
</script>
```

### <a name="repeat"></a>[Repeat](#repeat)

The [repeat command](/commands/repeat) is the looping construct in hyperscript and supports a large number of variants:

```html
<script type="text/hyperscript">
  function loops()

    -- a basic for loop
    repeat for x in [1, 2, 3]
      log x
    end

    -- you may omit the 'repeat' keyword for a for loop
    for x in [1, 2, 3]
      log x
    end

    -- you may repeat without an explicit loop variable and use the implicit `it` symbol
    repeat in [1, 2, 3]
      log it
    end

    -- you may use a while clause to loop while a condition is true
    repeat while x < 10
      log x
    end

    -- you may use an until clause to loop until a condition is true
    repeat until x is 10
      log x
    end

    -- you may use the times clause to repeat a fixed number of times
    repeat 3 times
      log 'looping'
    end

    -- you may use the index clause on any of the above
    -- to bind the loop index to a given symbol
    for x in [1, 2, 3] index i
      log i, "is", x
    end

  end
</script>
```

### <a name="fetch"></a>[Fetch](#fetch)

The [fetch command](/commands/fetch) issues an AJAX request using the [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) API. It is an asynchronous command but, as with all hyperscript, can be used in a linear manner without call backs.

The results of a fetch will be placed in the `it` variable. Note that by default the value will be text, but you can use the `as json` modifier to parse it as JSON.

Here are some example usages:

```html

<button _="on click fetch /example then put it into my.innerHTML">
  Fetch it!
</button>

<button _="on click fetch /example as json then put it.message into my.innerHTML">
  Fetch it as JSON!
</button>

<button _="on click fetch /example with method:'POST' then put it into my.innerHTML">
  Fetch it with a POST!
</button>
```

### <a name="js-command"></a>[Inline Javascript](#js-command)

Performance is an, ahem, _secondary_ consideration in hyperscript and, while it is fast enough
in most cases, there are times when you may want to kick out to javascript. You may of course
pull logic out to a javascript function and invoke it from hyperscript, but you can also inline
javascript using the [js command](/commands/js).

Here are some examples:

```html
<button _="on click js
                      console.log('this is js code..');
                    end">
  Click Me
</button>
```

You can pass variables into the block like so:

```html
<button _="on click js(me)
                      console.log(me);
                    end">
  Click Me
</button>
```

And you can use any results return from the javascript in the default `it` variable:

```html
<button _="on click js
                      return 'This is from javascript...";
                    end then log it">
  Click Me
</button>
```

### <a name="pseudo-commands"></a>[Pseudo-Commands](#pseudo-commands)

While almost all commands have a specific start symbol, there is one other type of command: pseudo-commands.

Pseudo-commands allow you to treat a method as a command.

There are two forms:

#### Naked pseudo-commands

Naked pseudo-commands are just normal method invocations:

```html
  <button _="on click alert('clicked!')">
    Refresh the Location
  </button>
```

#### Prepositional pseudo-commands

Prepositional pseudo-commands include a preposition syntax after the function, one of "the", "to", "on", "with", "into", "from", "at",
  followed by an expression.

The method will be looked up on the value returned by the expression and then executed.

Consider the `refresh()` method found on `window.location`. In hyperscript, you can use it as a pseudo-command like so:

```html
  <button _="on click refresh() the location of the window">
    Refresh the Location
  </button>
```

## <a name="expressions"></a>[Expressions](#expressions)

Expressions in hyperscript are a mix of familiar ideas from javascript and friends, and then some more exotic expressions.

You can see [the expressions page](/expressions) for more detail.

### Things Similar to Javascript

Strings, numbers, `true`, `false` and `null` all work as you'd expect.

Mathematical operators work normally _except_ that you cannot mix different mathematical operators without
parenthesizing them to clarify binding.

```hyperscript
  set x to 1 * (2 + 3)
```

Logical operators use the english terms `and`, `or` and `not` and must also be fully disambiguated.

```hyperscript
  if foo and bar
    log "Foo & Bar!"
  end
```

Comparison operators are the normal '==', '<=', etc. You can is `is` and `is not` in place of `==` and `!==` respectively.

```hyperscript
  if foo is bar
    log "Foo is Bar!"
  end
```

Hyperscript also supports a `no` operator to test for `== null`

```hyperscript
  if no foo
    log "foo was null-ish"
  end
```

Array and object literals work the same as in javascript:

```hyperscript
  set x to {arr:[1, 2, 3]}
```

### Things Different from JavaScript

While some expressions work the same as JavaScript, many things are different. Here are some of the bigger
differences:

#### Closures

Closures in hyperscript have a different syntax, starting with a backslash and followed by an arrow:

```hyperscript
    set arr to ["a", "ab", "abc"]
    set lengths to arr.map( \ str -> str.length )
```

Hyperscript closures may only have an expression body. They cannot have return statements, etc. in them. Because
hyperscript is async-transparent, the need for complex callbacks is minimized, and by only allowing expressions
in closure bodies, hyperscript eliminates ambiguity around things like `return`, `throw` etc.

#### CSS Literals

Hyperscript supports many literal values for DOM access:

* Class Literals - `.myClass`
* ID Literals - `#someElement`
* Query Literals - `<p.hidden/>`
* Attribute Literals - `@href`

Each of these can be used to refer to various elements in or attributes on those elements.

```hyperscript
  add .disabled to #myDiv
  for tab in <div.tabs/>
    add .highlight to tab
    set @highligted of the tab to true
  end
```

In the above code, `.disabled` refers to the class `disabled` and `#myDiv` evaluates to the element with the ID
`myDiv`.

In the loop we iterate over all `div` with the `tab` class using a CSS selector literal.

We add the `highlight` class to them.

And then we set the attribute `highlighted` to `true` using an attribute literal: `@highlighted`

#### Possessive's, Of Expressions and "The"

One of the more humorous aspects of hyperscript is the inclusion of alternative possessive expressions, which allows you to
replace the normal dot notation of property chains with a few different syntaxes.

The first form uses the english style `'s` or `my` symbol:

```hyperscript
  set my innerText to 'foo'
  set #anotherDiv's innerText to 'bar'
```

These are the equivalent to the more conventional following dot notation:

```hyperscript
  set me.innerText to 'foo'
  set #anotherDiv.innerText to 'bar'
```

Alternatively you can use the `of` expression:

```hyperscript
  set innerText of me to 'foo'
  set innerText of #anotherDiv to 'bar'
```

Finally, as mentioned above, you can add a definite article `the` to the code to clarify the language:

```hyperscript
  set the innerText of me to 'foo'
  set the innerText of #anotherDiv to 'bar'
```

`the` can appear as a start symbol for any expression, and should be used judiciously to clarify code for future
readers.

```html
  <button _="on click refresh() the location of the window">
    Refresh the Location
  </button>
```

Here we use a pseudo-command to refresh the location of the window.

#### <a name='zoo'></a>[The Hyperscript Zoo](#zoo)

Hyperscript supports a number of symbols that have specific meanings

| name     | description                                                        |
| -------- | ------------------------------------------------------------------ |
| `result` | the result of the last command, if any (e.g. a `call` or `fetch`)  |
| `it`     | alias for `result`                                                 |
| `its`    | alias for `result`                                                 |
| `me`     | the element that the current event handler is running on           |
| `my`     | alias for `me`                                                     |
| `I`      | alias for `me`                                                     |
| `event`  | the event that triggered the event current handler, if any         |
| `body`   | the body of the current document, if any                           |
| `detail` | the detail of the event that triggered the current handler, if any |

## <a name="async"></a>[Async Transparency](#async)

A feature that sets hyperscript apart from other languages is that it is _async transparent_: the runtime largely hides
the distinction between asynchronous code and synchronous code from the script writer.

You can write a hyperscript function that looks like this:

```html
<script type="text/hyperscript">
def theAnswer()
  return 42
end
</script>
```

And then invoke it from an event handler like so:

```html
<button _="on click put theAnswer() into my innerHTML">
  Get The Answer...
</button>
```

So far, so synchronous.

However, if you updated the function to include a `wait` command:

```html
<script type="text/hyperscript">
def theAnswer()
  wait 2s
  return 42
end
</script>
```

Suddenly the function becomes _asynchronous_.

Under the covers, that `wait` command turns into a `setTimeout()` and,
if you invoke the method from javascript (which is perfectly acceptable) you would see that the result was a `Promise`
rather than a number!

And now, here's the trick: the event handler that we defined earlier:

```html
<button _="on click put theAnswer() into my innerHTML">
  Get The Answer...
</button>
```

This still works _exactly_ the same, without modification.

You don't need to deal with the promise that was returned by `theAnswer()`. Instead, the hyperscript runtime takes
care of it for you and, when the Promise from `theAnswer()` resolves, hyperscript will continue executing.

No `async`/`await`, no callbacks, no `.then()` invocations.

It just keeps working.

Now, that might seem like a parlor trick, but what's the real world value?

Well, what if we wanted to fetch the value from the server?

That involves an asynchronous call to the `fetch()` API, and the hyperscript runtime is fine with that as well:

```html
<script type="text/hyperscript">
def theAnswer()
  fetch /theAnswer
  return it
end
</script>
```

Again, the original event handler does not need to be updated to deal with asynchronous code. When the value returns
from the server, the hyperscript runtime will take care of resuming execution of the event handler.

Now how much would you pay? :)

### <a name="async-keyword"></a>[The `async` keyword](#async-keyword)

That's all well and good (and it _is_ well and good) but what if you _want_ an operation to be asynchronous? Sometimes
that comes up.

Hyperscript provides an `async` keyword that will tell the runtime _not_ to synchronize on a value. So, if you wanted
to invoke `theAnswer()` but not wait on it to return, you could update the event handler to look like this:

```html
<button _="on click call async theAnswer() put 'I called it...' into my.innerHTML">
  Get The Answer...
</button>
```

### <a name="event-control-flow"></a>[Event Driven Control Flow](#event-control-flow)

One of the extremely interesting abilities that this async-transparent runtime gives hyperscript is the ability to have
event driven control flow:

```html
<button id="pulsar"
        _="on click repeat until event stop
                      add .pulse then settle
                      remove .pulse then settle
                    end">
  Click me to Pulse...
</button>

<button _="on click send stop to #pulsar">
  Stop it from Pulsing
</button>
```

Here we have a button that, when clicked, will cycle between having the `.pulse` class on it and off it, with some
sort of transition defined for that class in CSS. It will keep cycling through this loop until the button receives
a `stop` event, which another other button will helpfully send to it.

Here is a demo of this code:

<div style="text-align: center">
<style>
#pulsar {
    padding: 1em;
    letter-spacing: .1em;
    text-transform: uppercase;
    background: white;
    border: solid;
    cursor:pointer;
    border-radius: 8px;
    display: inline-block;
  transition: all 1s ease-in;
}
#pulsar.pulse {
  background-color: indianred;
}
</style>
<div id="pulsar"
        _="on click repeat until event stop
                      add .pulse then settle
                      remove .pulse then settle
                    end">
  Click me to Pulse...
</div>

<div class="btn primary" style="display: inline-block"  _="on click send stop to #pulsar">
  Stop it from Pulsing
</div>
</div>

What's particularly interesting here is that the CSS transition is allowed to finish smoothly, rather than abruptly,
because the event listener that terminates the loop is only consulted once a complete loop is made.

This I hope gives you a taste of the unique execution model of hyperscript, and what uses it might be put to.

## <a name="debugging"></a>[Debugging (Alpha)](#debugging)

**Note: The hyperscript debugger is in alpha and, like the rest of the language, is undergoing active development**

Hyperscript includes a debugger, [hdb](/hdb), that allows you to debug by inserting `breakpoint` commands in your hyperscript.

To use it you need to include the `lib/hdb.js` file. You can then add `breakpoint` commands in your hyperscript
to trigger the debugger.

```html
<div>
Debug: <input id="debug-on" type='checkbox' checked="checked">
</div>
<button _="on click
             if #debug-on matches <:checked/>
               breakpoint
             end
             tell #debug-demo
               transition 'background-color' to red
               transition 'background-color' to green
               transition 'background-color' to blue
               transition 'background-color' to initial
           ">Colorize...</button>

<div id="debug-demo">TechnoColor Dream Debugging...</div>
```

<div>
Debug: <input id="debug-on" type='checkbox' checked="checked">
</div>
<button class='btn primary'
        _="on click
            if #debug-on matches <:checked/>
              breakpoint
            end
            tell #debug-demo
              transition 'background-color' to red
              transition 'background-color' to green
              transition 'background-color' to blue
              transition 'background-color' to initial
           ">Colorize...</button>

<div id="debug-demo">TechniColor Dream Debugging...</div>

## <a name="extending"></a>[Extending](#extending)

Hyperscript has a pluggable grammar that allows you to define new features, commands and certain types of expressions.

Here is an example that adds a new command, `foo`, that logs `"A Wild Foo Was Found!" if the value of its expression
was "foo":

```javascript
    _hyperscript.addCommand('foo', function(parser, runtime, tokens) { // register for the command keyword "foo"

        if(tokens.match('foo')){                                       // consume the keyword "foo"

            var expr = parser.requireElement('expression', tokens);    // parse an expression for the value

            var fooCmd = {
                expr: expr,    // store the expression on the element

                args: [expr],  // return all necessary expressions for
                               // the command to execute for evaluation by
                               // the runtime

                op: function (context, value) {                 // implement the logic of the command
                    if(value == "foo"){                         // taking the runtime context and the value
                        console.log("A Wild Foo Was Found!")    // of the result of evaluating the expr expression
                    }

                    return runtime.findNext(this)               // return the next command to execute
                                                                // (you may also return a promise)
                }
            }
            return fooCmd; // return the new command object
        }
    })
```

With this command defined you can now write the following hyperscript:

```hyperscript
  def testFoo()
    set str to "foo"
    foo str
  end
```

And "A Wild Foo Was Found!" would be printed to the console.

## <a name="security"></a>[Security](#security)

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

## <a name="history"></a>[History, or 'Yet Another Language?'](#history)

I know, I know.

Why on earth do we need yet another front end technology, let alone another _scripting language_?

Well, I'll tell you why:

The initial motivation for the language was the [event model](https://htmx.org/reference/#events) in htmx. I wanted
to have a way to utilize these events naturally and directly within HTML. HTML tags support `on*` attributes
for handling standard DOM events (e.g. `onClick`) but that doesn't work for custom events like `htmx:load`.

In [intercooler](https://intercoolerjs.org), I had handled this by adding a bunch of custom event attributes, but that
always felt hacky and wasn't general enough to handle custom events triggered by response headers, etc.

Additionally, I wanted to have a way to address some useful features from intercooler.js, but without causing htmx
to bloat up and lose focus on the core request/response processing infrastructure:

* [`ic-add-class`](http://intercoolerjs.org/attributes/ic-add-class.html) and [`ic-remove-class`](http://intercoolerjs.org/attributes/ic-remove-class.html)
* [`ic-remove-after`](http://intercoolerjs.org/attributes/ic-remove-after.html)
* [`ic-post-errors-to`](http://intercoolerjs.org/attributes/ic-post-errors-to.html)
* [`ic-action`](http://intercoolerjs.org/attributes/ic-action.html) and all the associated attributes

Finally, after having spent many, many years chasing down event handlers defined in jQuery, often in obscure
and, at times, insane places, I wanted to return to the simplicity of something like HyperCard, where the logic
was right there, associated with the elements.

The more I looked at it, the more I thought that there was a need for a small, domain specific language for all this,
rather than an explosion in attributes and inline javascript, or a hacky custom syntax as with `ic-action`. `ic-action`
had the prototype for async tranparency idea in it, and I thought it would be interesting to see if we could solve
the aync/sync problem with this language as well.

And so here we are. Yes, another programming language.

</div>
