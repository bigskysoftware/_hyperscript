---
title: bind - ///_hyperscript
---

## The `bind` Feature

The `bind` feature keeps two values in sync reactively. It is syntax sugar built on top of
[`when`](/features/when).

### Syntax

```ebnf
bind <target> to <expression>
bind <target> and <target>
```

### One-Way Binding: `bind X to Y`

Creates a derived value. The target always reflects the expression's current value. When any
dependency of the expression changes, the target updates automatically.

```html
<!-- Keep an element's text bound to an input -->
<input type="text" id="name" />
<h1 _="bind my.textContent to #name.value"></h1>
```

```html
<!-- Derive a variable from a compound expression -->
<div _="bind :fullName to ($firstName + ' ' + $lastName)
        when :fullName changes
            put it into me"></div>
```

```html
<!-- Keep an attribute in sync with a variable -->
<div _="bind @data-theme to $theme"></div>
```

`bind X to Y` is equivalent to:

```
when Y changes
    set X to it
```

### Two-Way Binding: `bind X and Y`

Keeps two values in sync. Changes to either side propagate to the other.

```html
<input _="bind $username and my.value" />
```

When the user types in the input, `$username` updates. When `$username` is set programmatically,
the input's value updates.

`bind X and Y` is equivalent to:

```
when X changes
    set Y to it
end
when Y changes
    set X to it
```

#### Form Input Examples

Two inputs sharing the same variable. Edit either one and the other updates:

```html
<input type="text" _="bind $msg and my.value" />
<input type="text" _="bind $msg and my.value" />
```

Text input with display:

```html
<input type="text" _="bind $search and my.value" />
<div _="when $search changes
            put 'Searching for: ' + it into me"></div>
```

Checkbox:

```html
<input type="checkbox" _="bind $darkMode and my.checked" />
```

Select dropdown:

```html
<select _="bind $country and my.value">
    <option value="us">United States</option>
    <option value="uk">United Kingdom</option>
</select>
```

#### Attribute Two-Way Binding

```html
<div _="bind $theme and @data-theme"></div>
```

### Infinite Loop Prevention

Two-way binding creates two effects that could trigger each other indefinitely. The reactive
system prevents this with same-value deduplication: if setting a value to what it already
equals (`===`), no change is detected and the reverse effect does not fire.

### Supported Targets

Both sides of a `bind` can be any assignable expression:

| Target | Example |
|--------|---------|
| Global variable | `$username` |
| Element variable | `:count` |
| Attribute | `@data-title` |
| Property | `my.value` |
| Style | `*color` |

For `bind X to Y` (one-way), the right side can be any expression since it is only read.

### Relationship to `when`

Everything `bind` does can be written with [`when ... changes`](/features/when) and `set`. Use
`bind` when you want concise declarative bindings. Use `when` when you need to run arbitrary
commands in response to changes.
