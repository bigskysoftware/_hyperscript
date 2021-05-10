
## Pseudo-Commands

### Syntax

```ebnf
  <method name>(<arg list>) [(to | on | with)] <expression>
```

### Description

Pseudo-commands allow you to treat a method on an object as a top level command.  The method name must be followed by
an argument list, then optional prepositional syntax to clarify the code, then an expression.  The method will be
looked up on the value returned by the expression and executed.

### Examples

Consider the `refresh()` method found on `window.location`.  In hyperscript, you can use it as a pseudo-command like so:

```html
  <button _="on click refresh() the location of the window">
    Refresh the Location
  </button>

  <button _="on click setAttribute('foo', 'bar') on me">
    Set foo to bar on me
  </button>
```
