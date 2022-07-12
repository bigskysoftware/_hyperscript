
<style>
@media (min-width: 100ch) {
  #toc-wrapper {
    float: left;
    position: sticky;
    top: var(--gap);
    border: none;
    margin: 0;
  }
  #toc {
    
    overflow: auto;
    max-height: 80vh;
    max-width: 24ch;
    
    margin-inline-end: var(--gap);
    margin-inline-start: calc(var(--gap) - var(--gutter-width));
  }

  #docs-content {
    display: flow-root;
    max-width: calc(100vw - 24ch - 3 * var(--gap));
  }

  #skip-to-content {
    display: none;
  }
}

#docs-content:target {
  outline: none;
}
</style>


<header id="toc-wrapper" aria-labelledby="contents-h">
<div id=toc class=box>

# _hyperscript <sub-title>documentation</sub-title> {.h2}

[Skip to content](#docs-content){#skip-to-content}

<nav aria-label="Table of contents">

[[toc]]

</nav>
</div>
</header>

<div id="docs-content">


## Introduction

Hyperscript is a scripting language for doing front end web development.  It is designed to make it very easy to
respond to events and do simple DOM manipulation in code that is directly embedded on elements on a web page.

Here is a simple example of some hyperscript:

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

The first thing to notice is that hyperscript is defined *directly on the button*, using the `_` (underscore) attribute.

Embedding code directly on the button like this might seem strange at first, but hyperscript is one of a growing number
of technologies that de-emphasize [Separation of Concerns](https://en.wikipedia.org/wiki/Separation_of_concerns)
in favor of [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/).

Other examples of libraries going this direction are [Tailwind CSS](https://tailwindcss.com/),
[AlpineJS](https://alpinejs.dev) and [htmx](https://htmx.org).

The next thing you will notice about hyperscript is its syntax, which is very different than most programming languages
used today. Hyperscript is part of the [xTalk](https://en.wikipedia.org/wiki/XTalk) family of scripting languages, which
ultimately derive from [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf).  These languages all read more
like english than the programming languages you are probably used to.

This unusual syntax has advantages, once you get over the initial shock:

* It is very distinctive, making it obvious when hyperscript is being used in a web page
* It is very easy to read, making it obvious what a script is doing

Hyperscript favors read time over write time when it comes to code. It can be a bit tricky to write at first
for some people who are used to other programming languages, but it reads very clearly once you are done.

Code is typically read many more times than it is written, so this tradeoff is a good one for simple
front end scripting needs.

Below you will find an overview of the various features, commands and expressions in hyperscript, as well as links to
more detailed treatments of each them.

Some other hypserscript resources you may want to check out are:

 * The [cookbook](/cookbook) for existing hyperscripts you can start using and modifying for your own needs.
 * The [VanillaJS/jQuery/hyperscript comparison](/comparison), which shows the differences between vanillajs, jQuery
   and hyperscript implementations of various common UI patterns

OK, let's get started with hyperscript!

## Install & Quick Start {#install}

Hyperscript is a dependency-free javascript library that can be included in a web page without any build step:

  ~~~ html
  <script src="https://unpkg.com/hyperscript.org@0.9.6"></script>
  ~~~

After you've done this, you can begin adding hyperscript to elements:

  ~~~ html
  <div _="on click call alert('You clicked me!')">
    Click Me!
  </div>
  ~~~

You can also add hyperscript within script tags that are denoted as `text/hyperscript`:

  ~~~ html
  <script type="text/hyperscript">
    on mousedown
      halt the event -- prevent text selection...
      -- do other stuff...
    end
  </script>
  ~~~

Features defined in script tags will apply to the `body`.

Hyperscript has an open, pluggable grammar & some advanced features do not ship by default (e.g. [workers](#workers)).

To use a feature like workers you can either:

* install the extension directly by including `/dist/workers.js` after you include hyperscript
* use the "Whole 9 Yards" version of hyperscript, which includes everything by default and can be
  found at `/dist/hyperscript_w9y.js`

## Language Basics {#basics}

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

### Comments

Comments in hyperscript start with the `--` characters and a whitespace character (space, tab, carriage return or newline) and go to the end of the line:
  ~~~ hyperscript
  -- this is a comment
  log "Yep, that was a comment"
  ~~~

There is no multi-line comment syntax.

### Separators

Multiple commands may be optionally separated with a `then`, which acts like a semi-colon in javascript:

  ~~~ hyperscript
  log "Hello" then log "World"
  ~~~

Using the `then` keyword is recommended when multiple commands are on the same line.

When commands have bodies that include other commands, such as
with the [`if`](/commands/if) command, the series of commands are terminated by an `end`:

  ~~~ hyperscript
  if x > 10  -- start of the conditional block
    log "Greater than 10"
  end        -- end of the conditional block
  ~~~

Features are also terminated by an `end`:

  ~~~ hyperscript
  on click
    log "Clicked!"
  end
~~~

The `end` terminator can often be omitted for both features and statements if either of these conditions hold:

* The script ends:
  ~~~ html
  <button _="on click if true log 'Clicked!'">
  Click Me
  </button>
  ~~~
* Another feature starts:
  ~~~ html
  <button _="on click if true log 'Clicked!'
             on mouseenter log 'Mouse entered!'">
  Click Me
  </button>
  ~~~

In practice, `end` is used only when necessary, in order to keep scripts small and neat.

### Expressions

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

### Variables {#variables}

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

#### Scoping {#scoping}

hyperscript has three different variable scopes: `local`, `element`, and `global`.

* Global variables are globally available (and should be used sparingly)
* Element variables are scoped to the element they are declared on, but shared across all features on that element
* Local scoped variables are scoped to the currently executing feature

Note that hyperscript has a flat local scope, similar to javascript's `var` statement.

#### Variable Names & Scoping {#names_and_scoping}

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

#### Scoping Modifiers {#scoping_modifiers}

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

#### Attributes

In addition to scoped variables, another way to store data is to put it directly in the DOM, in an attribute of an
element.

You can access attributes on an element with the attribute literal syntax, using an `@` prefix:

  ~~~ hyperscript
  set @my-attr to 10
  ~~~

This will store the value 10 in the attribute `my-attr` on the current element:

  ~~~ html
  <div my-attr="10"></div>
  ~~~

Note that, unlike regular variables, attributes can only store strings.  Anything else you store in them will be converted
to a string.

You can remember the `@` sign as the **at**tribute operator.  We will discuss other DOM literals [below](#dom-literals).

Here is the above example, rewritten to use an attribute rather than an element-scoped variable:

{% example %}
<button _="on click increment @my-attr then put it into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

If you click the above button a few times and then inspect it using your browsers developer tools, you'll note that it
has a `my-attr` attribute on it that holds a string value of the click count.

The [`increment` command](/commands/increment)  is discussed [below](#math).

#### Special Names & Symbols

One of the interesting aspects of hyperscript is its use of implicit names for things, often with multiple ways
to refer to the same thing.  This might sound crazy, and it kind of is, but it helps to make scripts much more
readable!

We have already seen the use of the `it` symbol above, to put the result of an `increment` command into an
element.

It turns out that `it` is an alias for `result`, which we could have used instead:

{% example "It" %}
<button _="on click increment :x then put result into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

It may be equivalent, but it doesn't read as nicely does it?

That's why hyperscript supports the `it` symbol as well.

Another funny thing you might have noticed is the appearnce of `the` in this script.

`the` is whitespace before any expression in hyperscript and can be used to make your code read more nicely.

For example, if we wanted to use `result` rather than it, we would write `the result` instead, which reads more nicely:

{% example "The" %}
<button _="on click increment :x then put the result into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

This is exactly equivalent to the previous example, but reads better.  Hyperscript is all about readability!

In this case, we'd probably stick with `it` :)

##### The Hyperscript Zoo {#zoo}

In addition to `result` and `it`, hyperscript has a number of other symbols that are automatically available, depending
on the context, that make your scripting life more convenient.

Here is a table of available symbols:

{% syntaxes %}
`result` `it` `its`
	the result of the last command, if any (e.g. a `call` or `fetch`)
`me` `my` `I`
	the element that the current event handler is running on
`event`
	the event that triggered the event current handler, if any
`body`
	the body of the current document, if any
`target`
	the target of the current event, if any
`detail`
	the detail of the event that triggered the current handler, if any
`sender`
	the element that sent the current event, if any
{% endsyntaxes %}

Note that the `target` is the element that the event *originally* occurred on.

Event handlers, discussed [below](#on), may be placed on parent elements to take advantage
of [event bubbling](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture)
which can reduce redundancy in code.

### Logging To The Console

If you wish to print something to the `console` you can use the [`log` command](/commands/log):

  ~~~ hyperscript
  log "Hello Console!"
  ~~~

Simplicity itself.

#### Objects

Hyperscript is not an object-oriented language: it is, rather, event-oriented.  However it still allows you to work with
objects in an easy and convenient manner, which facilitates interoperability with all the functionality of JavaScript,
including the DOM APIs, javascript libraries and so on.

Here is how you can work with objects in hyperscript:

#### Properties

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

There are two special cases for the possessive expression, the symbols `my` and `its`, both of which
can be used without the `'s` for possessive expressions:

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

The `of` operator flips the order of the property & the element that the property is on, which can sometimes
clarify your code.

Which of these options you choose for property access is up to you.  We recommend the possessive form in
most cases as being the most "hyperscripty", with the `of` form being chosen when it helps clarify some code by
putting the final property at the front of the expression.

##### Flat Mapping

Inspired by [jQuery](https://jquery.org), another feature of property access in hyperscript is that, when a property is access on an
Array-like object, it will [flat-map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap)
the results to a single, linear array of that property applied to all values within the array.

  ~~~ hyperscript
  set allDivs to <div/>                      -- get all divs
  set allParents to the parent of allDivs    -- get all parents of those divs as an array
  set allChildren to the children of allDivs -- get all children of those divs as an array
  ~~~

On an array, only the `length` property will not perform a flat map in this manner.

##### Null Safety

Finally, all property accesses in hyperscript are null safe, so if the object that the property is being accessed on
is null, the result of the property access will be null as well, without a need to null-check:

  ~~~ hyperscript
  set example to null
  log example.prop     -- logs null, because `example` is null
  ~~~

This null-safe behavior is appropriate for a scripting language intended for front-end work.

#### Creating New Objects

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
  make an <a.navlink/> then put it after me
  ~~~

#### Arrays

Hyperscript arrays work very similarly to Javascript arrays:

  ~~~ hyperscript
  set myArr to [1, 2, 3]
  log myArr[0]           -- logs "1"
  ~~~

You can use the `first`, `last` and `random` keywords, discussed [below](#positional), with arrays:

  ~~~ hyperscript
  set myArr to [1, 2, 3]
  log the first of myArr  -- logs "1"
  log the last of myArr   -- logs "3"
  log random in myArr     -- logs a random element from the array
  ~~~

##### Closures

Hyperscript does not encourage the use of closures or callbacks nearly as much  Javascript.  Rather, it uses
[async transparency](#async) to handle many of the situations in which Javascript would use them.

However, there is one area where closures provide a lot of value in hyperscript: data structure manipulation.  The
hyperscript syntax for closures is inspired by [haskell](https://www.haskell.org/), starting with a `\` character,
then the arguments, then an arrow `->`, followed by an expression:

  ~~~ hyperscript
  set strs to ["a", "list", "of", "strings"]
  set lens to strs.map( \ s -> s.length )
  log lens
  ~~~

### Control Flow

Conditional control flow in hyperscript is done with the the [if command](/commands/if).  The conditional expression
in an if statement is not parenthesized. Hyperscript uses `end` rather than curly-braces to delimit the conditional body.

The else-branch can use either the `else` keyword or the `otherwise` keyword.

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
                otherwise
                  put '3 is the max...' into the next <output/>">
    Click Me
  </button>
  <output>--</output>
  ~~~

You can chain `if/else` commands together in the usual manner.

#### Comparisons & Logical Operators

In addition to the usual comparison operators from javascript, such as `==` and `!=`, hyperscript
supports [a rich set of natural language style comparisons](/expressions/comparison-operator) for use in `if` commands:

A small sampling is shown below:

{% syntaxes %}
`[[a]] is [[b]]`
	Same as {%syntax "[[a]] == [[b]]"%}.
`[[a]] is not [[b]]`
	Same as {%syntax "[[a]] != [[b]]"%}.
`no [[a]]`
	Same as {%syntax "[[a]] == null or [[a]] == undefined or [[a.length]] == 0"%}.
`[[element]] matches [[selector]]`
	Does a CSS test, i.e. `if I match .selected`.
`[[a]] exists`
	Same as {%syntax "not (no [[a]])"%}.
`[[x]] is greater than [[y]]`
`[[x]] is less than [[y]]`
	Same as `>` and `<`, respectively.
`[[collection]] is empty`
	Tests if a collection is empty.
{% endsyntaxes %}

If the left hand side of the operator is `I`, then `is` can be replaced with `am`:

  ~~~ hyperscript
  get chosenElement()
  if I am the result then remove me end
  ~~~

Using these natural language alternatives allows you to write very readable scripts.

Comparisons can be combined via the `and`, `or` and `not` expressions in the usual manner:

  ~~~ hyperscript
  if I am <:checked/> and the closest <form/> is <:focused/>
    add .highlight to the closest <form/>
  ~~~

#### Loops {#loops}

The [repeat command](/commands/repeat) is the looping mechanism in hyperscript.

It supports a large number of variants, including a short hand `for` version:

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

  -- you can loop forever if you like
  repeat forever
    if I match :focus
      break
    end
    wait 2s
  end

  ~~~

Loops support both the [`break`](/commands/break) and [`continue`](/commands/continue) commands.

You can also use events to signal when a loop ends, see [the async section on loops](#async_loops)

#### Aggregate Operations {#aggregate_operations}

Note that loops are often not required in hyperscript.  Many commands will automatically deal with arrays and
collections for you.

For example, if you want to add the class `.foo` to all elements that have the class `.bar` on it, you can simply
write this:

  ~~~ hyperscript
  add .foo to .bar
  ~~~

The [`add`](/commands/add) command will take care of looping over all elements with the class `.bar`.

No need to loop explicitly over the results.

### Math Operations {#math}

Hyperscript supports most of the regular math operators:

  ~~~ hyperscript
  set x to 10
  set y to 20
  set sum to x + y
  set diff to x - y
  set product to x * y
  ~~~

Hyperscript does not have a notion of mathematical operator precendence.  Instead, math operators must be fully
parenthesized when used in combination with other math operators:

  ~~~ hyperscript
  set x to 10
  set y to 20
  set sumOfSquares to (x * x) + (y * y)
  ~~~

If you did not fully parenthesize this expression it would be a parse error.

This clarifies any mathematical logic you are doing and encourages simpler expressions, which, again helps
readability.

Hyperscript also offers an [`increment`](/commands/increment) and [`decrement`](/commands/decrement) command for modifying
numbers:

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
     if @data-counter as Int is greater than 4
       add @disabled -- disable after the 5th click
  ~~~

### Strings {#strings}

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

### Conversions {#conversions}

To convert values between different types, hyperscript has an [`as` operator](/expressions/as):

{% example "Converting Values" %}
<button _="on click
               get the (value of the next <input/>) as an Int
               increment it
               put it into the next <output/>">
  Add 1 To :
</button>
<input/>
<output>--</output>
{% endexample %}

Here we get the input value, which is a String, and we convert it to an Integer.  Note that we need to use parenthesis
to ensure that the `as` expression does not bind too tightly.

We then increment the number and put it into the next `output` element.

Out of the box hyperscript offers a number of useful conversions:

* `Array` - convert to Array
* `Date` - convert to Date
* `Float` - convert to float
* `Fragment` - converts a string into an HTML Fragment
* `HTML` - converts NodeLists and arrays to an HTML string
* `Int` - convert to integer
* `JSON` - convert to a JSON String
* `Number` - convert to number
* `Object` - convert from a JSON String
* `String` - convert to String
* `Values` - converts a Form (or other element) into a struct containing its input names/values
* `Fixed<:N>` - convert to a fixed precision string representation of the number, with an optional precision of `N`

You can also [add your own conversions](/expressions/as) to the language as well.

### Calling Functions {#calling-functions}

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

Finally, you can use the [`pseudo-command`](/commands/pseudo-commands)` syntax, which allows you to put the method
name first on the line in a method call, to improve readability in some cases:

  ~~~ hyperscript
  refresh() the location of the window
  writeText('evil') into the navigator's clipboard
  reset() the #contact-form
  ~~~

These are called "pseudo-commands" because this syntax makes method calls look like a normal command in hyperscript.

### Events & Event Handlers {#event}

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
* Respond to events only in certain cases, either with counts (e.g. `on click 1`) or with event filters (`on keyup[key is 'Escape']`)
* Control debounce and throttle behavior
* Respond to events from other elements or from `elsewhere` (i.e. outside the current element)

You can read all the gory details on the [event handler](/features/on) page, but chances are, if you want some special
handling of an event, hyperscript has a nice, clear syntax for doing so.

#### Event Queueing {#event_queueing}

By default, the event handler will be run synchronously, so if the event is triggered again before the event handler
finished, the new event will be queued and handled only when the current event handler finishes.

You can modify this behavior in a few different ways:

##### The Every Modifier {#on_every}

An event handler with the `every` modifier will execute the event handler for every event that is received,
 even if the preceding handler execution has not finished.

  ~~~ html
  <button _="on every click add .clicked">
    Add The "clicked" Class To Me
  </button>
  ~~~

This is useful in cases where you want to make sure you get the handler logic for every event going immediately.

##### The Queue Modifier {#on_queue}

The `every` keyword is a prefix to the event name, but for other queuing options, you use postfix the event name
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

#### Event Destructuring {#event_destructuring}

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

#### Event Filters {#event_filters}

You can filter events by adding a bracketed expression after the event name and destructured properties (if any).

The expression should return a boolean value `true` if the event handler should execute.

Note that symbols referenced in the expression will be resolved as properties of the event, then as symbols in the global scope.

This lets you, for example, test for a middle click on the click event, by referencing the `button` property on that event directly:

{% example "Event Filters" %}
  <button _="on mousedown[button==1] add .clicked">
    Middle-Click To Add The "clicked" Class To Me
  </button>
{% endexample %}

#### Halting Events {#halting_events}

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

#### Sending Events {#sending-events}

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

#### Synthetic Events

hyperscript includes a few synthetic events that make it easier to use more complex APIs in javascript.

##### Mutation Events {#mutation}

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

##### Intersection Events {#intersection}

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

### Init Blocks {#init}

If you have logic that you wish to run when an element is initialized, you can use the `init` block to do so:

  ~~~ html
  <div _="init transition my opacity to 100% over 3 seconds">
    Fade Me In
  </div>
  ~~~

The `init` keyword should be followed by a set of commands to execute when the element is loaded.

### Functions {#functions}

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
  <script src="https://unpkg.com/hyperscript.org"></script>
  ~~~

Hyperscript is fully interoperable with javascript, and global hyperscript functions can be called from javascript as well
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

#### Namespacing {#function_namespacing}

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

### Exception Handling {#exceptions}

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

#### Finally Blocks {#finally}

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

#### Throwing Exceptions {#throw}

You may throw an exception using the familiar `throw` keyword:

  ~~~ hyperscript
  on click
    if I do not match .selected
      throw "I am not selected!"
    ...
  ~~~
## Working With The DOM {#working-with-the-dom}

The primary use case for hyperscript is adding small bits of interactivity to the DOM and, as such, it has a lot of syntax
for making this easy and natural.

We have glossed over a lot of this syntax in previous examples (we hope it was intuitive enough!) but now we will get
into the details of what they all do:

### Finding Elements {#finding-things}

There are two sides to DOM manipulation: finding stuff and mutating it.  In this section we will focus on how to
find things in the DOM.

#### DOM Literals {#dom-literals}

You are probably used to things like number literals (e.g. `1`) or string literals (e.g. `"hello world"`).

Since hyperscript is designed for DOM manipulation, it supports special literals that make it easy to work with the DOM.

Some are inspired by CSS, while others are our own creation.

Here is a table of the DOM literals:

{% syntaxes %}
`.[[class name]]`
`.{[[expression]]}`
	A <dfn>class literal</dfn> starts with a `.` and returns all elements with that class.

`#[[ID]]`
`#{[[expression]]}`
	An <dfn>ID literal</dfn> starts with a `#` and returns the element with that id.

`<[[css selector]] />`
	A <dfn>query literal</dfn> is contained within a `<` and `/>`, returns all elements matching the CSS selector.

`@[[attribute name]]`
	An <dfn>attribute literal</dfn> starts with an `@` (hence, *at*tribute, get it?) and returns the value of that
	attribute.

`*[[style property]]`
	A <dfn>style literal</dfn> starts with an `*` (a reference to [CSS Tricks](https://css-tricks.com/)) and returns the
	value of that style property.

`1em`
`0%`
`[[expression]] px`
	A <dfn>measurement literal</dfn> is an expression followed by a CSS unit, and it appends the unit as a string. So, the
	above expressions are the same as `"1px"`, `"0%"` and {%syntax "&#96;${[[expression]]}px&#96;"%}.
{% endsyntaxes%}

Here are a few examples of these literals in action:

  ~~~ hyperscript
  -- adds the 'disabled' class to the element with the id 'myDiv'
  add .disabled to #myDiv

  -- adds the 'highlight' class to all divs with the class 'tabs' on them
  add .highlight to <div.tabs/>

  -- sets the width of the current element to 35 pixels
  set my *width to 35px

  -- adds the `disabled` attribute to the current element
  add @disabled to me
  ~~~

Class literals, ID Literals and Query Literals all support a templating syntax.

This allows you to look up elements based on a variable rather than a fixed value:

  ~~~ hyperscript
  -- adds the 'disabled' class to the element with the id 'myDiv'
  set idToDisable to 'myDiv'
  add .disabled to #{idToDisable}

  -- adds the 'highlight' class to all elements with the 'tabs' class
  set classToHighlight to 'tabs'
  add .highlight to .{classToHighlight}

  -- removes all divs w/ class .hidden on them from the DOM
  set elementType to 'div'
  remove <#{elementType}.hidden/>
  ~~~

All these langauge constructs make it very easy to work with the DOM in a concise, enjoyable manner.

Compare the following javascript:

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

You can see how the support for CSS literals directly in hyperscript makes for a much cleaner script, allowing us
to focus on the logic at hand.

#### Finding Things In Other Things {#in}

Often you want to find things *within* a particular element.  To do this you can use the `in` expression:

  ~~~ hyperscript
  -- add the class 'highlight' to all paragraph tags in the current element
  add .highlight to <p/> in me
  ~~~

#### Finding The Closest Matching (Parent) Element {#closest}

Sometimes you wish to find the closest element in a parent hierarchy that matches some selector.  In JavaScript
you might use the [`closest()` function](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)

To do this in hyperscript you can use the [`closest`](/expressions/closest) expression:

  ~~~ hyperscript
  -- add the class 'highlight' to the closest table row to the current element
  add .highlight to the closest <tr/>
  ~~~

Note that `closest` starts with the current element
and recurses up the DOM from there.  If you wish to start at the parent instead, you can use this form:

  ~~~ hyperscript
  -- add the class 'highlight' to the closest div to the current element, excluding the current element
  add .highlight to the closest parent <div/>
  ~~~

#### Finding Things By Position {#positional}

You can use the [positional expressions](/expressions/positional) to get the first, last or a random element from
a collection of things:

  ~~~ hyperscript
  -- add the class 'highlight' to the first paragraph tag in the current element
  add .highlight to the first <p/> in me
  ~~~

#### Finding Things Relative To Other Things {#relative_positional}

You can use the [relative positional expressions](/expressions/relative-positional) `next` and `previous` to get an element
 relative to either the current element, or to another element:

  ~~~ hyperscript
  -- add the class 'highlight' to the next paragraph found in a forward scan of the DOM
  add .highlight to the next <p/>
  ~~~

Note that `next` and `previous` support wrapping, if you want that.

### Updating The DOM {#updating_things}

Using the expressions above, you should be able to find the elements you want to update easily.

Now, on to updating them!

#### Set & Put {#set-and-put}

The most basic way to update contents in the DOM is using the [`set`](/commands/set) and [`put`](/commands/put) commands.
Recall that these commands can also be used to set local variables.

When it comes to updating DOM elements, the `put` command is much more flexible, as we will see.

First, let's just set the `innerHTML` of an element to a string:

{% example "Setting innerHTML" %}
<button _="on click set my innerHTML to 'Clicked!'">
  Click Me
</button>
{% endexample %}

Using the `put` command would look like this:

{% example 'Setting properties with "put"' %}
<button _="on click put 'Clicked!' into my innerHTML">
  Click Me
</button>
{% endexample %}

In fact, the `put` command is smart enough to default to `innerHTML` when you put something into an element, so we can
omit the `innerHTML` entirely:

{% example "Putting things into elements" %}
<button _="on click put 'Clicked!' into me">
  Click Me
</button>
{% endexample %}

The `put` command can also place content in different places based on how it is used:

{% example "Put X before Y" %}
<button _="on click put 'Clicked!' before me">
  Click Me
</button>
{% endexample %}

The `put` command can be used in the following ways:

{% syntaxes %}
`put [[content]] before [[element]]`
	Puts the content in front of the element, using [`Element.before`][].
`put [[content]] at the start of [[element]]`
	Puts the content at the beginning of the element, using [`Element.prepend`][].
`put [[content]] at the end of [[element]]`
	Puts the content at the end of the element, using [`Element.append`][].
`put [[content]] after [[element]]`
	Puts the content after the element, using [`Element.after`][].
{% endsyntaxes %}

[`Element.before`]:  https://developer.mozilla.org/en-US/docs/Web/API/Element/before
[`Element.prepend`]: https://developer.mozilla.org/en-US/docs/Web/API/Element/prepend
[`Element.append`]:  https://developer.mozilla.org/en-US/docs/Web/API/Element/append
[`Element.after`]:   https://developer.mozilla.org/en-US/docs/Web/API/Element/after

This flexibility is why we generally recommend the `put` command when updating content in the DOM.

##### Setting Attributes {#setting-attributes}

One exception to this rule is when setting attributes, which we typically recommend using `set`.

It just reads better to us:

{% example "Setting attributes" %}
<button _="on click set @disabled to 'disabled'">
  Disable Me
</button>
{% endexample %}

`set` is recommended for setting values into normal variables as well.

#### Add, Remove & Toggle {#add-remove-toggle}

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
<button _="on click toggle the *display of the next <p/>">
  Toggle The Next Paragraph
</button>
<p>
  Hyperscript is rad!
</p>
{% endexample %}

##### Removing Content {#removing}

You can also use the [`remove` command](/commands/remove) to remove content from the DOM:

{% example "Remove an element" %}
<button _="on click remove me">
  Remove Me
</button>
{% endexample %}

The remove command is smart enough to figure out what you want to happen based on what you tell it to remove.

#### Showing & Hiding Things {#show-hide}

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
               hide me with *opacity
               wait 2s
               show me with *opacity">
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

We mentioned this above, but as a reminder, you can toggle visibility using the `toggle` command:

{% example "Toggle visibility" %}
<button _="on click toggle the *display of the next <p/>">
  Toggle The Next Paragraph
</button>
<p>
  Hyperscript is rad!
</p>
{% endexample %}

#### Transitions {#transitions}

You can transition a style from one state to another using the [`transition` command](/commands/transition).  This
allows you to animate transitions between different states:

{% example '"transition" command' %}
<button _="on click transition my *font-size to 30px
               then wait 2s
               then transition my *font-size to initial">
  Transition My Font Size
</button>
{% endexample %}

The above example makes use of the special `initial` symbol, which you can use to refer to the initial value of an
elements style when the first transition begins.

##### Class-Based Transitions {#settling}

The `transition` command is blocking: it will wait until the transition completes before the next command executes.

Another common way to trigger transitions is by adding or removing classes or setting styles directly on an element.

However, commands like `add`, `set`, etc. do *not* block on transitions.

If you wish to wait until a transition completes after adding a new class, you should use the [`settle` command](/commands/settle)
which will let any transitions that are triggered by adding or removing a class finish before continuing.

{% example "Wait for transitions/animations to finish" %}
<button style="transition: all 800ms ease-in"
         _="on click add .red then settle then remove .red">
  Flash Red
</button>
{% endexample %}

If the above code did not have the `settle` command, the button would not flash red because the class `.red` would be
added and then removed immediately

This would not allow the 800ms transition to `.red` to complete.

### Measuring Things {#measuring}

Sometimes you want to know the dimensions of an element in the DOM in order to perform some sort of translation or
transition.  Hyperscript has a [`measure` command](/commands/measure) that will give you measurement information
for an element:

{% example "Measure an Element" %}
<button _="on click measure my top then
                    put `My top is ${top}` into the next <output/>">
Click Me To Measure My Top
</button>
<output>--</output>
{% endexample %}

You can also use the pseudo-style literal form `*computed-<style property>` to get the computed (actual) style property
value for an element:

{% example "Get A Styles Computed Value" %}
<button _="on click get my *computed-width
                    put `My width is ${the result}` into the next <output/>">
Click Me To Get My Computed Width
</button>
<output>--</output>
{% endexample %}

## Remote Content {#remote-content}

Hyperscript is primarily designed for front end scripting, local things like toggling a class on a div and so on,
and is designed to pair well with [htmx](https://htmx.org), which uses a hypermedia approach for interacting with
servers.

Broadly, we recommend that approach: you stay firmly within the original REST-ful model of the web, keeping things
simple and consistent, and you can use hyperscript for small bits of front end functionality.  htmx and hyperscript
integrate seamlessly, so any hyperscript you return to htmx will be automatically initialized without any additionl
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

{% example "Going Around The Document" %}
<button _="on click
              go to the top of the body smoothly
              wait 2s
              go to the bottom of me smoothly">
              Take A Trip
</button>
{% endexample %}

You can also use it to navigate to another web page entirely:

{% example "Going Elsewhere" %}
<button _="on click go to url https://htmx.org">
              Go Check Out htmx
</button>
{% endexample %}

## Async Transparency {#async}

One of the most distinctive features of hyperscript is that it is "async transparent".  What that means is that,
for the most part, you, the script writer, do not need to worry about asynchronous behavior.  In the [`fetch`](#fetch)
section, for example, we did not need to use a `.then()` callback or an `await` keyword, as you would need to
in javascript: we simply fetched the data and then inserted it into the DOM.

To make this happen, the hyperscript runtime handles [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) under the covers for you, resolving them internally, so that
asynchronous behavior simply looks linear.

This dramatically simplifies many coding patterns and effectively
[decolors functions](http://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/) (and event handlers) in hyperscript.

Furthermore, this infrastructure allows hyperscript to work extremely effectively with events, allowing for
*event driven* control flow, explained below.

### Waiting {#wait}

In javascript, if you want to wait some amount of time, you can use the venerable `setTimeout()` function:

  ~~~ javascript
  console.log("Start...")
  setTimeout(function(){
    console.log("Finish...")
  }, 1000);
  ~~~

This code will print `"Start"` to the console and then, after a second (1000 milliseconds) it will print `"Finish"`.

To accomplish this in javascript requires a closure, which acts as a callback.  Unfortunately this API is awkward,
containing a lot of syntactic noise and placing crucial information, how long the delay is, at the end.  As this
logic becomes more complex, that delay infomation gets further and further away from where, syntactically, the delay
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

Previously we looked at the `toggle` command.  It turns out that it, to, can work with events:

{% example "Waiting On Events With A Timeout" %}
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
  <button _="on click call async returnsAPromise() put 'I called it...' into the next <output/>">
    Get The Answer...
  </button>
  ~~~

Hyperscript will immediately put the value "I called it..." into the next output element, even if the result
from `returnsAPromise()` has not yet resolved.

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

The worker does not share a namespace with other code, it is in it's own isolated sandbox. However, you may interact
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

Note that you can use the inline js feature discussed next if you want to use javascript in your worker. You might
want to do this if you need better performance on calculations than hyperscript provides, for example.

### Web Sockets {#sockets}

[Web Sockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) allow for two-way communication with
a web server, and are becoming increasingly popular for building web applications. Hyperscript provides a simple way to
create them, as well as a simple [Remote Procedure Call (RPC)](https://en.wikipedia.org/wiki/Remote_procedure_call) mechanism
layered on top of them, by using the [`socket` keyword](/features/sockets).

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

### Inline JS {#js}

Inline javascript may be defined using the [`js` keyword](/features/js). You might do this for performance reasons,
since the hyperscript runtime is more focused on flexibility, rather than performance.

This feature is useful in [workers](#workers), when you want to pass javascript across to the worker's
implementation:

  ~~~ html
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
  ~~~

Note that there is also a way to include [inline javascript](/commands/js)
directly within a hyperscript body, for local optimizations.

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
///_ BEEP! The expression 'the <div.foo/>' evaluates to: ElementCollection {_css: "div.hilight", ...} of type ElementCollection
```

You can see the expressions source, it's value (which you can right click on and assign to a temporary value to work
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

### HDB - The Hyperscript Debugger

An even more sophisticated debugging technique is to use [hdb](/hdb), the Hyperscript Debugger, which allows you to
debug by inserting `breakpoint` commands in your hyperscript.

**Note: The hyperscript debugger is in alpha and, like the rest of the language, is undergoing active development**

To use it you need to include the `lib/hdb.js` file. You can then add `breakpoint` commands in your hyperscript
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

Here is an example that adds a new command, `foo`, that logs `"A Wild Foo Was Found!" if the value of its expression
was "foo":

  ~~~ javascript
  // register for the command keyword "foo"
  _hyperscript.addCommand('foo', function(parser, runtime, tokens) {

    // A foo command  must start with "foo".
    if(!tokens.match('foo')) return

    // Parse an expression.
    const expr = parser.requireElement('expression', tokens);

    return {
      // All expressions needed by the command to execute.
      // These will be evaluated and the result will be passed back to us.
      args: [expr],

      // Implement the logic of the command.
      // Can be synchronous or asynchronous.
      // @param {Context} context The runtime context, contains local variables.
      // @param {*} value The result of evaluating expr.
      async op(context, value) {
        if (value == "foo") {
          console.log("A Wild Foo Was Found!")
        }
        // Return the next command to execute.
        return runtime.findNext(this)
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
allowed for some simple client-side interactions.  One of my goals with htmx was to remove non-core fuctionality
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
