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
bind <expression> to <expression>
bind <expression> and <expression>
bind <expression> with <expression>
```

The keywords `to`, `and`, and `with` are interchangeable.

### Two-Way Binding

Keeps two values in sync. Changes to either side propagate to the other.

Toggle a class based on a checkbox:

```html
<input type="checkbox" id="dark-toggle" />
<body _="bind .dark to #dark-toggle's checked">
```

Keep an attribute in sync with a nearby input:

```html
<input type="text" id="title-input" />
<h1 _="bind @data-title to #title-input's value">
```

Sync two inputs together:

```html
<input type="range" id="slider" />
<input type="number" _="bind my value to #slider's value" />
```

#### Boolean Attributes

When binding a boolean value to an attribute, standard attributes use
presence/absence. ARIA attributes use `"true"`/`"false"` strings:

```html
<div _="bind @data-active to #toggle's checked">
<div _="bind @aria-hidden to $isHidden">
```

### Element Auto-Detection

When either side of a bind resolves to a DOM element (via `me`, `#id`, or a
query), the bound property is detected automatically:

| Element | Detected property |
|---------|-------------------|
| `<input type="text">` | `value` |
| `<input type="number">`, `<input type="range">` | `valueAsNumber` (preserves number type) |
| `<input type="checkbox">` | `checked` |
| `<input type="radio">` | radio group value (see below) |
| `<textarea>` | `value` |
| `<select>` | `value` |
| `<* contenteditable>` | `textContent` |
| Custom elements with a `value` property | `value` |

```html
<!-- auto-detects 'value' on the input -->
<input type="text" _="bind $name to me" />

<!-- auto-detects 'checked' on the checkbox -->
<input type="checkbox" _="bind $darkMode to me" />

<!-- bind to an element by id — auto-detects 'value' -->
<div _="bind $search to #search-input" />

<!-- both sides auto-detect -->
<input type="number" _="bind me to #slider" />

<!-- explicit property still works -->
<div _="bind $dark to #toggle's checked" />
```

#### Radio Button Groups

Radio buttons are grouped by `name` attribute. The variable holds the value of the
selected radio. Each radio in the group has its own `bind`:

```html
<input type="radio" name="size" value="small" _="bind $size to me" />
<input type="radio" name="size" value="medium" _="bind $size to me" />
<input type="radio" name="size" value="large" _="bind $size to me" />
```

Clicking a radio sets `$size` to that radio's `value` attribute. Setting `$size`
programmatically checks the matching radio and unchecks the others.

### Initialization

When both sides have values on init, the **left side wins**:

```html
<!-- The input's current value drives the variable on init -->
<input type="text" value="Bob" _="bind me to $name" />

<!-- The variable drives the input on init -->
<input type="text" _="bind $name to me" />
```

If either side is `undefined` or `null`, the other side wins regardless of position.

### Infinite Loop Prevention

Two-way binding prevents infinite loops with same-value deduplication: if setting
a value to what it already equals, the reverse effect does not fire.
