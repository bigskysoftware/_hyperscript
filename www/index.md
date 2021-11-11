
<header id="intro-to-hyperscript">

# hyperscript is an easy and approachable language designed for modern front-end web development

<div id="sample">

<pre _="
  on mouseenter queue none
    repeat until event mouseleave
      transition #sample-tip's transform to 'translateX(-2ch)' using 'all 500ms ease-out'
      transition #sample-tip's transform to initial            using 'all 500ms ease-in'
"><code id="snippet" class="lang-hyperscript">writeText(#snippet's innerText)
  on navigator.clipboard
put 'copied!' into me
wait 1s
put 'copy' into me</code></pre>

<p style="text-align: right">
<span id="sample-tip">see it in action &rarr;</span>
<button class="btn primary" style="margin: auto" _="on click
writeText(#snippet's innerText) on navigator.clipboard
put 'copied!' into me
wait 1s
put 'copy' into me">
copy
</button>

</div>
</header>

 <span class="lede">hyperscript makes writing event handlers and highly
responsive user interfaces trivial with native language support for async
behavior&mdash;easier than callbacks, promises, even async/await.</span>

<div id="features">

**Events as first class citizens in the language**&mdash;clean syntax for
[receiving](/features/on) and [sending](/commands/send) events, as well as
[event-driven control flow](docs/#event-control-flow)

**DOM-oriented syntax**&mdash;seamless integrated [CSS id, CSS class and CSS
query literals](https://hyperscript.org/expressions/#css)

**First-class [web workers](/docs#workers)**

**[Async-transparent](/docs#async) runtime**&mdash;highly responsive user
experiences without callback hell

**[Pluggable & extendable](/docs/#extending)** parser & grammar

**[Debugger](/docs#debugging)** to step through hyperscript code

**Inspired by [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)**
  (not AppleScript)

</div>

<div id="links">

[Companion of **htmx**](https://htmx.org) |
[**Comparison** with vanilla JS and jQuery](/comparison) |
[Read the **docs**](/docs) |
[Try it on the **playground**](/playground)
<span id='install'>Install: `<script src="https://unpkg.com/hyperscript.org@0.8.3"></script>`
<button style="font:inherit; background: none; border: none; color: #3465a4"
  _="on click
  writeText(my previousElementSibling's innerText) on navigator.clipboard
  put 'copied!' into me
  wait 1s
  put 'copy' into me">copy</button>
</span>

</div>

<small style="color: darkgoldenrod;">
<b style="font-size: 2em; padding: 4px .2ch 0 0; line-height: 1; float: left">β</b>
hyperscript is in active development and is working to a 1.0 release. At this
time, the syntax and core feature set are considered to be reasonably complete.
Key areas of focus for 1.0 include additional test cases and documentation
improvements. Please join us at the
<a style="color: darkgoldenrod;font-weight: bold" href="https://htmx.org/discord">#hyperscript discord channel</a>
as we push to 1.0! Thank you!</p>
</small>

 <small><em>NB: because hyperscript relies on
[promises](https://caniuse.com/?search=Promise), it does not strive for IE11
compatibility, unlike htmx.</em></small>

<style>
#intro-to-hyperscript {
  display: flex;
  position: relative;
  flex-flow: row wrap;
  justify-content: stretch;
  align-items: center;
}

#intro-to-hyperscript h1 {
  flex: 4 6 18ch;
  margin-right: 2em;
  font-size: clamp(1.2em, 5vw, 2em);
}

#intro-to-hyperscript #sample {
  flex: 1 1 max-content;
  max-width: 100%;
}

#sample-tip {
  display: inline-block;
}

.lede {
	font-size: clamp(1.1em, 2vw, 1.2em);
}

#features {
  column-width: 40ch;
  column-gap: 2em;
}

#features > * {
  margin: 0 0 1.4em 0;
}

#links p {
  margin: 1.4em 0;
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  text-align: center;
  gap: .2em 2ch;
}

.example {
  margin: .5em auto;
  text-align: center;
}
</style>

## examples

```html
<button _="on click toggle .big-text">
  Toggle the "big-text" class on me on click
</button>
```

<div class="example">
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

```html
<div _="on mouseenter toggle .visible on #help until mouseleave">
  Mouse Over Me!
</div>
<div id="help"> I'm a helpful message!</div>

```

<div class="example">
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

```html
<button _="on click log me then call alert('yep, it’s an alert')">
  Show An Alert
</button>
```

<div class="example">
<button class="btn primary" _="
  on click
    log me then call alert('yep, it\'s an alert - check the console...')">
  Show An Alert
</button>
</div>
