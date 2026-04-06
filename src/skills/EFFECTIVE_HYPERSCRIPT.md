# Effective _hyperscript

A practical reference for writing _hyperscript — a scripting language for the web designed to be embedded in HTML.

## Core Concepts

_hyperscript code lives in `_` attributes on HTML elements. Each element's script defines **features** (event handlers,
functions, variables) that operate on that element.

```html

<button _="on click add .active to me">Click Me</button>
```

The language reads like English. Prefer natural phrasing over terse syntax.

## Style: Write English, Not Code

### `the` — Semantic Sugar

The word `the` can be inserted almost anywhere for readability. It has no semantic meaning and is ignored by the parser:

```hyperscript
-- These are identical:
set innerHTML of #d1 to "hello"
set the innerHTML of the #d1 to "hello"

get the first <li/> in the <ul/>
get first <li/> in <ul/>
```

Always use `the` when it makes the line read more naturally.

### Property Access: Prefer English Order

_hyperscript offers three ways to access properties. Prefer the most readable form:

**Possessives** — the standard form. Use `'s` for named elements, and `my`, `its`, `your` for the special implicit targets:

```hyperscript
set #output's innerHTML to "done"
get the event's detail
set the closest <div/>'s style to ""

set my innerHTML to "hello"          -- "my" refers to me
put its name into me                 -- "its" refers to it (the result)
log your style.color                 -- "your" refers to you (in tell blocks)
```

**`of` expressions** — an alternative form that is particularly useful when you want to avoid the tight binding of possessives, since `of` binds more loosely:

```hyperscript
-- without "of", you'd need parentheses:
get (the closest <ul/>)'s children

-- with "of", it reads naturally:
get the children of the closest <ul/>
```

**Dot notation** — good for method invocation and acceptable in general, although the other forms are preferred for readability:

```hyperscript
element.classList.add('active')      -- method calls: dot is natural
element.dataset.id                   -- deeply nested access: dot is practical
my.style.color                       -- acceptable but "my style's color" is more hyperscript-y
```

**Guideline:** If you can read the line aloud and it sounds like English, you've picked the right form. `#output's innerHTML` reads better than `#output.innerHTML`. Use `of` when possessives would require parentheses.

## Magic Symbols

| Symbol                    | Meaning                                      |
|---------------------------|----------------------------------------------|
| `me`, `my`, `I`           | The element the script is on                 |
| `it`, `its`, `result`     | Result of the last command                   |
| `you`, `your`, `yourself` | Current target in a `tell` block             |
| `event`                   | The current event object (in `on` handlers)  |
| `target`                  | `event.target`                               |
| `detail`                  | `event.detail`                               |
| `sender`                  | Element that sent a custom event             |
| `body`                    | `document.body`                              |
| `cookies`                 | Cookie jar (get/set/clear)                   |
| `clipboard`               | System clipboard (async read, sync write)    |
| `selection`               | Currently selected text (`window.getSelection().toString()`) |

## Variable Scoping

```hyperscript
set x to 1            -- local to this handler invocation
set $x to 1           -- global (window-level)
set :x to 1           -- element-scoped (persists across handler calls)
set element x to 1    -- same as :x
set global x to 1     -- same as $x
set local x to 1      -- explicitly local
```

Element-scoped variables (`:x`) persist between event handler invocations on the same element. Use them for component
state.

### DOM-Scoped Variables

```hyperscript
set ^x to 1           -- DOM-scoped: walks up the DOM to find/set the variable
```

DOM-scoped variables (`^x`) search up the DOM tree for the nearest element that has that variable defined. They are
used for component state and for sharing state within a section of the page without using globals. Each component
instance gets its own isolated DOM scope via `dom-scope="isolated"`.

```html
<div _="set ^count to 0
        on click increment ^count then put ^count into me">0</div>
```

## Features

### Event Handlers — `on`

```hyperscript
on click ...
on click from #other-element ...
on click from closest <form/> ...
on keyup[key is 'Escape'] ...          -- event filtering
on click(clientX, clientY) ...          -- destructure event properties
on every click ...                      -- allow concurrent handlers
on first click ...                      -- fire only once
on click debounced at 300ms ...
on click throttled at 500ms ...
on click queue all ...                  -- queue: all, first, last (default), none
```

Observers — mutation, intersection, and resize:

