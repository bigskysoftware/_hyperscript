---
title: show - ///_hyperscript
---

## The `show` Command

### Syntax

```ebnf
show [target] [with <hide-show-strategy>[: <argument>]] [when <expr>]
```

### Description

The `show` command allows you to show an element in the DOM using various strategies. The default strategy is `display`.

By default, the following strategies are available:

- `display` - toggle display between `none` and `block`
- `visibility` - toggle visibility between `hidden` and `visible`
- `opacity` - toggle visibility between `0` and `1`

You can also use the style-literal form (e.g. `*display`).

You can change the default hide/show strategy by setting `_hyperscript.config.defaultHideShowStrategy`

You can add new hide/show strategies by setting the `hyperscript.config.hideShowStrategies` object.

Note that the `display` strategy can take an argument to specify the type of display to use when showing. The default
is `block`

The `when` clause allows you filter what elements are shown in the `target`.  The expression will be evaluated for
each element in `target` and, if the result is true, the element will be shown.  If it is false, the element will be
hidden.  The `it` symbol will be set to the current element, allowing you to express conditions against each element
in `target`

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

### Tailwind CSS extensions

In case you are using Tailwind CSS, you may want to use their utility classes.

You will have to set `_hyperscript.config.defaultHideShowStrategy` to one of this options :

- `twDisplay` - remove class `hidden` [Display - Tailwind](https://tailwindcss.com/docs/display#hidden)
- `twVisibility` - remove class `invisible` [Visibility - Tailwind](https://tailwindcss.com/docs/visibility#making-elements-invisible)
- `twOpacity` - remove class `opacity-0` [Opacity - Tailwind](https://tailwindcss.com/docs/opacity)

### Examples

```html
<div _="on load wait 2s then show">I'll show after a few seconds!</div>

<!-- Or by specifying the strategy name directly between : twDisplay, twVisibility, twOpacity -->
<div _="on load wait 2s then show with *twOpacity">
  I'll show after a few seconds with Tailwind CSS opacity!
</div>
```
