---
title: style ref - ///_hyperscript
---

## Style References

Style references give you a shorthand for reading and writing CSS style properties on an element. Prefix a style property name with `*` to access it -- `*color` reads or writes `element.style.color`, and `*computed-color` reads the computed (resolved) value via `getComputedStyle()`.

By default, a bare style reference like `*opacity` targets `me` (or `you` in a [possessive expression](/expressions/possessive) context). You can also use it with possessives: `#box's *width` reads the inline style of `#box`.

The `*computed-` variant is read-only -- it returns the value the browser actually rendered, which is useful when you need to read styles set via CSS classes or stylesheets rather than inline styles.

Style references are also used with [`set`](/commands/set) and other commands to assign style values directly:

### Examples

```html
<div _="on click set *opacity to 0.5">
  Click to fade
</div>
```

```html
<div _="on click put *computed-width into the next <output/>">
  Read my width
</div>
```

```html
<div _="on mouseenter set *background-color to 'red'
        on mouseleave set *background-color to ''">
  Hover me
</div>
```

### Syntax

```ebnf
*<style-property>
*computed-<style-property>
```
