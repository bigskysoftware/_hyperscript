
## <a name='features'></a>[Features](#features)

|  name | description | example
|-------|-------------|---------
| [behavior](/features/behavior) | Define cross-cutting behaviors that are applied to many HTML elements
| [def](/features/def) | Defines a function | [see details...](/features/def)
| [eventsource](/features/event-source) | Subscribe to Server Sent Events (SSE)
| [js](/features/js) | Embed JavaScript code at the top level | [see details...](/features/js)
| [init](/features/init) | Initialization logic to be run when the code is first loaded
| [on](/features/on) | Creates an event listener | `on click log "clicked!"`
| [socket](/features/socket) | Create a Web Socket
| [worker](/features/worker) | Create a Web Worker for asynchrnous work

## <a name='commands'></a>[Commands](#commands)

{% include commands_table.md %}

## <a name='expressions'></a>[Expressions](#expressions)

See [expressions](/expressions) for an overview.

|  name | description | example
|-------|-------------|---------
| [as expressions](/expressions/as) | Converts an expression to a new value | `"10" as Int`
| [async expressions](/expressions/async) | Evaluate an expression asynchronously | `set x to async getPromise()`
| [attribute reference](/expressions/attribute-ref) | An attribute reference | `[selected=true]`
| [block literal](/expressions/block-literal) | Anonymous functions with an expression body | `\ x -> x * x`
| [class reference](/expressions/class-reference) | A class reference | `.active`
| [comparison operator](/expressions/comparison-operator) | Comparison operators | `x == "foo" I match <:active/>`
| [id reference](/expressions/id-reference) | An id reference | `#main-div`
| [logical operator](/expressions/logical-operator) | Logical operators | `x and y`<br/>`z or false`
| [no operator](/expressions/no) | No operator | `no element.children`
| [query reference](/expressions/query-reference) | A query reference | `<button/> <:focused/>`
| [time expression](/expressions/time) | A time expression | `200ms`
| [closest expression](/expressions/closest) | Find closest element | `closest <div/>`
| [of expression](/expressions/of) | Get a property of an object | `the location of window`
| [positional expressions](/expressions/positional) | Get a positional value out of an array-like object | `first from <div/>`
| [possessive expressions](/expressions/possessive) | Get a property or attribute from an element | `the window's location`
| [relative positional expressions](/expressions/relateivePositional) | Get a positional value out of an array-like object | `first from <div/>`

## <a name='magic-values'></a> [Magic Values](#magic-values)

|  name | description | example
|-------|-------------|---------
| [it](/expressions/it) | The result of a previous command | `fetch /people as JSON then put it into people`
| [me](/expressions/me) | Reference to the current element | `put 'clicked' into me`
| [you](/expressions/you) | Reference to a target element | `tell <p/> remove yourself`

## <a name='literals'></a> [Literals](#literals)

Define other values just like you do in Javascript

|  name | description | example
|-------|-------------|---------
| arrays | Javascript-style array literals | `[1, 2, 3]`
| booleans | Javascript-style booleans | `true false`
| math operators | Javascript-style mathematical operators | `1 + 2`
| null | Javascript-style null | `null`
| numbers | Javascript-style numbers | `1  3.14`
| objects | Javascript-style object literals | `{foo:"bar", doh:42}`
| [strings](/expressions/string) | Javascript-style strings | `"a string", 'another string'`
