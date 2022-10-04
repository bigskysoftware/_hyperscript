
<style>
  #features-list pre {
    margin-left: auto;
    width: max-content;
    max-width: 100%;
    min-width: 0;
  }
</style>

<div id="intro-to-hyperscript" class="f-switch align-items:center" style="--col-width: 60ch;">

<div>

# The language of interaction.

HTML gets the scripting language it deserves, with advanced event handling features and concise DOM manipulation.
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
      over 500ms
  end
~~~

</figure>

<span class="center"><button class="crowded padding padding-block allcaps" _="
on pointerdown
  repeat until event pointerup
    set rand to Math.random() * 255
    transition *background-color
            to `hsl($rand 100% 90%)`
          over 500ms
  end">Try me: press and hold</button></strong>

Try more examples in the [**playground**](/playground)
{style="font-size:1rem; text-align: center"}

</div>
</div>


<div id="features-list" style="--density: 2">

**Events** are the channel to the web page from the human body.
_hyperscript's event listener features handle the mechanics of handling events
--- [filtering](/docs/#event_filters), [queueing](/docs/#event_queueing) and more ---
to let you focus on reacting to the events.
Furthermore, the ease of dispatching [custom events](/docs/#sending-events) means that
you can use events for communication between parts of a page.
<br>**&rarr; In action:**{.info .color}
[Disable a Button During an htmx Request](/cookbook/#40-disable-btn-during-request),
[Drag-and-drop elements](/cookbook/#70-drag-n-drop),
[Event Filter](/cookbook/#80-event-filtering)

~~~hyperscript
on input debounced at 15s   send updated to form
~~~

**The [xTalk](https://en.wikipedia.org/wiki/XTalk) syntax**
(remember [HyperCard](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)?)
of _hyperscript is designed with the DOM as first priority.
[CSS selector literals](/expressions/#css) and [positional operators](/docs/#in) make it a breeze to access elements.
Clear, concise [commands](/reference/#commands) let you modify these elements with modern DOM APIs.
<br>**&rarr; In action:**{.info .color}
[Filter A Group Of Elements](/cookbook/#60-filter-a-group-of-elements),
[Filter table rows](/cookbook/#90-filter-table-rows),
[Disable all Buttons During an htmx Request](/cookbook/#50-disable-btn-during-request-all)

~~~hyperscript
tell <details /> in .article   set you.open to false
~~~

_hyperscript excels in **enhancing existing HTML.**
Where frameworks demand full control over HTML generation to work their magic,
_hyperscript stays low-level to give you control over the DOM.
This means no reactivity or data binding --- respond to user interactions, not data flow.

**No more jQuery soup**. _hyperscript can be written [directly in HTML](), and stays readable when it is.
Organize your app by features, not languages. Achieve [locality](https://htmx.org/essays/locality-of-behaviour/).
If you do need to factor out your _hyperscript, you can use [behaviors](/docs/#behaviors).

~~~html
<div _="install Draggable(dragHandle: .titlebar in me)">
~~~

**Async-transparency** means _hyperscript makes asynchronous code as simple as synchronous ---
even simpler than Promises or async/await.
Call async functions and access their results with no ceremony,
or send some code off to run while you focus on other stuff.
All the non-blocking goodness, without the [red/blue functions](https://journal.stuffwithstuff.com/2015/02/01/what-color-is-your-function/).


~~~hyperscript
fetch /words.json as json then set acceptedWords to the result
~~~

**Fully interoperable** with JavaScript, _hyperscript makes the perfect glue language for libraries.
It also has a super-easy way to write [web workers](/docs#workers), if that's your thing.

~~~hyperscript
js(haystack) return /needle/gi.exec(haystack) end
~~~

There is a **graphical [debugger](/docs#debugging)** to inspect your code as it runs.
Jump back and forth and bend time to your whim to iron out tricky UI glitches.

~~~hyperscript
on click   breakpoint
~~~

The whole language is written to be **[extensible](/docs/#extending)**.
You can add new commands or expressions using nothing more than good-old JavaScript.

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
