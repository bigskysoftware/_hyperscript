[![//_hyperscript](https://hyperscript.org/img/light_logo.png "the underscore is silent")](https://hyperscript.org)

*the underscore is silent*

## introduction

`_hyperscript` is a small, open scripting language inspired by [hypertalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)

it is a companion project of <https://htmx.org>

## quickstart

```html

<script src="https://unpkg.com/hyperscript.org@0.8.2.1"></script>


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

## website & docs

* <https://hyperscript.org>
* <https://hyperscript.org/docs>

## contributing

* please write code, including tests, in ES5 for [IE 11 compatibility](https://stackoverflow.com/questions/39902809/support-for-es6-in-internet-explorer-11)
* please include test cases in [`/test`](https://github.com/bigskysoftware/_hyperscript/tree/dev/test) and docs in [`/www`](https://github.com/bigskysoftware/_hyperscript/tree/dev/www)
* development pull requests should be against the `dev` branch, docs fixes can be made directly against `master`
