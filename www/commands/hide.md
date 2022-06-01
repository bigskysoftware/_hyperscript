
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
- `twDisplay` - add / remove `hidden` css class [Tailwind documentation](https://tailwindcss.com/docs/display#hidden)
- `twVisibility` - add / remove `invisible` css class [Tailwind documentation](https://tailwindcss.com/docs/visibility#making-elements-invisible)
- `twOpacity` - add / remove `opacity-0` css class [Tailwind documentation](https://tailwindcss.com/docs/opacity)

You can change the default hide/show strategy by setting `_hyperscript.config.defaultHideShowStrategy`

You can add new hide/show strategies by setting new values into the `_hyperscript.config.hideShowStrategies` object.

### Examples

```html
<div _="on click hide">Hide Me!</div>

<div _="on click hide with opacity">Hide Me With Opacity!</div>

<div _="on click hide #anotherDiv">Hide Another Div!</div>
```
