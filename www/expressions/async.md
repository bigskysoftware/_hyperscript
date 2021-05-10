
## The `attribute reference` Expression

### Syntax

```ebnf
  async <expression>
```

### Description

By default, hyperscript synchronizes on any [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 
that go through its runtime.  This is usually what is desired but 
at times you may want to avoid this synchronization when evaluating 
an expression.  To do so, you can use the `async` keyword

### Examples

```html
<button _="on click call async generatePromise() ">
  Generate a promise but don't block
</button>
```