```hyperscript
on mutation of @class from #target ...
on mutation of anything ...                 -- watch all changes
on intersection(intersecting) having threshold 0.5 ...
on resize put detail.width into #size ...   -- ResizeObserver, detail has width/height
```

### Function Definitions — `def`

```hyperscript
def greet(name)
  return "Hello, " + name
end

def utils.format(x)              -- namespaced function
  return x as String
end
```

Functions support bare `return` (returns null), `catch` and `finally`:

```hyperscript
def riskyOp()
  if not ready return end         -- early return, no value
  throw "oops"
catch e
  log e
finally
  log "done"
end
```

### Behaviors — `behavior` / `install`

Reusable bundles of features:

```hyperscript
behavior Removable(removeButton)
  on click from removeButton
    remove me
  end
end
```

```html

<div _="install Removable(removeButton: #btn)">
    <button id="btn">X</button>
</div>
```

### Init Blocks — `init`

```hyperscript
init
  add .loaded to me
end

init immediately    -- runs before other features are installed
  set :count to 0
end
```

### Element Variables — `set` (feature level)

```hyperscript
set :count to 0     -- element-scoped, available to all handlers
```

### Inline JavaScript — `js` (feature level)

```hyperscript
js
  function helper() { return 42; }
end
```

Exposed functions become globally available.

## Commands

### Assignment

```hyperscript
set x to 10
set my.style.color to "red"
set #d1's innerHTML to "hello"
set innerHTML of #d1 to "hello"
set @data-value to "foo"
set *color to "red"                     -- style ref
set arr[0] to "first"
set {foo: 1, bar: 2} on myObj          -- bulk property set

default x to 10                         -- only sets if x is null or empty string

put "hello" into me                     -- DOM-aware: clears children, inserts as HTML
put "hello" before me                   -- DOM insertion
put "hello" after me
put "hello" at start of me
put "hello" at end of me
put "hello" into x                      -- if x is an Element, clears and inserts
put "hello" into my.innerHTML           -- property assignment
put null into @foo                      -- removes the attribute
put item at start of myArray            -- unshift
put item at end of myArray              -- push

increment x                             -- +1
increment x by 5
decrement x                             -- -1
decrement x by 3
```

### DOM Manipulation

```hyperscript
add .active                              -- to me (default)
add .active to #target
add .foo .bar to <li/>                   -- multiple classes
add @disabled to me
add {color: red; font-size: 2em} to me  -- inline styles
add .highlight to <li/> when it is not me
add item to myArray                      -- push to array
add item to mySet                        -- add to set

remove .active
remove .active from #target
remove @disabled from me
remove {color; font-size} from me       -- remove CSS properties
remove me                                -- removes the element from DOM
remove item from myArray                 -- find by value and splice
remove item from mySet                   -- set.delete(item)
remove key from myMap                    -- map.delete(key)

toggle .active                           -- on me
toggle .active on #target
toggle .active for 2s                    -- auto-toggles back
toggle .active until mouseout
toggle between .on and .off
toggle between @open="true" and @open="false"
toggle *display                          -- visibility toggle
toggle *opacity of #target

take .active from .tabs for me           -- removes from all .tabs, adds to me

show me                                  -- display: block (or showModal for <dialog>)
show me with *opacity                    -- opacity: 1
show <li/> in #results when its textContent contains my value
show #fallback when the result is empty  -- show fallback if no matches

hide me                                  -- display: none (or close() for <dialog>)
hide me with *visibility                 -- visibility: hidden

focus #input                             -- focus an element
blur #input                              -- unfocus an element
empty #container                         -- remove all children
empty myArray                            -- splice to length 0
empty mySet                              -- set.clear()
select #input                            -- select text in input/textarea

open #modal                              -- dialog: showModal(), details: open, popover: show
close #modal                             -- dialog: close(), details: close, popover: hide
open fullscreen #video                   -- requestFullscreen()
close fullscreen                         -- document.exitFullscreen()
```

### when Clause and Result Pattern

The `when` clause on `add`, `remove`, `show`, and `hide` evaluates a condition per element. After
execution, `the result` contains the array of elements that matched:

```hyperscript
on input
  hide #no-match
  show <li/> in #results when its textContent contains my value ignoring case
  show #no-match when the result is empty
```

This pattern is common for search/filter UIs: show matching elements, then show a fallback if nothing matched.

