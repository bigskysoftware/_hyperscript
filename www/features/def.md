---
title: def - ///_hyperscript
---

## The `def` Feature

The `def` feature lets you define reusable functions in hyperscript. Functions can be synchronous or asynchronous -- the hyperscript runtime handles the difference transparently when you call them from hyperscript code.

A function consists of a name, a parameter list, and a body with an optional `catch` and/or `finally` block. The body is a list of [commands](/docs#commands), optionally separated by the `then` keyword.

Functions are typically placed in script tags:

```html
<script type="text/hyperscript">
  def delayTheAnswer(i)
    wait 2s
    return i
  end
</script>
```

You may also namespace functions by giving them a dot-separated namespace:

```html
<script type="text/hyperscript">
  def utils.delayTheAnswer()
    wait 2s
    return 42
  end
</script>
```

Functions may be invoked from both hyperscript or JavaScript. However, in JavaScript, an asynchronous function will
return a promise that must be dealt with explicitly.

### Return

Values may be returned with the `return` command. If the function is synchronous, the value will be returned as normal
and if it is asynchronous, the promise will be resolved. The hyperscript runtime hides this difference when the
function is invoked within hyperscript.

### Throw

Exceptions may be thrown with the `throw` command. If the function is synchronous, the exception will be thrown as normal
and if it is asynchronous, the promise will be rejected. The hyperscript runtime hides this difference when the
function is invoked within hyperscript.

### Exceptions

Hyperscript functions support a single catch block that can be used to catch exceptions that are thrown synchronously
or asynchronously:

```html
<script type="text/hyperscript">
  def delayTheAnswer()
    wait 2s
    throw "Nope!"
  catch e
    return e
  end
</script>
```

### Finally Blocks

Both functions and event handlers also support a `finally` block to ensure that some cleanup code is executed:

```hyperscript
  def loadExample ()
    add @disabled to me
    fetch /example
    put the result after me
  finally
    remove @disabled from me
  end
```

In this code you ensure that the `disabled` property is removed from the current element.

### Examples

```html
<script type="text/hyperscript">
  def delayTheAnswer(i)
    wait 2s
    return i
  end
</script>

<script type="text/hyperscript">
  def utils.delayTheAnswer()
    wait 2s
    return 42
  end
</script>
```

### Syntax

```ebnf
def <function-name>(<parameter-list>)
  <command>+
[catch <identifier>
  <command>+]
[finally
  <command>+]
end
```
