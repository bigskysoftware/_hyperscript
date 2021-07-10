
## The `show` Command

### Syntax

```ebnf
show [target] [with <hide-show-strategy>[: <argument>]]
```

### Description

The `show` command allows you to show an element in the DOM using various strategies. The default strategy is `display`.

By default, the following strategies are available:

- `display` - toggle display between `none` and `block`
- `visibility` - toggle visibility between `hidden` and `visible`
- `opacity` - toggle visibility between `0` and `1`

You can change the default hide/show strategy by setting `_hyperscript.config.defaultHideShowStrategy`

You can add new hide/show strategies by setting the `hyperscript.config.hideShowStrategies` object.

Note that the `display` strategy can take an argument to specify the type of display to use when showing. The default
is `block`

### Examples

```html
<div _="on load wait 2s then show">I'll show after a few seconds!</div>

<div _="on load wait 2s then show:inline">
  I'll show inline after a few seconds!
</div>

<div _="on load wait 2s then show with opacity">
  I'll show after a few seconds with opacity!
</div>

<div _="on click show #anotherDiv">Show Another Div!</div>
```
