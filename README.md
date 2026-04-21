<div align="center">

<a href="https://hyperscript.org">
<img src="https://hyperscript.org/img/logo.png" alt="hyperscript" width="120">
</a>

# hyperscript

*the underscore is silent*

A scripting language for the web, inspired by [HyperTalk](https://hypercard.org/HyperTalk%20Reference%202.4.pdf)

</div>

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
