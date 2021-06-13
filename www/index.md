<div style="background-color: lightgoldenrodyellow; margin: 16px; border-radius: 8px;
color: darkgoldenrod; border: gold 1px solid; font-size: 20px">
<p>hyperscript is in active development and is working to a 1.0 release.</p>
<p>At this time the syntax and core feature set are considered to be reasonably complete.
Key areas of focus for 1.0 include additional test cases and documentation improvements.</p>
<p>Please join us at the
<a style="color: darkgoldenrod;font-weight: bold" href="https://htmx.org/discord">#hyperscript discord channel</a>
as we push to 1.0!  Thank you!</p>
</div>

## intro

hyperscript is a scripting language designed for modern front-end web development.

hyperscript makes writing event handlers and highly responsive user interfaces trivial with native language support
for async behavior - easier than promises or async/await.

hyperscript features include:

* Events as first class citizens in the language. Clean syntax for [responding to](/features/on) and
  [sending](/commands/send) events, as well as [event-driven control flow](docs/#event-control-flow)
* DOM-oriented syntax with seamless integrated [CSS id, CSS class and CSS query literals](https://hyperscript.org/expressions/#css)
* First class [web workers](/docs#workers)
* An [async-transparent](/docs#async) runtime for highly responsive user experiences.
* A [pluggable & extendable](/docs/#extending) parser & grammar
* A [debugger](/docs#debugging) to step through hyperscript code

You can see a comparison of hyperscript, vanillaJS and jQuery [here](/comparison).

hyperscript is a companion project of [htmx](https://htmx.org).

Because hyperscript relies on [promises](https://caniuse.com/?search=Promise), it does not strive for IE11 compatibility.

## examples

```html
<script src="https://unpkg.com/hyperscript.org@0.8.0"></script>

<button _="on click toggle .big-text">
  Toggle the "big-text" class on me on click
</button>

<div _="on mouseenter toggle .visible on #help until mouseleave">
  Mouse Over Me!
</div>
<div id="help"> I'm a helpful message!</div>

<button _="on click log me then call alert('yep, it\’s an alert')">
    Show An Alert
</button>
```

## demos

Here are the examples above in demo form:

<div class="row">
    <div class="4 col">
        <style>
        button {
          transition: all 300ms ease-in;
        }
        button.big-text {
          font-size: 2em;
        }
        </style>
        <button class="btn primary" _="on click toggle .big-text">
          Toggle .clicked
        </button>
        </div>
    <div class="4 col">
        <style>
        #help {
          opacity: 0;
        }
        #help.visible {
          opacity: 1;
          transition: opacity 200ms ease-in;
        }
        </style>
        <div _="on mouseenter toggle .visible on #help until mouseleave">
          Mouse Over Me!
        </div>
        <div id="help"> I'm a helpful message!</div>
    </div>
    <div class="4 col">
        <button class="btn primary" _="on click log me then call alert('yep, it\'s an alert - check the console...')">
            Show An Alert
        </button>
    </div>
</div>

## origins

Hyperscript was originally inspired by [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf).

## haiku

_the unknown button<br/>
so often inscrutable<br/>
now says what it does_
