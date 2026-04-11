---
title: show - ///_hyperscript
---

## The `show` Command

The `show` command makes a hidden element visible using a configurable strategy. The default strategy is `display`.

> **`<dialog>` elements**
>
> When the target is a `<dialog>`, `show` calls the non-modal `dialog.show()`.
> The dialog stays in normal document flow at its DOM position, so
> `position: absolute` against an ancestor with `position: relative` works
> for dropdown-style anchoring. Use [`open`](/commands/open) instead if you
> want a modal dialog with a backdrop and focus trap (`showModal()`).

### Strategies

The following built-in strategies are available:

- `display` -- toggles display between `none` and `block`
- `visibility` -- toggles visibility between `hidden` and `visible`
- `opacity` -- toggles opacity between `0` and `1`

You can also use the style-literal form (e.g. `*display`).

The `display` strategy accepts an argument to specify the display type when showing (e.g. `show:inline`). The default is `block`.

You can change the default strategy by setting `_hyperscript.config.defaultHideShowStrategy`, or add new strategies via `_hyperscript.config.hideShowStrategies`.

### Filtering with `when`

The `when` clause lets you filter which elements are shown in the target. The expression is evaluated for each element -- if true, the element is shown; if false, it's hidden. Use `it` to refer to the current element.

### Examples

```html
<div _="on load wait 2s then show">I'll show after a few seconds!</div>

<div _="on load wait 2s then show:inline">
  I'll show inline after a few seconds!
</div>

<div _="on load wait 2s then show with *opacity">
  I'll show after a few seconds with opacity!
</div>

<div _="on click show #anotherDiv">Show Another Div!</div>

<!-- on every keyup show all elements in #quotes that match the inputs value -->
<input type="text" placeholder="Search..."
     _="on keyup
          show <p/> in #quotes when its textContent contains my value">
```

### Tailwind CSS Extensions

If you're using Tailwind CSS, you can use their utility classes instead. Set `_hyperscript.config.defaultHideShowStrategy` to one of:

- `twDisplay` -- removes class `hidden` ([Display - Tailwind](https://tailwindcss.com/docs/display#hidden))
- `twVisibility` -- removes class `invisible` ([Visibility - Tailwind](https://tailwindcss.com/docs/visibility#making-elements-invisible))
- `twOpacity` -- removes class `opacity-0` ([Opacity - Tailwind](https://tailwindcss.com/docs/opacity))

```html
<div _="on load wait 2s then show">I'll show after a few seconds!</div>

<!-- Or by specifying the strategy name directly -->
<div _="on load wait 2s then show with *twOpacity">
  I'll show after a few seconds with Tailwind CSS opacity!
</div>
```

### Syntax

```ebnf
show [<expression>] [with <hide-show-strategy>[: <argument>]] [when <expression>]
```
