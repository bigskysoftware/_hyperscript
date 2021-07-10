---
tags: post
title: hyperscript 0.0.6 has been released!
date: 2021-03-16
---

## hyperscript 0.0.6 Release

I'm pleased to announce the [0.0.6 release](https://unpkg.com/browse/hyperscript.org@0.0.6/) of hyperscript.

#### Changes

- The `on` feature now supports count filters to respond only on certain counts:

  ```html
  <button
    _="on click 1 put 'Thanks for clicking...' into me
                on click 2 put 'Thanks for clicking...' into me
                on click 3 and on put 'OK, that's enough' into me"
  >
    Click me...
  </button>
  ```

- The `on` feature now supports `debounce` and `throttle` modifiers to debounce and throttle event response:

  ```html
  <button
    _="on click debounced at 1s put 'Finally, you stopped clicking' into me"
  >
    Click me...
  </button>
  ```

- The project was split into modules that can be mixed and matched as features are needed.

- [Web Socket](/features/socket) support was added with both standard events-based interaction or a simple RPC mechanism.

- [Server Sent Event](/features/event-source) support was added.

- init blocks now are supported to initialize with

  ```html
  <script type="text/hyperscript">
    init
       set window.foo to "foo"
    end
  </script>
  ```

- Content can now be put directly into node objects with the `put` command

  ```html
  <button _="on click put 'Some Content...' into me">Click me...</button>
  ```

- The `as` expression now can convert to and from JSON

  ```html
  <button
    _="on click get getSomeJSON() as Object
                         put result.name into me"
  >
    Click me...
  </button>
  ```

- The `as` expression now can convert a DOM node to the form values of that DOM node
  ```html
  <button
    _="on click get #aForm as Values
                         put `The name in the form was $result.name` into me"
  >
    Click me...
  </button>
  ```
- Support for javascript-style template strings was added
  ```html
  <button
    _="on click fetch /example as json
                         put `Result: $it.result` into me"
  >
    Click me...
  </button>
  ```
- The [toggle command](/commands/toggle) now supports a `between` form to toggle between two classes

- The [of expression](/expressions/of) allows you to reverse normal dot notation for more natural language:

  ```html
  <button _="on click log the location of the window">Log Location</button>
  <button _="on click log window.location">Log Location</button>
  ```

- `it` and `its` are now aliases for the HyperTalk standard `result`

- [Pseudo-commands](/commands/pseudo-commands) are now supported

- Object-literals now support expressions for key values.

- The [add command](/commands/add) can now add many css properties at once if the value is an object literal

- The [set command](/commands/add) can now set many properties at once if the value is an object literal

- The [closest expression](/expressions/closest) returns the closest match for a given css selector

- The [add](/commands/add), [remove](/commands/remove) and [toggle](/commands/toggle) commands all can now take multiple
  classes

- Positional expressions [first](/expression/first), [last](/expression/first) and [random](/expression/random) were
  added

- HDB, the [Hyperscript Debugger](/docs#debugging) was added!

Enjoy!
