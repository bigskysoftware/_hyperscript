---
title: me/my/I - ///_hyperscript
---

## The `me/my/I` Reference

`me` refers to the HTML element that owns the current script. Most hyperscript runs in the context of an element -- for example, `<div _="on click ...">` is an [event handler](/features/on) on that `<div>`. Inside that script, `me` is a reference back to the `<div>`.

`I` is an alias for `me`, useful for more natural English phrasing: `if I match .active`. For [possessive expressions](/expressions/possessive), `my` works too -- `my property` instead of `me.property`.

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

### Syntax

```ebnf
me | I
```
