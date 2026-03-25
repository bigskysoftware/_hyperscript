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

| Symbol                    | Meaning                                     |
|---------------------------|---------------------------------------------|
| `me`, `my`, `I`           | The element the script is on                |
| `it`, `its`, `result`     | Result of the last command                  |
| `you`, `your`, `yourself` | Current target in a `tell` block            |
| `event`                   | The current event object (in `on` handlers) |
| `target`                  | `event.target`                              |
| `detail`                  | `event.detail`                              |
| `sender`                  | Element that sent a custom event            |
| `body`                    | `document.body`                             |

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

## Features

### Event Handlers — `on`

```hyperscript
on click ...
on click from #other-element ...
on click from closest <form/> ...
on keyup[key is 'Escape'] ...          -- event filtering
on click(clientX, clientY) ...          -- destructure event properties
on every click ...                      -- allow concurrent handlers
on click debounced at 300ms ...
on click throttled at 500ms ...
on click queue all ...                  -- queue: all, first, last (default), none
```

Mutation and intersection observers:

```hyperscript
on mutation of @class from #target ...
on intersection(intersecting) having threshold 0.5 ...
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

Functions support `catch` and `finally`:

```hyperscript
def riskyOp()
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

default x to 10                         -- only sets if x is falsy

put "hello" into me                     -- DOM-aware: clears children, inserts as HTML
put "hello" before me                   -- DOM insertion
put "hello" after me
put "hello" at start of me
put "hello" at end of me
put "hello" into x                      -- if x is an Element, clears and inserts
put "hello" into my.innerHTML           -- property assignment

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

remove .active
remove .active from #target
remove @disabled from me
remove me                                -- removes the element from DOM

toggle .active                           -- on me
toggle .active on #target
toggle .active for 2s                    -- auto-toggles back
toggle .active until mouseout
toggle between .on and .off
toggle between @open="true" and @open="false"
toggle *display                          -- visibility toggle
toggle *opacity of #target

take .active from .tabs for me           -- removes from all .tabs, adds to me

show me                                  -- display: block
show me with *opacity                    -- opacity: 1
hide me                                  -- display: none
hide me with *visibility                 -- visibility: hidden
```

### Control Flow

```hyperscript
if x > 10
  log "big"
else
  log "small"
end

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

for item in items index i          -- with index variable
  log i + ": " + item
end

break                               -- exit innermost loop
continue                            -- skip to next iteration

tell #target
  add .active                       -- operates on #target (accessed as `you`)
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
exit                                    -- return without a value

halt                                    -- stop event propagation + default, exit handler
halt the event                          -- stop propagation + default, continue execution
halt bubbling                           -- stopPropagation only, exit
halt default                            -- preventDefault only, exit

throw "error message"
```

### Navigation & Scrolling

```hyperscript
go back                                 -- history.back()
go to url "/page"                       -- navigate
go to url "/page" in new window         -- window.open()
go to #element                          -- scrollIntoView
go to the top of #element smoothly      -- smooth scroll, top alignment
go to the bottom of #element +50px      -- with offset
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
fetch /api/data                          -- GET, result in `it`
fetch /api/data as json                  -- auto-parse JSON
fetch /api/data as html                  -- parse as document fragment
fetch /api/data with method: "POST", body: "data"
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

pick match of /regex/ from str           -- first regex match
pick matches of /regex/g from str        -- all matches
pick items 2 to 5 from arr              -- array slice
pick characters 0 to 3 from str         -- substring

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

-- Comparison
x == y    x != y    x < y    x > y    x <= y    x >= y
x is y    x is not y
x is empty    x is not empty
x exists    x does not exist
x is a String    x is not a Number
x matches /regex/    x does not match /regex/
x contains "sub"    x does not contain "sub"
x includes item     x does not include item

-- Logical
x and y    x or y    not x

-- Existence
no x                                     -- true if null/empty
some x                                   -- true if not null/empty
```

### Type Conversion

```hyperscript
x as String
x as Int
x as Float
x as Number
x as Date
x as JSON
x as Object                              -- JSON.parse
x as Array
x as HTML                                -- parse as document fragment
x as Fragment                            -- same
x as Fixed                               -- toFixed()
x as Fixed:2                             -- toFixed(2)
x as Values                              -- form values as object
x as Values:Form                         -- as FormData
x as Values:JSON                         -- as JSON string
```

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
fetch /api/data as json
add .loaded to me
put it into #result              -- `it` is now the result of `add`, not fetch

-- RIGHT: save to a variable
fetch /api/data as json
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
fetch /api/data as json          -- automatically waits for response
set x to asyncFunction()         -- automatically waits for promise
```

**`on every` vs `on`.** Plain `on` queues handlers (default: last wins). Use `on every` to allow concurrent executions:

```hyperscript
on click                         -- if clicked again during execution, previous run is dropped
on every click                   -- multiple clicks run concurrently
on click queue all               -- multiple clicks queue up sequentially
on click queue none              -- ignore clicks while handling
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
  fetch /api/action as json
  put it.message into #result
  remove @disabled from me
">Submit
</button>
```

### Debounced Search

```html
<input _="on keyup debounced at 300ms
  fetch `/api/search?q=${my.value}` as json
  put it as HTML into #results
"/>
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
      fetch url as json
      return it
    catch e
      log "fetch failed: " + e
      return null
    end
</script>
```

## Extensions

Load after the core script:

- **template.js** — `render` command for HTML templates with `${}` interpolation
- **hdb.js** — hyperscript debugger (breakpoint UI)
- **socket.js** — WebSocket support with RPC
- **worker.js** — Web Worker support
- **eventsource.js** — Server-Sent Events
- **tailwind.js** — Tailwind CSS show/hide strategies
