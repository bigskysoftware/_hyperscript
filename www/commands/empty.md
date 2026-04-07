---
title: empty - ///_hyperscript
---

## The `empty` Command

The `empty` command removes all child nodes from an element, clears an input's value, or clears a collection. If no target is given, it empties the current element (`me`).

`clear` is an alias for `empty`.

### Inputs & Forms

For form elements, `empty` clears the value rather than removing child nodes:

```html
<button _="on click empty #search">Clear Search</button>

<button _="on click clear #my-form">Clear Form</button>
```

| Target | Action |
|---|---|
| `<input>` (text, number, etc.) | Sets `value` to `""` |
| `<input type="checkbox/radio">` | Sets `checked` to `false` |
| `<textarea>` | Sets `value` to `""` |
| `<select>` | Deselects all options |
| `<form>` | Clears all inputs within the form |

To restore inputs to their original values instead, see [reset](/commands/reset).

### Collections

For arrays, sets, and maps, `empty` clears all entries:

```hyperscript
empty myArray                            -- splices to length 0
empty mySet                              -- set.clear()
empty myMap                              -- map.clear()
```

### Examples

```html
<button _="on click empty #results">Clear Results</button>

<div _="on click empty">Click to clear me</div>

<button _="on click empty .messages">Clear All Messages</button>

<button _="on click clear #email clear #password">Clear Login Form</button>
```

### Syntax

```ebnf
empty [<expression>]
clear [<expression>]
```
