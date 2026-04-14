---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Extensions {#extensions}

Hyperscript is designed to be extended.  You can add your own commands, expressions, and features to the
language, and several useful extensions ship with the project.

### Built-In Extensions {#built-in}

These extensions ship in the `dist/ext/` directory and must be loaded separately after hyperscript:

- [Components](/features/components) -- Custom elements with reactive templates and slots
- [EventSource](/features/eventsource) -- Server-Sent Events (see [Networking](/docs/networking/#eventsource))
- [Intercept](/features/intercept) -- Service worker DSL for caching and offline support (see [Networking](/docs/networking/#intercept))
- [Socket](/features/socket) -- WebSockets (see [Networking](/docs/networking/#socket))
- [Worker](/features/worker) -- Web Workers declared inline in hyperscript
- Tailwind -- Support for Tailwind CSS classes with special characters (`:`, `/`) in class operations
- [HDB Debugger](/commands/breakpoint) -- Interactive in-browser debugger

Each extension is loaded via an additional `<script>` tag. For example:

```html
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.91/dist/_hyperscript.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hyperscript.org@0.9.91/dist/ext/socket.min.js"></script>
```

See each extension's feature page for specific install instructions.

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

Hyperscript has a pluggable grammar that allows you to define new features, commands and certain types of expressions.

Here is an example that adds a new command, `foo`, that logs "A Wild Foo Was Found!" if the value of its expression
was "foo":

  ~~~ javascript
  // register for the command keyword "foo"
  _hyperscript.addCommand('foo', function(parser) {

    // A foo command must start with "foo".
    if(!parser.matchToken('foo')) return

    // Parse an expression.
    const expr = parser.requireElement('expression');

    return {
      // All expressions needed by the command to execute.
      // These will be evaluated and the results passed to resolve().
      args: { value: expr },

      // Implement the logic of the command.
      // Can be synchronous or asynchronous.
      // @param {Context} context The runtime context, contains local variables.
      // @param {Object} args The evaluated args, keyed by name.
      resolve(context, { value }) {
        if (value == "foo") {
          console.log("A Wild Foo Was Found!")
        }
        // Return the next command to execute.
        return context.meta.runtime.findNext(this, context)
      }
    }
  })
  ~~~

With this command defined you can now write the following hyperscript:

```hyperscript
  def testFoo()
    set str to "foo"
    foo str
  end
```

And "A Wild Foo Was Found!" would be printed to the console.

<div class="docs-page-nav">
<a href="/docs/components/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Components</strong></a>
<a href="/docs/conclusion/" class="next"><strong>Conclusion</strong> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></a>
</div>

</div></div>
