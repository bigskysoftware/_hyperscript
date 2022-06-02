---
layout: layout.njk
tags: post
title: hyperscript 0.9.5 has been released!
date: 2022-02-22
---

## hyperscript 0.9.5 Release

We are pleased to present the
[0.9.5 release](https://unpkg.com/browse/hyperscript.org@0.9.5/)
of hyperscript.

### Changes

* The `go` expression now works with a `window` target, and also allows a pixel offset so that an element scrolled
  into view will not be directly on the edge of the viewport
* The `closest` expression now works with arrays as well as element collections
* We now support `Values:Form` and `Values:JSON` conversions to convert directly to form-encoded or JSON-encoded values
  for `fetch` requests
* The [`add` command](/commands/add) now supports a `when` clause to allow conditionally adding/removing a class, etc.
  in a single command
* The [`beep` expression](/expressions/beep) is now available to assist in debugging hyperscript code

### Bug Fixes

* `of` and `in` clauses now parse unary expressions, which is more closely aligns with our instinctive reading of
   those clauses.

Enjoy!
