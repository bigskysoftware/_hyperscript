---
layout: layout.njk
tags: post
title: hyperscript 0.8 has been released!
date: 2021-06-15
---

## hyperscript 0.8 Release

We are pleased to present the
[0.8 release](https://unpkg.com/browse/hyperscript.org@0.8/)
of hyperscript.

### Changes

- **BREAKING:** If an element A adds an event listener to another element B, then
  when element A gets removed, the listener will be removed.

  ```html
  Count: <output _="
  	on click from #inc
  		log 'Increment'
  		increment my textContent
    init
  	  remove me
  ">0</output>

  <!--After the <output/> is removed, clicking this will not log anything to
    the console-->
  <button id="inc">Increment</button>
  ```

- Hyperscript now has _local_, _global_ and _element-scoped_ variables.

  By default, variables are in the `local` scope, which means they disappear
  when the current handler or function finishes.

  Now, you can use the `global` scope to set variables that last as long as the
  current thread (these are set on `window` in the main thread, and `self` in
  workers).

  In addition, you can set `element` scoped variables that persist as long as
  the element does. These can be used to persist information across events.
  If you set `element` variables within a [behavior](/features/behavior),
  those will be usable only from within that behavior and won't clash with
  anything.

  For more details, see [Variables and scope](/docs/#variables_and_scope).

- You can now load external hyperscript files!

  ```html
  <script type="text/hyperscript" src="draggable._hs"></script>
  ```

- You can use the [make](/commands/make) command to call constructors or
  create DOM elements.

  ```hyperscript
  make a WeakMap
  make an URL from "/path", "https://origin.example.com"
  make a <button.btn-primary/>
  ```

- The [`put`](/commands/put) command can now put DOM elements into other
  elements, in addition to HTML strings. Arrays work as well.

  ```hyperscript
  put ['<b>hello</b>', document.createElement('hr')] at end of me
  ```

- You can now use any expression as a CSS class or id, as shown:

  ```hyperscript
  get idOfElementToRemove()
  remove #{it}
  ```

  ```hyperscript
  set configuration to { activeClass: "active" }
  add .{configuration.activeClass} to allActiveElements()
  ```

- The [`render`](/commands/render) command now escapes HTML.

- The [`fetch`](/commands/fetch) command can use [conversions](/expressions/as).
  Custom conversions work too!

  ```hyperscript
  fetch /count as Int -- or Float, Date...
  ```

  - In addition, `fetch as html` will parse the HTML returned by the server
    into a DOM tree

- The new built-in Fragment conversion turns HTML strings and DOM elements
  (and arrays thereof) into `DocumentFragment`s

- The [`on`](/commands/on) command now supports string literals as event
  names, so you can use characters like dashes.

  ```hyperscript
  on "somelibrary:before-init-something"
    ...
  ```

- You can use "yourself" to refer to the target of a [`tell`](/commands/tell)
  command, in addition to the existing "you" and "your"

- You can now use any expression with many commands like `add`, `send`, `remove`
  that previously only accepted some expressions (id, class, property access
  and a few more).

Enjoy!
