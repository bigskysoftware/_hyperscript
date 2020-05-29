# `///_hyperscript`

## introduction

_hyperscript is a small web scripting language based [applescript](https://en.wikipedia.org/wiki/Applescript) and
 [hypertalk](https://en.wikipedia.org/wiki/HyperTalk)

it is a companion project of <https://htmx.org>

## sample

```html
<button hscript="toggle clicked">
  Toggle the "clicked" class on me
</button>


<div hscript="on mouseOver toggle mouse-over on #foo">
</div>

<div hscript="on click call aJavascriptFunction() then
              wait 10s then 
              call anotherJavascriptFunction()">
           Do some stuff
</div>
```