
## <a name='features'></a>[Features](#features)

|  name | description | example
|-------|-------------|---------
| [on](/features/on) | Creates an event listener | `on click log "clicked!"`
| [def](/features/def) | Defines a function | [see details...](/features/def)
| [js](/features/js) | Embed JavaScript code at the top level | [see details...](/features/js)
| [worker](/features/worker) | Create a Web Worker for asynchrnous work
| [eventsource](/features/event-source) | Subscribe to Server Sent Events (SSE)
| [socket](/features/socket) | Create a Web Socket
| [init](/features/init) | Initialization logic to be run when the code is first loaded

## <a name='commands'></a>[Commands](#commands)

{% include commands_table.md %}

## <a href='expressions'></a>[Expressions](#expressions)

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
| [string](/expressions/string) | A string | `"a string", 'another string'`
| [time expression](/expressions/time) | A time expression | `200ms`
| [closest expression](/expressions/closest) | Find closest element | `closest <div/>`
| [of expression](/expressions/of) | Get a property of an object | `the location of window`
| [positional expressions](/expressions/positional) | Get a positional value out of an array-like object | `first from <div/>`
| [possessive expressions](/expressions/possessive) | Get a property or attribute from an element | `the window's location`
| array literal | Javascript-style array literals | `[1, 2, 3]`
| boolean literal | Javascript-style booleans | `true false`
| math operator | Javascript-style mathematical operators | `1 + 2`
| null literal | Javascript-style null | `null`
| number | Javascript-style numbers | `1  3.14`
| object literal | Javascript-style object literals | `{foo:"bar", doh:42}`
