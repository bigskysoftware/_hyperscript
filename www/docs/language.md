---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

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

It's worth mentioning that, if you prefer, you can use `script` or `data-script` 
instead of `_` when using hyperscript:

{% example %}
<button script="on click toggle .red on me">
  Click Me
</button>
{% endexample %}

### Comments

Comments in hyperscript start with the `--` characters and a whitespace character (space, tab, carriage return or newline) and go to the end of the line:
  ~~~ hyperscript
  -- this is a comment
  log "Yep, that was a comment"
  ~~~

To ease migrations to hyperscript, `//` and `/* ... */` comments are supported.

### Separators

Multiple commands may be optionally separated with a `then`, which acts like a semi-colon in JavaScript:

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

Many expressions in hyperscript will be familiar to developers and are based on expressions available in JavaScript:

* Number literals - `1.1`
* String literals - `"hello world"`
* Array literals - `[1, 2, 3]`

Others are a bit more exotic and, for example, make it easy to work with the DOM:

* ID References: `#foo`
* Class References: `.tabs`
* Query References: `<div/>`
* Attribute References: `@count`
* Style References: `*width`

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

hyperscript has four different variable scopes: `local`, `element`, `dom`, and `global`.

* Global variables are globally available (and should be used sparingly)
* DOM variables are scoped to the element they are declared on and inherited by all descendant elements
* Element variables are scoped to the element they are declared on, but shared across all features on that element
* Local scoped variables are scoped to the currently executing feature

Note that hyperscript has a flat local scope, similar to JavaScript's `var` statement.

#### Variable Names & Scoping {#names_and_scoping}

In order to make non-locally scoped variables easy to create and recognize in code, hyperscript
supports the following naming conventions:

* If a variable starts with the `$` character, it will default to the global scope
* If a variable starts with the `^` character, it will default to the DOM scope
* If a variable starts with the `:` character, it will default to the element scope

By using these prefixes it is easy to tell differently scoped variables from one another without a lot of additional
syntax:

  ~~~ hyperscript
  set $foo to 10 -- sets a global named $foo
  set ^baz to 30 -- sets a DOM scoped variable named ^baz
  set :bar to 20 -- sets an element scoped variable named :bar
  ~~~

DOM-scoped variables walk up the DOM tree to find the nearest ancestor where the variable is defined.
If the variable doesn't exist yet, it is created on the current element. This makes them ideal for
sharing state within a component subtree without polluting the global scope:

  ~~~ html
  <div class="counter" _="init set ^count to 0">
    <button _="on click increment ^count">+1</button>
    <output _="on click put ^count into me">
  </div>
  ~~~

You can also target a specific element using the `on` clause to read or write a DOM-scoped variable
on that element directly:

  ~~~ hyperscript
  set ^count on closest .counter to 0  -- write to a specific element
  put ^count on closest .counter into me  -- read from a specific element
  ~~~

**Note:** Because `on` is also used to define event handlers, if `^var on <expr>` is the last thing
in a feature block you must use an explicit `end` to avoid ambiguity:

  ~~~ html
  <!-- needs end because ^val on ... is the last expression -->
  <div _="on click set ^val on closest .foo end">

  <!-- no end needed — "to" terminates the on clause -->
  <div _="on click set ^val on closest .foo to 10">
  ~~~

Here is an example of a click handler that uses an element scoped variable to maintain a counter:

{% example %}
<button _="on click increment :x then put it into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

