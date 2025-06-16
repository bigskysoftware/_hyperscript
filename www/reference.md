
## Features

| name                                  | description                                                           | example                         |
|---------------------------------------|-----------------------------------------------------------------------|---------------------------------|
| [behavior](/features/behavior)        | Define cross-cutting behaviors that are applied to many HTML elements |                                 |
| [def](/features/def)                  | Defines a function                                                    | [see details...](/features/def) |
| [eventsource](/features/event-source) | Subscribe to Server Sent Events (SSE)                                 |                                 |
| [js](/features/js)                    | Embed JavaScript code at the top level                                | [see details...](/features/js)  |
| [set](/features/set)                  | Defines a new [element-scoped](/docs#names_and_scoping) variable      |                                 |
| [init](/features/init)                | Initialization logic to be run when the code is first loaded          |                                 |
| [on](/features/on)                    | Creates an event listener                                             | `on click log "clicked!"`       |
| [socket](/features/socket)            | Create a Web Socket                                                   |                                 |
| [worker](/features/worker)            | Create a Web Worker for asynchronous work                             |                                 |

## Commands

See also [pseudo-commands](/commands/pseudo-commands/).

{% include "commands_table.md" %}

## Expressions

See [expressions](/expressions) for an overview.

| name                                                                 | description                                        | example                         |
|----------------------------------------------------------------------|----------------------------------------------------|---------------------------------|
| [as expressions](/expressions/as)                                    | Converts an expression to a new value              | `"10" as Int`                   |
| [async expressions](/expressions/async)                              | Evaluate an expression asynchronously              | `set x to async getPromise()`   |
| [attribute reference](/expressions/attribute-ref)                    | An attribute reference                             | `[selected=true]`               |
| [block literal](/expressions/block-literal)                          | Anonymous functions with an expression body        | `\ x -> x * x`                  |
| [class reference](/expressions/class-reference)                      | A class reference                                  | `.active`                       |
| [closest expression](/expressions/closest)                           | Find closest element                               | `closest <div/>`                |
| [comparison operator](/expressions/comparison-operator)              | Comparison operators                               | `x == "foo" I match <:active/>` |
| [id reference](/expressions/id-reference)                            | An id reference                                    | `#main-div`                     |
| [logical operator](/expressions/logical-operator)                    | Logical operators                                  | `x and y`<br/>`z or false`      |
| [no operator](/expressions/no)                                       | No operator                                        | `no element.children`           |
| [of expression](/expressions/of)                                     | Get a property of an object                        | `the location of window`        |
| [query reference](/expressions/query-reference)                      | A query reference                                  | `<button/> <:focused/>`         |
| [relative positional expressions](/expressions/relative-positional/) | Get a positional value out of an array-like object | `next <div/> from me`           |
| [positional expressions](/expressions/positional)                    | Get a positional value out of an array-like object | `first from <div/>`             |
| [possessive expressions](/expressions/possessive)                    | Get a property or attribute from an element        | `the window's location`         |
| [time expression](/expressions/time-expression)                      | A time expression                                  | `200ms`                         |
| [cookies symbol](/expressions/cookies)                               | A symbol for accessing cookies                     | `cookies['My-Cookie']`          |

## Magic Values

| name                    | description                      | example                                         |
|-------------------------|----------------------------------|-------------------------------------------------|
| [it](/expressions/it)   | The result of a previous command | `fetch /people as json then put it into people` |
| [me](/expressions/me)   | Reference to the current element | `put 'clicked' into me`                         |
| [you](/expressions/you) | Reference to a target element    | `tell <p/> remove yourself`                     |

## Literals

Define other values just like you do in Javascript

| name                           | description                                                                  | example                        |
|--------------------------------|------------------------------------------------------------------------------|--------------------------------|
| arrays                         | Javascript-style array literals                                              | `[1, 2, 3]`                    |
| booleans                       | Javascript-style booleans                                                    | `true false`                   |
| math operators                 | Javascript-style mathematical operators (`mod` is a keyword in place of `%`) | `1 + 2`                        |
| null                           | Javascript-style null                                                        | `null`                         |
| numbers                        | Javascript-style numbers                                                     | `1  3.14`                      |
| objects                        | Javascript-style object literals                                             | `{foo:"bar", doh:42}`          |
| [strings](/expressions/string) | Javascript-style strings                                                     | `"a string", 'another string'` |


See also [pseudo-commands](/commands/pseudo-commands/).


## Events

| name                  | description                                                        |
|-----------------------|--------------------------------------------------------------------|
| `hyperscript:ready`   | Triggered on the document after hyperscript has processed the page |
| `load`                | Triggered on an element with hyperscript on it after it has loaded |
| `fetch:beforeRequest` | Triggered before a `fetch` command sends a request                 |
| `fetch:afterResponse` | Triggered after a `fetch` command recieves a response              |
| `fetch:afterRequest`  | Triggered after a `fetch` command handles a response               |
| `fetch:error`         | Triggered when a `fetch` command gets an error                     |
| `fetch:abort`         | Triggered when a `fetch` command request is aborted                |
| `hyperscript:beep`    | Triggered when a `beep` command executes                           |
