---
layout: layout.njk
title: ///_hyperscript
---

<div class="hero full-width">
<div class="c">
<h1><span class="s1">/</span><span class="s2">/</span><span class="s3">/</span><span class="s4">_</span><span class="s2">h</span>yper<span class="s2">s</span>cript</h1>
</div>
</div>

## intro

_hyperscript is a small scripting language designed to be embedded in HTML and inspired by
 [hypertalk](https://en.wikipedia.org/wiki/HyperTalk)

it is a companion project of <https://htmx.org>

## sample

```html
<button _="on click toggle .clicked">
  Toggle the "clicked" class on me
</button>

<div _="on mouseOver toggle .mouse-over on #foo">
  Mouse Over Me!
</div>

<div _="on click eval aJavascriptFunction() then
                 wait 10s then 
                 eval anotherJavascriptFunction()">
           Do some stuff
</div>
```