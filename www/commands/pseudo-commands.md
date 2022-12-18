---
title: pseudo-commands - ///_hyperscript
---

## Pseudo-Commands

### Syntax

```ebnf
  <method name>(<arg list>) [(to | on | with | into | from | at)] <expression>
```

### Description

Pseudo-commands allow you to treat a method on an object as a top level command. The method name must be followed by
an argument list, then optional prepositional syntax to clarify the code, then an expression. The method will be
looked up on the value returned by the expression and executed.

### Examples

Consider the `reload()` method found on `window.location`. In hyperscript, you can use it as a pseudo-command like so:

```html
<button _="on click reload() the location of the window">
  Reload the Location
</button>

<button _="on click setAttribute('foo', 'bar') on me">
  Set foo to bar on me
</button>
```

### Caveats

**A function defined with the same name as a hyperscript command cannot be called as a pseudo-command.**

Built-in commands can be called with or without parentheses grouping the single object the command works on. If a function has the same name as a command but takes more than a single parameter, the hyperscript parser will not see the call to the function as a pseudo-command, but will see the additional parameters in the function call as a parse error for the built-in command.

For example, this function's name, `increment()`, collides with the built-in hyperscript `increment` command.

```html
<script type="text/hyperscript">
  def increment(i, j)
    return (i as int) + (j as int)
  end
</script>
```

This demonstrates typical `increment` command usage:

```html
<button _="on click increment :x then put it into the next <output/>">
  call increment :x
</button>
<output></output>
```

Here is a call to the `increment` command with parens around the variable to increment.

```html
<button _="on click increment(:x) then put it into the next <output/>">
  increment(:x)
</button>
<output></output>
```

The `increment` and `decrement` commands can take a "by X" expression to modify the difference value:

```html
<button _="on click increment :x by 2 then put it into the next <output/>">
  increment :x by 2
</button>
<output></output>
```

This shows that the parens work with a "by" expression as well:

```html
<button _="on click increment(:x) by 2 then put it into the next <output/>">
  increment(:x) by 2
</button>
<output></output>
```

If the `set` command is used, the `increment()` function will be called rather than the `increment` command:

```html
<button _="on click set :x to increment(:x, 2) then put :x into the next <output/>">
  set :x to increment(:x, 2)
</button>
<output></output>
```

The `increment()` function can also be called via the call command:

```html
<button _="on click call(increment(:x, 2)) then put it into the next <output/>">
  call(increment(:x,2))
</button>
<output></output>
```

Finally, attempting to use the `increment()` function as a pseudo-command will fail with a parse error, as hyperscript's parser recognizes this as the `increment` command with its object separated by parentheses, rather than the function:

```html
<button _="on click increment(:x, 2) then put it into the next <output/>">
  increment(:x, 2)
</button>
<output></output>
```
