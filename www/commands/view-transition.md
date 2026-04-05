---
title: start a view transition - ///_hyperscript
---

## The `start a view transition` Command

The `start a view transition` command wraps DOM mutations in a
[View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API),
giving you smooth animated transitions between before and after states.

The browser captures a snapshot of the current DOM, runs the body commands (which mutate the DOM),
captures a second snapshot, then animates between the two. All animation is controlled via CSS.

If the View Transitions API is not supported, the body runs directly with no animation.

### Examples

Basic content swap with a crossfade:

```html
<button _="on click
    start a view transition
        put 'New content!' into #container
    end">
  Swap
</button>
```

With a named transition type (for CSS targeting):

```html
<button _="on click
    start a view transition using 'slide-left'
        remove .active from .tab
        add .active to me
        put tabContent into #panel
    end">
  Next Tab
</button>
```

Async operations work naturally:

```hyperscript
start a view transition
    fetch /api/data as HTML
    put it into #results
end
```

### Transition Types

The optional string after `start a view transition` sets a
[transition type](https://developer.mozilla.org/en-US/docs/Web/API/ViewTransition#viewtransition_types)
that can be targeted in CSS:

```css
html:active-view-transition-type(slide-left) {
    &::view-transition-old(root) {
        animation: slide-out-left 0.5s ease-in;
    }
    &::view-transition-new(root) {
        animation: slide-in-right 0.5s ease-out;
    }
}
```

### Named Elements

To animate individual elements (rather than the whole page crossfade), give them a
`view-transition-name` in CSS:

```html
<img id="hero" style="view-transition-name: hero">
```

```hyperscript
start a view transition
    set #hero's @src to newImageUrl
end
```

The browser will animate the `hero` element independently from the rest of the page.

### Early Exit

If the body exits early via `return`, `halt`, `exit`, `break`, or `continue`, the
transition is automatically skipped and a warning is logged. The DOM mutations that
already occurred remain in place.

### Fallback

If the browser does not support the View Transitions API, the body commands run
normally with no animation. No error is thrown.

### Syntax

```ebnf
start [a] view transition [using <string>]
  <commands>
end
```
