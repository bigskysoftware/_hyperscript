---
title: hide - ///_hyperscript
---

## The `hide` Command

The `hide` command hides an element in the DOM using a configurable strategy. The default strategy is `display`.

By default, the following strategies are available:

- `display` -- toggles `display` between `none` and the element's original value *(default)*
- `visibility` -- toggles `visibility` between `hidden` and `visible`
- `opacity` -- toggles `opacity` between `0` and `1`
- `hidden` -- toggles the native [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden) attribute

You can change the default hide/show strategy by setting `_hyperscript.config.defaultHideShowStrategy`.

You can add new hide/show strategies by setting new values into the `_hyperscript.config.hideShowStrategies` object.

#### The `hidden` strategy

The `hidden` strategy uses the HTML [`hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/hidden) attribute. 

This has advantages over `display`:

* A hidden element is automatically inert  and removed from the accessibility tree, so screen readers skip it without any extra `aria-hidden` wiring.
* Hiding and showing doesn't pollute the element's `style=""` attribute or require the runtime to stash and restore the element's previous `display` value.

```html
<div _="on click hide me with hidden">Hide Me!</div>
```

To make `hidden` the default for every `hide`/`show`/`toggle` in your
app, set the config once at startup:

```js
_hyperscript.config.defaultHideShowStrategy = "hidden"
```

{% warning "Specificity gotcha" %}
`[hidden]` applies `display: none` via the UA stylesheet, which has very
low specificity. Any author rule like `.card { display: flex }` will
override it and the element will stay visible. If this bites you, either
raise the specificity (`[hidden] { display: none !important }`) or use
`with display` on that particular call.
{% endwarning %}

The `when` clause lets you filter which elements are hidden in the `target`. The expression is evaluated for
each element in `target` -- if the result is true, the element is hidden; if false, it's shown.
The `it` symbol is set to the current element, so you can express conditions against each element.

### Examples

```html
<div _="on click hide">Hide Me!</div>

<div _="on click hide with opacity">Hide Me With Opacity!</div>

<div _="on click hide #anotherDiv">Hide Another Div!</div>

<div _="on click hide <div/> in me when it matches .hideable">
  Conditionally Hide Children!
</div>
```

### Tailwind CSS extensions

If you're using Tailwind CSS, you may want to use their utility classes.

Set `_hyperscript.config.defaultHideShowStrategy` to one of these options:

- `twDisplay` -- adds class `hidden` [Display - Tailwind CSS](https://tailwindcss.com/docs/display#hidden)
- `twVisibility` -- adds class `invisible` [Visibility - Tailwind CSS](https://tailwindcss.com/docs/visibility#making-elements-invisible)
- `twOpacity` -- adds class `opacity-0` [Opacity - Tailwind CSS](https://tailwindcss.com/docs/opacity)

You may also need to update your `tailwind.config.js` to safelist the classes you need.

More information here: [Content Configuration - Tailwind CSS](https://tailwindcss.com/docs/content-configuration#safelisting-classes)

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
If you are using Tailwind CSS v4.0 and are making use of the CSS configuration, you may need to update your `style.css` file to safelist the classes you need.

```css
@source inline("hidden");
@source inline("invisible");
@source inline("opacity-0");
```
More information here: [Safelisting specific utilities - Tailwind CSS v4.0](https://tailwindcss.com/docs/detecting-classes-in-source-files#safelisting-specific-utilities).

```html
<div _="on click hide">Hide Me!</div>

<!-- Or by specifying the strategy name directly: twDisplay, twVisibility, twOpacity -->
<div _="on click hide with twOpacity">Hide Me With Opacity!</div>
```

### Syntax

```ebnf
hide [<expression>] [with <hide-show-strategy>[: <argument>]] [when <expression>]
```
