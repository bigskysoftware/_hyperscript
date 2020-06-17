---
layout: layout.njk
title: ///_hyperscript
---

## Documentation

### Introduction

Hyperscript is a small, expressive scripting language designed to embed well directly in HTML (thus satisfying the
[Locality of Behaviour Principle](https://htmx.org/locality-of-behaviour/)). It is a sibling project of [htmx](https://htmx.org)
and the two integrate automatically when used together.

Hyperscript is inspired by the [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf) programming language
and uses an english-like syntax for most of the language.  It transpiles down to ES5.1 and thus is compatible with
all modern browsers, as well as IE11.

#### Another Language?  Are you kidding me?

Yeah, I know.  

But hyperscript is a small [Domain Specific Language](https://en.wikipedia.org/wiki/Domain-specific_language)
that is used as glue between events and some light DOM manipulations, with an expressiveness that other languages
can't really match.

When I was building htmx I wanted to have something that addressed the following intercooler.js features, without 
junking up the core of the library:

* [`ic-add-class`](http://intercoolerjs.org/attributes/ic-add-class.html) and [`ic-remove-class`](http://intercoolerjs.org/attributes/ic-remove-class.html)
* [`ic-remove-after`](http://intercoolerjs.org/attributes/ic-remove-after.html)
* [`ic-post-errors-to`](http://intercoolerjs.org/attributes/ic-post-errors-to.html)
* [`ic-action`](http://intercoolerjs.org/attributes/ic-action.html) and all the associated attributes
* all the event attributes (e.g. `ic-on-beforeSend`)

The more I looked at it, the more I thought there was a small language needed here, rather than an explosion in attributes
and inline javascript.  And I remembered how much I enjoyed HyperTalk.

Besides, I like compilers.

#### The Language

So, what does the language look like?  As mentioned above, it is designed to be used directly from within HTML:

```html
<button _="on click add .clicked">
  Add The "clicked" Class To Me
</button>
```

The underscore attribute is where hyperscript is stored.  You can also use `script` and `data-script`, or configure
which attribute you want it to live on if you don't like those.

This script says 

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

### Features

|  name | description | example
|-------|-------------|---------
| [on](/features/on) | Creates an event listener | `on click log "clicked!"`

### Commands

|  name | description | example
|-------|-------------|---------
| [add](/commands/add) | Adds content to a given target | `add .myClass to me`
| [ajax](/commands/ajax) | Send an AJAX request | `ajax GET "/demo" then put it into my.innerHTML`
| [call](/commands/call) | Evaluates an expression (e.g. a Javascript Function) | `call alert('yep, you can call javascript!)`
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

### Expressions

|  name | description | example
|-------|-------------|---------
| [array literal](/expressions/array-literal) | An array literal, as in JavaScript | `[1, 2, 3]`
| [attribute reference](/expressions/attribute-reference) | An attribute reference | `[selected=true]`
| [block literal](/expressions/block-literal) | An anonymous function with an expression body | `\ x -> x * x`
| [boolean](/expressions/boolean) | Boolean literals | `true`<br/>`false`
| [class reference](/expressions/class-reference) | A class reference | `.active`
| [comparison oeprator](/expressions/comparison-operator) | Comparison operators | `x < y`<br/>`z === "foo"`
| [id reference](/expressions/id-reference) | A class reference | `#main-div`
| [number](/expressions/number) | A number | `3.14`
| [object literal](/expressions/object-literal) | A javascript-style object literal | `{foo:"bar"}`
| [string](/expressions/string) | A string | `"a string", 'another string'`