### Control Flow

```hyperscript
if x > 10
  log "big"
else
  log "small"
end                                      -- `end` is always required for if blocks

repeat for item in items
  put item at end of me
end

repeat 3 times
  log "hello"
end

repeat while x < 10
  increment x
end

repeat until x > 10
  increment x
end

repeat forever
  wait 1s
  log "tick"
  if done break end
end

repeat                                   -- bottom-tested loop
  increment x
until x is 10 end                        -- runs body at least once

for item in items index i                -- with index variable
  log i + ": " + item
end

break                                     -- exit innermost loop
continue                                  -- skip to next iteration

tell #target
  add .active                             -- operates on #target (accessed as `you`)
  set your.innerHTML to "hello"
end
```

### Events

```hyperscript
send myEvent to #target
send myEvent(detail: "hello") to #target
trigger myEvent on #target              -- same as send, uses "on" instead of "to"

wait 2s
wait 500ms
wait for click
wait for click or keyup
wait for click from #btn
wait for transitionend or 5s            -- mix events and timeouts
wait a tick                             -- setTimeout(0)
```

### Execution Control

```hyperscript
call myFunc()                           -- evaluate, store in `it`
get myFunc()                            -- same as call
get x + 1                              -- get works with any expression

return value                            -- return from def, sets result
return                                  -- return null
exit                                    -- return without a value (same as bare return)

halt                                    -- stop event propagation + default, exit handler
halt the event                          -- stop propagation + default, continue execution
halt bubbling                           -- stopPropagation only, exit
halt default                            -- preventDefault only, exit

throw "error message"
```

### Dialogs

```hyperscript
ask "What is your name?"                -- prompt(), result in `it`
put it into #greeting

answer "File saved!"                    -- alert()

answer "Save changes?" with "Yes" or "No"  -- confirm(), result is chosen label
if it is "Yes" ...
```

### Navigation & Scrolling

```hyperscript
go back                                  -- history.back()
go to /page                              -- navigate (naked URL)
go to /page in new window                -- window.open()
go to "#hash"                            -- location.hash
scroll to #element                       -- scrollIntoView
scroll to the top of #element smoothly   -- smooth scroll, top alignment
scroll to the bottom of #element +50px   -- with offset
```

### Animation

```hyperscript
transition my *opacity to 0 over 500ms
transition #el's *width from "100px" to "200px" over 300ms
transition *opacity to 0 *height to 0 over 500ms  -- multiple properties
settle                                   -- wait for CSS transitions to finish
```

### Fetching

```hyperscript
fetch /api/data                          -- GET, naked URL, result in `it`
fetch /api/data as JSON                  -- auto-parse JSON
fetch /api/data as HTML                  -- parse as document fragment
fetch /api/data as Response              -- raw Response object, no auto-throw
fetch /api/data with method: "POST", body: "data"
fetch /api/data with method: "POST", headers: {Authorization: `Bearer ${token}`} as JSON
```

By default, fetch throws on non-2xx status codes. To suppress:

```hyperscript
fetch /api/data as JSON do not throw     -- returns null on error
fetch /api/data as JSON don't throw      -- same thing
```

The `as Response` form never throws — you get the raw Response and handle it yourself.

### Templates & Morphing

The `render` command generates HTML from a `<template>` element with interpolation and control flow:

```html
<template id="user-list">
<ul>
#for user in users
  <li>${user.name} (${user.role})</li>
#else
  <li>No users found</li>
#end
</ul>
</template>
```

```hyperscript
render #user-list with users: userData   -- result is an HTML string in `it`
put it into #container                   -- replace innerHTML
morph #container to it                   -- or morph for DOM-preserving update
```

Template syntax:
- `${expr}` — interpolate a hyperscript expression (HTML-escaped by default)
- `${unescaped expr}` — raw HTML output
- `${expr1 if condition else expr2}` — inline conditional
- `#for item in collection` ... `#else` ... `#end` — loop with optional empty fallback
- `#if condition` ... `#else` ... `#end` — conditional blocks
- `#break`, `#continue` — loop control

The `morph` command updates existing DOM to match new content, preserving focus, scroll position, and event handlers:

```hyperscript
morph #container to newHtml              -- DOM-preserving update
```

### View Transitions

Wrap DOM mutations in a View Transition for animated state changes:

