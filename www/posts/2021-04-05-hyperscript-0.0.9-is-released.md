---
layout: layout.njk
tags: post
title: hyperscript 0.0.9 has been released!
date: 2021-04-05
---

## hyperscript 0.0.9 Release

I'm pleased to announce the [0.0.9 release](https://unpkg.com/browse/hyperscript.org@0.0.8/) of hyperscript.

#### Changes

- **BREAKING CHANGE**: [Attribute literals](/expressions#attributes) now use the syntax `[@attribute-name]` or `@attribute-name` rather than
  `[attribute-name]`

- **BREAKING CHANGE**: The [eventsource feature](/features/event-source) now uses the syntax `eventsource <name> [from <url>]` so that URLs can be optionally omitted from the EventSource definition.

- The [append command](/commands/append) allows you to append values to strings, arrays and so forth

- The [behavior](/features/behavior) and [install](/features/behavior) features allow you to define generic
  behaviors in hyperscript and install them on elements
- The [render](/commands/render) supports client-side templates defined in hyperscript

- There is now a Prism-based syntax highlighting project: <https://github.com/dz4k/prism-hyperscript>

- The [default command](/commands/default) allows you to default a variable to a given value

- The [increment command](/commands/increment) allows you to increment variable's value

- The [halt command](/commands/halt) allows you modify the current event's bubbling and default behaviors

- The [event handler](/features/on#mutation) added support for the synthetic `mutation` event, based on `MutationObservers`

- The [event handler](/features/on#intersection) added support for the synthetic `instersection` event, based on `IntersectionObservers`

- The [closest expression](/expressions#closest) added support getting and setting attribute values directly

Enjoy!
