---
layout: layout.njk
title: ///_hyperscript
---

<div class="row">
<div class="2 col nav">

**Contents**

<div id="contents">

* [introduction](#introduction)
* [install & quick start](#install)
* [the language](#lang)
  * [features](#features)
    * [on](#on)
    * [def](#def)
    * [worker](#worker)
    * [js](#js)
  * [commands](#commands)
    * [add](#add)
    * [remove](#remove)
    * [toggle](#toggle)
    * [wait](#wait)
    * [return](#return)
    * [send](#send)
    * [trigger](#trigger)
    * [take](#take)
    * [log](#log)
    * [call](#call)
    * [put](#put)
    * [set](#set)
    * [if](#if)
    * [repeat](#repeat)
    * [fetch](#fetch)
    * [throw](#throw)
    * [js](#js-command)
  * [expressions](#expressions)
* [async transparency](#async)
  * [async keyword](#async-keyword)
  * [event driven control flow](#events)
* [history](#history)

</div>

</div>
<div class="10 col">


## <a name="introduction"></a>[Introduction](#introduction)

Hyperscript is a scripting language for the web, inspired by the 
[HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf) programming language, giving it a distinct, english-like syntax & first class event-handling.

One of the core features of hyperscript is the ability to embed event handlers directly on HTML elements:

```html
<button _="on click put 'I was clicked!' into my.innerHTML">
  Click Me!
</button>
``` 
<button class='btn primary' _="on click put 'I was clicked!' into my.innerHTML 
                    then wait 2s
                    then put 'Click Me' into my.innerHTML">
  Click Me!
</button>

Embedding event handling logic directly on elements in this manner makes it much easier to understand what a given element does & hyperscript's syntax allows you to respond to *any event*, even custom events that you create or that are triggered by [other libraries](https://htmx.org/reference/#events).

Hyperscript reads easily and is expressive enough that many common web patterns can be comfortably written directly inline.  (Of course, if you need to, you can factor logic out to [functions](#functions) as 
well.)

One of the most interesting aspects of hyperscript is that it is *[async-transparent](#async)*.  That is, you can write code
that is asynchronous in a linear style.  Consider the following hyperscript function:

```javascript
def getString()
  fetch /aString
  return it
end
```
This is an asynchronous hyperscript function, issuing a `GET` to `/aString` on the server and waiting for a response.  Despite this, you do not need to explicitly annotate the function being asynchronous.

If we create an event handler that invokes this function:

```html
<button _="on click put getString() into my.innerHTML">
  Click Me!
</button>
``` 

The `put` command will wait for `getString()` to complete before it
puts the results into the buttons innerHTML.  The hyperscript runtime dynamically detects if something is asynchronous and adjusts the execution accordingly.  

This lets you do some pretty neat stuff:

```html
<button _="on click add .waiting
                    put getString() into my.innerHTML
                    remove .waiting">
  Click Me!
</button>
``` 

Here we've added a `.waiting` class to the button, invoked an AJAX call and allowed it to respond, and then removed the `.waiting` class from the button, all in proper order.  

This is all done without callbacks, explicit Promises or any `async`/`await` annotations.

This gives you a flavor of the language, and I hope perks your interest.  Now let's get down to brass tacks...

## <a name="install"></a>[Install & Quick Start](#install)

Hyperscript is a dependency-free javascript library that can be included in a web page without any build steps:

```html
<script src="https://unpkg.com/hyperscript.org@0.0.3"></script>
```

After you've done this, you can begin adding hyperscript to elements:

```html
<div _="on click call alert('You clicked me!')">
  Click Me!
</div>
```

## <a name="lang"></a>[The Language](#lang)

Hyperscript is a modern reinterpretation of [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf) for the web and thus has a distinctive, english-like syntax.  

This may be off-putting at first, but it has advantages:

* It is obvious when some code is hyperscript, since it looks so distinctive
* Commands (statements) start with a keyword, making it easy to parse
* It reads well once you are used to it

The syntax, while alien at first, will grow on you.

Let's consider a simple event handler in hyperscript

```html
<button _="on click add .aClass to #anotherDiv">
  Click Me!
</button>
``` 

This button, when clicked, will add the `aClass` CSS class to the div with the id `anotherDiv`.  You can see that hyperscript has native syntactic support for CSS class literals and ID references.  This makes it easy to express common DOM manipulations.

This is what hyperscript is designed for: reacting to events and updating DOM elements, acting as a glue language between various events and elements on the page.  Note that hyperscript event handlers can respond to any event, even custom events that you, or a library you are using, has defined, all with a nice, inline syntax that makes it obvious what is happening on inspection.

#### The Basics

Now that you've seen a basic introduction, let's look at the broader language.

A `hyperscript` consists of one or more [features](#features).  The primary entrypoint into hyperscript is  [`on`](/features/on) feature, which defines an event listener on a DOM element.

A feature then contains a series of [commands](#commands) (aka "statements"), a term taken from HyperTalk.  A command consists of a starting keyword and then a series of keywords, [expressions](#expressions) and potentially child commands or command lists.

A command list is a series of commands, optionally separated by the `then` keyword:

```html
<div _="on click add .fadeMe then wait 200ms then remove me">
  Fade & Remove Me
</div>
```

The `then` keyword is particularly recommended when commands are on the same line, for clarity.

Expressions are the root syntactic element.  Some should be very familiar to developers:

* Number literals - `1.1`
* String literals = `"hello world"`
* Array literals = `[1, 2, 3]`

Others are a bit more exotic:

* ID Ref = `#foo`
* Class Ref = `.tabs`

Below you will find an overview of the various features, commands and expressions in hyperscript, as well as links to more detailed treatments of them.

You may also want to simply head over to the [cookbook](/cookbook) for existing hyperscripts you can start using and modifying for your own needs.

## <a name="features"></a>[Features](#features)

Top level constructs in hyperscript are called "features".  They provide entry points into the hyperscript runtime through functions, event handlers and so forth.  

Below are the core features of hyperscript.

### <a name="on"></a>[The On Feature](#on)

The [on feature](/features/on) allows you to embed *event handlers* directly in HTML and respond to events with hyperscript:

```html
<button _="on click add .clicked">
  Add The "clicked" Class To Me
</button>
```

The underscore (`_`) attribute is where the hyperscript runtime looks for hyperscript on an element by default.  

*Note: you may also use `script` or `data-script` attribute, or 
configure a different attribute name if you don't like any of those.*

The script above says

> On the 'click' event for this button, add the 'clicked' class to this button

Hyperscript syntax reads a lot like the english does, often making it self-documenting.

#### <a name="on_every"></a>[On Every](#on_every)

By default, the event handler will be run synchronously, so if the event is triggered again before the event handler finished, it will ignore the new event.  You can modify this behavior with the `every` modifier:

```html
<button _="on every click add .clicked">
  Add The "clicked" Class To Me
</button>
```
#### <a name="on_filters"></a>[On Filters](#on_filters)

You can filter events by adding a bracketed expression after the event name.  The expression should return a boolean value `true` if the
event handler should execute.  

Note that symbols referenced in the expression will be resolved as properties of the event, then as symbols in the global scope.  

This lets you, for example, test for a middle click on the click event, by referencing the `button` property on that event directly:

```html
<button _="on click[button==1] add .clicked">
  Middle-Click To Add The "clicked" Class To Me
</button>
```
### <a name="def"></a>[The Def Feature](#def)

The [def feature](/features/def) allows you define new hyperscript functions.

Rather than living on an element attributes, functions are typically embedded in a hyperscript `script` tag:

```html
<script type="text/hyperscript">
  def waitAndReturn() 
    wait 2s
    return "I waited..."
  end
</script>
```

This will define a global function, `waitAndReturn()` that can be
invoked from anywhere in hyperscript.  The function will also be available in javascript:

```js
  var str = waitAndReturn();
  str.then(function(val){
    console.log("String is: " + val);
  })
```

In javascript, you must explicitly deal with the `Promise` created by the `wait` command, but the hyperscript runtime [takes care of all that](#async) for you behind the scenes.

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

#### <a name="def_namespacing"></a>[Namespacing](#def_namespacing)

You can namespace a function by prefixing it with dot separated identifiers.  This allows you to place functions into a specific
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

### <a name="workers"></a>[The Worker Feature](#workers)

The [worker feature](/features/worker) allows you define a [WebWorker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) in hyperscript

```html
<script type="text/hyperscript">
  worker Incrementer
    def increment(i) 
      return i + 1
    end
  end
</script>
```

TODO....

### <a name="js"></a>[The JS Feature](#js)

The [js feature](/features/worker) allows you define javascript within hyperscript script tags.  You might do this for performance reasons, since the hyperscript runtime is more focused on flexibility, rather than performance.  This feature is most useful in [workers](#workers), when you want to pass javascript across to the worker's implementation:

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

Note that there is also a way to include [inline javascript](#inline_js)
within a hyperscript function, for local optimizations.

## <a name="commands"></a>[Commands](#commands)

Commands are the statements of the hyperscript langauge, and make up the body of functions, event handlers and so on.  In hyperscript, all commands start with a term, such as `add`, `remove` or `fetch`. 

Commands may be separated with a `then` keyword.  This is recommended in one-liner event handlers but is not required.

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

If you omit a target, the default will be the current element

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

You can remove a class to multiple elements by using a class reference instead:

```html
<!-- removes the .blocked class from all elements with the .example class on them -->
<button _="on click remove .blocked from .example">
  Click Me
</button>
```

If you omit a target, the default will be the current element

```html
<!-- removes the .blocked class from the button -->
<button _="on mouseover remove .blocked">
  Click Me
</button>
```

### <a name="toggle"></a>[Toggle](#toggle)

The [toggle command](/commands/toggle) allows you to toggle a class or property on an element or multiple elements in the DOM.  Depending on the syntax you pick, the toggle can be for a fixed amount of time, or until the reception of an event.

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

### <a name="wait"></a>[Wait](#wait)

The [wait command](/commands/wait) allows you to wait a fixed amount of time or to wait for an event.  Execution will
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

### <a name="return"></a>[Return](#return)

The [return command](/commands/return) returns a value for the currently executing function.

Here are some examples:

```html
<script type="text/hyperscript">
  def theAnswer()
    return 42
  end
</script>
<!-- puts 42 into the button-->
<button _="on click put theAnswer() into my.innerHTML">
  Click Me
</button>
```

```html
<script type="text/hyperscript">
  def theAnswer()
    wait 2s
    return 42
  end
</script>
<!-- puts 42 into the button after a 2 second delay -->
<button _="on click put theAnswer() into my.innerHTML">
  Click Me
</button>
```

### <a name="send"></a>[Send](#send)

The [send command](/commands/send) sends an event to another element in the DOM.  You can pass arguments to the other
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

### <a name="trigger"></a>[Trigger](#trigger)

The [trigger command](/commands/trigger) triggers an event on the current element.  You can use this to centralize logic
in one event handler.

Here is an examples that centralizes logic to remove an element:

```html
<div _="on click trigger remove
        on mouseout trigger remove
        on remove add .fadeOut then wait until transitionend then remove Me">Click Me!</div>
```

### <a name="take"></a>[Take](#take)

The [take command](/commands/trigger) takes a class from another set of elements.  This can be used to represent an 
active element in a tabbed UI, for example.

Here is an example on a parent element that takes the class `.active` and assigns it to the clicked anchor.
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

The [call command](/commands/call) calls a function or evaluates an expression and puts the result into the `it`
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

Here is a basic example putting 'Clicked' into the divs innerHTML
```html
<div _="on click put 'Clicked!' into my.innerHTML">
  Click Me
</div>
```

Here is an example putting 'Clicked' *after* the button.  Additional clicks will keep adding "Clicked"
```html
<div _="on click put 'Clicked!' after me">
  Click Me
</div>
```

Other positional options are:

* `before`
* `at end of`
* `at start of`

### <a name="set"></a>[Set](#set)

The [set command](/commands/set) sets a value somewhere, either into a variable or into a property.

Here is an example function setting a few variables
```html
<script type="text/hyperscript">
  function numberString(total)
    set i to total
    set str to ""
    repeat while i > 0
      set str to str + i
      set i to i - 1
    end
    return str
  end
</script>
```

### <a name="if"></a>[If](#if)

The [if command](/commands/if) allows for conditional execution and works in the expected manner:

```html
<script type="text/hyperscript">
  function isNegative(value)
    if i < 0
      return "The value is negative"
    else
      return "The value is non-negative"
    ebd
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

The [fetch command](/commands/fetch) issues an AJAX request using the [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) API.  It is an asynchronous command but, as with all hyperscript, can be used in a linear manner without call backs.  

The results of a fetch will be placed in the `it` variable.  Note that by default the value will be text, but you can use the `as json` modifier to parse it as JSON.

Here are some example usages:

```html

<button _="on click fetch /example then put it into my.innerHTML">
  Fetch it!
</button>

<button _="on click fetch /example as json then put it.message into my.innerHTML">
  Fetch it as JSON!
</button>

<button _="on click fetch /example {method:'POST'} then put it into my.innerHTML">
  Fetch it with a POST!
</button>
```

### <a name="throw"></a>[Throw](#throw)

The [throw command](/commands/throw) throws an execption, interrupting the currently executing function.

Here are some examples:

```html
<script type="text/hyperscript">
  def throws()
    wait 2s
    throw
  end
</script>
<!-- will not put anything into the button-->
<button _="on click put throws() into my.innerHTML">
  Click Me
</button>
```

### <a name="js-command"></a>[Inline Javascript](#js-command)

Performance is an, ahem, *secondary* consideration in hyperscript and, while it is fast enough
in most cases, there are times when you may want to kick out to javascript.  You may of course
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

## <a name="async"></a>[Async Transparency](#async)

A feature that sets hyperscript apart from other languages is that it is *async transparent*: the runtime largely hides
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
<button _="on click put theAnswer() into my.innerHTML">
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

Suddenly the function becomes *asynchronous*.  

Under the covers, that `wait` command turns into a `setTimeout()` and,
if you invoke the method from javascript (which is perfectly acceptable) you would see that the result was a `Promise`
rather than a number!

And now, here's the trick: the event handler that we defined earlier:

```html
<button _="on click put theAnswer() into my.innerHTML">
  Get The Answer...
</button>
```

This still works *exactly* the same, without modification.  

You don't need to deal with the promise that was returned by `theAnswer()`.  Instead, the hyperscript runtime takes 
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

Again, the original event handler does not need to be updated to deal with asynchronous code.  When the value returns
from the server, the hyperscript runtime will take care of resuming execution of the event handler.

Now how much would you pay? :)

### <a name="async-keyword"></a>[The `async` keyword](#async-keyword)

That's all well and good (and it *is* well and good) but what if you *want* an operation to be asynchronous?  Sometimes
that comes up.

Hyperscript provides an `async` keyword that will tell the runtime *not* to synchronize on a value.  So, if you wanted
to invoke `theAnswer()` but not wait on it to return, you could update the event handler to look like this:

```html
<button _="on click call async theAnswer() put 'I called it...' into my.innerHTML">
  Get The Answer...
</button>
```

### <a name="events"></a>[Event Driven Control Flow](#events)

One of the extremely interesting abilities that this async-transparent runtime gives hyperscript is the ability to have
event driven control flow:

```html
<button id="pulsar"
        _="on click repeat until event stop
                      add .pulse
                      wait for transitionend
                      remove .pulse
                      wait for transitionend
                    end">
  Click me to Pulse...
</button>

<button _="on click send stop to #pulsar">
  Stop it from Pulsing
</button>
```

Here we have a button that, when clicked, will cycle between having the `.pulse` class on it and off it, with some
sort of transition defined for that class in CSS.  It will keep cycling through this loop until the button receives
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
                      add .pulse
                      wait for transitionend
                      remove .pulse
                      wait for transitionend
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

## <a name="history"></a>[History, or 'Yet Another Language?'](#history)

I know.

The initial motivation for the language was the [event model](https://htmx.org/reference/#events) in htmx.  I wanted
to have a way to utilize these events naturally and directly within HTML.  Most HTML tags support `on*` attributes
for handling standard DOM events (e.g. `onClick`) but that doesn't work for custom events.  

In [intercooler](https://intercoolerjs.org), I had
handled this by adding a bunch of custom event attributes, but that always felt hacky and wasn't general enough
to handle custom events triggered by response headers, etc.

Additionally, I wanted to have a way to address some useful features from intercooler.js, but without causing htmx
to lose focus on the core request/response processing infrastructure:

* [`ic-add-class`](http://intercoolerjs.org/attributes/ic-add-class.html) and [`ic-remove-class`](http://intercoolerjs.org/attributes/ic-remove-class.html)
* [`ic-remove-after`](http://intercoolerjs.org/attributes/ic-remove-after.html)
* [`ic-post-errors-to`](http://intercoolerjs.org/attributes/ic-post-errors-to.html)
* [`ic-action`](http://intercoolerjs.org/attributes/ic-action.html) and all the associated attributes

The more I looked at it, the more I thought that there was a need for a small, domain specific language for all this, rather 
than an explosion in attributes and inline javascript, or a hacky custom syntax as with `ic-action`.

</div>