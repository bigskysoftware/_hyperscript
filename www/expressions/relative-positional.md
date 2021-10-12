
## The `relative positional` Expression

### Syntax

```ebnf
  (next|previous) <css expression> [from <expression>] [within <expression>]
```

### Description

Relative positional expressions allow you to select an element relative to another element in the DOM, using the
`next` and `previous` keywords.

You can use the `from` clause to start the linear forward search from another element.  The default element to start
the search from is the current element that the script is on.

You can use the `within` clause to restrict the search to a given subset of the DOM.  The default

```html
<button _="on click toggle .hidden on the next <div/>">Toggle Hidden</button>
<div class="hidden">
  ...
</div>
```
