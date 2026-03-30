
## Features {.allcaps}

Features are top-level constructs that define the behavior of an element. Every hyperscript program is made up of one or more features. They handle events, define functions, manage state, and set up reactive bindings.

| name                                  | description                                                           | example                         |
|---------------------------------------|-----------------------------------------------------------------------|---------------------------------|
| [on](/features/on)                    | Creates an event listener                                             | `on click log "clicked!"`                 |
| [def](/features/def)                  | Defines a function                                                    | [see details...](/features/def)           |
| [init](/features/init)                | Initialization logic to be run when the code is first loaded          |                                           |
| [set](/features/set)                  | Defines a new [element-scoped](/docs#names_and_scoping) variable      |                                           |
| [behavior](/features/behavior)        | Define cross-cutting behaviors that are applied to many HTML elements |                                           |
| [install](/features/behavior)         | Install a behavior onto the current element                           | `install Draggable`                       |
| [js](/features/js)                    | Embed JavaScript code at the top level                                | [see details...](/features/js)            |
| [live](/features/live)                | Declare reactive commands that re-run when dependencies change        | `live set $total to ($price * $qty)`      |
| [when](/features/when)                | React to value changes with side effects, async, or events            | `when $x changes ...`                     |
| [bind](/features/bind)                | Two-way sync between values with element auto-detection               | `bind $name to me`                        |

### Extensions

These features are available via extension scripts:

| name                                  | description                                                           | example                         |
|---------------------------------------|-----------------------------------------------------------------------|---------------------------------|
| [eventsource](/features/event-source) | Subscribe to Server Sent Events (SSE)                                 |                                           |
| [socket](/features/socket)            | Create a Web Socket                                                   |                                           |
| [worker](/features/worker)            | Create a Web Worker for asynchronous work                             |                                           |

## Commands {.allcaps}

Commands are the executable statements of hyperscript. They are the actions that run inside features - putting values, adding classes, fetching data, controlling flow, and more. Commands can be chained with `then` and most support an implicit `me` target.

See also [pseudo-commands](/commands/pseudo-commands/).

{% include "commands_table.md" %}

## Expressions {.allcaps}

Expressions are the values and references that commands operate on. They include DOM selectors, property access, comparisons, math, and type conversions. Hyperscript expressions are designed to read naturally and work seamlessly with the DOM.

See [expressions](/expressions) for an overview.

### DOM References

| name                                                                 | description                                        | example                         |
|----------------------------------------------------------------------|----------------------------------------------------|---------------------------------|
| [id reference](/expressions/id-reference)                            | An element ID reference                            | `#main-div`                     |
| [class reference](/expressions/class-reference)                      | A CSS class reference                              | `.active`                       |
| [query reference](/expressions/query-reference)                      | A CSS query selector                               | `<button/>` `<:focused/>`      |
| [attribute reference](/expressions/attribute-ref)                    | An element attribute reference                     | `@selected`                     |
| style reference                                                      | An element style reference                         | `*color` `*computed-fontSize`  |
| [closest expression](/expressions/closest)                           | Find closest ancestor matching a selector          | `closest <div/>`               |
| [relative positional](/expressions/relative-positional/)             | Navigate to relative elements                      | `next <div/> from me`          |
| [positional expressions](/expressions/positional)                    | Get a positional value from a set                  | `first from <div/>`            |

### Property Access

| name                                                                 | description                                        | example                         |
|----------------------------------------------------------------------|----------------------------------------------------|---------------------------------|
| [of expression](/expressions/of)                                     | Get a property of an object                        | `the location of window`       |
| [possessive expressions](/expressions/possessive)                    | Possessive property access                         | `the window's location`        |
| property access                                                      | Dot notation property access                       | `event.target`                 |
| array index                                                          | Bracket notation access                            | `items[0]` `obj['key']`       |
| [cookies symbol](/expressions/cookies)                               | A symbol for accessing cookies                     | `cookies['My-Cookie']`         |

### Operators

| name                                                                 | description                                        | example                                 |
|----------------------------------------------------------------------|----------------------------------------------------|-----------------------------------------|
| math operator                                                        | Arithmetic operators (`mod` replaces `%`)          | `x + 1` `y * 2` `z mod 3`             |
| [comparison operator](/expressions/comparison-operator)              | Comparison and type-checking operators              | `x == "foo"` `I match <:active/>`     |
| [logical operator](/expressions/logical-operator)                    | Logical operators                                  | `x and y` `not z` `a or false`        |
| [no operator](/expressions/no)                                       | Emptiness/existence check                          | `no element.children`                  |
| some operator                                                        | Existence check (inverse of `no`)                  | `some <.results/>`                     |
| [as expression](/expressions/as)                                     | Converts an expression to a new type               | `"10" as Int`                          |
| pipe operator                                                        | Chain conversions left to right                    | `x as Values \| JSONString`            |
| in expression                                                        | Containment check                                  | `"foo" in myArray`                     |
| starts with / ends with                                              | String prefix/suffix check                         | `url starts with "https"`              |
| is between                                                           | Inclusive range check                              | `x is between 1 and 10`               |
| precedes / follows                                                   | DOM document-order check                           | `#a precedes #b`                       |
| ignoring case                                                        | Case-insensitive modifier for comparisons          | `x contains "hi" ignoring case`        |

### Collection Expressions

| name                                                                 | description                                        | example                                 |
|----------------------------------------------------------------------|----------------------------------------------------|-----------------------------------------|
| where                                                                | Filter a collection                                | `items where its active`               |
| sorted by                                                            | Sort a collection                                  | `items sorted by its name descending`  |
| mapped to                                                            | Map/project a collection                           | `items mapped to its id`               |
| split by                                                             | Split a string into an array                       | `"a,b" split by ","`                   |
| joined by                                                            | Join an array into a string                        | `items joined by ", "`                 |

### Literals

| name                                                                 | description                                        | example                                 |
|----------------------------------------------------------------------|----------------------------------------------------|-----------------------------------------|
| [string](/expressions/string)                                        | String literals with template interpolation        | `"Hello ${name}"`                      |
| [time expression](/expressions/time-expression)                      | A time expression                                  | `200ms` `2s`                           |
| CSS units                                                            | Numeric values with CSS unit suffixes              | `10px` `2em` `50%`                     |
| [block literal](/expressions/block-literal)                          | Anonymous functions with an expression body        | `\ x -> x * x`                        |

### Debugging

| name                                                                 | description                                        | example                                 |
|----------------------------------------------------------------------|----------------------------------------------------|-----------------------------------------|
| [beep!](/expressions/beep)                                           | Debug expression that logs and passes through      | `beep! <.foo/>`                        |

## Magic Values {.allcaps}

Magic values are special names that are automatically available in hyperscript contexts. They provide access to the current element, event information, and previous results without explicit declaration.

### Element References

| name                    | description                                                 | example                                         |
|-------------------------|-------------------------------------------------------------|-------------------------------------------------|
| [me](/expressions/me)   | Reference to the current element (aliases: `my`, `I`)       | `put 'clicked' into me`                         |
| [you](/expressions/you) | Reference to a target element set by `tell`                 | `tell <p/> remove yourself`                     |
| body                    | Reference to `document.body`                                | `put "Hello" into body`                         |
| clipboard               | System clipboard (async read, sync write)                   | `put clipboard into me`, `set clipboard to "hi"`|
| selection               | Currently selected text                                     | `put selection into #out`                       |

### Result Values

| name                    | description                                                 | example                                         |
|-------------------------|-------------------------------------------------------------|-------------------------------------------------|
| [it](/expressions/it)   | The result of a previous command (aliases: `its`, `result`) | `fetch /people as json then put it into people` |

### Event Context

These are available inside event handlers (e.g. `on click`):

| name                    | description                                                 | example                                         |
|-------------------------|-------------------------------------------------------------|-------------------------------------------------|
| event                   | The current event object                                    | `log event.type`                                |
| target                  | The target of the current event (`event.target`)            | `add .clicked to target`                        |
| detail                  | The detail of a custom event (`event.detail`)               | `log detail.message`                            |
| sender                  | The element that sent a custom event (`event.detail.sender`)| `log sender.id`                                 |

## Literals {.allcaps}

Literals are inline values in your code. Hyperscript supports the same literal types as JavaScript, so you can write values naturally.

| name                           | description                                                                  | example                        |
|--------------------------------|------------------------------------------------------------------------------|--------------------------------|
| arrays                         | Javascript-style array literals                                              | `[1, 2, 3]`                    |
| booleans                       | Javascript-style booleans                                                    | `true false`                   |
| null                           | Javascript-style null                                                        | `null`                         |
| numbers                        | Javascript-style numbers                                                     | `1`  `3.14`                      |
| objects                        | Javascript-style object literals                                             | `{foo:"bar", doh:42}`          |
| [strings](/expressions/string) | String literals with template interpolation                                  | `"a string"` `'another string'` |

## Events {.allcaps}

Hyperscript dispatches these events during its lifecycle. You can listen for them with standard `addEventListener` or hyperscript's `on` feature.

### Lifecycle

| name                         | description                                                        |
|------------------------------|--------------------------------------------------------------------|
| `hyperscript:ready`          | Triggered on the document after hyperscript has processed the page |
| `load`                       | Triggered on an element with hyperscript on it after it has loaded |
| `hyperscript:before:init`    | Triggered on an element before its hyperscript is initialized      |
| `hyperscript:after:init`     | Triggered on an element after its hyperscript is initialized       |
| `hyperscript:before:cleanup` | Triggered on an element before its hyperscript is cleaned up       |
| `hyperscript:after:cleanup`  | Triggered on an element after its hyperscript is cleaned up        |

### Fetch

| name                  | description                                                        |
|-----------------------|--------------------------------------------------------------------|
| `fetch:beforeRequest` | Triggered before a `fetch` command sends a request                 |
| `fetch:afterResponse` | Triggered after a `fetch` command receives a response              |
| `fetch:afterRequest`  | Triggered after a `fetch` command handles a response               |
| `fetch:error`         | Triggered when a `fetch` command gets an error                     |
| `fetch:abort`         | Triggered when a `fetch` command request is aborted                |

### Errors

| name                         | description                                                        |
|------------------------------|--------------------------------------------------------------------|
| `hyperscript:parse-error`    | Triggered when parse errors are found (detail contains `errors` array) |
| `exception`                  | Triggered when a runtime error occurs (detail contains `error`)    |

### Debugging

| name                  | description                                                        |
|-----------------------|--------------------------------------------------------------------|
| `hyperscript:beep`    | Triggered when a `beep!` command executes                          |
