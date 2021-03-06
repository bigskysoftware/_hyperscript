---
layout: layout.njk
title: ///_hyperscript
---

## <a name='features'></a>[Features](#features)

|  name | description | example
|-------|-------------|---------
| [on](/features/on) | Creates an event listener | `on click log "clicked!"`
| [def](/features/def) | Defines a function | [see details...](/features/def)
| [js](/features/js) | Embed JavaScript code at the top level | [see details...](/features/js)
| [worker](/features/worker) | Create a Web Worker for asynchrnous work

## <a name='commands'></a>[Commands](#commands)

|  name | description | example
|-------|-------------|---------
| [add](/commands/add) | Adds content to a given target | `add .myClass to me`
| [fetch](/commands/fetch) | Send a fetch request | `fetch /demo then put it into my.innerHTML`
| [call/get](/commands/call) | Evaluates an expression (e.g. a Javascript Function) | `call alert('yep, you can call javascript!)` <br/><br/> `get prompt('Enter your name')`
| [if](/commands/if) | A conditional control flow command | `if me.selected then call alert('I\'m selected!')`
| [log](/commands/log) | Logs a given expression to the console, if possible | `log me`
| [put](/commands/put) | Puts a value into a given variable or property| `put "cool!" into me.innerHTML`
| [remove](/commands/remove) | Removes content | `log "bye, bye" then remove me`
| [send](/commands/send) | Sends an event | `send customEvent to #a-div`
| [set](/commands/set) | Sets a variable or property to a given value | `set x to 0`
| [take](/commands/take) | Takes a class from a set of elements | `take .active from .tabs`
| [toggle](/commands/toggle) | Toggles content on a target | `toggle .clicked on me`
| [trigger](/commands/trigger) | triggers an event on the current element | `trigger customEvent`
| [wait](/commands/wait) | Waits for an event or a given amount of time before resuming the command list | `wait 2s then remove me`
| [js](/commands/js) | Embed JavaScript code inline | `js(a) return compute(a); end`
| [hide](/commands/hide) | Hide an element in the DOM | `hide me`
| [show](/commands/show) | Show an element in the DOM | `show #anotherDiv`

## <a href='expressions'></a>[Expressions](#expressions)

See [expressions](/expressions) for an overview.

|  name | description | example
|-------|-------------|---------
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
| array literal | Javascript-style array literals | `[1, 2, 3]`
| boolean literal | Javascript-style booleans | `true false`
| math operator | Javascript-style mathematical operators | `1 + 2`
| null literal | Javascript-style null | `null`
| number | Javascript-style numbers | `1  3.14`
| object literal | Javascript-style object literals | `{foo:"bar", doh:42}`
