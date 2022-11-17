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

Most hyperscript features run within the context of an HTML element.  For example, `<div _="on click ...">` is an [event handler](/features/on) that runs in the context of the `<div>` that contains it.  Within these scripts, you can use the `me` expression as a link back to their associated HTML element.

If it makes the code more readable in English, `yourself` can be used as an alias.

For [possessive expressions](/expressions/possessive), `your` will also work, as in `my property` instead of `me.property`.

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