```hyperscript
start a view transition
  put "new content" into #target
end

start a view transition using "slide-left"
  remove #old-panel
  put newPanel after #container
end
```

### Speech

```hyperscript
speak "Hello world"                      -- text-to-speech, waits for completion
speak "Hello" with voice "Samantha"
speak "Fast" with rate 2 with pitch 1.5
```

### Other Commands

```hyperscript
log x                                    -- console.log
log x, y, z                             -- multiple values
log x with myLogger                      -- custom logger

make a URL from "/path"                  -- new URL("/path")
make a <div/>                            -- document.createElement
make a MyClass from (arg1: 1, arg2: 2) called myObj

append "text" to myString               -- string concatenation
append item to myArray                   -- array push
append "<b>bold</b>" to me              -- DOM append

measure me                               -- bounding rect → result
measure #el's width, height              -- specific measurements

pick first 3 of arr                      -- first 3 items
pick last 2 of arr                       -- last 2 items
pick random of arr                       -- random element
pick random 3 of arr                     -- 3 random elements
pick items 2 to 5 of arr                 -- array slice
pick characters 0 to 3 of str            -- substring
pick match of /regex/ of str             -- first regex match
pick matches of /regex/ of str           -- all matches

breakpoint                               -- triggers debugger
beep! expr                               -- logs expression with source info
js(x, y) return x + y; end              -- inline JavaScript with inputs
```

## Expressions

### Literals

```hyperscript
42  3.14  1e10                           -- numbers
"hello"  'hello'                         -- strings
`hello ${name}`                          -- template strings
true  false                              -- booleans
null                                     -- null
[1, 2, 3]                               -- arrays
{foo: "bar", baz: 42}                   -- objects
\ x -> x * 2                            -- lambda/block literal
```

### DOM References

```hyperscript
#myId                                    -- document.getElementById
.myClass                                 -- getElementsByClassName
<div.foo/>                              -- querySelectorAll
<div#bar/>                              -- querySelector by CSS
@name                                    -- attribute on me/you
@name="value"                            -- attribute with value
*color                                   -- style property on me
*computed-color                          -- computed style
```

Template interpolation:

```hyperscript
#${expr}                                 -- dynamic ID
.${expr}                                 -- dynamic class
<div.${expr}/>                          -- dynamic query
```

### Property Access

```hyperscript
obj.prop                                 -- dot notation
obj's prop                               -- possessive
my prop                                  -- my = me's
its prop                                 -- its = it's
your prop                                -- in tell blocks
prop of obj                              -- reversed (natural English)
the innerHTML of the parentNode of #d1   -- chained of-expressions
obj[0]                                   -- array/object indexing
obj[start..end]                          -- slicing (inclusive)
obj[..end]                               -- slice from start
obj[start..]                             -- slice to end
obj@attr                                 -- attribute access on expression
```

### Operators

```hyperscript
-- Math
x + y    x - y    x * y    x / y    x mod y

-- Comparison (all support `ignoring case` postfix for string comparison)
x == y    x != y    x < y    x > y    x <= y    x >= y
x is y    x is not y
x is empty    x is not empty
x exists    x does not exist
x is a String    x is not a Number       -- also works with Element, Node, Error etc.
x matches /regex/    x does not match /regex/
x contains "sub"    x does not contain "sub"
x includes item     x does not include item

-- Case-insensitive comparison
my value contains "search" ignoring case

-- Logical
x and y    x or y    not x

-- Existence
no x                                     -- true if null/empty
some x                                   -- true if not null/empty
```

### Collection Expressions

Postfix expressions that operate on arrays and collections. They chain naturally and use `it`/`its`
to refer to the current element:

```hyperscript
-- Filter
items where its active
items where it > 3
<li/> in #list where it matches .visible

-- Sort
items sorted by its name
items sorted by its age descending

-- Map/Project
items mapped to its name
items mapped to (it * 2)

-- Split/Join
"a,b,c" split by ","
items joined by ", "

-- Chaining
"banana,apple,cherry" split by "," sorted by it joined by ", "
items where its active sorted by its name mapped to its id
```

### Type Conversion

