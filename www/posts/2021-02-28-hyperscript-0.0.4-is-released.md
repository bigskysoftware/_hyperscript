---
layout: layout.njk
tags: post
title: hyperscript 0.0.4 has been released!
date: 2021-02-28
---

## hyperscript 0.0.4 Release

I'm pleased to announce the [0.0.4 release](https://unpkg.com/browse/hyperscript.org@0.0.4/) of hyperscript.

I would like to thank Deniz Akşimşek and Ben Pate for their assistance in getting this major
release out the door by providing code, discussion and moral support. Thank you guys!

#### Changes

This release involved a massive refactor of the hyperscript runtime to fully support [async transparancy](/docs#async).  
The runtime was moved back to being interpreted from being transpiled into javascript, which allows for this
innovative language feature and that has set the stage for a number of interesting features in the future.

Most commands from the `0.0.3` release are still available, except for the `ajax` command, which has been replaced with
the (much different) [`fetch`](/commands/fetch) command.

The `ajax` command may return as an add-on in a future release.

In addition to the big runtime change, a slew of new features were added:

##### Features

- [event handlers](/features/on) now
  - can have event filters on them using a bracket syntax
  - can specify that an event happens `elsewhere` (that is, on an element not in the current element's hierarchy)
  - can specify if multiple concurrent instances of an event should be processed (defaults to no)
- There is a new [`def`](/features/def) feature that allows you to define hyperscript functions
- There is a new [`worker`](/features/worker) feature that allows you to define WebWorkers in hyperscript (!!!)
- There is a new [`js`](/features/js) feature that allows you to define javascript blocks within workers and hyperscript script tags
- Hyperscript now supports a [`pluggable grammar`](/docs#extending) feature that allows you to define new hyperscript
  commands, features, and leaf & indirect expressions

##### Commands

- As mentioned above, the [`fetch`](/commands/fetch) replaces the `ajax` command
- The [`return`](/commands/return) and [`throw`](/commands/throw) commands have been added to support hyperscript functions
- The [`repeat`/`for`](/commands/repeat) command has been added to support many different forms of iteration
- The [`js`](/commands/js) command has been added to allow for inline use of javascript within a hyperscript function or event handler
- The [`wait`](/commands/wait) and [`repeat`](/commands/repeat) commands can now wait for events to occur, allowing for
  [event driven control flow](/docs#events)
- The ['hide'](/commands/hide) and ['show'](/commands/show) commands can be used to hide and show elements using various
  strategies, and allow for plugging in additional strategies

##### Expressions

- support the `no` expression that returns true if the left hand side is `null`
- support `is` and `is not` as aliases for `==` and `!=`
- support the `async` expression to prevent the hyperscript runtime from syncing on a Promise returned by an expression

Enjoy!
