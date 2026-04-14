---
layout: layout.njk
tags: post
title: hyperscript 0.9.90 has been released!
date: 2026-03-29
---

## hyperscript 0.9.90 Release

We are pleased to present the 0.9.90 release of hyperscript. This is a significant release that includes a complete
internal restructuring, a new experimental reactivity system, a rewritten templating system, DOM morph support
an experimental components mechanism, many new commands and expressions, and improved error handling.

There is an [Upgrade Guide](#upgrade-guide) at the bottom of this release note.

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

The [`render`](/commands/render) command and template language are now built into core - no extension script needed.
Templates use `<script type="text/hyperscript-template">` elements with `${}` interpolation and `#`-prefixed control flow:

```html
<script type="text/hyperscript-template" id="user-card">
#for user in users
  <div class="card">
    <h3>${user.name}</h3>
    #if user.bio
      <p>${user.bio}</p>
    #end
  </div>
#end
</script>

<button _="on click
  fetch /users as JSON
  set userDat to the result
  render #user-card with users: userData
  put the result into #container">
  Load Users
</button>
```

Interpolated expressions are HTML-escaped by default. Use `${unescaped expr}` for raw output.

### Morph

The [`morph`](/commands/morph) command by @Latent22 brings DOM morphing to hyperscript - powered by
[idiomorph](https://github.com/bigskysoftware/idiomorph), it intelligently patches the DOM while preserving
focus, scroll position, and form state:

```hyperscript
morph #container with newHtml
morph me with responseHtml
```

### Components

A new components system (`component`) lets you define custom elements with reactive templates, slots,
and scope isolation - all declared in a single `<script type="text/hyperscript-template">`:

```html
<script type="text/hyperscript-template" component="my-counter">
  <button _="on click increment ^count">+1</button>
  <output _="live put ^count into me"></output>
</script>

<my-counter></my-counter>
```

### DOM-Scoped Variables

[Variables](/docs#scoping) with the `^` prefix are scoped to the element and inherited by all descendants,
ideal for component state without polluting the global scope:

```html
<div _="init set ^count to 0">
  <button _="on click increment ^count">+1</button>
  <output _="live put ^count into me"></output>
</div>
```

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

#### empty / clear

[`empty`](/commands/empty) (or its alias `clear`) clears an element's content. It's smart about what it
clears - inputs get their values reset, checkboxes get unchecked, selects get deselected, forms get all
their fields cleared, and regular elements get their children removed. It also works on arrays, sets,
and maps:

```hyperscript
on click empty #results           -- remove children
on click clear #search-input      -- clear input value
on click empty myArray            -- splice the array
```

#### reset

[`reset`](/commands/reset) restores a form or input to its default value (the value it had when the page loaded):

```hyperscript
on click reset <form/>
on click reset #name-input
```

#### swap

[`swap`](/commands/swap) exchanges the values of two assignable expressions - variables, properties, array
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

Text-to-speech via the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) - a
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

Pause execution in the browser DevTools. Now built in to core - no hdb extension required:

```hyperscript
on click
  breakpoint
  add .active
```

#### toggle between values

The [`toggle`](/commands/toggle) command now supports cycling any writable value through a list of values
with `between`. Each toggle advances to the next value, wrapping around:

```hyperscript
-- cycle a style property between specific values
toggle *display of #panel between 'none' and 'flex'
toggle *opacity of me between '0', '0.5' and '1'

-- cycle a variable through values
toggle $mode between 'edit' and 'preview'
toggle $theme between 'light', 'dark' and 'auto'
```

This works with any [assignable expression](/commands/set) - variables, properties, style refs - and
supports any number of values, not just two.

#### take enhancements

The [`take`](/commands/take) command gains two features:

**`giving` keyword** -- an alternative to `with` that reads more naturally after the `from` clause:

```hyperscript
take @aria-selected='true' from <[role=tab]/> in me giving 'false' for tab
```

**Class swap** -- `take` now supports a replacement class via `with` or `giving`, so the
`from` elements get one class and the `for` target gets the other:

```hyperscript
take .selected from .opt giving .unselected for the closest <.opt/> to the target
```

#### remove properties and array indices

The [`remove`](/commands/remove) command now works on object properties and array indices:

```hyperscript
remove :arr[1]         -- splices index 1 out of the array
remove :obj.field      -- deletes the property
remove field of :obj   -- same, using the `of` form
```

For arrays, `remove` uses `splice` (indices shift). For objects, it uses `delete`.
If the value at the expression is a DOM node, `remove` falls through to DOM detachment
as before.

#### hidden hide/show strategy

A new built-in [`hide`/`show`](/commands/hide) strategy uses the native `hidden` attribute:

```hyperscript
hide me with hidden
show me with hidden
```

Set it as the default for your whole app:

```js
_hyperscript.config.defaultHideShowStrategy = "hidden"
```

### New Expressions & Syntax

#### Collection Expressions

Filter, sort, map, split, and join collections with postfix expressions that chain naturally.
[`it`/`its`](/expressions/it) refer to the current element. In a `for` loop, the `where`
clause can also use the loop variable name directly:

```hyperscript
items where its active sorted by its name mapped to its id
"banana,apple,cherry" split by "," sorted by it joined by ", "
<li/> in #list where it matches .visible
for x in items where x.score > 10 ...
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

### CLI Validation Tool

A new `--validate` flag lets you check all hyperscript in your project for syntax errors from the command
line, useful for CI and for catching issues during upgrades:

```bash
npx hyperscript.org --validate
npx hyperscript.org --validate src/ templates/
```

It scans `.html` files for `_="..."` attributes and `<script type="text/hyperscript">` blocks, parses them,
and reports errors with file, line, and column numbers. See the [documentation](/docs/conclusion/#validate)
for the full set of options.

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

#### Validate your codebase

This release includes a CLI validation tool. Run it before and after upgrading to catch any
syntax errors introduced by the breaking changes below:

```bash
npx hyperscript.org --validate
```

This scans your `.html` and `._hs` files, parses all hyperscript, and reports errors with
file, line, and column numbers. See the [full documentation](/docs/conclusion/#validate) for
options like targeting specific directories, adding file extensions, and CI integration.

</div>

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

The `url` keyword in [`go to`](/commands/go) `url X` is no longer needed - `go to` now accepts naked URLs
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

#### 12. Multi-line `/* */` comments removed

JavaScript-style `/* ... */` block comments are no longer supported. Use `--` or `//`
line comments instead (both were already supported). This change enables patterns
like `/api/*` to work correctly in expressions and route patterns.

<div class="upgrade-step">

**Upgrade Step:** Replace any `/* ... */` comments with `--` or `//` line comments.

</div>

#### 13. `fetch` throws on non-2xx responses

The `fetch` command now throws on 4xx/5xx responses by default, matching the
behavior of most modern HTTP libraries. This surfaces errors that previously
passed through silently.

<div class="upgrade-step">

**Upgrade Step:** If you were relying on 404/500 responses passing through, either:

- Add `do not throw` to the fetch command: `fetch /api as JSON do not throw`
- Use `as Response` to get the raw Response: `fetch /api as Response`
- Wrap in a `catch` block to handle errors
- Set `_hyperscript.config.fetchThrowsOn = []` to restore old behavior globally

</div>
</div>

### Upgrade Music

<iframe style="width:100%;aspect-ratio:16/9;" src="https://www.youtube.com/embed/g2DXFmOuFA0" title="Waveshaper - Friends Again" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Enjoy!
