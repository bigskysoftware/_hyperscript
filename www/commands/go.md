---
title: go - ///_hyperscript
---

## The `go` Command

### Syntax

```ebnf
 go [to] url <stringLike> [in new window]
 go [to] [top|middle|bottom] [left|center|right] [of] <expression> [(+|-) <number> [px] ][smoothly|instantly]
 go back
```

### Description

The `go` command allows you navigate on the page with various forms

`go to url <stringLike>` will navigate to the given URL. If the url starts with an anchor `#` it will instead update
the windows href.

`go to <modifiers> elt` will scroll the element into view on the current page. You can pick the top, bottom, left, etc.
by using modifiers, and you can pick the animation style with a following `smoothly` or `instantly`.

Additionally you can use a pixel-based offset to pad the scrolling by some amount since, annoyingly, the default behavior of
`scrollIntoView()` is to put the element right on the edge of the viewport.

Finally, the `go back` form will navigate back in the history stack.

### Examples

```html
<button _="on click go to url https://duck.com">
  Go Search
</button>

<button _="on click go to the top of the body">
  Go To The Top...
</button>

<button _="on click go to the top of #a-div -20px">
  Go To The Top Of A Div, with 20px of padding in the viewport
</button>
```
