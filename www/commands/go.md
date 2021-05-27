---
layout: layout.njk
title: ///_hyperscript
---

## The `go` Command

### Syntax

```ebnf
 go [to] url <stringLike> [in new window]
 go [to] [top|middle|bottom] [left|center|right] [of] <expression> [smoothly|instantly]
 go back
```

### Description

The `go` command allows you navigate on the page with various forms

`go to url <stringLike>` will navigate to the given URL. If the url starts with an achor `#` it will instead update
the windows href.

`go to <modifiers> elt` will scroll the element into view on the current page. You can pick the top, bottom, left, etc.
by using modifiers, and you can pick the animation style with a following `smoothly` or `instantly`

Finally, the `go back` form will navigate back in the history stack.

### Examples

```html
<button _="on click go to https://duck.com">Go Search</button>

<button _="on click go to the top of the body">Go To The Top...</button>
```
