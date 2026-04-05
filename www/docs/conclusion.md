---
layout: layout.njk
title: ///_hyperscript
---

{% include "docs-layout-start.md" %}

## Misc. & Conclusion {#misc}

We have covered the basics (and not-so-basics) of hyperscript.

A few remaining bits: a handful of HyperTalk-inspired commands, debugging tools,
JavaScript interop and security considerations.

## HyperTalk-isms {#hypertalk-isms}

Hyperscript is a descendant of [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf),
the scripting language of HyperCard. A few of its commands are direct nods to HyperTalk,
wrapping browser APIs in the friendly English-like style that HyperCard was known for.

### Ask & Answer {#ask-answer}

HyperTalk had `ask` and `answer` commands for prompting the user. Hyperscript keeps the
names and wires them up to the browser's built-in dialogs:

  ~~~ hyperscript
  ask "What is your name?"
  put it into #greeting

  answer "File saved!"
  ~~~

`ask` wraps `prompt()` and places the result in `it`. `answer` wraps `alert()` by default.

With two choices, `answer` wraps `confirm()` and the result is the chosen label:

  ~~~ hyperscript
  answer "Save changes?" with "Yes" or "No"
  if it is "Yes"
    -- save...
  end
  ~~~

### Speech {#speech}

HyperTalk had a `speak` command that used the Mac's text-to-speech. Hyperscript's
`speak` does the same, using the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis):

  ~~~ hyperscript
  speak "Hello world"
  speak "Hello" with voice "Samantha"
  speak "Quickly now" with rate 2 with pitch 1.5
  ~~~

The command is async-transparent: it waits for the utterance to finish before continuing
to the next command. You can configure `voice`, `rate`, `pitch`, and `volume` using
`with` clauses.

## Debugging {#debugging}

Debugging hyperscript can be done a few different ways.  The simplest and most familiar way for most developers to debug
 hyperscript is the use of the [`log`](/commands/log) command to log intermediate results.  This is
the venerable "print debugging":

```hyperscript
get <div.highlighted/> then log the result
```

This is a reasonable way to start debugging but it is, obviously, fairly primitive.

### Beeping

An annoying aspect of print debugging is that you are often required to extract bits of expressions in order to
print them out, which can interrupt the flow of code.  Consider this example of hyperscript:

```hyperscript
  add .highlighted to <p/> in <div.hilight/>
```

If this wasn't behaving as you expect, and you wanted to debug the results, you might break it up like so:

```hyperscript
  set highlightDiv to <div.hilight/>
  log highlightDiv
  set highlightParagraphs to <p/> in highlightDiv
  log highlightParagraphs
  add .highlighted to highlightParagraphs
```

This is a fairly violent code change and it obscures what the actual logic is.

To avoid this, hyperscript offers a [`beep!`](/expressions/beep) operator.  The `beep!` operator can be thought of
as a pass-through expression: it simply passes the value of whatever expression comes afterwards through unmodified.

However, along the way, it logs the following information to the console:

* The source code of the expression
* The value of the expression
* The type of the expressions

So, considering the above code, rather than breaking things up, we might just try this:

```hyperscript
  add .highlighted to <p/> in beep! <div.hilight/>
```

Here we have added a `beep!` just before the `<div.hilight/>` expression.  Now when the code runs
we will see the following in the console:

```
///_ BEEP! The expression (<div.hilight/>) evaluates to: [div.hilight] of type ElementCollection
```

You can see the expressions source, its value (which you can right click on and assign to a temporary value to work
with in most browsers) as well as the type of the value.  All of this had no effect on the evaluation of the expression
or statement.

Let's store the `ElementCollection` as a temporary value, `temp1`.

We could now move the `beep!` out to the `in` expression like so:

```hyperscript
  add .highlighted to beep! <p/> in <div.hilight/>
```

And we might see results like this:

```
///_ BEEP! The expression (<p/> in <div.hilight/>) evaluates to: [] of type Array
```

Seeing this, we realize that no paragraphs elements are being returned by the `in` expression, which is why the class is
 not being added to them.

In the console we check the length of the original `ElementCollection`:

```
> temp1.length
0
```

And, sure enough, the length is zero.  On inspecting the divs in question, it turns out we had misspelled the class name
`hilight` rather than `highlight`.

After making the fix, we can remove the `beep!` (which is *obviously* not supposed to be there!):

```hyperscript
  add .highlighted to <p/> in <div.highlight/>
```

And things work as expected.

As you can see, `beep!` allows us to do much more sophisticated print debugging, while not disrupting code nearly as
drastically as traditional print debugging would require.

You can also use `beep!` [as a command](/commands/beep) to assist in your debugging.

### HDB - The Hyperscript Debugger

An even more sophisticated debugging technique is to use [hdb](/hdb), the Hyperscript Debugger, which allows you to
debug by inserting `breakpoint` commands in your hyperscript.

**Note: The hyperscript debugger is in alpha and, like the rest of the language, is undergoing active development**

