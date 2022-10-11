
<style>
  #features-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0 var(--gap);
    margin: var(--gap) 0;
  }
  @media (min-width: 60ch) {
    #features-list {
      max-width: 100%;
      grid-template-columns: 1fr 1fr;
    }
  }
  #features-list h2 {
    grid-column: 1 / -1;
  }
  #features-list pre {
    white-space: pre-wrap;
  }
</style>

<div id="intro-to-hyperscript" class="f-switch align-items:center" style="--col-width: 60ch; border-block-end: 1px solid var(--faded-fg);">

<div>

# Scripting for hypertext

HTML gets the language it deserves, with advanced event handling features and concise DOM manipulation.
_hyperscript has a simple goal: **make websites written in plain-old markup a joy to use.**

Install: `<script src="https://unpkg.com/hyperscript.org@0.9.7"></script>`{.language-html}

<strong><a class="<button>" style="font-size:1em" href="/docs">Go to the docs</a></strong>

</div>

<div style="width: max-content; max-width: 100%; margin: auto">

<figure>

~~~ hyperscript
on pointerdown
  repeat until event pointerup
    set rand to Math.random() * 255
    transition
      *background-color
      to `hsl($rand 100% 90%)`
      over 250ms
  end
~~~

</figure>

<span class="center" style="margin-top: calc(-1.5*var(--gap))"><button class="crowded padding padding-block allcaps" _="
on pointerdown
  repeat until event pointerup
    set rand to Math.random() * 255
    transition *background-color
            to `hsl($rand 100% 90%)`
          over 250ms
  end">Try me: press and hold</button></strong>

Try more examples in the [**playground**](/playground)
{style="font-size:1rem; text-align: center"}

</div>
</div>


<div id="features-list" style="">

## A language for interaction

<div>

Listen to and dispatch events with ease.
[Filter](/docs/#event_filters), [queue](/docs/#event_queueing) or debounce them.
You can even have control flow based on events.

**In action &rarr;**{.info .color}
[Disable a button during an htmx request](/cookbook/#40-disable-btn-during-request),
[Drag-and-drop elements](/cookbook/#70-drag-n-drop),
[Event filter](/cookbook/#80-event-filtering)

</div>

~~~hyperscript
on input debounced at 15s
  send updated to form
~~~

## Progressive enhancement

<div>

_hyperscript excels in **enhancing existing HTML.**
Where frameworks demand full control over every step,
_hyperscript stays low-level to give you full control.
This means no reactivity or data binding &mdash; respond to user interactions, not data flow.

**No more jQuery soup**. _hyperscript can be written [directly in HTML](), and stays readable when it is.
Organize your app by features, not languages. Achieve [locality](https://htmx.org/essays/locality-of-behaviour/).
If you do need to factor out your _hyperscript, you can use [behaviors](/docs/#behaviors).

</div>

~~~html
<div _="install Draggable(
  dragHandle: .titlebar)">
~~~

## Remember [HyperCard](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)?

<div>

**The [xTalk](https://en.wikipedia.org/wiki/XTalk) syntax**
of _hyperscript is designed with the DOM as first priority.
[CSS selector literals](/expressions/#css) and [positional operators](/docs/#in) make it a breeze to access elements.
Simple [commands](/reference/#commands) backed by modern DOM APIs.

**In action &rarr;**{.info .color}
[Filter A Group Of Elements](/cookbook/#60-filter-a-group-of-elements),
[Filter table rows](/cookbook/#90-filter-table-rows),
[Disable all Buttons During an htmx Request](/cookbook/#50-disable-btn-during-request-all)

</div>

~~~hyperscript
tell <details /> in .article
  set you.open to false
~~~

## Programming on easy mode

**Async-transparency** means _hyperscript makes asynchronous code as easy as synchronous &mdash;
even easier than Promises or async/await.
All the non-blocking goodness, without the [red/blue functions](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/).


~~~hyperscript
fetch /words.json as json
set acceptedWords to the result
~~~

**Fully interoperable** with JavaScript, _hyperscript makes the perfect glue language for libraries.
It also has a super-easy way to write [web workers](/docs#workers), if that's your thing.

~~~hyperscript
js(haystack)
  return /needle/gi.exec(haystack)
end
~~~

There is a **graphical [debugger](/docs#debugging)** to inspect your code as it runs.
Jump back and forth and bend time to your whim to iron out tricky UI glitches.

~~~hyperscript
on click
  breakpoint
~~~

The whole language is written to be **[extensible](/docs/#extending)**.
You can add new commands or expressions using nothing more than good-old JavaScript.


~~~js
_hyperscript.addCommand(
  "foo",
  (parser, rt, tokens) => ...
~~~

</div>

<aside class="box warn crowded color">

hyperscript is under construction, working towards 1.0. While the syntax and
features are largely complete, we're focused on more tests and docs. Please join us at the
<a style="font-weight: bold" href="https://htmx.org/discord">#hyperscript discord channel</a>
&mdash; thank you!

Because hyperscript relies on
[promises](https://caniuse.com/?search=Promise), it cannot offer IE11
compatibility.

</aside>
