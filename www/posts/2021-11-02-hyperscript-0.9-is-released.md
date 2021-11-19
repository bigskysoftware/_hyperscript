---
layout: layout.njk
tags: post
title: hyperscript 0.9 has been released!
date: 2021-11-19
---

## hyperscript 0.9 Release

We are pleased to present the
[0.9 release](https://unpkg.com/browse/hyperscript.org@0.9.0/)
of hyperscript.

### Changes

* A completely new build system, with both ESM and Modern compatible resources!
  * Loading _hyperscript from UNPKG will work as it did before. No complex tooling needed.
  * You can use _hyperscript as an ES module, perhaps with a bundler! This one needs some testing in the wild. 
* The [`continue`](/commands/continue) command can now be used in the [`repeat`](/commands/repeat) to skip to the next
* The [`send`](/commands/send) and [`trigger`](/commands/trigger) commands were unified and are effectively the same
* A new [`includes`](/expressions/comparison-operator) comparison operator for testing if a string or array contains
  another value (unified with the `contains` and `is in` comparisons)
* A new [`matches`](/expressions/comparison-operator) comparison operator for testing if a string matches a regular
  expression string
* English-style relative comparisons such as [`is less than`](/expressions/comparison-operator)
* Improved [`fetch`](/commands/fetch) syntax to have a `with` clause: `fetch /url with method:'POST'`
* Comments now require two dashes and a space, like so: `-- `, which enables double dashes in class literals like so:
  `add .foo--bar`
* The [`show`](/commands/show) command now supports a `when` clause that allows you to apply `if(expr) show else hide`
  logic directly inline
* Scoping rules have been [updated slightly](https://hyperscript.org/docs/#variables_and_scope): you must explicitly 
  declare access to `global`variables now
* However, this release introduces scope prefixing as well:
  * Any variable that starts with a colon (`:`) will be treated as element scoped unless otherwise specified
  * Any variable that starts with a dollar (`$`) will be treated as global scoped unless otherwise specified
* Global functions can now be called without a `call` statement:
  ```
    call prompt('Enter  your name')
    put `Hello ${the result}` into #response
    -- becomes
    prompt('Enter  your name')
    put `Hello ${the result}` into #response
  ```

### Bug Fixes

* The [`tell`](/commands/tell) command now properly respects feature boundaries
* Fixed bug when using [`put`](/commands/put) with attributes

Enjoy!
