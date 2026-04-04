---
title: answer - ///_hyperscript
---

## The `answer` Command

The `answer` command displays a browser dialog. In its simple form it calls `alert()`; with the `with ... or ...` form it calls `confirm()` and places the chosen label into [`it`](/expressions/it).

If the user clicks OK, `it` is set to the first choice. If the user cancels, `it` is set to the second choice.

### Examples

```html
<button _="on click answer 'File saved!'">Save</button>

<button _="on click
  answer 'Save changes?' with 'Yes' or 'No'
  if it is 'Yes'
    log 'saving...'
  end
">Confirm</button>
```

### Syntax

```ebnf
answer <expression>
answer <expression> with <expression> | <expression>
```