```hyperscript
x as String
x as Int
x as Float
x as Number
x as Date
x as JSON                                -- JSON.parse
x as JSONString                          -- JSON.stringify
x as Object                              -- JSON.parse for strings
x as Array
x as HTML                                -- parse as document fragment
x as Fragment                            -- same
x as Fixed                               -- toFixed()
x as Fixed:2                             -- toFixed(2)
x as Values                              -- form values as object
x as Values | FormEncoded                -- form values as URL-encoded string
x as Values | JSONString                 -- form values as JSON string
x as Set                                 -- iterable to Set (deduplicates)
x as Map                                 -- object to Map
x as Keys                               -- object/Map keys as array
x as Entries                             -- object/Map entries as array
x as Reversed                           -- reversed copy of array
x as Unique                             -- deduplicated array
x as Flat                               -- flatten nested array
```

The pipe operator `|` chains conversions left to right.

### Positional

```hyperscript
first in collection
last in collection
random in collection
first <li/> in #list                     -- first matching child
next <input/> from me                    -- next in DOM order
previous <li/> from me within #list      -- scoped search
next <li/> with wrapping                 -- wraps around
closest <form/>                          -- closest ancestor matching
closest parent <div/>                    -- skip self
closest @data-id                         -- closest with attribute
```

### Time & Units

```hyperscript
100ms    1s    2 seconds    500 milliseconds
10px    2em    50%                        -- CSS unit postfix (returns string)
```

### Cookies

```hyperscript
cookies.name                             -- get cookie
set cookies.name to "value"              -- set cookie
cookies.clear("name")                    -- remove cookie
cookies.clearAll()                       -- remove all
```

## Common Mistakes

**`it` gets overwritten by every command.** Save it to a variable if you need it later:

```hyperscript
-- WRONG: `it` is overwritten by `add`
fetch /api/data as JSON
add .loaded to me
put it into #result              -- `it` is now the result of `add`, not fetch

-- RIGHT: save to a variable
fetch /api/data as JSON
set data to it
add .loaded to me
put data into #result
```

**`set` vs `put` for DOM elements.** `put X into el` clears the element's children and inserts X as HTML. `set el to X`
overwrites the variable. Use `put` for DOM content, `set` for property/variable assignment:

```hyperscript
put "hello" into me              -- clears me, inserts "hello" as HTML
set my.innerHTML to "hello"      -- same effect, but via property assignment
set me to "hello"                -- WRONG: overwrites the `me` variable (no-op)
```

**Local variables don't persist between handler calls.** Use `:x` (element-scoped) for state:

```hyperscript
-- WRONG: count resets to 0 on every click
on click set count to 0 then increment count then put count into me end

-- RIGHT: :count persists across clicks
set :count to 0
on click increment :count then put :count into me end
```

**Promises auto-resolve.** Any command that returns a Promise automatically waits. No `await` keyword exists or is
needed:

```hyperscript
fetch /api/data as JSON          -- automatically waits for response
set x to asyncFunction()         -- automatically waits for promise
```

**`on every` vs `on`.** Plain `on` queues handlers (default: last wins). Use `on every` to allow concurrent executions:

```hyperscript
on click                         -- if clicked again during execution, previous run is dropped
on every click                   -- multiple clicks run concurrently
on click queue all               -- multiple clicks queue up sequentially
on click queue none              -- ignore clicks while handling
```

**`if` blocks always require `end`.** There is no single-line if form:

```hyperscript
-- WRONG: will fail to parse
if x add .active

-- RIGHT: always close with end
if x add .active end
```

**`default` uses nullish+empty check, not truthiness.** `default x to 10` only sets `x` if it is `null`, `undefined`,
or `""`. It preserves `0`, `false`, and other falsy-but-meaningful values:

```hyperscript
set x to 0
default x to 10         -- x stays 0
set x to false
default x to true        -- x stays false
set x to ""
default x to "fallback"  -- x becomes "fallback" (empty string is treated as unset)
```

**`as JSON` is parse-only.** Use `as JSONString` to stringify:

```hyperscript
'{"name":"Alice"}' as JSON       -- parses to object
{name: "Alice"} as JSONString    -- stringifies to '{"name":"Alice"}'
```

## Patterns

### Component State

```html

<div _="
  set :count to 0
  on click
    increment :count
    put :count into me
  end
">0
</div>
```

### Event Delegation

```html

<ul _="on click from <li/>
  take .selected from <li/> for target
end">
    <li>Item 1</li>
    <li>Item 2</li>
</ul>
```

