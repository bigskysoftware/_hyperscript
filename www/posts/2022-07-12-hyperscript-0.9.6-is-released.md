---
layout: layout.njk
tags: post
title: hyperscript 0.9.6 has been released!
date: 2022-07-12
---

## hyperscript 0.9.6 Release

We are pleased to present the [0.9.6 release](https://unpkg.com/browse/hyperscript.org@0.9.6/) of hyperscript.

### Changes

* Added the `immediately` clause to the [`init`](/features/init) feature, so you can run code immediately on intialization
* Hyperscript in content added by the `put` command will be automatically initialized (no need to call `_hyperscript.processNode()`
  now!)
* Hyperscript has been moved back to a single file with no build step.  Thank you Deniz!
* The [`pick`](/commands/pick) command has been added, allowing you to pick items out of arrays or strings with various
  syntaxes

### Bug Fixes

* The [`increment`](/commands/increment)  and [`decrement`](/commands/decrement) commands now properly increment when
  the value incrementing or decrementing is 0

Enjoy!
