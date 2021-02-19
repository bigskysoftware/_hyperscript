---
layout: layout.njk
title: ///_hyperscript
---

## intro

hyperscript is a scripting language designed for the web, inspired by 
 [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)
 
hyperscript has many interesting and practical features:

<div style="padding: 16px">

* it is [async-transparent](/docs#async), allowing you to mix both asyncrhonous and synchronous code in an intuitive, 
  linear manner
* it is event oriented, allowing you to work with DOM events in interesting and novel ways
* it has DOM-friendly syntax, such as id and class literals
* it supports [inline Web Workers](/docs#workers), allowing you to easily define a worker and interact with it via 
  intuitive function calls
* it is designed to be embedded directly in HTML, making it easy to see what HTML elements are up to

</div>

hyperscript is a companion project of [htmx](https://htmx.org)

## examples

```html
<script src="https://unpkg.com/hyperscript.org@0.0.3"></script>

<button _="on click toggle .big-text">
  Toggle the "big-text" class on me on click
</button>

<div _="on mouseenter add .visible to #help
        on mouseleave remove .visible from #help">
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
        <div _="on mouseenter add .visible to #help 
                on mouseleave remove .visible from #help">
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
