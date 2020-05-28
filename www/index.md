---
layout: layout.njk
title: ///hypescript
---

<div class="hero full-width">
<div class="c">
<h1><span class="s1">/</span><span class="s2">/</span><span class="s3">/</span><span class="s4">_</span>hypescript</h1>
</div>
</div>

hypescript is a small scripting language designed to be embedded in HTML and based on [applescript](https://en.wikipedia.org/wiki/Applescript) and
 [hypertalk](https://en.wikipedia.org/wiki/HyperTalk)

it is a companion project of <https://htmx.org>

## sample

```html
<button _="toggle .clicked">
  Toggle the "clicked" class on me
</button>

<div _="on mouseOver toggle .mouse-over on #foo">
  Mouse Over Me!
</div>

<div _="on click call aJavascriptFunction() then
                 wait 10s then 
                 call anotherJavascriptFunction()">
           Do some stuff
</div>
```