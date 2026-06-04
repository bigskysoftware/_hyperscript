---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Debugging {#debugging}

_hyperscript ships with a **visual debugger** as a loadable extension. It gives you breakpoints,
step-through execution, a local-scope inspector, a paused-context REPL, and a time-travel history
of every command that has run on the page.

The debugger is a single extension file — no build step, no devtools panel, no extra tooling. It
loads into whatever page you're already working on and floats a HyperCard-inspired window on top.

### Loading {#loading}

Add the extension alongside the core `<script>` tag:

```html
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.91/dist/_hyperscript.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.91/dist/ext/debugger.min.js"></script>
```

Or, without preloading, press <kbd>Ctrl</kbd>+<kbd>.</kbd> on any page that loads _hyperscript and
the core will lazy-load the debugger from the same CDN path.

### Opening the Panel {#opening}

Press <kbd>Ctrl</kbd>+<kbd>.</kbd> (or <kbd>⌘</kbd>+<kbd>.</kbd> on macOS) to toggle the panel.

The layout has three regions:

- **Element panel** (left) — every element on the page that has an `_`, `script`, or
  `data-script` attribute. Click one to open its script in the editor. The filter box
  at the top narrows the list by tag / id / class, case-insensitively.
- **Detail pane** (center) — the selected element's tag plus a Monaco-powered editor
  showing its script. Debug controls sit at the top of the editor row; the variables
  panel appears to the right when execution is paused.
- **Console** (right) — a REPL that evaluates _hyperscript against the selected element,
  plus log output from commands like `log`.

You can dock the panel to the bottom or right via the toolbar buttons. Drag the splitters
between regions to resize. Dragging the console splitter all the way to the edge collapses
it; dragging a collapsed console opens it again. All of this — dock, sizes, collapsed state,
open/closed, selected element, and breakpoints — persists across page reloads.

### Breakpoints {#breakpoints}

Click in the editor's gutter (next to a line number) to toggle a breakpoint on that line.
Breakpoints are per-element and survive reloads.

When execution reaches a breakpoint it pauses *before* running that command. The editor
grows a blue outline and flashes briefly and the debug toolbar enables stepping. You can
inspect any value from the paused context by typing expressions into the REPL console.

### Stepping {#stepping}

While paused, the debug toolbar exposes five actions. Each has a keyboard shortcut while the
panel has focus:

| Button | Key | What it does |
|---|---|---|
| ◀ Step Back | <kbd>F9</kbd> | Rewind one command in the current event-handler invocation |
| ▶ Step | <kbd>F10</kbd> | Run the current command, break at the next one |
| ↻ Step Over | <kbd>F11</kbd> | Run and break at the next command at or above the current nesting depth |
| ▶▶ Continue | <kbd>F8</kbd> | Resume normally until the next breakpoint |
| ■ Stop | — | Abandon the paused command and exit debug mode |

### Time Travel {#time-travel}

Step Back rewinds through the **recorded timeline** of commands. DOM mutations are undone, the
highlight moves back one command, and you can keep going all the way to the first recorded
step. Step forward to replay toward the present; stepping forward past the last recorded
command exits time-travel and restores the live paused view (if there is one), at which point
Continue resumes normal execution.

### The Timeline Panel {#timeline}

The **Timeline** panel sits at the bottom of the debugger and shows a scrollable, vertical
list of every command that has run on the page. Each row shows the step's index and the
command source; the row you're currently viewing is highlighted, errored steps are red, and
async steps are marked.

Click any row to time-travel straight to that step: the DOM, editor highlight, and selected
element all jump to that moment. Hovering a row highlights its owner element on the page.

Use the **Live** button to leave time-travel and return to the present, and **Clear** to wipe
the recorded history. The timeline records continuously while the debugger is loaded, so you
can open it after the fact to see what already happened.

Additional URL parameters:


### The Paused REPL {#repl}

The console evaluates _hyperscript against the selected element. While paused, it also has
full access to the paused execution context, so expressions like `it`, `result`, and locals
resolve to exactly what you'd see in the vars panel:

```hyperscript
:count
set :count to 100
the closest <ul/> to it
```

You can also highlight a region of code in the editor and <kbd>Shift</kbd>+<kbd>middle-click</kbd>
it to evaluate that exact text in the console.

### Picking Elements From The Page {#shift-picker}

Hold <kbd>Shift</kbd> while the debugger is visible and your focus is *on the page* (not in the
debugger): every hyperscript element on the page gets a blue halo. Middle-click any of them to
jump straight to it in the element panel.

### Programmatic API {#api}

The debugger panel object is `_hyperscript.debugger`:

```js
_hyperscript.debugger.toggle()    // show/hide the panel
_hyperscript.debugger.step()      // programmatic F10
_hyperscript.debugger.continue()  // programmatic F8
```

### See Also {#see-also}

The [`breakpoint` command](/commands/breakpoint) and its associated HDB extension offer an
older, simpler debugger driven by placing a `breakpoint` keyword in your source. The
visual debugger described here is additive — both can be used together.

<div class="docs-page-nav">
<a href="/docs/networking/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Networking</strong></a>
<a href="/docs/templates/" class="next"><strong>Templates & Morphing</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
