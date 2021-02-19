---
layout: layout.njk
title: ///_hyperscript
---

<div class="row">
<div class="2 col nav">

**Contents**

<div id="contents">

* [introduction](#introduction)

</div>

</div>
<div class="10 col">


## <a name="introduction"></a>[Introduction](#introduction)

hyperscript is a small, expressive scripting language for the web, inspired by the 
[HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf) programming language
which gives it a distinct, english-like syntax, along with native event-handling.

One of the primary features of hyperscript is the ability to embed logic directly on HTML elements:

```html
<button _="on click put 'I was clicked!' into my.innerHTML">
  Click Me!
</button>
``` 
<button _="on click put 'I was clicked!' into my.innerHTML">
  Click Me!
</button>

By embedding the event trigger logic directly in the HTML, you make it much easier to understand what a given element
is up to.  Hyperscript is designed to read easily and be powerful enough that many common web patterns can be 
comfortably written directly inline.  (Of course, if you need to, you can pull logic out to [functions](#functions) as 
well.)

One of the most interesting aspect of hyperscript is that it is *async-transparent*.  That is, you can write code
that is asynchronous in a linear manner.  Consider the following hyperscript function:

```javascript
def getString()
  fetch /aString
  return it
end
```
This is an asynchronous function, issuing a `GET` to `/aString` on the server.  Note that you do not need to annotate
the function as asynchronous, however.

Now consider this hyperscript event handler:

```html
<button _="on click put getString() into my.innerHTML">
  Click Me!
</button>
``` 

This button, when clicked, will invoke the `getString()` method *and wait for it to complete* before putting the
result into the button.  The hyperscript runtime determines dynamically if something is asynchronous and adjusts
the execution accordingly.  This lets you do some pretty neat stuff:

```html
<button _="on click add .fadeOut to me 
                    then wait 2s 
                    then remove .fadeOut from me">
  Click Me!
</button>
``` 

This even handler will add a class, `.fadeOut` to the button and then wait 2 seconds, then remove it.  You can do
all this without callbacks or any sort of `await` syntax.  It just works.  :)

This gives you a flavor of the language, and I hope perks your interest.  Now let's get down to brass tacks...

### Quick Start

Include hyperscript:

```html
<script src="https://unpkg.com/hyperscript.org@0.0.3"></script>
```

Then add some hyperscript to an element:

```html
<div _="on click call alert('You clicked me!')">
  Click Me!
</div>
```

#### Yet Another Language?

I know.

The initial motivation for the language was the [event model](https://htmx.org/reference/#events) in htmx.  I wanted
to have a way to utilize these events naturally and directly within HTML.  Most HTML tags support `on*` attributes
for handling standard DOM events (e.g. `onClick`) but that doesn't work for custom events.  In intercooler, I had
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

#### The Language

So, what does hyperscript look like?  

As mentioned above, hyperscript is designed to embed well directly within HTML:

```html
<button _="on click add .clicked">
  Add The "clicked" Class To Me
</button>
```

The underscore (`_`) attribute is where hyperscript is stored.  You can also use `script` or `data-script` attribute, or 
configure a different attribute if you don't like those.

The script above says

> On the 'click' event for this button, add the 'clicked' class to the button

The syntax reads a lot like the english does.  This is intentional and drawn from HyperTalk (and its successors, such 
as AppleTalk)

You can extend this example to target another element like so:

```html
<div id="a-div">I'm a div</div>
<button _="on click add .clicked to #a-div">
  Add The "clicked" Class To That Div Above Me
</button>
```

Now the `clicked` class will be added to the div with the id `a-div`, rather than to the element the event handler is
on.

You can see in the example above that hyperscript has native syntactic support for CSS class literals as well as well 
as ID references.  This makes it easy to express common DOM manipulations without a lot of unnecessary syntax.

#### The Basics

Now that you've seen a basic introduction, let's look at the broader language.

A `hyperscript` consists of one or more [features](#features).  Currently, the only feature supported right now
is the [`on`](/features/on) feature, which instantiates an event listener on the current DOM element.

A feature then contains a series of [commands](#commands), a term taken from HyperTalk.  A more standard name would
be "statements", but calling them "commands" is fun.  A command typically consists of a starting keyword (which makes
parsing easy!) and then a series of keywords and [expressions](#expressions).

A command list is a series of commands, optionally separated by the `then` keyword:

```html
<div _="on click add .fadeMe then wait 200ms then remove me">
  Fade & Remove Me
</div>
```

The `then` keyword is particularly recommended when commands are on the same line, for clarity.

Some commands, such as the [if](/commands/if) command contain lists of other commands as well.

Expressions are the root syntactic element.  Some should be very familiar to developers:

* Number literals - `1.1`
* String literals = `"hello world"`
* Array literals = `[1, 2, 3]`

While some are a bit more exotic for an imperative programming language:

* ID Ref = `#foo`
* Class Ref = `.tabs`

Below is a reference for the various features, commands and expressions available in hyperscript:

### <a name='features'></a>[Features](#features)

|  name | description | example
|-------|-------------|---------
| [on](/features/on) | Creates an event listener | `on click log "clicked!"`
| [js](/features/js) | Embed JavaScript code at the top level | `js return { foo() {...} } end`

### <a name='commands'></a>[Commands](#commands)

|  name | description | example
|-------|-------------|---------
| [add](/commands/add) | Adds content to a given target | `add .myClass to me`
| [fetch](/commands/fetch) | Send a fetch request | `fetch /demo then put it into my.innerHTML`
| [call/get](/commands/call) | Evaluates an expression (e.g. a Javascript Function) | `call alert('yep, you can call javascript!)` <br/><br/> `get prompt('Enter your name')`
| [if](/commands/if) | A conditional control flow command | `if me.selected then call alert('I\'m selected!')`
| [log](/commands/log) | Logs a given expression to the console, if possible | `log me`
| [put](/commands/put) | Puts a value into a given variable or property| `put "cool!" into me.innerHTML`
| [remove](/commands/remove) | Removes content | `log "bye, bye" then remove me`
| [send](/commands/send) | Sends an event | `send customEvent to #a-div`
| [set](/commands/set) | Sets a variable or property to a given value | `set x to 0`
| [take](/commands/take) | Takes a class from a set of elements | `take .active from .tabs`
| [toggle](/commands/toggle) | Toggles content on a target | `toggle .clicked on me`
| [trigger](/commands/trigger) | triggers an event on the current element | `trigger customEvent`
| [wait](/commands/wait) | Waits a given amount of time before resuming the command list | `wait 2s then remove me`
| [js](/commands/js) | Embed JavaScript code inline | `js(a) return compute(a); end`

### <a href='expressions'></a>[Expressions](#expressions)

|  name | description | example
|-------|-------------|---------
| [array literal](/expressions/array-literal) | An array literal, as in JavaScript | `[1, 2, 3]`
| [attribute reference](/expressions/attribute-ref) | An attribute reference | `[selected=true]`
| [block literal](/expressions/block-literal) | An anonymous function with an expression body | `\ x -> x * x`
| [boolean](/expressions/boolean) | Boolean literals | `true`<br/>`false`
| [class reference](/expressions/class-reference) | A class reference | `.active`
| [comparison operator](/expressions/comparison-operator) | Comparison operators | `x < y`<br/>`z === "foo"`
| [id reference](/expressions/id-reference) | An id reference | `#main-div`
| [logical operator](/expressions/logical-operator) | Logical operators | `x and y`<br/>`z or false`
| [math operator](/expressions/math-operator) | A mathematical operator | `1 + 2`
| [number](/expressions/number) | A number | `3.14`
| [object literal](/expressions/object-literal) | A javascript-style object literal | `{foo:"bar"}`
| [string](/expressions/string) | A string | `"a string", 'another string'`
| [target](/expressions/target) | A target for update | `.buttons.parent`

</div>