---
title: reset - ///_hyperscript
---

## The `reset` Command

The `reset` command restores a form or input to its default value. If no target is given, it resets the current element (`me`).

For forms, it calls the native `form.reset()`. For individual inputs, it restores the value that was set in the HTML markup.

| Target | Action |
|---|---|
| `<form>` | Calls `form.reset()` |
| `<input>` | Restores `defaultValue` |
| `<input type="checkbox/radio">` | Restores `defaultChecked` |
| `<textarea>` | Restores `defaultValue` |
| `<select>` | Restores each option's `defaultSelected` |

To blank out inputs instead, see [empty](/commands/empty).

### Examples

```html
<button _="on click reset #my-form">Reset Form</button>

<form _="on reset-all reset">
  <input type="text" value="default" />
</form>

<button _="on click reset <input/> in #settings">Reset All Inputs</button>
```

### Syntax

```ebnf
reset [<expression>]
```
