
<div id="intro-to-hyperscript">

# hyperscript is an easy & approachable language designed for modern front-end web development

<div id="sample" class="basicgrid" style="align-items: stretch" _="
  on mouseenter queue none
    repeat until event mouseleave
      transition #sample-tip's transform to 'translateX(-2ch)' using 'all 500ms ease-out'
      transition #sample-tip's transform to initial            using 'all 500ms ease-in'">

<pre><code id="snippet" class="lang-hyperscript">writeText(the #snippet's innerText)
  into the navigator's clipboard
put 'copied!' into me
wait 1s
put 'copy' into me</code></pre>

<figure class="col-1 center">
<span id="sample-tip">see it in action &rarr;</span>
<button class="btn primary" _="on click
writeText(the #snippet's innerText) into the navigator's clipboard
put 'copied!' into me
wait 1s
put 'copy' into me">
copy
</button>
</figure>
</div>
</div>

hyperscript makes writing event handlers and highly
responsive user interfaces easy with a clear, DOM-oriented syntax and by transparently
 handling asynchronous behavior for you &mdash; easier than callbacks, promises, even async/await.

## features

<div id="features-list">

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

**An [xTalk](https://en.wikipedia.org/wiki/XTalk) syntax, inspired by [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)**


</div>

<div id="links">

[Companion of **htmx**](https://htmx.org) |
[**Comparison** with VanillaJS & jQuery](/comparison) |
[Read the **docs**](/docs) |
[Try it on the **playground**](/playground)

 <span id='install'>Install: <input type=text style=display:inline;width:auto readonly value='<script src="https://unpkg.com/hyperscript.org@0.9.5"></script>'>
<button
  _="on click
  writeText(my previousElementSibling's value) on navigator.clipboard
  put 'copied!' into me
  wait 1s
  put 'copy' into me">copy</button>
</span>

</div>

hyperscript is in active development and is working to a 1.0 release. At this
time, the syntax and core feature set are considered to be reasonably complete.
Key areas of focus for 1.0 include additional test cases and documentation
improvements. Please join us at the
<a style="color: darkgoldenrod;font-weight: bold" href="https://htmx.org/discord">#hyperscript discord channel</a>
as we push to 1.0! Thank you!

<aside class="box warn crowded">

NB: because hyperscript relies on
[promises](https://caniuse.com/?search=Promise) it cannot offer IE11
compatibility

</aside>

## examples

{% example %}
<button _="on click toggle .big-text">
  Toggle the "big-text" class on me on click
</button>
{% endexample %}

<style>
button.big-text {
  font-size: 2em;
}
</style>

{% example %}
<div _="on mouseenter toggle .visible on #help until mouseleave">
  Mouse Over Me!
</div>
<div id="help"> I'm a helpful message!</div>
{% endexample %}

<style>
#help {
  opacity: 0;
}
#help.visible {
  opacity: 1;
  transition: opacity 200ms ease-in;
}
</style>

{% example %}
<button _="on click
             call alert('OK, Going to put the current date into the output!')
             make a Date then put it into the next <output/>">
  Show An Alert
</button>
<output>--</output>
{% endexample %}
