<div class="row">
<div class="2 col nav">

**Contents**

<div id="contents" style="overflow-y: auto; max-height: 90vh">

* [introduction](#introduction)
* [install & quick start](#install)
* [language basics](#lang)
  * [variables & names](#variables)
    * [scoping](#scoping)
    * [special-names](#special-names)
  * [objects](#objects)
    * [properties](#properties)
  * [control flow](#control-flow)
    * [loops](#loops)
  * [events](#events)
    * [sending events](#sending_events)
  * [init blocks](#init)
  * [functions](#functions)
    * [exceptions](#exceptions)
* [DOM manipulation](#working_with_the_dom)
  * [finding things](#finding_things)
    * [using DOM literals](#dom_literals)
    * [finding things in other things](#in)
  * [updating things](#updating_things)
    * [putting new content into the DOM](#set_and_put)
    * [adding, removing & toggling](#add_remove_toggle)
      * [removing content](#removing)
    * [showing & hiding](#show_hide)
    * [transitions](#transitions)
  * [measuring things]()
* [remote content]()
  * [fetch]()
  * [going places]()
* [async transparency](#async)
    * [async keyword](#async-keyword)
    * [event driven control flow](#event-control-flow)


* Deniz
* [advanced features](#advanced_features)
  * [behaviors](#behaviors)
  * [workers](#workers)
  * [sockets](#sockets)
  * [event sources](#event_source)
* [debugging](#debugging)


* Old
  * [commands](#commands)
  * [expressions](#expressions)
* [extending](#extending)
* [security](#security)
* [history](#history)

</div>

</div>

<div class="10 col" style="padding-bottom: 250px">

## <a name="introduction"></a>[Introduction](#introduction)

Hyperscript is a scripting language for doing front end web development.  It is designed to make it very easy to
respond to events and do simple DOM manipulation directly within elements on a web page.

Here is a simple example of hyperscript:

{% example %}
<button _="on click toggle .red on me">
  Click Me
</button>
{% endexample %}

<style>
  .red {
    background: rgba(255,0,0,0.48) !important;
  }
</style>

The first thing to notice is that hyperscript is defined directly on the button, using the `_` property.

Embedding code directly on the button like this
might seem a bit funny, but hyperscript is one of a growing number of technologies that de-emphasize [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
in favor of [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/).  Other examples of technologies
going this direction are [tailwinds](https://tailwindcss.com/), [AlpineJS](https://github.com/alpinejs/alpine/) and [htmx](https://htmx.org).

The next thing to notice about hyperscript is its syntax, which is very different than most programming languages
used today. Hyperscript is part of the [xTalk](https://en.wikipedia.org/wiki/XTalk) family of scripting languages, which
ultimately derive from [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf).  These languages all read more
like english than the programming languages you are probably used to.

This unusual syntax has advantages, once you get over the initial hump:

* It is very distinctive, making it obvious when hyperscript is being used in a web page
* It reads very easily, making it obvious what a script is doing

Hyperscript favors read time over write time when it comes to code. It can be a bit tricky to get the syntax
right when you are starting out, but it reads very clearly once the code is written.  Code is typically read many
more times than it is written, so this tradeoff is a reasonable one.

Below you will find an overview of the various features, commands and expressions in hyperscript, as well as links to
more detailed treatments of each them.

Some other resources you may want to check out are:

 * The [cookbook](/cookbook) for existing hyperscripts you can start using and modifying for your own needs.
 * The [VanillaJS/jQuery/hyperscript comparison](/comparison), which shows the differences between vanillajs, jQuery
   and hyperscript implementations of various common UI patterns

OK, let's get started with hyperscript!

## <a name="install"></a>[Install & Quick Start](#install)

Hyperscript is a dependency-free javascript library that can be included in a web page without any build step:

  ~~~ html
  <script src="https://unpkg.com/hyperscript.org@0.9.3"></script>
  ~~~

After you've done this, you can begin adding hyperscript to elements:

  ~~~ html
  <div _="on click call alert('You clicked me!')">
    Click Me!
  </div>
  ~~~

Hyperscript has an open, pluggable grammar & some advanced features do not ship by default (e.g. [workers](#workers)).

To use a feature like workers you can either:

* install the extension directly by including `/dist/workers.js` after you include hyperscript
* use the "Whole 9 Yards" version of hyperscript, which includes everything by default and can be
  found at `/dist/hyperscript_w9y.js`

## <a name='basics'></a>[Language Basics](#basics)

A hyperscript script consists of a series of ["features"](/reference#features), the most common of which is an
event handler, as we saw in the first example.  The body of a feature then consists of a series of
["commands"](/reference#commands), which are often called statements in other languages.  These commands may include
one or more ["expressions"](/reference#expressions).

Going back to our original example:
  ~~~ html
  <button _="on click toggle .red on me">
    Click Me
  </button>
  ~~~

In the script above:

* The `on click` is an [event handler feature](/features/on)
* [`toggle`](/commands/toggle) is a command
* `.red` and `me` are expressions that are part of the `toggle` command

All hyperscript scripts are made up of these basic building blocks.

#### Comments

Comments in hyperscript start with the `--` character:
  ~~~ hyperscript
  -- this is a comment
  log "Yep, that was a comment"
  ~~~

#### Separators

Multiple commands may be optionally separated with a `then`

  ~~~ hyperscript
  log "Hello" then log "World"
  ~~~

This is particularly recommended when commands are on the same line.

When commands include other commands, such as
with the [`if`](/commands/if) command, the series of commands are terminated by an `end`:

  ~~~ hyperscript
  if x > 10
    log "Greater than 10"
  end
  ~~~

Features are also terminated by an `end`:

  ~~~ hyperscript
  on click
    log "Clicked!"
  end
~~~

Note that `end` can often be omitted for both features and statements if either

* The script ends:
  ~~~ html
  <button _="on click if true log 'Clicked!'">
  Click Me
  </button>
  ~~~ 
* Another feature starts:
  ~~~ html
  <button _="on click if true log 'Clicked!'
             on mouseenterlog 'Mouse entered!'">
  Click Me
  </button>
  ~~~ 
In practice, `end` is used only when necessary, in order to keep scripts small.

#### Expressions

Many expressions in hyperscript will be familiar to developers and are based on expressions available in javascript:

* Number literals - `1.1`
* String literals = `"hello world"`
* Array literals = `[1, 2, 3]`

Others are a bit more exotic and, for example, make it easy to work with the DOM:

* ID References: `#foo`
* Class References: `.tabs`
* Query References: `<div/>`
* Attribute References: `@count`

We will see how features, commands and expressions all fit together and what they can do in the coming sections.

### <a name="variables"></a>[Variables](#variables)

In hyperscript, variables are created by the [`set`](/commands/set) or [`put`](/commands/put) commands,
with `set` being preferred.

Here is how you create a simple, local variable:

  ~~~ hyperscript
  set x to 10
  ~~~ 

Here is an example that creates a local variable and then logs it to the console:

{% example "Local variable" %}
<button _="on click set x to 10 then log x">
  Click Me
</button>
{% endexample %}

If you click this button and open up the console, you should see `10` being logged to it.

#### <a name="scoping"></a>[Scoping](#scoping)

hyperscript has three different variable scopes: `local`, `element`, and `global`.

* Global variables are globally available (and should be used sparingly)
* Element variables are scoped to the element they are declared on, but shared across all features on that element
* Local scoped variables are scoped to the currently executing feature

Note that hyperscript has a flat local scope, similar to javascript's `var` statement.

#### <a name="names_and_scoping"></a>[Variable Names & Scoping](#names_and_scoping)

In order to make non-locally scoped variables easy to create and recognize in code, hyperscript
supports the following naming conventions:

* If a variable starts with the `$` character, it will default to the global scope
* If a variable starts with the `:` character, it will default to the element scope

By using these prefixes it is easy to tell differently scoped variables from one another without a lot of additional
syntax:

  ~~~ hyperscript
  set $foo to 10 -- sets a global named $foo
  set :bar to 20 -- sets an element scoped variable named :bar
  ~~~ 

Here is an example of a click handler that uses an element scoped variable to maintain a counter:

{% example %}
<button _="on click increment :x then put it into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

This script also uses the implicit `it` symbol, which we will discuss [below](#special-names).

#### <a name="scoping_modifiers"></a>[Scoping Modifiers](#scoping_modifiers)

You may also use scope modifiers to give symbols particular scopes:

* A variable with a `global` prefix is a global
  ~~~ hyperscript
  set global myGlobal to true
  ~~~ 
* A variable with a `element` prefix is element-scoped
  ~~~ hyperscript
  set element myElementVar to true
  ~~~ 
* A variable with a `local` prefix is locally scoped
  ~~~ hyperscript
  set local x to true
  ~~~ 

#### <a name=attributes></a> [Attributes](#attributes)

In addition to scoped variables, another way to store data is to put it directly in the DOM, on an element's attribute.

You can access attributes on an element with the following syntax, using an `@` prefix:

  ~~~ hyperscript
  set @my-attr to 10
  ~~~

This will store the value 10 in the attribute `my-attr` on the current element:

  ~~~ html
  <div my-attr="10"></div>
  ~~~ 

Note that, unlike regular variables, attributes can only store strings.  Anything else you store in them will be converted
to a string.

You can remember the `@` sign as the **AT**tribute operator.

Here is the above example, rewritten to use an attribute rather than an element-scoped variable:

{% example %}
<button _="on click increment @my-attr then put it into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

If you click the above button a few times and then inspect it using your browsers developer tools, you'll note that it
has a `my-attr` attribute on it that holds a string value of the click count.

The [`increment`](/commands/increment) command is discussed below.

#### <a name=special-names></a> [Special Names & Symbols](#special-names)

One of the interesting aspects of hyperscript is its use of implicit names for things, often with multiple ways
to refer to the same thing to make a script more readable!

We have already seen the use of the `it` symbol above, to put the result of an `increment` command into an
element.  It turns out that `it` is an alias for `result`, which we could have used just as easily:

{% example "It" %}
<button _="on click increment :x then put result into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

It may be equivalent, but it doesn't read as nicely does it?  That's why hyperscript supports the `it` symbol as well.

Another funny thing you might have noticed is the `the` in this hyperscript.

`the` is whitespace before any expression
in hyperscript and can be used to make your code read more nicely.  For example, if we wanted to use `result` rather than
 it, we could update our use of `result` to be `the result`, which reads more nicely:

{% example "The" %}
<button _="on click increment :x then put the result into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

This is exactly equivalent to the previous example, but reads more nicely and hyperscript is all about readability.

(In this case, we'd probably stick with `it` :)

##### <a name='zoo'></a>[The Hyperscript Zoo](#zoo)

Hyperscript has symbols that are automatically available, depending on the context, that make scripting more convenient:

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
| `target` | the target of the current event, if any                            |
| `detail` | the detail of the event that triggered the current handler, if any |
| `sender` | the element that sent the current event, if any                    |

Note that the `target` is the element that the event originally occurred on, and event handlers may be placed
on parent elements to take advantage of [event bubbling](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture) and reduce redundancy in code.

### <a name=logging></a> [Logging To The Console](#logging)

If you wish to print something to the `console` you can use the [`log` command](/commands/log):

  ~~~ hyperscript
  log "Hello Console!"
  ~~~ 
#### <a name=objects></a> [Objects](#objects)

Hyperscript is not an object oriented language (it is event oriented) but it still allows you to work with objects
in an easy and convenient manner.

#### <a name=properties></a> [Properties](#properties)

Hyperscript offers a few different ways to access properties of objects.  The first two should be familiar
to javascript developers:

  ~~~ hyperscript
  set x to {name : "Joe", age: 35}    -- create an object with some properties
  log x.name                          -- standard "dot" notation
  log x['name']                       -- standard array-index notation
  ~~~ 

The next mechanism is known as a [possessive expression](/expressions/possessive) and uses the standard english `'s`
to express a property access:

  ~~~ hyperscript
  set x to {name : "Joe", age: 35}    -- create an object with some properties
  log x's name                        -- access the name property using a possessive
  ~~~ 

Note that there are two special cases for the possessive expression, the symbols `my` and `its`, both of which
can be used without the `'s` for possessive expressions (as with standard english)

  ~~~ hyperscript
  get the first <div/> then          -- get the first div in the DOM, setting the `results` variable
  set my innerHTML to its innerHTML  -- use possessive expressions to set the current elements innerHTML
                                     -- to the innerHTML of that div
  ~~~ 

Finally, you can also use the [of expression](/expressions/of) to get a property as well:

  ~~~ hyperscript
  set x to {name : "Joe", age: 35}    -- create an object with some properties
  log the name of x                   -- access the name property using an of expression
  ~~~ 

Note that this flips the order of the property and the element that the property is on.

Which of the options above you choose for property access is up to you.  We recommend the possessive form in
most cases as being the most "hyperscripty", with the `of` form being chosen when it helps clarify some code.

Another thing to know about property access in hyperscript is that it is an implicit flatmap, when applied to
collections of values:

  ~~~ hyperscript
  set allDivs to <div/>                      -- get all divs
  set allParents to the parent of allDivs    -- get all parents of those divs as an array
  set allChildren to the children of allDivs -- get all children of those divs as an array
  ~~~ 

On an array, only the `length` property will not perform a flat map in this manner.

#### <a name=make></a> [Creating New Objects](#make)

If you want to make new objects, you can use the [`make` command](/commands/make):

  ~~~ hyperscript
  make a URL from "/path/", "https://origin.example.com"
  ~~~ 

Which is equal to the JavaScript `new URL("/path/", "https://origin.example.com")`

If you wish to assign an identifier to the new object you can use the ` called ` modifier:

  ~~~ hyperscript
  make a URL from "/path/", "https://origin.example.com" called myURL
  log myURL
  ~~~ 

You can also use [`query literals`](/expressions/query_references), discussed [below](#dom_literals), to create new HTML content:

  ~~~ hyperscript
  make an <a.navlink/>
  ~~~ 

#### <a name=arrays></a> [Arrays](#arrays)

Hyperscript arrays work very similarly to Javascript arrays:

  ~~~ hyperscript
  set myArr to [1, 2, 3]
  log myArr[0]           -- logs "1"
  ~~~ 

You can use the `first`, `last` and `random` keywords, discussed [below](#positional), with arrays:

  ~~~ hyperscript
  set myArr to [1, 2, 3]
  log the first of myArr[0]  -- logs "1"
  log the last of myArr[0]   -- logs "3"
  log random in myArr[0]     -- logs a random element from the array
  ~~~ 

### <a name=control-flow></a> [Control Flow](#control-flow)

The primary source of control flow in hyperscript is the [if command](/commands/if).  Note that the expression
in an if statement is not parenthesized and that hyperscript uses `end` rather than curly-braces to delimit
command blocks:

{% example '"If" command' %}
<button _="on click increment :x
              if :x <= 3
                put :x into the next <output/>
              else
                put '3 is the max...' into the next <output/>
              end">
  Click Me
</button>
<output>--</output>
{% endexample %}

As mentioned in the introduction, `end` is often omitted when it isn't needed in order to make script smaller:

  ~~~ html
  <button _="on click increment :x
                if :x < 3
                  put :x into the next <output/>
                else
                  put '3 is the max...' into the next <output/>">
    Click Me
  </button>
  <output>--</output>
  ~~~ 

#### <a name="comparisons"></a> [Comparisons & Logical Operators](#comparisons)

In addition to the usual comparison operators from javascript, such as `==` and `!=`, hyperscript
supports [a rich set of natural language style comparisons](/expressions/comparison operator) for use in `if` commands:

A small sampling is shown below:

| name     | description                                                        |
| -------- | ------------------------------------------------------------------ |
| `is`     | equivalent to `==`: `if 1 is 1`
| `is not` | equivalent to `!=`: `if 1 is not 1`
| `no`     | equivalent to `!= null`: `if no .tab in me`
| `match`  | does a CSS test : `if I match .selected`
| `exists` | tests if an object is non-null : `if #tab1 exists`
| `is greater than` | tests if a number is greater than another number : `if x is greater than y`
| `empty`  | tests if a collectin is empty : `if .tabs is empty`

Using these natural language alternatives allow you to write more concise and clear conditional expressions in your
if commands.

Comparisons can be combined via the `and`, `or` and `not` expressions:

  ~~~ hyperscript
  if I am <:checked/> and the closest <form/> is <:focused/>
    add .highlight to the closest <form/>
  ~~~ 

### <a name="loops"></a>[Loops](#loops)

The [repeat command](/commands/repeat) is the looping construct in hyperscript and supports a large number of variants,
including a shortend `for` version:

  ~~~ hyperscript
  -- a basic for loop
  repeat for x in [1, 2, 3]
    log x
  end

  -- you may omit the 'repeat' keyword for a for loop
  for x in [1, 2, 3]
    log x
  end

  -- you may repeat without an explicit loop variable and use
  -- the implicit `it` symbol
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
  ~~~ 

Loops support both the [`break`](/commands/break) and [`continue`](/commands/continue) commands.

#### <a name="aggregate_operations"></a>[Aggregate Operations](#aggregate_operations)

Note that loops are often not required in hyperscript because many commands will automatically deal with arrays and
collections for you.

For example, if you want to add the class `.foo` to all elements that have the class `.bar` on it, you can simply
write this:

  ~~~ hyperscript
  add .foo to .bar
  ~~~ 

The [`add`](/commands/add) command will take care of looping over all elements with the class `.bar`, so there
is no need to explicitly loop.

#### <a name="math"></a>[Math Operations](#math)

Hyperscript supports most of the regular math operators:

  ~~~ hyperscript
  set x to 10
  set y to 20
  set sum to x + y
  set diff to x - y
  set product to x * y
  ~~~ 

Note that in hyperscript operators must be fully parenthesized when used in combination:

  ~~~ hyperscript
  set x to 10
  set y to 20
  set sumOfSquares to (x * x) + (y * y)
  ~~~ 

If you did not fully parenthesize this expression it would be a parse error.

Hyperscript also offers an [`increment`](/commands/increment) and [`decrement`](/commands/decrement) command for modifying numbers:

  ~~~ hyperscript
  set x to 1
  increment x
  puts x -- prints 2 to the console
  ~~~ 

A nice thing about the `increment` and `decrement` commands is that they will automatically handle string to number
conversions and, therefore, can be used with numbers stored in attributes on the DOM:

  ~~~ hyperscript
  on click
     increment @data-counter
     if @data-counter as Integer is greater than 4
       add @disabled -- disable after the 5th click
  ~~~ 

#### <a name="strings"></a>[Strings](#strings)

Hyperscript supports strings that use either a single quotes or double quotes:

  ~~~ hyperscript
  set hello to 'hello'
  set world to "world"
  set helloWorld to hello + " " + world
  ~~~ 

and also supports javascript style template strings:

  ~~~ hyperscript
  set helloWorld to `${hello} ${world}`
  ~~~ 

The [`append`](/commands/append) command can append content to strings (as well as to arrays and the DOM):

  ~~~ hyperscript
    get "hello"      -- set result to "hello"
    append " world"  -- append " world" to the result
    log it           -- log it to the console
  ~~~ 

### <a name=calling-functions></a> [Calling Functions](#calling-functions)

There are many ways to invoke functions in hyperscript.  Two commands let you invoke a function and automatically
assign the result to the `result` variable: [`call`](/commands/call) and [`get`](/commands/get):

  ~~~ hyperscript
  call alert('hello world!')
  get the nextInteger() then log it -- using the 'it' alias for 'result`
  ~~~ 

You can also invoke functions as stand-alone commands:

  ~~~ hyperscript
  log "Getting the selection"
  getSelection()
  log "Got the selection"
  log it
  ~~~ 

Finally, you can use the [`pseudo-command`](/commands/pseudo-commands)` syntax, which allows you to put the function
call first on the line, to improve readability in some cases:

  ~~~ hyperscript
  refresh() the location of the window
  writeText('evil') into the navigator's clipboard
  reset() the #contact-form
  ~~~ 

These are called pseudo-commands because this syntax make the function look like a normal command in hyperscript.

### <a name="events"></a>[Events & Event Handlers](#event)

[Events](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events) are at the core of what
hyperscript is designed for, and [event handlers](/features/on) are the primary entry point into most hyperscript
code.

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

* Control the queuing behavior of events (do you want events to queue up when an event handler is running?)
* Respond to events only in certain cases, either with counts (e.g. `on click 1`) or with event filters (`on keyup[key is 'Escape']`)
* Control debounce and throttle behavior
* Respond to events from other elements or from `elsewhere` (i.e. outside the current element)

You can read all the gory details on the [event handler](/features/on) page, but chances are, if you want some special
handling of an event, hyperscript has a terse syntax for doing so.

#### <a name="event_queueing"></a>[Event Queueing](#event_queueing)

By default, the event handler will be run synchronously, so if the event is triggered again before the event handler
finished, the new event will be queued and handled only when the current event handler finishes.

You can modify this behavior in a few different ways.

##### <a name="on_every"></a>[The Every Modifier](#on_every)

The with the `every` modifier will execute the event handler for every event that is received even if the preceding
handler execution has not finished (due to some asynchronous operation.)

  ~~~ html
  <button _="on every click add .clicked">
    Add The "clicked" Class To Me
  </button>
  ~~~ 

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

You can [destructure](https://hacks.mozilla.org/2015/05/es6-in-depth-destructuring/) properties found eitehr on the
 `event` or in the `event.detail` object by appending a parenthesized list of names after the event name. This will create a local variable of the same name as the referenced property.

  ~~~ html
  <button _="on click(button) log button">
    Log the event.button property
  </button>
  ~~~ 

#### <a name="event_filters"></a>[Event Filters](#event_filters)

You can filter events by adding a bracketed expression after the event name and destructured properties (if any).

The expression should return a boolean value `true` if the event handler should execute.

Note that symbols referenced in the expression will be resolved as properties of the event, then as symbols in the global scope.

This lets you, for example, test for a middle click on the click event, by referencing the `button` property on that event directly:

  ~~~ html
  <button _="on click[button==1] add .clicked">
    Middle-Click To Add The "clicked" Class To Me
  </button>
  ~~~ 

#### <a name="halting_events"></a>[Halting Events](#halting_events)

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

You may also use the [`exit`](/commands/exit) command to exit an event handler

#### <a name="sending_events"></a>[Sending Events](#sending_events)

hyperscript not only makes it easy to respond to events, but also makes it very easy to send events to other elements
using the [`send`](/commands/send) and [`trigger`](/commands/trigger) commands.  Both commands do the same thing: sending an event to an element (possibly the current element!) to handle.  Here are a few examples:

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
<button _="on click send showMsg(msg:'foo') to the next <output/>">Send Foo</button>
<button _="on click send showMsg(msg:'bar') to the next <output/>">Send Bar</button>
<output _="on showMsg(msg) put 'The message ' + msg + ' was sent to me' into me">
  No Events Yet...
</output>
{% endexample %}

Working with events is very smooth in hyperscript and allows you to build event-driven code with very little effort or unnecessary complexity.

#### Synthetic Events

hyperscript includes a few synthetic events that make it easier to use more complex APIs in javascript.

##### <a name="mutation"></a>[Mutation Events](#mutation)

You can listen for mutations on an element with the `on mutation` form. This will use the [Mutation Observer](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
API, but will act more like a regular event handler.

  ~~~ html
  <div _='on mutation of @foo put "Mutated" into me'></div>
  ~~~ 

This div will listen for mutations of the `foo` attribute on this div and, when one occurs, will put the value
"Mutated" into the element.

##### <a name="intersection"></a>[Intersection Events](#intersection)

Another synthetic event is the `intersection` event that uses the [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
API. Again, hyperscript makes this API feel more event-driven:

  ~~~ html
  <img _="on intersection(intersecting) having threshold 0.5
          if intersecting transition opacity to 1
          else transition opacity to 0 "
      src="https://placebear.com/200/300"/>
  ~~~ 

This image will become visible when 50% or more of it has scrolled into view. Note that the `intersecting` property
is destructured into a local symbol, and the `having threshold` modifier is used to specify that 50% of the image
must be showing.

Here is a demo:

<img _="on intersection(intersecting) having threshold 0.5
         if intersecting transition opacity to 1
         else transition opacity to 0 "
     src="https://placebear.com/200/300"/>

### <a name="init"></a>[Init Blocks](#init)

If you have logic that you wish to run when an element is initialized, you can use the `init` block to do so:

  ~~~ html
  <div _="init transition my opacity to 100% over 3 seconds">
    Fade Me In
  </div>
  ~~~ 

The `init` keyword should be followed by a set of commands to execute when the element is loaded.

### <a name="functions"></a>[Functions](#functions)

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

These scripts can also be loaded remotely, but in that case, they **must** appear before loading hyperscript:

  ~~~ html
  <script type="text/hyperscript" src="/functions._hs"></script>
  <script src="https://unpkg.com/hyperscript.org"></script>
  ~~~ 

hyperscript is interoperable with javascript, and global hyperscript functions can be called from javascript, as well
as vice-versa:

  ~~~ js
  var str = waitAndReturn();
  str.then(function(val){
    console.log("String is: " + val);
  })
  ~~~ 

hyperscript functions can take parameters and return values in the expected way:

  ~~~ html
  <script type="text/hyperscript">
    def increment(i)
      return i + 1
    end
  </script>
  ~~~ 

You may also exit a function using [`return`](/commands/return) if you wish to return a value or
 [`exit`](/commands/exit) if you do not want to return a value

#### <a name="function_namespacing"></a>[Namespacing](#function_namespacing)

You can namespace a function by prefixing it with dot separated identifiers. This allows you to place
functions into a specific namespace, rather than polluting the global namespace:

  ~~~ html
  <script type="text/hyperscript">
    def utils.increment(i)
      return i + 1
    end
  </script>
  <script>
    console.log(utils.increment(41)); // access it from javascript
  </script>
  ~~~ 

### <a name="exceptions"></a>[Exception Handling](#exceptions)

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

Note that exception handling in hyperscript respects the [async-transparent](#async) behavior of the language.

#### <a name="finally"></a>[Finally Blocks](#finally)

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

#### <a name="throw"></a>[Throwing Exceptions](#throw)

You may throw an exception using the familiar `throw` keyword:

  ~~~ hyperscript
  on click
    if I do not match .selected
      throw "I am not selected!
    ...
  ~~~ 
## <a name="working_with_the_dom"></a>[Working With The DOM](#working_with_the_dom)

The primary use case for hyperscript is adding small bits of interactivity to the DOM and, as such, it has a lot of syntax
for making this easy and natural.  We have glossed over a lot of this syntax in previous examples but now we will get into
the details of what you have available:

### <a name="finding_things"></a>[Finding Elements](#finding_things)

There are two sides to DOM manipulation: finding stuff and mutating it.  In this section we will focus on how to
find things in the DOM.

#### <a name="dom_literals"></a>[DOM Literals](#dom_literals)

You are probably used to things like number literals (e.g. `1`) or string literals (e.g. `"hello world"`).  _hyperscript,
since it is designed for DOM manipulation, supports special literals that make it easy to work with the DOM.  Some
are inspired by CSS, while others are our own creation.

Here is a table of DOM literal value types:

| name                 | example          | description                                                        |
| -------------------- | ---------------- | ------------------------------------------------------------------ |
| Class Literals       | `.selected`      | A class literal starts with a `.` and will return all elements with that class
| ID Literals          | `#tab-container` | An ID literal starts with a `#` and returns the element with that id
| Query Literals       | `<div/>`         | A query literal is contained within a `<` and `/>`, returns all elements matching the CSS selector
| Attribute Literals   | `@value`         | An attribute literal starts with an `@` (hence, *att*ribute, get it?) and returns the value of that attribute
| Style Literals       | `*width`         | A style literal starts with an `*` (a reference to [CSS Tricks](https://css-tricks.com/)) and returns the value of that style attribute
| Measurement Literals | `1px`, `0%`      | A measurement literal is an expression followed by a "measurement" ending such as `px` or `%`, and it will return a string with the ending appended to it

Here are a few examples:

  ~~~ hyperscript
  add .disabled to #myDiv        -- adds the 'disabled' class to the element with the id 'myDiv'
  add .highlight to <div.tabs/>  -- adds the 'highlight' class to all divs with the class 'tabs' on them
  set my *width to 35px          -- sets the width of the current element to 35 pixels
  add @disabled to me            -- adds the `disabled` attribute to the current element
  ~~~ 

Class literals, ID Literals and Query Literals all support templating syntax so you can look up dynamic values
easily:

  ~~~ hyperscript
  set idToDisable to 'myDiv'
  add .disabled to #{idToDisable}         -- adds the 'disabled' class to the element with the id 'myDiv'

  set classToHighlight to 'tabs'
  add .highlight to .{classToHighlight}   -- adds the 'highlight' class to all elements with the 'tabs' class

  set elementType to 'div'
  remove <#{elementType}.hidden/>         -- removes all divs w/ class .hidden on them from the DOM
  ~~~ 

These literals make it very easy to work with the DOM in a concise, enjoyable manner.  Compare the following
javascript:

  ~~~ js
  document.querySelector('#example-btn')
    .addEventListener('click', e => {
      document.querySelectorAll(".elements-to-remove").forEach(value => value.remove());
  })
  ~~~ 

with the corresponding hyperscript:

  ~~~ hyperscript
  on click from #example-btn
    remove .elements-to-remove
  ~~~ 

You can see how the support for CSS literals directly in the language cleans the code up quite a bit, allowing us
to focus on the logic at hand.

#### <a name="in"></a>[Finding Things In Other Things](#in)

Often you want to find things in a particular element.  To do this you can use the `in` expression:

  ~~~ hyperscript
  -- add the class 'highlight' to all paragraph tags in the current element
  add .highlight to <p/> in me
  ~~~ 

#### <a name="closest"></a>[Finding The Closest Matching (Parent) Element](#closest)

Sometimes you wish to find the closest element in a parent hierarchy that matches some selector.  To do this you can
use the [`closest`](/expressions/closest) expression:

  ~~~ hyperscript
  -- add the class 'highlight' to the closest table row to the current element
  add .highlight to the closest <tr/>
  ~~~ 

Note that `closest` [starts with the current element](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)
and recurses up the DOM from there.  If you wish to start at the parent, you can use this form:

  ~~~ hyperscript
  -- add the class 'highlight' to the closest div to the current element, excluding the current element
  add .highlight to the closest parent <div/>
  ~~~ 

#### <a name="positional"></a>[Finding Things By Position](#positional)

You can use the [positional expressions](/expressions/positional) to get the first, last or a random element from
a collection of things:

  ~~~ hyperscript
  -- add the class 'highlight' to the first paragraph tag in the current element
  add .highlight to the first <p/> in me
  ~~~ 

#### <a name="relative_positional"></a>[Finding Things Relative To Other Things](#relative_positional)

You can use the [relative positional expressions](/expressions/relative-positional) `next` and `previous` to get an element
 relative to either the current element, or another element:

  ~~~ hyperscript
  -- add the class 'highlight' to the next paragraph found in a forward scan of the DOM
  add .highlight to the next <p/>
  ~~~ 

### <a name="updating_things"></a>[Updating The DOM](#updating_things)

Using the expressions above, you should be able to find the elements you want to update easily.  Now, on to updating them!

#### <a name="set_and_put"></a>[Set & Put](#set_and_put)

The most basic way to update elements is using the [`set`](/commands/set) and [`put`](/commands/put).  Recall that these
commands can also be used to set local variables.  When it comes to updating DOM elements, the `put` command is more
flexible, as we will see.

First, let's just set the `innerHTML` of an element to a string:

{% example "Setting innerHTML" %}
<button _="on click set my innerHTML to 'Clicked!'">
  Click Me
</button>
{% endexample %}

Using the `put` command would look like this:

{% example 'Setting properties with "put"' %}
<button _="on click put 'Clicked!' into my.innerHTML">
  Click Me
</button>
{% endexample %}

And, in fact, the `put` command is smart enough to default to `innerHTML` when you put something into an element, so we can omit the `innerHTML`:

{% example "Putting things into elements" %}
<button _="on click put 'Clicked!' into me">
  Click Me
</button>
{% endexample %}

The `put` command can also place content in different spots based on how it is used:

{% example "Put X before Y" %}
<button _="on click put 'Clicked!' before me">
  Click Me
</button>
{% endexample %}

The `put` command can be used in the following ways:

 * `put content before me` - puts the content in front of the element
 * `put content at the start of me` - puts the content at the beginning of the element
 * `put content at the end of me` - puts the content at the end of the element
 * `put content after me` - puts the content after the element

This flexibility is why we generally recommend the `put` command when updating content in the DOM.

##### <a name="set_attributes"></a>[Setting Attributes](#setting_attributes)

One exception to this rule is when setting attributes, which we typically recommend using `set`.  It just reads better to us:

{% example "Setting attributes" %}
<button _="on click set @disabled to 'disabled'">
  Disable Me
</button>
{% endexample %}

#### <a name="add_remove_toggle"></a>[Add, Remove & Toggle](#add_remove_toggle)

A very common operation in front end scripting is adding or removing classes or attributes from DOM elements. hyperscript
supports the [`add`](/commands/add), [`remove`](/commands/remove) and [`toggle`](/commands/toggle) commands do help do this.

Here are some examples adding, removing and toggling classes:

{% example '"add" command' %}
<button _="on click add .red to me">
  Click Me
</button>
{% endexample %}

{% example '"remove" command' %}
<button class="red" _="on click remove .red from me">
  Click Me
</button>
{% endexample %}

{% example '"toggle" command' %}
<button _="on click toggle .red on me">
  Click Me
</button>
{% endexample %}

You can also add, remove and toggle attributes as well.  Here is an example:

{% example "Toggle an attribute" %}
<button _="on click toggle @disabled on #say-hello">
  Toggle Disabled State
</button>
<button id="say-hello" _="on click alert('hello!')">
  Say Hello
</button>
{% endexample %}

Finally, you can toggle the visibility of elements by toggling a style literal:

{% example "Toggle an attribute" %}
<button _="on click toggle *display of the next <p/>">
  Toggle The Next Paragraph
</button>
<p>
  Hyperscript is rad!
</p>
{% endexample %}

##### <a name="removing"></a>[Removing Content](#removing)

You can also use the [`remove` command](/commands/remove) to remove content from the DOM:

{% example "Remove an element" %}
<button _="on click remove me">
  Remove Me
</button>
{% endexample %}

The remove command is smart enough to figure out what you want to happen based on what you tell it to remove.

#### <a name="show_hide"></a>[Showing & Hiding Things](#show_hide)

You can show and hide things with the [`show`](/commands/show) and [`hide`](/commands/hide) commands:

{% example "Show, Hide" %}
<button _="on click
               hide me
               wait 2s
               show me">
               Peekaboo
</button>
{% endexample %}

By default, the `show` and `hide` commands will use the `display` style property.  You can instead use `visibility`
or `opacity` with the following syntax:

{% example "Show/hide strategies" %}
<button _="on click
               hide me with opacity
               wait 2s
               show me with opacity">
               Peekaboo
</button>
{% endexample %}

You can also apply a conditional to the `show` command to conditionally show elements that match a given condition by
using a `when` clause:

{% example "Filter elements with `show ... when`" %}
<input _="on keyup show <li/> in #color-list
                     when it's innerHTML contains my value">
<ul id="color-list">
  <li>Red</li>
  <li>Blue</li>
  <li>Blueish Green</li>
  <li>Green</li>
  <li>Yellow</li>
</ul>
{% endexample %}

And, as mentioned above, you can also toggle visibility using the `toggle` command:

{% example "Toggle visibility" %}
<button _="on click toggle *display of the next <p/>">
  Toggle The Next Paragraph
</button>
<p>
  Hyperscript is rad!
</p>
{% endexample %}

#### <a name="transitions"></a>[Transitions](#transitions)

You can transition a style from one state to another using the [`transition` command](/commands/transition).  This
allows you to animate transitions between different states:

{% example '"transition" command' %}
<button _="on click transition my *font-size to 20px 
               then wait 500ms
               then transition my *font-size to initial">
  Transition My Font Size
</button>
{% endexample %}

The above example makes use of the special `initial` symbol, which you can use to refer to the initial value of an
elements style when the first transition begins.

##### <a name="settling"></a>[Class-Based Transitions](#settling)

The `transition` command is blocking: it will wait until the transition completes before the next command executes.

Another common way to trigger transitions is by adding or removing classes or setting styles directly.  Commands like
`add` do *not* block on transitions.  If you wish to wait until a transition completes after adding a new class, you
should use the [`settle` command](/commands/settle):

{% example "Wait for transitions/animations to finish" %}
<button _="on click add .red then settle then remove .red">
  Flash Red
</button>
{% endexample %}

If the above code did not have the `settle` command, the button would not flash red because the class `.red` would be
added and then removed immediately, not allowing the 200ms transition to `.red` to complete.


</div>