To use it you need to include the `dist/ext/hdb.js` file. You can then add `breakpoint` commands in your hyperscript
to trigger the debugger.

{% example "Debugging" %}
<button _="
  on click
  tell next <output/>
    breakpoint
    put 'You can click <kbd><samp>Step Over</samp></kbd> to execute the command' into you
    put 'Click the <kbd><samp>&rdca;</kbd></samp> button to skip to a command'   into you
    put 'Click <kbd><samp>Continue</samp></kbd> when you’re done'                into you
    put '--'                                                                     into you
">Debug</button>
<output>--</output>
{% endexample %}

## Using JavaScript {#js-migration}

Hyperscript is directly integrated with JavaScript, providing ways to use them side by side and migrate with ease.

### Calling JavaScript {#js-call}

Any JavaScript function may be called directly from Hyperscript. See: [calling functions](/docs/language/#calling-functions).

  ~~~ html
  <button _="on click call alert('Hello from JavaScript!')">
    Click me.
  </button>
  ~~~

### Inline JavaScript {#js-inline}

Inline JavaScript may be defined using the [`js` keyword](/features/js).

  ~~~ html
  <div _="init js alert('Hello from JavaScript!') end"></div>
  ~~~

Return values are supported.

  ~~~ html
  <button _="on click js return 'Success!' end then put it into my.innerHTML">
   Click me.
  </button>
  ~~~

Parameters are supported.

  ~~~ html
  <button _="on click set foo to 1 js(foo) alert('Adding 1 to foo: '+(foo+1)) end">
   Click me.
  </button>
  ~~~

JavaScript at the top-level may be defined using the same [`js` command](/commands/js), exposing it to the global scope.

You may use inline JavaScript for performance reasons, since the Hyperscript runtime is more focused on flexibility, rather than performance.

This feature is useful in [workers](/features/worker), when you want to pass JavaScript across to the worker's
implementation:

  ~~~ html
  <script type="text/hyperscript">
    worker CoinMiner
      js
        function mineNext() {
          // a JavaScript implementation...
        }
      end
      def nextCoin()
        return mineNext()
      end
    end
  </script>
  ~~~

## Security {#security}

Hyperscript allows you to define logic directly in your DOM. This has a number of advantages, the
largest being [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/) making your system
more coherent.

One concern with this approach, however, is security. This is especially the case if you are injecting user-created
content into your site without any sort of HTML escaping discipline.

You should, of course, escape all 3rd party untrusted content that is injected into your site to prevent, among other
issues, [XSS attacks](https://en.wikipedia.org/wiki/Cross-site_scripting). The `_`, `script` and `data-script` attributes,
as well as inline `<script>` tags should all be filtered.

Note that it is important to understand that hyperscript is _interpreted_ and, thus, does not use eval (except for the inline js
features). You (or your security team) may use a [CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
that disallows inline scripting. This will have _no effect_ on hyperscript functionality, and is almost certainly not
what you (or your security team) intends.

To address this, if you don't want a particular part of the DOM to allow for hyperscript interpretation, you may place a
`disable-scripting` or `data-disable-scripting` attribute on the enclosing element of that area.

This will prevent hyperscript from executing within that area in the DOM:

```html
  <div data-disable-scripting>
    <%= user_content %>
  </div>
```

This approach allows you enjoy the benefits of [Locality of Behavior](https://htmx.org/essays/locality-of-behaviour/)
while still providing additional safety if your HTML-escaping discipline fails.

## Language History {#history}

The initial motivation for hyperscript came when I ported [intercooler.js](https://intercoolerjs.org) to
htmx.  Intercooler had a feature, [`ic-action`](https://intercoolerjs.org/attributes/ic-action.html) that
allowed for some simple client-side interactions.  One of my goals with htmx was to remove non-core functionality
from intercooler, and really focus it in on the hypermedia-exchange concept, so `ic-action` didn't make the
cut.

However, I couldn't shake the feeling that there was something there: an embedded, scripty way of doing light
front end coding.  It even had some proto-async transparent features.  But, with my focus on htmx, I had to
set it aside.

As I developed htmx, I included an extensive [event model](https://htmx.org/reference/#events). Over time,
I realized that I wanted to have a clean way to utilize these events naturally and directly within HTML.  HTML supports `on*` attributes for handling standard DOM events (e.g. `onClick`) of course, but they don't work for custom events like `htmx:load`.

The more I looked at it, the more I thought that there was a need for a small, domain specific language that was
event oriented and made DOM scripting efficient and fun.  I had programmed in [HyperTalk](https://en.wikipedia.org/wiki/HyperTalk), the scripting language for [HyperCard](https://en.wikipedia.org/wiki/HyperCard), when I was younger and remembered that it integrated events very well into the language.  So I dug up some old documentation on it and began work on hyperscript, a HyperTalk-derived scripting language for the web.

And here we are.  

I hope you find the language useful!

Or, at least, funny.  :)

<div class="docs-page-nav">
<a href="/docs/extensions/" class="prev"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg> <strong>Extensions</strong></a>
</div>

</div></div>
