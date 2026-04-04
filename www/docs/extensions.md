---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Extensions {#extensions}

Hyperscript is designed to be extended.  You can add your own commands, expressions, and features to the
language, and several useful extensions ship with the project.

### Built-In Extensions {#built-in}

These extensions are available in the `src/ext/` directory and can be included separately:

- [**EventSource**](/features/eventsource) — Server-Sent Events (see [Networking](/docs/networking/#eventsource))
- [**Socket**](/features/socket) — WebSockets (see [Networking](/docs/networking/#socket))
- **Tailwind** — Support for Tailwind CSS classes with special characters (`:`, `/`) in class operations
- [**HDB Debugger**](/commands/breakpoint) — Interactive in-browser debugger

#### HDB Debugger {#hdb}

The [HDB extension](/commands/breakpoint) adds a `breakpoint` command that opens an interactive
in-browser debugger, letting you step through hyperscript execution, inspect variables, and
evaluate expressions:

  ~~~ hyperscript
  on click
    set x to 10
    breakpoint
    put x into #output
  ~~~

### Writing Your Own {#writing-extensions}

Hyperscript's parser is extensible via the grammar API.  You can register new commands, expressions,
and features.

A simple custom command:

  ~~~ javascript
  _hyperscript.addCommand("greet", function(parser, runtime, tokens) {
    // parse the command
    if (!tokens.matchToken("greet")) return;
    var name = parser.requireElement("expression");

    return {
      args: [name],
      op: function(context, name) {
        alert("Hello, " + name + "!");
        return runtime.findNext(this);
      }
    };
  });
  ~~~

  ~~~ html
  <button _="on click greet 'World'">Say Hello</button>
  ~~~

See the [advanced docs](/docs/advanced/#extending) for the full extension API.

<div class="docs-page-nav">
<a href="/docs/reactivity/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Reactivity</strong></a>
</div>

</div></div>
