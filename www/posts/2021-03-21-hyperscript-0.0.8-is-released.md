---
layout: layout.njk
tags: post
title: hyperscript 0.0.8 has been released!
date: 2021-03-21
---

## hyperscript 0.0.8 Release

I'm pleased to announce the [0.0.8 release](https://unpkg.com/browse/hyperscript.org@0.0.8/) of hyperscript.

#### Changes

* **BREAKING CHANGE**: The `with` command has been removed in favor of the [`tell` command](/commands/tell).  The `tell`
  command is similar to `with`, but does not override the `me` symbol, which remains bound to the element the event handler is
  defined on.
  ```
    tell #anotherDiv
      add .foo
    end
  ```
  ```

* New comparison expressions: `is empty`, `is not empty`, `is a <type>`, `is not a <type>`
  ```
    array is empty
    array is not empty
    x is a String
    x is not a String
  ```

* The `hdb` window is now draggable using some pretty sweet hyperscript...

* The new [`possessive` expression](/expressions/possessive) allows you to use natural language for data members:
  ```
    set the window's location to "http://www.google.com"
  ```
  
* The new [`possessive` expression](/expressions/possessive) also allows getting and setting DOM attribute values via
  the `attribute` modifier
  ```
    set #anotherDiv's attribute data-foo to my attribute data-bar
  ```

* The `transition` command now supports pseudo-possessive syntax:
  ```
    transition my opacity to 0
    transition the div's opacity to 0
  ```
* The `transition` command now supports an alternate `over` syntax for specifying the length of the transtion:
  ```
    transition my opacity to 0 over 2s
  ```

* The `wait` command can destructure event properties into local variables
  ```
    wait until event mouseMove(clientX, clientY)
    log clientX, clientY
  ```

* The `wait` command specify multiple events to wait for via the `or` modifier
  ```
    wait until event mouseMove(clientX, clientY) or mouseUp(clientX, clientY)
    log clientX, clientY
  ```

* The new [`measure` command](/commands/measure) returns the measurements for a given element in the DOM, including
  the top, left, etc.

* Functions, sockets, etc. can be defined on an element and are visible to children elements, but not in the global
  scope
  
* The `as HTML` conversion was added to convert content into an HTML string

* All commands now support an `unless` modifier to conditionally execute:
  ```
    log error unless no error
  ```

* The new `exit` command allows you to exit a function or event handler without returning a value

* The new [`go` command](/commands/go) allows you navigate with the browser or within a page


Enjoy!