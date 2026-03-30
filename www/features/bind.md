---
title: bind - ///_hyperscript
---

## The `bind` Feature

The `bind` feature keeps two values in sync (two-way). Use it for form inputs and
shared state.

For one-way derived values, see [`live`](/features/live).
For reacting to changes with side effects, see [`when`](/features/when).

### Syntax

```ebnf
bind <expression> and <expression>
bind <expression> with <expression>
bind <expression> to <expression>
bind <variable>
```

The keywords `and`, `with`, and `to` are interchangeable.

### Two-Way Binding

Keeps two values in sync. Changes to either side propagate to the other.

Toggle a class based on a checkbox:

```html
<input type="checkbox" id="dark-toggle" />
<body _="bind .dark and #dark-toggle's checked">
```

Keep an attribute in sync with a nearby input:

```html
<input type="text" id="title-input" />
<h1 _="bind @data-title and #title-input's value">
```

Sync two inputs together:

```html
<input type="range" id="slider" />
<input type="number" _="bind my value and #slider's value" />
```

#### Boolean Attributes

When binding a boolean value to an attribute, standard attributes use
presence/absence. ARIA attributes use `"true"`/`"false"` strings:

```html
<div _="bind @data-active and #toggle's checked">
<div _="bind @aria-hidden and $isHidden">
```

### Initialization

When both sides have values on init, the **left side wins**:

```html
<!-- The input's current value drives the heading on init -->
<input type="text" id="title-input" value="From Input" />
<h1 data-title="From HTML"
    _="bind #title-input's value and @data-title">
```

If either side is `undefined` or `null`, the other side wins regardless of position.

### Shorthand: `bind $var`

On form elements, you can omit the second argument. The bound property is detected
automatically from the element type:

| Element | Binds to |
|---------|----------|
| `<input type="text">` | `my value` |
| `<input type="number">` | `my valueAsNumber` (preserves number type) |
| `<input type="checkbox">` | `my checked` |
| `<input type="radio">` | group (see below) |
| `<textarea>` | `my value` |
| `<select>` | `my value` |

```html
<input type="text" _="bind $name" />
<input type="checkbox" _="bind $darkMode" />
<select _="bind $country">...</select>
```

#### Radio Button Groups

Radio buttons are grouped by `name` attribute. The variable holds the value of the
selected radio. Each radio in the group has its own `bind`:

```html
<input type="radio" name="size" value="small" _="bind $size" />
<input type="radio" name="size" value="medium" _="bind $size" />
<input type="radio" name="size" value="large" _="bind $size" />
```

Clicking a radio sets `$size` to that radio's `value` attribute. Setting `$size`
programmatically checks the matching radio and unchecks the others.

### Infinite Loop Prevention

Two-way binding prevents infinite loops with same-value deduplication: if setting
a value to what it already equals, the reverse effect does not fire.
