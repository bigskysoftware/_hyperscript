---
title: me/my - ///_hyperscript
---

## The `me/my` Reference

### Syntax

```ebnf
  me
```

### Description

Most hyperscript features run within the context of an HTML element.  For example, `<div _="on click ...">` is an [event handler](/features/on) that runs in the context of the `<div>` that contains it.  Within these scripts, you can use the `me` expression as a link back to their associated HTML element.

For [possessive expressions](/expressions/possessive), `my` will also work, as in `my property` instead of `me.property`.

### Examples

This uses the [put command](/commands/put) to update the contents of the associated element.

```html
<button data-script="on click put 'I have been clicked' into me">
    click me
    </button>
```

This uses a [possessive expression](/expressions/possessive) and an [attribute reference](/expressions/attribute-ref) to display a custom message.

```html
<span
    data-script="on mouseover alert my @data-message"
    data-message="Keep Out!">
    Hover Over Me...
</span>
```

This demonstrates the [possessive expression](/expressions/possessive) along with the [increment command](/commands/increment) to makes a simple click counter.

```html
<div data-script="on click increment my innerHTML">1</div>
```
