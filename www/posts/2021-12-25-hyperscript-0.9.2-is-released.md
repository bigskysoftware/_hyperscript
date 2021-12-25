---
layout: layout.njk
tags: post
title: hyperscript 0.9.2 has been released!
date: 2021-11-29
---

## hyperscript 0.9.2 Release

We are pleased to present the
[0.9.2 release](https://unpkg.com/browse/hyperscript.org@0.9.2/)
of hyperscript.

### Changes

* The hyperscript debugger (hdb) now supports arbitrary jumping!

<div style="text-align: center">
<img src="/img/debugging.gif" style="width: 80%; margin: 20px">
</div>

* [Event handlers](/commands/on) now support a `catch` and `finally` block:
  ```hyperscript
    on click
      doSomething()
    catch e
      log e
    finally
      cleanUp()
  ```
* [Functions](/commands/def) also now support a `finally` block
  ```hyperscript
    def foo()
      doSomething()
    finally
      cleanUp()
  ```
* The [`fetch`](/commands/fetch) command now support both configurable timeouts
  as well as the ability to cancel a fetch request by sending a `fetch:abort` event
  to the element making the request
* *Much* better error reporting in the presence of nulls, rather
  than random exceptions from hyperscript internals
* Support for an `exists` operator:
  ```hyperscript
    if .someClass exists
      ...
  ```
* The `repeat N times` form of the repeat command now supports an expression for `N` (rather than only a number literal)
* A new `Fixed` conversion can convert a number to a fixed-precision string:
  ```hyperscript
    log 3.1415 as Fixed:2 -- prints "3.14"
  ```

### Bug Fixes

* Allow dot-operator after string literals :expressionless:
* `increment`/`decrement`/`append` commands were all cleaned up
* Each installation of a behavior has its own event queue - https://github.com/bigskysoftware/_hyperscript/issues/206
* Non-class CSS literals do not have colons escaped - https://github.com/bigskysoftware/_hyperscript/issues/211
* Fixed bug in `in` expression when used with `form` and other
  iterable DOM elements

Enjoy!
