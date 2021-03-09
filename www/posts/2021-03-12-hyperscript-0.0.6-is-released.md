---
layout: layout.njk
tags: post
title: hyperscript 0.0.6 has been released!
date: 2021-03-06
---

## hyperscript 0.0.6 Release

I'm pleased to announce the [0.0.6 release](https://unpkg.com/browse/hyperscript.org@0.0.6/) of hyperscript.

#### Changes

* The `on` feature now supports count filters to respond only on certain counts:
  ```html
     <button _="on click 1 put 'Thanks for clicking...' into me
                on click 2 put 'Thanks for clicking...' into me
                on click 3 and on put 'OK, that's enough' into me">
              Click me...
     </button>
  ```

* The `on` feature now supports `debounce` and `throttle` modifiers to debounce and throttle event response:
  ```html
     <button _="on click debounced at 1s put 'Finally, you stopped clicking' into me">
              Click me...
     </button>
  ```

* The project was split into a few different modules that can be mixed and matched as features are needed.

* Web Socket support was added with both standard events-based interaction as well as a simple RPC mechanism.

* init blocks are supported to initialize with
  ```html
    <script type="text/hyperscript">
      init
         set window.foo to "foo"
      end
    </script>
  ```

* Content can now be put directly into node objects with the `put` command
  ```html
     <button _="on click put 'Some Content...' into me">
              Click me...
     </button>
  ```

* The `as` expression now can convert to and from JSON
  ```html
     <button _="on click get getSomeJSON() as Object
                         put it.name into me">
              Click me...
     </button>
  ```
* Support for javascript-style template strings was added
  ```html
     <button _="on click fetch /example as json
                         put `Result: $it.result` into me">
              Click me...
     </button>
  ```

Enjoy!