---
layout: layout.njk
tags: post
title: hyperscript 0.8 has been released!
date: 2021-05-25
---

## hyperscript 0.8 Release

We are pleased to present the
[0.8 release](https://unpkg.com/browse/hyperscript.org@0.8/)
of hyperscript.

### Changes

- **BREAKING:** If an element adds an event listener to another element, then
  when the first element gets removed, the listener will be removed.

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

- You can now load external hyperscript files!

  ```html
  <script type="text/hyperscript" src="draggable._hs"></script>
  ```

- The [`put`](/commands/put) command can now put DOM elements into other
  elements, in addition to HTML strings. Arrays work as well.

  ```hyperscript
  put ['<b>hello</b>', document.createElement('hr')] at end of me
  ```

- The [`render`](/commands/render) command now escapes HTML

- The [`fetch`](/commands/fetch) command can use [conversions](/expressions/as).
  Custom conversions work too!

  ```hyperscript
  fetch /count as Int -- or Float, Date...
  ```

  - In addition, `fetch as html` will parse the HTML returned by the server
    into a DOM tree

- The new built-in Fragment conversion turns HTML strings and DOM elements
  (and arrays thereof) into `DocumentFragment`s

- You can use "yourself" to refer to the target of a [`tell`](/commands/tell)
  command, in addition to the existing "you" and "your"

Enjoy!
