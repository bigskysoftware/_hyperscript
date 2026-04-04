---
title: go - ///_hyperscript
---

## The `go` Command

The `go` command navigates to a URL or goes back in browser history.

`go to` accepts a URL (string, template literal, or naked URL starting with `/` or `http`/`https`) and navigates to it.
If the value starts with `#`, it sets `window.location.hash`. If it resolves to an Element, it scrolls to it (for backwards compatibility — prefer [`scroll to`](/commands/scroll) for scrolling).

`go to ... in new window` opens the URL in a new window/tab.

`go back` navigates back in the browser history.

Naked URLs are detected automatically — no `url` keyword is needed:

```hyperscript
go to /about
go to https://example.com
go to `/${dynamicPath}`
go to "#section"
```

Note: the `go to url ...` form and scroll modifiers (`go to the top of ...`) are deprecated.
Use naked URLs or string expressions for navigation, and the [`scroll`](/commands/scroll) command for scrolling.

### Examples

```html
<button _="on click go to /about">
  About Page
</button>

<button _="on click go to `https://example.com/${page}`">
  Dynamic Navigation
</button>

<button _="on click go to /page in new window">
  Open In New Tab
</button>

<button _="on click go back">
  Back
</button>
```

### Syntax

```ebnf
go [to] <expression> [in new window]
go back
```
