---
title: you/yourself/your - ///_hyperscript
---

## The `you/yourself/your` Reference

### Syntax

```ebnf
  you
```

### Description

The `you` reference is available within the [tell command](/commands/tell) as a reference to current node being acted upon.

If it makes the code more readable in English, `yourself` can be used as an alias.

For [possessive expressions](/expressions/possessive), `your` will also work, as in `your property` instead of `you.property`.

### Examples

This uses the [append command](/commands/append) to update the contents of every `<p>` tag.

```hyperscript
tell <p/>
    append "some value" to you
end
```

This uses the [remove command](/commands/remove) to remove all elements with the disabled=true property

```hyperscript
tell <[disabled=true]/>
    remove yourself
end
```

This uses a [possessive expression](/expressions/possessive) to [decrement](/commands/decrement) the value of every element targeted

```hyperscript
tell <.counter/>
    increment your value
```
