---
layout: layout.njk
tags: post
title: hyperscript 0.9.90 has been released!
date: 2026-03-29
---

## hyperscript 0.9.90 Release

We are pleased to present the 0.9.90 release of hyperscript. This is a significant release that includes a complete
internal restructuring, a new reactivity system, many new commands and expressions, and improved error handling.

### Reactivity

The headline feature of this release is a new [reactivity system](/docs#reactivity) with three features that let you
declare relationships between values and have them stay in sync automatically.

#### live

Keeps the DOM in sync with values. Each command in a [`live`](/features/live) block becomes an independent
tracked effect that re-runs when its dependencies change:

```html
<button _="on click increment $count">+1</button>
<output _="live put 'Count: ' + $count into me"></output>
```

#### when ... changes

[`when`](/features/when) reacts to value changes with side effects:

```html
<div _="when $source changes set $derived to (it * 2)"></div>
<output _="when $derived changes put it into me"></output>
```

#### bind

[`bind`](/features/bind) keeps two values in sync (two-way binding). On form elements it auto-detects the right
property (value, checked, valueAsNumber):

```html
<input type="checkbox" id="dark-toggle" />
<body _="bind .dark and #dark-toggle's checked">
```

The reactivity system includes automatic dependency tracking, circular dependency detection, and cleanup
when elements are removed from the DOM.

### Templates in Core

The [`render`](/commands/render) command and template language are now built into core — no extension script needed.
Templates use `<template>` elements with `${}` interpolation and `#`-prefixed control flow:

```html
<template id="user-card">
#for user in users
  <div class="card">
    <h3>${user.name}</h3>
    #if user.bio
      <p>${user.bio}</p>
    #end
  </div>
#end
</template>

<button _="on click
  render #user-card with users: userData
  put the result into #container">
  Load Users
</button>
```

Interpolated expressions are HTML-escaped by default. Use `${unescaped expr}` for raw output.

### New Commands

#### open / close

Open and close dialogs, details elements, popovers, and fullscreen. The command automatically detects the
element type and calls the right API:

```hyperscript
open #my-dialog                -- showModal() for <dialog>
close #my-dialog               -- close() for <dialog>
open #my-details               -- sets open on <details>
open fullscreen                -- fullscreen the entire page
open fullscreen #video         -- fullscreen a specific element
close fullscreen               -- exit fullscreen
```

#### focus / blur

[`focus`](/commands/focus) and [`blur`](/commands/blur) set or remove keyboard focus. Default to `me` if no
target is given:

```hyperscript
on click focus #name-input
on submit blur me
```

#### empty

[`empty`](/commands/empty) removes all children from an element:

```hyperscript
on click empty #results
```

#### swap

[`swap`](/commands/swap) exchanges the values of two assignable expressions — variables, properties, array
elements, or any combination:

```hyperscript
swap x with y
swap arr[0] with arr[2]
swap #a.textContent with #b.textContent
```

#### select

Select the text content of an input or textarea:

```hyperscript
on focus select #search-input
```

#### ask / answer

Access the browser's built-in dialogs. `ask` wraps `prompt()` and places the result in
[`it`](/expressions/it). `answer` wraps `alert()`, or `confirm()` when given two choices:

```hyperscript
ask "What is your name?"
put it into #greeting

answer "File saved!"

answer "Save changes?" with "Yes" or "No"
if it is "Yes" ...
```

#### speak

Text-to-speech via the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) — a
nod to [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf). The command waits for the utterance
to finish before continuing:

```hyperscript
speak "Hello world"
speak "Quickly now" with rate 2 with pitch 1.5
```

#### scroll

[`scroll`](/commands/scroll) scrolls elements into view with alignment, offset, and smooth scrolling. Use `in` to
scroll within a specific container, or `scroll by` for relative scrolling:

```hyperscript
scroll to #target
scroll to the top of #target smoothly
scroll to the bottom of me +50px
scroll to #item in #sidebar smoothly
scroll down by 200px
scroll #panel left by 100px
```

#### breakpoint

Pause execution in the browser DevTools. Now built in to core — no hdb extension required:

```hyperscript
on click
  breakpoint
  add .active
```

### New Expressions & Syntax

#### Collection Expressions

Filter, sort, map, split, and join collections with postfix expressions that chain naturally.
[`it`/`its`](/expressions/it) refer to the current element:

