---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Language Basics {#basics}

Hyperscript scripts contain the following elements:

* ["features"](/reference#features), which are top level elements
* ["commands"](/reference#commands), which are often called statements in other languages. Features typically include
  commands.
* Finally, commands typically contain ["expressions"](/reference#expressions).

Taking this example:

  ~~~ html
  <button _="on click toggle .red on me">
    Click Me
  </button>
  ~~~

* `on click` is a feature, an [event handler](/features/on)
* [`toggle`](/commands/toggle) is a command
* `.red` and `me` are expressions that are part of the `toggle` command

All hyperscript scripts are made up of these basic building blocks.

### Comments

Comments in hyperscript start with the `--` characters and a whitespace character (space, tab, carriage return or
newline) and go to the end of the line:

  ~~~ hyperscript
  -- this is a comment
  log "Yep, that was a comment"
  ~~~

### Separators

In hyperscript multiple commands can be separated with a `then`, which acts like a semi-colon in JavaScript:

  ~~~ hyperscript
  log "Hello" then log "World"
  ~~~

Using the `then` keyword is recommended when multiple commands are on the same line.

When commands have bodies that include other commands, such as with the [`if`](/commands/if)
command, the series of commands are terminated by an `end`:

  ~~~ hyperscript
  if x > 10  -- start of the conditional block
    log "Greater than 10"
  end        -- end of the conditional block
  ~~~

Features are similarly terminated by an `end`:

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
* Or another feature starts:
  ~~~ html
  <button _="on click if true log 'Clicked!'
             on mouseenter log 'Mouse entered!' -- ">
  Click Me
  </button>
  ~~~

The hyperscript-y way to do things is to use `end` only when necessary, in order to keep scripts small and neat.

### Expressions

Many expressions in hyperscript will be familiar to developers:

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

In hyperscript, variables are created with the [`set`](/commands/set) command (covered
in more detail [below](#values)):

  ~~~ hyperscript
  set x to 10
  ~~~

Here is an example that creates a local variable and then logs it to the console:

{% example "Local variable" %}
<button _="on click set x to 42 then log x">
  Click Me
</button>
{% endexample %}

If you click this button and open up the console, you should see `42` being logged to it.

#### Scoping {#scoping}

hyperscript has four different variable scopes: `local`, `element`, `dom`, and `global`.

* Global variables are globally available (and should be used sparingly)
* DOM variables are scoped to the element they are declared on and inherited by all descendant elements
* Element variables are scoped only to the element they are declared on, but shared across all features on that element
* Local scoped variables are scoped to the currently executing feature

Note that local scoped variables are scoped to the enclosing feature, similar to JavaScript's `var` statement.

#### Variable Names & Scoping {#names_and_scoping}

In order to make non-locally scoped variables easy to create and recognize in code, hyperscript
supports the following naming conventions:

* If a variable starts with the `$` character, it will be globally scoped
* If a variable starts with the `^` character, it will be DOM scoped
* If a variable starts with the `:` character, it will be element scoped

By using these prefixes it is easy to tell differently scoped variables from one another without a lot of additional
syntax:

  ~~~ hyperscript
  set $foo to 10 -- sets a global named $foo
  set ^baz to 30 -- sets a DOM scoped variable named ^baz
  set :bar to 20 -- sets an element scoped variable named :bar
  ~~~

DOM-scoped variables walk up the DOM tree to find the nearest ancestor where the variable is defined.
If the variable doesn't exist yet, it is created on the current element.

This makes DOM-scoped variables ideal for sharing state within a DOM subtree without polluting the global scope:

  ~~~ html
  <div class="counter" _="init set ^count to 0">
    <button _="on click increment ^count">+1</button>
    <output _="on click put ^count into me"></output>
  </div>
  ~~~

With DOM-scoped variables you can target a specific element to resolve the variable from using the `on` clause:

  ~~~ hyperscript
  set ^count on closest .counter to 0  -- write to a specific element
  put ^count on closest .counter into me  -- read from a specific element
  ~~~

You can control DOM-scope lookup with the `dom-scope` attribute on any element:

| Value | Behavior |
|-------|----------|
| `isolated` | Stops lookup at this element. `^var` references inside do not see outer variables, and inside writes do not leak out. This is how [components](/docs/components/) keep state private. |
| `closest <selector>` | Resumes lookup at the nearest ancestor matching `<selector>` (skipping everything between). |
| `parent of <selector>` | Resumes lookup at the *parent* of the nearest ancestor matching `<selector>`. |

Here is an example of a click handler that uses an element scoped variable to maintain a counter,
shared between a [`set`](/features/set) feature and an event listener:

{% example %}
<button _="set :x to 0
           on click increment :x then put it into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

This script also uses the implicit `it` symbol, which we will discuss [below](#zoo).

#### Scoping Modifiers {#scoping_modifiers}

You may also use scope modifiers to give symbols particular scopes: `global`, `dom`, `element` and
`local`. These are rarely used but are sometimes necessary if you don't want to follow the normal
naming convention:

~~~ hyperscript
set global x to true
~~~

#### DOM Attributes

In addition to variables, another common way to store data is to put it directly in the DOM, in an attribute of an
element.

You can access attributes on an element with the [attribute literal](/expressions/attribute-ref) syntax, using an `@` prefix:

  ~~~ hyperscript
  set @my-attr to 10
  ~~~

This will store the value 10 in the attribute `my-attr` on the current element:

  ~~~ html
  <div my-attr="10"></div>
  ~~~

Note that, unlike regular variables, attributes can only store strings. Anything you store in them will be
converted to a string.

Attribute literals are one of many of [DOM literals](/docs/dom/#dom-literals) hyperscript supports, and which
make writing hyperscript so much fun.

Here is the increment example above, rewritten to use an attribute rather than an element-scoped variable:

{% example %}
<button data-count="0"
        _="on click increment @data-count then put it into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

If you click the above button a few times and then inspect it using your browsers developer tools, you'll note that it
has a `data-count` attribute on it that holds a string value of the click count.

#### Special Names & Symbols

One of the interesting aspects of hyperscript is its use of implicit names for things, often with multiple ways
to refer to the same thing.

This might sound crazy, and it kind of is, but it helps to make scripts much more readable!

We have already seen the use of the `it` symbol above, to put the result of an `increment` command into an
element.

It turns out that `it` is an alias for `result`, which we could have used instead:

{% example "It" %}
<button _="set :x to 0
           on click increment :x then put result into the next <output/>">
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
<button _="set :x to 0
           on click increment :x then put the result into the next <output/>">
  Click Me
</button>
<output>--</output>
{% endexample %}

This is exactly equivalent to the previous example and is maybe a little more verbose, but it reads better.

Hyperscript is all about readability!

In this case, we'd probably stick with `it`.

#### The Hyperscript Zoo {#zoo}

In addition to `result` and `it`, hyperscript has a number of other symbols that are automatically available, depending
on the context, that make your scripting life more convenient.

Here is a table of available symbols:

| Name                      | Meaning                                                            |
|---------------------------|--------------------------------------------------------------------|
| `result`, `it`, `its`     | the result of the last command, if any (e.g. a `call` or `fetch`)  |
| `me`, `my`, `I`           | the element that the current event handler is running on           |
| `event`                   | the event that triggered the current handler, if any               |
| `body`                    | the body of the current document, if any                           |
| `target`                  | the target of the current event, if any                            |
| `detail`                  | the detail of the event that triggered the current handler, if any |
| `sender`                  | the element that sent the current event, if any                    |
| `you`, `your`, `yourself` | the current target in a [`tell`](/commands/tell) block             |
| `cookies`                 | an [api](/expressions/cookies) to access cookies                   |
| `clipboard`               | the system clipboard (reads are async, writes are sync)            |
| `selection`               | the currently selected text (`window.getSelection().toString()`)   |

Note that the `target` is the element that the event *originally* occurred on.

Note that JavaScript global symbols such as `window` & `localStorage` are also available.

### Logging To The Console

If you wish to print something to the `console` you can use the [`log` command](/commands/log):

~~~ hyperscript
log "Hello Console!"
~~~

### Setting & Getting Values {#values}

Hyperscript has four commands for moving values around: `set`, `put`, `get`, and `swap`, each covering 
different use cases.

#### Set

The [`set`](/commands/set) command assigns a value to a variable, property, or attribute.

It is the main mechanism for setting variables:

  ~~~ hyperscript
  set x to 10                          -- a local variable
  set $total to price * qty            -- a global variable
  set :count to 0                      -- an element-scoped variable
  set my innerHTML to "Hello!"         -- a property on the current element
  set @data-id to 42                   -- an attribute on the current element
  set the first .item's textContent to "first" -- a property on a found element
  ~~~

With `set` the destination is the first part: `set this to that`.

#### Put

The [`put`](/commands/put) command is similar to `set` but flips the source and destination.

`put` supports positional modifiers and is designed mainly for updating DOM content:

  ~~~ hyperscript
  put "clicked" into me                -- replaces content (like innerHTML)
  put response into #container         -- same, but into another element
  put newItem at end of #list          -- append as a child
  put " done" at end of me             -- append as text/content
  ~~~

`put` can be used for local variables as well, but this is discouraged in general unless it dramatically
clarifies the code.  Typically you will use `set` for variables, and `put` for DOM addition.

#### Get

The [`get`](/commands/get) command evaluates an expression and stashes the result in `it` (and `result`). 

This is useful when you want to compute something and then refer to it in the next command:

  ~~~ hyperscript
  get the closest <form/>
  log it                               -- the form element
  send submit to it
  ~~~

Many commands set `it` automatically (for example, `fetch` and `increment`), so you
typically do not need to use `get` explicitly.

#### Swap

The [`swap`](/commands/swap) command exchanges two values:

  ~~~ hyperscript
  swap x with y                        -- swap variables
  swap my textContent with #other's textContent -- swap element text
  swap #a with #b                      -- swap two DOM elements in place
  ~~~

#### Default

The [`default`](/commands/default) command sets a variable only if it is currently null, undefined, or empty:

  ~~~ hyperscript
  default x to 10       -- only sets x if it has no value
  default @count to 0   -- works with attributes too
  ~~~

### Objects

Hyperscript allows you to declare JavaScript-style plain objects:

~~~ hyperscript
  set x to {name : "Joe", age: 35}    -- create an object with some properties
~~~

It does not have support for classes within the language.

### Properties

Hyperscript offers a few different ways to access properties of objects, both plain and DOM elements.

The first two should be familiar to JavaScript developers:

  ~~~ hyperscript
  set x to {name : "Joe", age: 35}    -- create an object with some properties
  log x.name                          -- standard "dot" notation
  log x['name']                       -- standard array-index notation
  ~~~

Beyond this, hyperscript has a [possessive expression](/expressions/possessive) that uses the standard english `'s`
to express a property access:

  ~~~ hyperscript
  set x to {name : "Joe", age: 35}    -- create an object with some properties
  log x's name                        -- access the name property using a possessive
  ~~~

There are two special cases for the possessive expression: the symbols `my` and `its`, both of which
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

The `of` operator flips the order of the property & the element that the property is on.  This is particularly useful
when the binding of a `.` operator or possessive would require parenthesizing:

~~~hyperscript
  -- with a compound target expression, `.` or possessive need parens:                                      
  set v to (the first <input/> in #form).value                                                              
  set v to (the first <input/> in #form)'s value                                                            
                                                                                                            
  -- `of` reads left-to-right, no parens needed:                                                            
  set v to the value of the first <input/> in #form
~~~

Which of these options you choose for property access is up to you. 

We recommend the possessive form in most cases as being the most "hyperscripty", with the `of` form being chosen when it
helps to clarify or clean up code.

#### Flat Mapping

Inspired by [jQuery](https://jquery.org), another feature of property access in hyperscript is that, when a property of
an Array-like object is accessed, it will [flat-map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap)
the results to a single, linear array of that property applied to all values within the array.

  ~~~ hyperscript
  set allDivs to <div/>                      -- get all divs
  set allParents to the parent of allDivs    -- get all parents of those divs as a single, flat array
  set allChildren to the children of allDivs -- get all children of those divs as a single, flat array
  ~~~

On an array, only the `length` property will not perform a flat map in this manner.

#### Null Safety

Finally, all property accesses in hyperscript are null safe: if the object that the property is being accessed on
is null then the result of the property access will be null as well, without a need to null-check:

  ~~~ hyperscript
  set example to null
  log example.prop     -- logs null, because `example` is null
  ~~~

### Creating New Objects

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

You can also use [query literals](/expressions/query-reference), discussed [later](/docs/dom/#dom-literals), to create
new HTML content:

  ~~~ hyperscript
  make an <a.navlink/> then put it after me
  ~~~

### Arrays

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

#### Array Comprehension Expressions {#comprehensions}

For many common data manipulation tasks, hyperscript offers postfix array comprehension expressions.

Within these expressions, the `it` and `its` symbols refer to the elements in the array:

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

Comprehension expressions chain naturally:

  ~~~ hyperscript
  set result to "banana,apple,cherry" split by "," 
     sorted by it 
     joined by ", "
  -- result is "apple, banana, cherry"
  ~~~

These can also be used with DOM queries:

  ~~~ hyperscript
  set visible to <li/> in #list where it matches .active
  ~~~

#### Closures

Hyperscript does not encourage the use of closures or callbacks nearly as much as JavaScript. 

Features like array comprehensions and [async transparency](/docs/async/) handle many of the situations in which
JavaScript would use them.

However, there are situations when a closure is required.

In hyperscript a closure is `\` character, then the arguments, then an arrow `->`, followed by an expression:

~~~ hyperscript
set strs to ["a", "list", "of", "strings"]
set lens to strs.map( \ s -> s.length )
log lens
~~~

### Control Flow

Conditional control flow in hyperscript is done with the [if command](/commands/if) or the `unless` modifier. 

The conditional expression in an if statement is not parenthesized. 

The else branch can use either the `else` keyword or the `otherwise` keyword.

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

All commands also support an `unless` modifier to conditionally execute a single command, placing it 
immediately *after* the command you wish to execute conditionally:

  ~~~ html
  <button _="on click set error to functionCouldReturnError()
                log error unless no error">
    Log Result
  </button>
  ~~~

It is strongly recommended that unless clauses be placed on the same line as the command they are modifying
and that they consist of simple expressions.

#### Comparisons & Logical Operators

In addition to the usual comparison operators from JavaScript, such as `==` and `!=`, hyperscript
supports [a rich set of natural language style comparisons](/expressions/comparison-operator) for use in `if` commands:

A small sampling is shown below:

| Syntax | Meaning |
|--------|---------|
| {% syntax "[[a]] is [[b]]" %} | Same as {% syntax "[[a]] == [[b]]" %} |
| {% syntax "[[a]] is not [[b]]" %} | Same as {% syntax "[[a]] != [[b]]" %} |
| {% syntax "no [[a]]" %} | Same as {% syntax "[[a]] == null or [[a]] == undefined or [[a.length]] == 0" %} |
| {% syntax "[[element]] matches [[selector]]" %} | Does a CSS test, e.g. `if I match .selected` |
| {% syntax "[[a]] exists" %} | Same as {% syntax "not (no [[a]])" %} |
| {% syntax "[[x]] is greater than [[y]]" %} | Same as `>` |
| {% syntax "[[x]] is less than [[y]]" %} | Same as `<` |
| {% syntax "[[collection]] is empty" %} | Tests if a collection is empty |
| {% syntax "[[string]] starts with [[value]]" %} | Tests if a string starts with the given value |
| {% syntax "[[string]] ends with [[value]]" %} | Tests if a string ends with the given value |
| {% syntax "[[x]] is between [[a]] and [[b]]" %} | Tests if a value is between two bounds (inclusive) |
| {% syntax "[[element]] precedes [[element]]" %} | Tests if an element comes before another in document order |
| {% syntax "[[element]] follows [[element]]" %} | Tests if an element comes after another in document order |

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

#### Loops {#loops}

The [repeat command](/commands/repeat) is the looping mechanism in hyperscript.

It supports a large number of variants, including a shorthand `for` version:

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

Loops support an `else` clause that will be executed if no elements are in an iterable object or the object is null:

  ~~~ hyperscript
  for item in items
    log item
  else
    log "No items found!"
  end
  ~~~


Repeat loops support [`break`](/commands/break) and [`continue`](/commands/continue):

  ~~~ hyperscript
  for item in items
    if item is null continue end   -- skip nulls
    if item is "stop" break end    -- exit loop
    log item
  end
  ~~~

You can also use DOM events to signal when a loop ends, see [the async section on loops](/docs/async/#async_loops)

#### Tell Blocks {#tell}

The [`tell`](/commands/tell) command lets you address a different element for a series of commands. Within a `tell`
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

Note that loops are often _not_ required in hyperscript. 

Many commands will automatically deal with arrays and collections for you.

For example, if you want to add the class `.foo` to all elements that have the class `.bar` on it, you can simply
write this:

  ~~~ hyperscript
  add .foo to .bar
  ~~~

The [`add`](/commands/add) command will take care of looping over all elements with the class `.bar`.

There is no need to loop explicitly.

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

Hyperscript does not have a notion of mathematical operator precedence. Instead, math operators must be fully
parenthesized when used in combination with other math operators:

  ~~~ hyperscript
  set x to 10
  set y to 20
  set sumOfSquares to (x * x) + (y * y)
  ~~~

If you did not fully parenthesize this expression it would be a parse error.

This clarifies any mathematical logic you are doing and encourages simpler expressions, which, again helps
readability.

Hyperscript also offers an [`increment`](/commands/increment) and [`decrement`](/commands/decrement) command for
modifying numbers:

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

The [`pick`](/commands/pick) command selects items from strings, regex match results & arrays:

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

Here we get the input value, which is a String, and we convert it to an Integer. Note that we need to use parenthesis
to ensure that the `as` expression does not bind too tightly.

We then increment the number and put it into the next `output` element.

Out of the box hyperscript offers a number of useful conversions:

| Conversion    | Description                                                                               |
|---------------|-------------------------------------------------------------------------------------------|
| `Array`       | convert to Array                                                                          |
| `Boolean`     | convert to boolean                                                                        |
| `Date`        | convert to Date                                                                           |
| `Float`       | convert to float                                                                          |
| `FormEncoded` | convert to a URL-encoded query string                                                     |
| `Fragment`    | converts a string into an HTML Fragment                                                   |
| `HTML`        | converts NodeLists and arrays to an HTML string                                           |
| `Int`         | convert to integer                                                                        |
| `JSON`        | parse a JSON string into an object                                                        |
| `JSONString`  | convert to a JSON string                                                                  |
| `Number`      | convert to number                                                                         |
| `Object`      | convert from a JSON string (or shallow copy an object)                                    |
| `String`      | convert to String                                                                         |
| `Values`      | converts a Form (or other element) into a struct containing its input names/values        |
| `Fixed:N`     | convert to a fixed precision string representation, with an optional precision of `N`     |

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

Functions can be invoked in the normal manner in hyperscript:

~~~ hyperscript
    log "Getting the selection"                                                                               
    document.getSelection()
    log "Got the selection", the result 
~~~

You can also prefix function calls with the `call` or `get` commands for readability:

  ~~~ hyperscript
  call alert('hello world!')
  get document.getSelection() then log it -- using the 'it' alias for 'result`
  ~~~

Finally, hyperscript supports a [`pseudo-command`](/commands/pseudo-commands) syntax, which allows you to put the method
name _before_ the object it is invoked on.

This improves readability in some cases:

  ~~~ hyperscript
  reload() the location of the window
  reset() the #contact-form
  ~~~

These are called "pseudo-commands" because this syntax makes method calls look like a regular command in hyperscript.

<div class="docs-page-nav">
<a href="/docs/getting-started/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Getting Started</strong></a>
<a href="/docs/events/" class="next"><strong>Events & Functions</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
