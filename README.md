[![//_hyperscript](https://hyperscript.org/img/light_logo.png "the underscore is silent")](https://hyperscript.org)

*the underscore is silent*

## introduction

`_hyperscript` is a small, open scripting language inspired by [hypertalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)

it is a companion project of <https://htmx.org>

## quickstart

```html
<script src="https://unpkg.com/hyperscript.org"></script>

<button _="on click toggle .clicked">
  Toggle the "clicked" class on me
</button>

<button _="on click call alert('yep!') then wait 2s then remove me">
  Click me
</button>
```

## esm

```js
import _hyperscript from 'hyperscript.org'
```

## website & docs

* <https://hyperscript.org>
* <https://hyperscript.org/docs>

## contributing

* please write tests in [`/test`](https://github.com/bigskysoftware/_hyperscript/tree/master/test) and docs in [`/www`](https://github.com/bigskysoftware/_hyperscript/tree/master/www)
* run the test suite: `npm test`
* build: `npm run build`
