[![//_hyperscript](https://hyperscript.org/img/light_logo.png "the underscore is silent")](https://hyperscript.org)

*the underscore is silent*

## introduction

`_hyperscript` is a small, open web scripting language inspired by [hypertalk](https://en.wikipedia.org/wiki/HyperTalk)

it is a companion project of <https://htmx.org>

## quickstart

```html

<script src="https://unpkg.com/hyperscript.org@0.0.1-alpha0/dist/hyperscript.min.js"></script>
<script>
_hyperscript.start();
</script>

<button _="on click toggle .clicked">
  Toggle the "clicked" class on me
</button>


<div hs="on mouseOver toggle mouse-over on #foo">
</div>

<div data-hs="on click call aJavascriptFunction() then
              wait 10s then 
              call anotherJavascriptFunction()">
           Do some stuff
</div>
```