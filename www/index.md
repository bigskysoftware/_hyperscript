---
layout: layout.njk
title: ///_hyperscript
---

## intro

`_hyperscript` is a small, open scripting language designed to be embedded in HTML and inspired by
 [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)

it is a companion project of <https://htmx.org>

## samples

```html
<script src="https://unpkg.com/hyperscript.org@0.0.3"></script>

<button _="on click toggle .big-text">
  Toggle the "clicked" class on me
</button>

<div _="on mouseenter add .visible to #help end
        on mouseleave remove .visible from #help end">
  Mouse Over Me!
</div>
<div id="help"> I'm a helpful message!</div>

<button _="on click log me then call alert('yep, it\’s an alert')">
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
        <button _="on click log me then call alert('yep, it\'s an alert - check the console...')">
            Show An Alert
        </button>
    </div>
</div>
