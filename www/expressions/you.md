---
title: you/yourself/your - ///_hyperscript
---

## The `you/yourself/your` Reference

The `you` reference is available inside the [tell command](/commands/tell), where it refers to the current element being acted upon. You can use `yourself` as an alias if it reads better, and `your` works for [possessive expressions](/expressions/possessive) (e.g., `your property` instead of `you.property`).

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

This uses a [possessive expression](/expressions/possessive) to [increment](/commands/increment) the value of every element targeted

```hyperscript
tell <.counter/>
    increment your value
```

### Syntax

```ebnf
(you | yourself)
```