This script also uses the implicit `it` symbol, which we will discuss [below](#zoo).

You can also initialize element-scoped variables at the top level using the [`set` feature](/features/set):

  ~~~ html
  <div _="set :count to 0
          on click increment :count then put :count into me">
  ~~~

#### Scoping Modifiers {#scoping_modifiers}

You may also use scope modifiers to give symbols particular scopes:

* A variable with a `global` prefix is a global
  ~~~ hyperscript
  set global myGlobal to true
  ~~~
* A variable with a `dom` prefix is DOM-scoped (inherited by descendants)
  ~~~ hyperscript
  set dom myDomVar to true
  ~~~
* A variable with an `element` prefix is element-scoped
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

You can remember the `@` sign as the **at**tribute operator.  We will discuss other DOM literals [below](/docs/dom/#dom-literals).

Here is the above example, rewritten to use an attribute rather than an element-scoped variable:

{% example %}
<button _="on click increment @my-attr then put it into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

If you click the above button a few times and then inspect it using your browsers developer tools, you'll note that it
has a `my-attr` attribute on it that holds a string value of the click count.

The [`increment` command](/commands/increment) is discussed [below](#math).

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

Another funny thing you might have noticed is the appearance of `the` in this script.

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
`you` `your` `yourself`
	the current target in a [`tell`](/commands/tell) block
`cookies`
    an [api](/expressions/cookies) to access cookies
`clipboard`
	the system clipboard (reads are async, writes are sync)
`selection`
	the currently selected text (`window.getSelection().toString()`)
{% endsyntaxes %}

Note that the `target` is the element that the event *originally* occurred on.

Event handlers, discussed [below](/docs/events/#event), may be placed on parent elements to take advantage
of [event bubbling](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture)
which can reduce redundancy in code.

Note that JavaScript global symbols such as `window` & `localStorage` are also available.

### Logging To The Console

If you wish to print something to the `console` you can use the [`log` command](/commands/log):

  ~~~ hyperscript
  log "Hello Console!"
  ~~~

Simplicity itself.

#### Objects

Hyperscript is not an object-oriented language: it is, rather, event-oriented.  However it still allows you to work with
objects in an easy and convenient manner, which facilitates interoperability with all the functionality of JavaScript,
including the DOM APIs, JavaScript libraries and so on.

Here is how you can work with objects in hyperscript:

#### Properties

Hyperscript offers a few different ways to access properties of objects.  The first two should be familiar
to JavaScript developers:

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
most cases as being the most "hyperscripty", with the `of` form being chosen when it helps to clarify some code by
putting the final property at the front of the expression.

##### Flat Mapping

Inspired by [jQuery](https://jquery.org), another feature of property access in hyperscript is that, when a property of an
Array-like object is accessed, it will [flat-map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap)
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

You can also use [query literals](/expressions/query-reference), discussed [below](/docs/dom/#dom-literals), to create new HTML content:

  ~~~ hyperscript
  make an <a.navlink/> then put it after me
  ~~~

#### Arrays

Hyperscript arrays work very similarly to JavaScript arrays:

  ~~~ hyperscript
  set myArr to [1, 2, 3]
  log myArr[0]           -- logs "1"
  ~~~

The `+` operator concatenates arrays, producing a new array without mutating the original:

  ~~~ hyperscript
  set a to [1, 2]
  set b to a + [3, 4]    -- b is [1, 2, 3, 4], a is unchanged
  set c to a + 5          -- c is [1, 2, 5]
  ~~~

You can use the `first`, `last` and `random` keywords, discussed [below](/docs/dom/#positional), with arrays:

  ~~~ hyperscript
  set myArr to [1, 2, 3]
  log the first of myArr  -- logs "1"
  log the last of myArr   -- logs "3"
  log random in myArr     -- logs a random element from the array
  ~~~

##### Closures

Hyperscript does not encourage the use of closures or callbacks nearly as much as JavaScript.  Rather, it uses
[async transparency](/docs/network/#async) to handle many of the situations in which JavaScript would use them.

However, there is one area where closures provide a lot of value in hyperscript: data structure manipulation.  The
hyperscript syntax for closures is inspired by [haskell](https://www.haskell.org/), starting with a `\` character,
then the arguments, then an arrow `->`, followed by an expression:

  ~~~ hyperscript
  set strs to ["a", "list", "of", "strings"]
  set lens to strs.map( \ s -> s.length )
  log lens
  ~~~

##### Collection Expressions {#collections}

For many common data manipulation tasks, hyperscript offers postfix collection expressions that read naturally and
avoid the need for closures entirely.  Within these expressions, `it` and `its` refer to the current element:

  ~~~ hyperscript
  set evens to [1, 2, 3, 4, 5] where it mod 2 is 0    -- [2, 4]
  set names to people sorted by its name                -- sort by name
  set ids to items mapped to its id                     -- extract ids
  ~~~

You can split strings into arrays and join arrays into strings:

  ~~~ hyperscript
  set words to "hello world" split by " "               -- ["hello", "world"]
  set csv to ["a", "b", "c"] joined by ", "             -- "a, b, c"
  ~~~

Collection expressions chain naturally:

  ~~~ hyperscript
  set result to "banana,apple,cherry" split by "," sorted by it joined by ", "
  -- result is "apple, banana, cherry"
  ~~~

These can also be used with DOM queries:

  ~~~ hyperscript
  set visible to <li/> in #list where it matches .active
  ~~~

### Control Flow

Conditional control flow in hyperscript is done with the [if command](/commands/if) or the `unless` modifier.  The conditional expression
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

As mentioned in the introduction, `end` is often omitted when it isn't needed in order to make scripts smaller:

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

All commands also support an `unless` modifier to conditionally execute them.
This allows for a very succinct way of expressing branching logic.

  ~~~ html
  <button _="on click set error to functionCouldReturnError()
                log error unless no error">
    Log Result
  </button>
  ~~~

See in the following example how the `.bordered` class is used to alter the behaviour of the second button.

{% example '"unless" modifier' %}
<button _="on click toggle .bordered on #second-button">
  Toggle Next Border
</button>
<button id="second-button"
          _="on click toggle .red unless I match .bordered">
  Toggle My Background
</button>
{% endexample %}

<style>
  .bordered {
    border-width: thick;
    border-color: green;
    border-style: solid;
  }
</style>

#### Comparisons & Logical Operators

In addition to the usual comparison operators from JavaScript, such as `==` and `!=`, hyperscript
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
`[[string]] starts with [[value]]`
	Tests if a string starts with the given value.
`[[string]] ends with [[value]]`
	Tests if a string ends with the given value.
`[[x]] is between [[a]] and [[b]]`
	Tests if a value is between two bounds (inclusive).
`[[element]] precedes [[element]]`
	Tests if an element comes before another in document order.
`[[element]] follows [[element]]`
	Tests if an element comes after another in document order.
{% endsyntaxes %}

You can also append `ignoring case` to any comparison to make it case-insensitive:

  ~~~ hyperscript
  if my value contains "hello" ignoring case
    ...
  end
  ~~~

If the left hand side of the operator is `I`, then `is` can be replaced with `am`:

  ~~~ hyperscript
  get chosenElement()
  if I am the result then remove me end
  ~~~

Using these natural language alternatives allows you to write very readable scripts.

Comparisons can be combined via the `and`, `or` and `not` expressions in the usual manner:

  ~~~ hyperscript
  if I am <:checked/> and the closest <form/> is <:focus/>
    add .highlight to the closest <form/>
  ~~~

Note that `and` and `or` will short circuit in the normal manner:

  ~~~ hyperscript
  if false and foo() -- foo() will not execute
  ~~~

with one important caveat: if the first expression returns a Promise rather than a synchronous value, it will be interpreted
as truthy:

  ~~~ hyperscript
  if returnsPromise() and foo() -- foo() will execute, even if the promise resolves to false
  ~~~

To work around this, you can move the promise-based value out to a separate statement:

  ~~~ hyperscript
  get returnsPromise()
  if the result and foo() -- foo() will not execute if promise resolves to false
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

  -- you can iterate over the properties in a javascript object
  set obj to {foo:1, bar:2}
  for x in obj
    log obj[x]
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
  -- an index clause is any of "index", or "indexed by"
  -- followed by a variable name
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

  -- a bottom-tested loop runs the body at least once
  repeat
    increment x
  until x is 10 end

  ~~~

Loops support the [`break`](/commands/break) and [`continue`](/commands/continue) commands:

  ~~~ hyperscript
  for item in items
    if item is null continue end   -- skip nulls
    if item is "stop" break end    -- exit loop
    log item
  end
  ~~~

You can also use events to signal when a loop ends, see [the async section on loops](/docs/network/#async_loops)

#### Tell Blocks {#tell}

The [`tell`](/commands/tell) command lets you address a different element for a series of commands.  Within a `tell`
block, the symbols `you`, `your` and `yourself` refer to the target element, rather than having to repeat it:

  ~~~ hyperscript
  tell <button/> in me
    add @disabled
    set your.title to "Please wait..."
  end
  ~~~

This is equivalent to:

  ~~~ hyperscript
  add @disabled to <button/> in me
  set (<button/> in me)'s title to "Please wait..."
  ~~~

The `tell` command is particularly useful when you need to perform several operations on the same element.

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

The `+` operator also works with arrays, producing a new concatenated array (see [Arrays](#arrays)).

The modulo operator uses the keyword `mod`:
  ~~~ hyperscript
  set x to 10 mod 3
  ~~~ 

Hyperscript does not have a notion of mathematical operator precedence.  Instead, math operators must be fully
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
  log x -- prints 2 to the console
  ~~~

A nice thing about the `increment` and `decrement` commands is that they will automatically handle string to number
conversions and, therefore, can be used with numbers stored in attributes on the DOM:

  ~~~ hyperscript
  on click
     increment @data-counter
     if @data-counter as Int is greater than 4
       add @disabled -- disable after the 5th click
  ~~~

The [`swap`](/commands/swap) command exchanges the values of any two assignable expressions — variables,
properties, or array elements:

  ~~~ hyperscript
  swap x with y
  swap arr[0] with arr[2]
  ~~~

### Strings {#strings}

Hyperscript supports strings that use either a single quotes or double quotes:

  ~~~ hyperscript
  set hello to 'hello'
  set world to "world"
  set helloWorld to hello + " " + world
  ~~~

and also supports JavaScript style template strings:

  ~~~ hyperscript
  set helloWorld to `${hello} ${world}`
  ~~~

The [`append`](/commands/append) command can append content to strings (as well as to arrays and the DOM):

  ~~~ hyperscript
    get "hello"      -- set result to "hello"
    append " world"  -- append " world" to the result
    log it           -- log it to the console
  ~~~

The [`pick`](/commands/pick) command selects items from arrays, strings, and regex match results:

  ~~~ hyperscript
  pick first 3 of arr        -- first 3 elements
  pick random of arr          -- random element
  pick match of "(\w+)" of str -- regex match
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
* `Boolean` - convert to boolean
* `Date` - convert to Date
* `Float` - convert to float
* `FormEncoded` - convert to a URL-encoded query string
* `Fragment` - converts a string into an HTML Fragment
* `HTML` - converts NodeLists and arrays to an HTML string
* `Int` - convert to integer
* `JSON` - parse a JSON string into an object
* `JSONString` - convert to a JSON string
* `Number` - convert to number
* `Object` - convert from a JSON string (or shallow copy an object)
* `String` - convert to String
* `Values` - converts a Form (or other element) into a struct containing its input names/values
* `Fixed:N` - convert to a fixed precision string representation of the number, with an optional precision of `N`

You can chain conversions using the pipe operator:

  ~~~ hyperscript
  get <form/> as Values | JSONString  -- form values as a JSON string
  ~~~

You can also [add your own conversions](/expressions/as) to the language as well.

You can assert that a value is of a given type using the postfix `:Type` syntax. This passes the value through
unchanged, but throws if the type check fails. Add `!` to reject `null`:

  ~~~ hyperscript
  set name to getName():String   -- passes through if String, throws otherwise
  set el to getEl():Element!     -- also throws if null
  ~~~

### Calling Functions {#calling-functions}

There are many ways to invoke functions in hyperscript.  Two commands let you invoke a function and automatically
assign the result to the `result` variable: [`call` and `get`](/commands/call):

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

Finally, you can use the [`pseudo-command`](/commands/pseudo-commands) syntax, which allows you to put the method
name first on the line in a method call, to improve readability in some cases:

  ~~~ hyperscript
  reload() the location of the window
  writeText('evil') into the navigator's clipboard
  reset() the #contact-form
  ~~~

These are called "pseudo-commands" because this syntax makes method calls look like a normal command in hyperscript.

<div class="docs-page-nav">
<a href="/docs/getting-started/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Getting Started</strong></a>
<a href="/docs/events/" class="next"><strong>Events</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