### Async Workflows

```html

<button _="on click
  add @disabled to me
  fetch /api/action as JSON
  put it.message into #result
  remove @disabled from me
">Submit
</button>
```

### Debounced Search with Fallback

```html
<input _="on input debounced at 300ms
  hide #no-match
  show <li/> in #results when its textContent contains my value ignoring case
  show #no-match when the result is empty
"/>
```

### Modal Dialog

```html

<button _="on click open #modal">Open</button>
<dialog id="modal">
  <p>Hello!</p>
  <button _="on click close #modal">Close</button>
</dialog>
```

### Toggle with Cleanup

```html

<div _="on click
  toggle .expanded on #panel
  toggle between @aria-expanded='true' and @aria-expanded='false'
"/>
```

### Error Handling

```html

<script type="text/hyperscript">
    def safeFetch(url)
      fetch url as JSON
      return it
    catch e
      log "fetch failed: " + e
      return null
    end
</script>
```

### Collection Processing

```html

<button _="on click
  set items to <li/> in #list
  set names to items where it matches .active mapped to its textContent
  put names joined by ', ' into #output
">Show Active</button>
```

### Tabs

```html
<div class="tabs">
  <button class="active"
    _="on click take .active from .tab for me then
                put 'Content 1' into #tab-content">Tab 1</button>
  <button
    _="on click take .active from .tab for me then
                put 'Content 2' into #tab-content">Tab 2</button>
</div>
<div id="tab-content">Content 1</div>
```

### Form Validation

```html
<form _="on submit
  if #email's value is empty
    add .error to #email
    halt                                   -- prevent submission
  else
    remove .error from #email
  end
">
  <input id="email" type="email" placeholder="Email" />
  <button type="submit">Submit</button>
</form>
```

### Dark Mode Toggle with Persistence

```html
<button _="on click
  toggle .dark on the body
  if the body matches .dark
    set cookies.theme to 'dark'
  else
    set cookies.theme to 'light'
  end
">Toggle Dark Mode</button>

<body _="init if cookies.theme is 'dark' add .dark to me">
```

### Infinite Scroll

```html
<div id="feed" _="on scroll
  if my scrollTop + my clientHeight >= my scrollHeight - 100
    fetch /api/posts?page=${:page} as HTML
    increment :page
    put it at end of me
  end
  init set :page to 1
"></div>
```

### htmx Integration

```html
<div _="on htmx:afterSwap from body
  add .fade-in to <.new-content/>
  settle
  remove .fade-in from <.new-content/>
">
```

### Accordion

```html
<div class="accordion">
  <button _="on click toggle .open on the next <div/>
             toggle between @aria-expanded='true' and @aria-expanded='false'"
    aria-expanded="false">Section 1</button>
  <div class="panel" style="display:none"
    _="on mutation of @class
         if I match .open show me else hide me end">
    Panel content here.
  </div>
</div>
```

## Reactivity

Hyperscript tracks reads and writes of reactive variables (`$x`, `:x`, `^x`, attributes, and mutating array methods).
Regular local variables (`set x to ...`) are **not** reactive.

### `live` — Reactive DOM Updates

Declares commands that re-run whenever their dependencies change:

```html
<output _="live put 'Count: ' + $count into me">Count: 0</output>
```

Block form for multiple commands:

```hyperscript
live
  set $total to ($price * $qty)
  put '$' + $total into me
end
```

### `when` — React to Changes with Side Effects

Runs commands when a value changes, with access to the new value via `it`:

```hyperscript
when ($price * $qty) changes
  if it > 100 add .expensive to me else remove .expensive from me end
end
```

### `bind` — Two-Way Sync

Keeps two values in sync bidirectionally:

```hyperscript
bind my value to #slider's value        -- sync two inputs
bind .dark to #toggle's checked          -- toggle class from checkbox
bind $name to me                         -- auto-detects input value
```

Keywords `to`, `and`, `with` are interchangeable.

### Reactive Arrays

Hyperscript tracks in-place mutations on arrays (`push`, `pop`, `splice`, `sort`, etc.). A `live` block
reading `^items` will re-run when a mutating method runs on it:

```html
<div _="init set ^items to []">
  <button _="on click call ^items.push(`item ${^items.length + 1}`)">Add</button>
  <ul _="live
           set my innerHTML to ''
           for item in ^items
             append `<li>${item}</li>` to my innerHTML
           end"></ul>
</div>
```

