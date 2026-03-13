---
title: hide - ///_hyperscript
---

## The `hide` Command

### Syntax

```ebnf
hide [target] [with <hide-show-strategy>[: <argument>]] [when <expr>]
```

### Description

The `hide` command allows you to hide an element in the DOM using various strategies. The default strategy is `display`.

By default, the following strategies are available:

- `display` - toggle display between `none` and `block`
- `visibility` - toggle visibility between `hidden` and `visible`
- `opacity` - toggle opacity between `0` and `1`

You can change the default hide/show strategy by setting `_hyperscript.config.defaultHideShowStrategy`

You can add new hide/show strategies by setting new values into the `_hyperscript.config.hideShowStrategies` object.

### Examples

```html
<div _="on click hide">Hide Me!</div>

<div _="on click hide with opacity">Hide Me With Opacity!</div>

<div _="on click hide #anotherDiv">Hide Another Div!</div>
```

### Tailwind CSS extensions

In case you are using Tailwind CSS, you may want to use their utility classes.

You will have to set `_hyperscript.config.defaultHideShowStrategy` to one of this options :

- `twDisplay` - add class `hidden` [Display - Tailwind CSS](https://tailwindcss.com/docs/display#hidden)
- `twVisibility` - add class `invisible` [Visibility - Tailwind CSS](https://tailwindcss.com/docs/visibility#making-elements-invisible)
- `twOpacity` - add class `opacity-0` [Opacity - Tailwind CSS](https://tailwindcss.com/docs/opacity)

You may also have to update your `tailwind.config.js` to add to the safe list the classes you need

More information here : [Content Configuration - Tailwind CSS](https://tailwindcss.com/docs/content-configuration#safelisting-classes)

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...
  safelist: [
    // Add needed classes here
    'hidden',
    'invisible',
    'opacity-0',
  ]
  // ...
}
```
If you are using Tailwind CSS v4.0 and are making use of the CSS configuration, you may need to update your `style.css` file to safe list the classes you need.

```css
@source inline("hidden");
@source inline("invisible");
@source inline("opacity-0");
```
More information here : [Safelisting specific utilities - Tailwind CSS v4.0](https://tailwindcss.com/docs/detecting-classes-in-source-files#safelisting-specific-utilities).

### Examples

```html
<div _="on click hide">Hide Me!</div>

<!-- Or by specifying the strategy name directly between : twDisplay, twVisibility, twOpacity -->
<div _="on click hide with twOpacity">Hide Me With Opacity!</div>
```
