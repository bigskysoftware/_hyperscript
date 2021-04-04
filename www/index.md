---
layout: layout.njk
title: ///_hyperscript
---

<div style="background-color: lightgoldenrodyellow; margin: 16px; border-radius: 8px;
            color: darkgoldenrod; border: gold 1px solid; font-size: 20px">
  <p>
    <b>NOTE:</b> hyperscript is still in very early development and may change
    dramatically between releases.  Please bear this in mind, and jump on the
    <a style="color: darkgoldenrod;font-weight: bold" href="https://htmx.org/discord">#hyperscript discord channel</a> to work with us as we develop the language.  Thank you!
  </p> 
</div>

## intro

hyperscript is an experimental scripting language designed for the web, inspired by 
 [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)

hyperscript features include:

<div style="padding: 16px">

* Events are first class citizens in the language with clean syntax for [responding to](/features/on) and 
  [sending](/commands/send) events, as well as [event-driven control flow](docs/#event-control-flow)
* DOM-oriented syntax, such as [CSS id, CSS class and  CSS query literals](https://hyperscript.org/expressions/#css)
* First class [web workers](/docs#workers)
* An [async-transparent](/docs#async) runtime, which removes the distinction between synchronous and asynchronous code
* A [pluggable & extendable](/docs/#extending) parser & grammar
* A [debugger](/docs#debugging) to step through hyperscript code

</div>

You can see a comparison of hyperscript, vanillaJS and jQuery [here](/comparison).

hyperscript is a companion project of [htmx](https://htmx.org) but note that because 
[promises are not available in IE](https://caniuse.com/?search=Promise) hyperscript does *not* strive for IE11 compatibility.

## examples

```html
<script src="https://unpkg.com/hyperscript.org@0.0.8"></script>

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

<table class="demos" _="init
	for row in (<tr/> in me)
		get the <code/> in the row
		put `<td>$it</td>` before the <td/> in the row
	end
	call _hyperscript.processNode(me)">
<tr><td>


```html
<div style="width: 100; height: 100" _="on pointermove(clientX, clientY) 
	add {
		background-color: `hsl(clientX, clientY, 1)`
	} to me"></div>
```

<tr><td>

</table>

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


## haiku

*the unknown button<br/>
so often inscrutable<br/>
now says what it does*
