---
layout: layout.njk
title: ///_hyperscript
---

<div class="hero full-width">
<div class="c">
<h1><span class="s1">/</span><span class="s2">/</span><span class="s3">/</span><span class="s4">_</span><span class="s2">h</span>yper<span class="s2">s</span>cript</h1>
</div>
</div>
<div class="center nav full-width">
<a href="/">home</a> <a href="/docs">docs</a> <a href="/extending">extending</a> <a href="">github</a>
</div>

## intro

_hyperscript is a small scripting language designed to be embedded in HTML and inspired by
 [hypertalk](https://en.wikipedia.org/wiki/HyperTalk)

it is a companion project of <https://htmx.org>

## samples

```html


<button _="on click toggle .big-text">
  Toggle the "clicked" class on me
</button>

<div _="on mouseenter 
           add .visible to #help 
        end
        on mouseleave 
           remove .visible from #help 
        end">
  Mouse Over Me!
</div>
<div id="help"> I'm a helpful message!</div>

<button _="on click log me then call alert('yep, it’s an alert')">
    Show An Alert
</button>
```
## demos

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
        <button _="on click toggle .big-text">
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
        <div _="on mouseenter 
                   add .visible to #help 
                end
                on mouseleave 
                   remove .visible from #help 
                end">
          Mouse Over Me!
        </div>
        <div id="help"> I'm a helpful message!</div>
    </div>
    <div class="4 col">
        <button _='on click log me then call alert("yep, it’s an alert - check the console...")'>
            Show An Alert
        </button>
    </div>
</div>
