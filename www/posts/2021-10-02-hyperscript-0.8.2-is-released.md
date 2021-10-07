---
layout: layout.njk
tags: post
title: hyperscript 0.8.2 has been released!
date: 2021-10-02
---

## hyperscript 0.8.2 Release

We are pleased to present the
[0.8.2 release](https://unpkg.com/browse/hyperscript.org@0.8.2/)
of hyperscript.

### Changes

<!-- the HDB changes are not ready for the public eye. they are behind a flag for now -->
* Our graphical debugger has been redesigned. Along with a total visual refresh, HDB now has a debug console like dev tools in modern browsers.
* The hyperscript runtime now fires a  `hyperscript:beforeFetch` event to allow you to configure fetch requests
* The `wait for` command now allows mixing delays and events, useful for adding a timeout to a listener.
* Improvements to the implementations of the `next`/`previous` expressions
* Dramatic internal runtime improvements, particularly in the evaluation of query literals (e.g. `<.foo/>`)
* Scoping fixes (see <https://github.com/bigskysoftware/_hyperscript/issues/173>)
* Expanded support for function invocation in pseudo-commands (TODO Carson - documentation)

Enjoy!
