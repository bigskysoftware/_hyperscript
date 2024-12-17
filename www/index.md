
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

<div id="intro-to-hyperscript" class="f-switch align-items:center" style="--col-width: 60ch;">

<div>

# An easy & approachable language for modern web front-ends

Enhance HTML with concise DOM, event and async features. **Make writing interactive HTML a joy.**

</div>

<div style="width: max-content; max-width: 100%; margin: auto">

<figure>

~~~hyperscript
on pointerdown
  repeat until event pointerup from the document
    set rand to Math.random() * 360
    transition
      *background-color
      to `hsl($rand 100% 90%)`
      over 250ms
  end
  transition *background-color to initial
~~~

</figure>

<span class="center" style="margin-top: calc(-1.5*var(--gap))"><button class="crowded padding padding-block allcaps" 
       _="on pointerdown
              repeat until event pointerup from the document
                set rand to Math.random() * 360
                transition *background-color
                        to `hsl($rand 100% 90%)`
                      over 250ms
              end
              transition *background-color to initial">
Try me: press and hold</button></span>
</div>


<div style="flex-basis: 100%; text-align: center;"><span id="install"><strong>Install:</strong> <code style="border: 2px dotted #00000055; margin: 0 10px; padding: 4px 6px; border-radius: 4px">&lt;script src="https://unpkg.com/hyperscript.org@0.9.13"&gt;&lt;/script&gt;</code>
<button style="font:inherit;font-size:.8em;background:#3465a4;color:white;border:none;padding: 0 .4em; border-radius: .4em" _="on click
  writeText(my previousElementSibling's innerText) on navigator.clipboard
  put 'copied!' into me
  wait 1s
  put 'copy' into me">copy</button>
</span>

</div>

</div>

<div style="text-align:center;">

[Companion of **htmx**](https://htmx.org/)
|
[**Comparison** with Vanilla JS & jQuery](/comparison/)
|
[Check out the **cheatsheet**](/img/hyperscript-cheatsheet.pdf)


</div>


<div id="features-list" style="">

## Events are first class citizens

<div>

**Easily send and receive events.** Chain events together. [Filter](/docs/#event_filters), [queue](/docs/#event_queueing) or [debounce](/comparison/#debounced-input) events.

In action ➡️
[Disable a button during an htmx request](/cookbook/#40-disable-btn-during-request),
[Drag-and-drop elements](/cookbook/#70-drag-n-drop),
[Event filter](/cookbook/#80-event-filtering)

</div>

~~~html
<button _="on click send hello to <form />">Send</button>

<form _="on hello alert('got event')">
~~~

## Be async with no extra code

<div>

Highly interactive user experiences **without promises, async / await or callback hell**.

**_hyperscript** transparently handles asynchronous behavior for you.


</div>

~~~html
<div _="on click wait 5s send hello to .target">

<div _="init fetch https://stuff as json then put result into me">Using fetch() API...</div>
~~~

## Enhance existing code

<div>

**_hyperscript** works [side by side with existing javascript](/docs/#js-migration). **You choose what and when to enhance.**

Use [locality of behaviour](https://htmx.org/essays/locality-of-behaviour/), or external [behaviors](/docs/#behaviors).

_hyperscript has a super-easy way to write [web workers](/docs#workers).

</div>

~~~html
<div _="init js alert('Hello from JavaScript!') end"></div>

<div _="init js(haystack) return /needle/gi.exec(haystack) end">

<div _="install Draggable(dragHandle: .titlebar)">
~~~

## Remember [HyperCard](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)?

<div>

**An [xTalk](https://en.wikipedia.org/wiki/HyperTalk#Descendants_of_HyperTalk) syntax inspired by HyperTalk, AppleScript; natively inside your browser.**

[CSS selector literals](/expressions/#css) and [positional operators](/docs/#in) make it a breeze to access DOM elements. Simple [commands](/reference/#commands) backed by modern browser API's.

In action ➡️
[Filter A Group Of Elements](/cookbook/#60-filter-a-group-of-elements),
[Filter table rows](/cookbook/#90-filter-table-rows),
[Disable all Buttons During an htmx Request](/cookbook/#50-disable-btn-during-request-all)

</div>

~~~html
<div _="on click tell <p/> in me add .highlight">

<div _="tell <details /> in .article set you.open to false">
~~~

## Debugging and extending

**Graphically [debug](/docs#debugging)** and step through code as it runs.

~~~hyperscript
on click breakpoint
~~~

**_hyperscript** is natively **[extensible](/docs/#extending)**.
Add new commands or expressions using vanilla javascript.

~~~javascript
_hyperscript.addCommand(
  "foo",
  (parser, rt, tokens) => ...)
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
