---
layout: layout.njk
tags: post
title: hyperscript 0.8.3 has been released!
date: 2021-11-02
---

## hyperscript 0.8.4 Release

We are pleased to present the
[0.8.4 release](https://unpkg.com/browse/hyperscript.org@0.8.4/)
of hyperscript.

### Changes

* A completely new build system, with both ESM and Modern compatible resources! (Deniz)
* The [`continue`](/commands/continue) command can now be used in the [`repeat`](/commands/repeat) to skip to the next
* The [`send`](/commands/send) and [`trigger`](/commands/trigger) commands were unified and are effectively the same
* A new [`includes`](/expressions/comparison-operator) comparison operator for testing if a string or array contains
  another value (unified with the `contains` and `is in` comparisons)
* A new [`matches`](/expressions/comparison-operator) comparison operator for testing if a string matches a regular
  expression string
* English-style relative comparisons such as [`is less than`](/expressions/comparison-operator)
* Improved [`fetch`](/commands/fetch) syntax, as suggested by @dz4k
* Comments now require two dashes and a space, like so: `-- `, which enables double dashes in class literals like so:
  `add .foo--bar`
* The [`show`](/commands/show) command now supports a `where` clause that allows you to apply `if(expr) show else hide`
  logic directly inline


### Bug Fixes

* The [`tell`](/commands/tell) command now properly respects feature boundaries
* Fixed bug when using [`put`](/commands/put) with attributes

Enjoy!