```hyperscript
items where its active sorted by its name mapped to its id
"banana,apple,cherry" split by "," sorted by it joined by ", "
<li/> in #list where it matches .visible
```

#### clipboard and selection

New [magic symbols](/docs#zoo) for accessing the system clipboard and current text selection:

```hyperscript
put clipboard into #paste-target     -- async read, auto-awaited
set clipboard to "copied!"           -- sync write
put selection into #selected-text    -- window.getSelection().toString()
```

#### on resize

[ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) as a synthetic event,
matching the pattern of [`on mutation`](/docs#mutation) and [`on intersection`](/docs#intersection):

```hyperscript
on resize put `${detail.width}x${detail.height}` into #size
on resize from #panel put detail.width into me
```

#### on first click

One-shot [event handlers](/features/on) that fire only once:

```hyperscript
on first click add .loaded to me then fetch /data
```

#### ignoring case

Case-insensitive modifier for [comparisons](/expressions/comparison-operator):

```hyperscript
if my value contains "hello" ignoring case ...
show <li/> when its textContent contains query ignoring case
```

#### when clause on add, remove, show, hide

Apply commands conditionally per element. After execution, `the result` contains the matched elements.
Works on [`add`](/commands/add), [`remove`](/commands/remove), [`show`](/commands/show), and
[`hide`](/commands/hide):

```hyperscript
show <li/> in #results when its textContent contains my value
show #no-match when the result is empty
```

#### Bottom-tested loops

[Loops](/commands/repeat) that run the body at least once before checking the condition:

```hyperscript
repeat
  increment x
until x is 10 end
```

#### Pipe operator

Chain [conversions](/expressions/as) left to right:

```hyperscript
get #myForm as Values | JSONString
get #myForm as Values | FormEncoded
```

#### DOM-scoped variables

[Variables](/docs#scoping) with the `^` prefix are scoped to the element and inherited by all descendants,
ideal for component state without polluting the global scope:

```html
<div _="init set ^count to 0">
  <button _="on click increment ^count">+1</button>
  <output _="live put ^count into me"></output>
</div>
```

### Parser Improvements

* **Error recovery** -- multiple parse errors are collected and reported together; a syntax error in one
  feature no longer kills the entire element
* **Standard expression parsing for [`transition`](/commands/transition) and [`measure`](/commands/measure)** --
  the internal pseudopossessive parsing mechanism has been removed; these commands now use the same expression
  syntax as everything else

### Internal

This release is a complete ESM rewrite of the codebase (45 modules). Element state is now stored on
`elt._hyperscript` (inspectable in DevTools), aligned with htmx's `elt._htmx` pattern. The test suite was
migrated to Playwright. See the [CHANGELOG](/changelog) for the full list of internal changes and bug fixes.

<style>
.upgrade-step {
  background: var(--bg-subtle, #f8f9fa);
  border-left: 3px solid var(--accent, #3b82f6);
  padding: 0.75em 1em;
  margin: 1em 0;
  border-radius: 0 var(--radius, 4px) var(--radius, 4px) 0;
}
.upgrade-step strong { white-space: nowrap; }
.upgrade-section { margin-bottom: 2.5em; }
</style>

---

### Upgrade Guide

If you are upgrading from 0.9.14 or earlier, the following breaking changes may require updates to your code.

<div class="upgrade-section">

#### 1. Extension paths moved

All extension scripts have been reorganized into a `dist/ext/` subdirectory.

<div class="upgrade-step">

**Upgrade Step:** Search for `dist/hdb.js`, `dist/socket.js`, `dist/worker.js`, `dist/eventsource.js`,
`dist/tailwind.js` and replace with `dist/ext/hdb.js`, `dist/ext/socket.js`, etc.

</div>
</div>

<div class="upgrade-section">

#### 2. Templates moved into core

The template extension (`dist/template.js` or `dist/ext/template.js`) is no longer needed.
The [`render`](/commands/render) command is now built into core. Also, the template command prefix has changed
from `@` to `#`:

```
-- Before                     -- After
@repeat in items              #for x in items
@set x to "hello"             #set x to "hello"
@end                          #end
```

<div class="upgrade-step">

**Upgrade Step:** Remove any `<script>` tag that loads `template.js`. If your templates use `@` command
prefixes, replace them with `#`. Replace `@repeat in Y` with `#for x in Y`.

</div>
</div>

<div class="upgrade-section">

#### 3. transition requires \* style refs

The [`transition`](/commands/transition) command previously accepted bare identifiers like `width` and `opacity`
as CSS property names. Now that hyperscript has [style literals](/docs#dom-literals) (`*width`, `*opacity`),
`transition` requires them for consistency with the rest of the language. The `element` keyword prefix for
targeting other elements has also been removed in favor of standard [possessive](/expressions/possessive) and
[`of`](/expressions/of) syntax.

```hyperscript
-- Before                                    -- After
transition width to 100px                    transition *width to 100px
transition my opacity to 0                   transition my *opacity to 0
transition element #foo width to 100px       transition #foo's *width to 100px
```

`transition` now also supports `of` syntax: `transition *opacity of #el to 0`.

<div class="upgrade-step">

**Upgrade Step:** Search for `transition` commands and add `*` before style property names. Replace
`transition element #foo` with `transition #foo's`.

</div>
</div>

<div class="upgrade-section">

#### 4. as JSON is now parse, not stringify

In previous versions, [`as JSON`](/expressions/as) called `JSON.stringify()`. It now calls `JSON.parse()`,
matching the natural reading of "interpret this as JSON". A new `as JSONString` conversion handles
stringification.

<div class="upgrade-step">

**Upgrade Step:** Search for `as JSON`. If it was being used to stringify an object, replace with `as JSONString`.
If it was parsing a JSON string, no change needed.

</div>
</div>

<div class="upgrade-section">

#### 5. Values:JSON and Values:Form removed

The colon-based conversion modifiers have been replaced by the more general [pipe operator](/expressions/as).

<div class="upgrade-step">

**Upgrade Step:** Replace `as Values:JSON` with `as Values | JSONString`. Replace `as Values:Form` with
`as Values | FormEncoded`.

</div>
</div>

<div class="upgrade-section">

#### 6. default uses nullish check

[`default`](/commands/default) previously used a truthy check, so `default x to 10` would overwrite `0` and
`false`. It now uses a nullish+empty check: only `null`, `undefined`, and `""` are considered unset.

<div class="upgrade-step">

**Upgrade Step:** If you relied on `default` overwriting falsy values like `0` or `false`, use an explicit
`if` instead.

</div>
</div>

<div class="upgrade-section">

#### 7. \[@ syntax deprecated

The `[@attr]` bracket-style attribute access has been deprecated in favor of the
[`@attr` literal](/expressions/attribute-ref).

<div class="upgrade-step">

**Upgrade Step:** Replace `[@attr]` with `@attr`.

</div>
</div>

<div class="upgrade-section">

#### 8. go to url and scroll form deprecated

The `url` keyword in [`go to`](/commands/go) `url X` is no longer needed — `go to` now accepts naked URLs
directly.

The scroll form `go to the top of ...` continues to work but has been superseded by the dedicated
[`scroll`](/commands/scroll) command.

<div class="upgrade-step">

**Upgrade Step:** Replace `go to url X` with `go to X`. If you like, replace `go to the top of #el` with
`scroll to the top of #el`.

</div>
</div>

<div class="upgrade-section">

#### 9. processNode() deprecated

The API has been renamed to `process()` to align with htmx's naming. The old name still works as an alias.

<div class="upgrade-step">

**Upgrade Step:** Replace `_hyperscript.processNode(` with `_hyperscript.process(`.

</div>
</div>

<div class="upgrade-section">

#### 10. async keyword removed

The async keyword was of limited utility and was confusing due to it having the opposite meaning of JavaScript.  It has
been removed.  If you need to run an asynchrnous operation without blocking you can do so in JavaScript.

<div class="upgrade-step">

**Upgrade Step:** Remove `async` from your hyperscript code, moving any necessarily non-blocking async operations out
to JavaScript.

</div>
</div>

<div class="upgrade-section">

#### 11. Bundle format changed

`dist/_hyperscript.js` is now IIFE (was UMD). Plain `<script>` tags work unchanged.

<div class="upgrade-step">

**Upgrade Step:** If you use ES module imports, switch to `dist/_hyperscript.esm.js`.

</div>
</div>

Enjoy!
