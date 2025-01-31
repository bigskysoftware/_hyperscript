---
layout: layout.njk
tags: post
title: hyperscript 1.0.0-rc1 has been released!
date: 2024-10-20
---

## hyperscript 1.0.0-rc1 Release

We are pleased to present the [1.0.0-rc1 release](https://unpkg.com/browse/hyperscript.org@1.0.0-rc1/) of hyperscript,
the first release candidate of hyperscript 1.0.

### Changes

* `and` and `or` now properly short circuit when the right hand side and left hand side are not promises
* Modified the binding of negative numbers and postfix expressions, so expressions like `-10px` now parse properly
* We now properly support tilde `~` and dollar sign `$` characters in query literals
* You may now escape any character in a class literal reference using the backslash character, so we don't need to keep
  special casing tailwinds insanity
* You may now use `an` as well as `a` in comparisons (e.g. `foo is an Event`)
* Trailing commas are now allowed in object literals
* Triggered events are now marked as `bubbles:true` for better shadow DOM usage
* The `append` command now preserves existing content when appending new HTML
* We now support the `indexed by` syntax for index variables in loops
* We now trigger a `hyperscript:ready` event when hyperscript is done processing nodes
* Many docs fixes
* Many bug fixes

Enjoy!
