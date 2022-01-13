---
layout: layout.njk
tags: post
title: hyperscript 0.9.4 has been released!
date: 2022-1-14
---

## hyperscript 0.9.4 Release

We are pleased to present the
[0.9.4 release](https://unpkg.com/browse/hyperscript.org@0.9.4/)
of hyperscript.

### Changes

* **BREAKING**: the [`transition`](/commands/transition) command no longer supports "naked" strings for style
  values.  This means that code like this must be changed:
  ```hyperscript
    transtion my color to red   -- Old syntax
    transtion my color to "red" -- New syntax
  ```
  However, with the addition of general measurement literals to the language, mentioned below, many transitions
  will not need to be changed:
  ```hyperscript
    transtion my width to 100%   -- Works because `100%` is a valid, general expression now
  ```
  If you have questions or need help, please jump on the [htmx discord](https://htmx.org/discord) for help
* [style literals](/docs#dom-literals) are now available, making it easier to refer to style properties
  ```hyperscript
    set my *opacity to 50%
  ```
* [style measurement literals](/docs#measuring) are now available, making it easy to get the computed value of a
  style property:
  ```hyperscript
    log my *opacity          -- logs the explicit opacity of the element
    log my *computed-opacity -- logs the computed opacity of the element
  ```
* [measurment literals](/docs#dom-literals) are now available, making it terms like `50%` available generally in
  the language:
  ```hyperscript
    set my *opacity to 50%
  ```
* [pseudo commands](/expressions/psuedo-commands) now support an expanded syntax, including the ability to simply
  use a function as a top level command:
  ```hyperscript
    on click
       alert("I was clicked") -- a stand alone function can now simply be a top level command
  ```
* the `sender` symbol is now available in event handlers, and will be set to the element that sent an event to the current
  element, if any
* the [`fetch`](/commands/fetch) command supports a better syntax, with the response transformation *before* the `with`
  clause, which eliminates some grammatical ambiguity:
  ```hyperscript
    fetch /example as json
      with method: "POST"
  ```
* the ['break'](/commands/break) command has been added, allowing you to break out of loops
* the ['toggle'](/commands/toggle) command can now toggle visibility, but passing it a style literal to use:
  ```hyperscript
    on click toggle my *opacity
    on click toggle my *display
  ```

### Bug Fixes

* functions and symbols with numbers in them now resolve properly, e.g. `call select2(...)`
* internally, the hyperscript runtime eliminated a hacky mechanism for resolving promises with the standard
  `Promise.all()` function (thank you to Deniz for noticing this!)
* fixed a bug where a template literal on the rhs was not working properly with the `in` expression
* properly throw errors when a hyperscript program has extra characters at the end and is being evaluated as
  an expression
* escape characters in strings (e.g. '\n') now are properly transformed into their corresponding control characters
* listening to events on `form` elements now works properly
* fixed issue when waiting for an event with a timeout

Enjoy!
