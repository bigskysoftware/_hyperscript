---
layout: layout.njk
tags: post
title: hyperscript 0.0.5 has been released!
date: 2021-03-06
---

## hyperscript 0.0.5 Release

I'm pleased to announce the [0.0.5 release](https://unpkg.com/browse/hyperscript.org@0.0.5/) of hyperscript.

#### Changes

While not as ambitions as the almost-suicidal 0.0.4 release, this release still contains a huge number of improvements
to the language.

- Strings now support expression references using the `$` operator:

  ```text
  set x to "World"
  put "Hello $x" into my.innerHTML
  ```

- The `as` expression can be used to convert values between various types:

  ```text
   set x to "10" as Int
  ```

  Conversions are fully pluggable, so you can add new conversions to the language dynamically.

- Functions now support catch blocks:

  ```text
    def example()
      call throwsAnExcetion()
    catch e
      log e
      return "bad stuff happened..."
    end
  ```

- The `_hyperscript` symbol is now a function that can evaluate hyperscript from javascript:

  ```js
  console.log(_hyperscript("1 + 1"));
  ```

- Hyperscript now includes "hypertraces" when exceptions occur to show where the given hyperscript originated from

- Hyperscript now supports arbitrary CSS queries with the query
  literal:
  ```text
    for elt in <div.foo/> -- will log all divs with the foo class
      log elt
    end
  ```
- Hyperscript now supports the `in` expression to look for elements inside of another element

  ```text
    -- add the class foo to all paragraphs in the current
    -- element
    add .foo to <p/> in me
  ```

- Hyperscript now includes many more comparison operations such as `is in`, `is not in`, `matches`, `does not match`,
  `contains`, `does not contain`

  ```text
  if elt matches <:focus/> log "Focused!"
  ```

- Hyperscript now supports `I` as an alias for `me` and alterative forms of the comparison operators for it:

  ```text
  I match .foo
  I contain that
  ```

- Event handlers have quite a few new features

  - You can now specify multiple events for a single event handler:

  ```html
  <div
    _="on mouseenter or touchbegin fetch /content then put it into my.innerHTML"
  >
    Fetch it...
  </div>
  ```

  - Event queueing can be controlled much more tightly. Previously the default was to discard
    events that came in when an event handler was still executing. Now you have the following
    options:
    - `on every click` - every click will be responded to, no queuing
    - `on click queue all` - every click will be responded to in serial fashion
    - `on click queue first` - the first click received while the handler is executing will be executed when the current event finishes
    - `on click queue last` - the last click received while the handler is executing will be executed when the current event finishes
  - You can use the new `in` modifier to listen for events that occur within a child. This allows you to lazily bind to events on children that might not yet exist in the DOM:

  ```html
   <body _="on click in <button.fetch/>
                     with it fetch /value then put it into my.innerHTML"
  ```

- You can now use the `async` command to execute a single or batch of commands asynchronously:

  ```text
    async fetch /foo
    async do
      fetch /foo
      put it into #aDiv.innerHTML
    end
  ```

- Hyperscript now supports the `with` command, that allows you to switch the meaning of `me` to another element within a given block

  ```text
    -- fade out and remove all paragraphs
    for p in <p/>
      with p
        transition opacity to 0
        remove
      end
    end
  ```

  the with command also supports groups of elements, so you could simplify the above to:

  ```text
    -- fade out and remove all paragraphs
    with <p/>
      transition opacity to 0
      remove
    end
  ```

- Hyperscript now supports a transition command that allows you to transition properties from
  on value to another. It will apply a configurable transition value to the element to ensure
  a smooth animation

  ```html
  <button _="on click transition opacity to 0 then remove me">
    Make Me Disappear!
  </button>
  ```

- Hyperscript now supports a `settle` command that allows you synchronized on the transitions caused by a previous
  command
  ```html
  <style>
    #pulsar {
      transition: all 800ms ease-in-out;
    }
    .red {
      background: red;
    }
  </style>
  <div id="pulsar" _="on load repeat 6 times toggle .red then settle">
    You thought the blink tag was dead?
  </div>
  z
  ```

Enjoy!