### When to Use Reactivity

Use `live` for derived values and DOM sync. Use `when` for side effects. Use `bind` for form inputs.
For simple cases where you know the exact source of a change, plain `on` event handlers are still the right tool.

## Components (Extension)

Hyper-components define reusable custom elements. Requires `dist/ext/component.js`.

```html
<template hyper-component="click-counter" _="init set ^count to 0">
  <button _="on click increment ^count">+</button>
  <span>Clicks: ${^count}</span>
</template>

<click-counter></click-counter>
<click-counter></click-counter>
```

Each instance gets its own isolated DOM scope. Template expressions (`${}`) re-render reactively
when `^var` dependencies change. Rendering uses morphing to preserve focus and event handlers.

### Attrs Proxy

Components read parent-scope values through the `attrs` proxy:

```html
<template hyper-component="user-card" _="init set ^user to attrs.data">
  <h3>${^user.name}</h3>
</template>

<div _="init set $currentUser to {name: 'Alice'}">
  <user-card data="$currentUser"></user-card>
</div>
```

`attrs.data` parses the attribute value as a hyperscript expression in the parent's scope.

### Slots

```html
<template hyper-component="my-card">
  <div class="card">
    <header><slot name="title"/></header>
    <main><slot/></main>
  </div>
</template>

<my-card>
  <span slot="title">Card Title</span>
  Default slot content here.
</my-card>
```

## Extensions

Load after the core script:

- **component.js** — hyper-components: custom elements with reactive templates and slots
- **template.js** — `render` command for HTML templates with `${}` interpolation
- **hdb.js** — hyperscript debugger (breakpoint UI)
- **socket.js** — WebSocket support with RPC
- **worker.js** — Web Worker support
- **eventsource.js** — Server-Sent Events
- **intercept.js** — service worker DSL for caching and offline support
- **tailwind.js** — Tailwind CSS show/hide strategies

## Syntax That Does Not Exist

LLMs frequently hallucinate JavaScript syntax in hyperscript. **None of the following work:**

| Do NOT write | Write instead |
|---|---|
| `var x = 1` / `let x = 1` / `const x = 1` | `set x to 1` |
| `function foo()` | `def foo()` |
| `(x) => x * 2` | `\ x -> x * 2` |
| `await fetch(...)` | `fetch ...` (async is automatic) |
| `async function` | `def` (all functions are async-transparent) |
| `element.addEventListener("click", ...)` | `on click ...` |
| `===` / `!==` | `is` / `is not` (or `==` / `!=`) |
| `&&` / `\|\|` / `!` | `and` / `or` / `not` |
| `%` | `mod` |
| `x ? y : z` | `if x y else z end` |
| `for (let i = 0; ...)` | `repeat` or `for x in y` |
| `try { } catch { }` | `catch` after commands in a `def` |
| `console.log(x)` | `log x` |
| `document.querySelector(".foo")` | `<.foo/>` |
| `document.getElementById("x")` | `#x` |
| `el.classList.add("active")` | `add .active to el` |
| `el.classList.toggle("active")` | `toggle .active on el` |
| `el.style.color = "red"` | `set el's *color to "red"` |
| `el.setAttribute("disabled", "")` | `add @disabled to el` |
| `el.removeAttribute("disabled")` | `remove @disabled from el` |
| `el.innerHTML = "..."` | `put "..." into el` |
| `/* comment */` | `-- comment` |
| `import` / `require` | Load via `<script>` tag |
| `new MyClass()` | `make a MyClass` |
| `throw new Error("...")` | `throw "..."` |

**Other things that do not exist:**
- No semicolons (use `then` or newlines to separate commands)
- No curly braces for blocks (use `end` to close blocks)
- No `else if` (use `else if ... end`)
- No `switch`/`case` (use chained `if`/`else`)
- No `this` keyword (use `me` for the current element)
- No `null` coalescing `??` (use `default x to value`)
- No `typeof` (use `x is a String`)
- No `Array.map/filter/reduce` (use `mapped to`, `where`, collection expressions)
- No `Promise.all` (use `repeat for` with async commands -- they auto-wait)
- No `setTimeout` (use `wait 1s`)
- No `setInterval` (use `repeat forever wait 1s ... end`)
