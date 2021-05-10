
## The `hide` Command

### Syntax

```ebnf
hide [target] [with <hide-show-strategy>[: <argument>]]
```

### Description

The `hide` command allows you to hide an element in the DOM using various strategies.  The default strategy is `display`.

By default, the following strategies are available:

* `display` - toggle display between `none` and `block`
* `visibility` - toggle visibility between `hidden` and `visible`
* `opacity` - toggle visibility between `0` and `1`

You can change the default hide/show strategy by setting `_hyperscript.config.defaultHideShowStrategy`

You can add new hide/show strategies by setting the `hyperscript.config.hideShowStrategies` object.

### Examples

```html
<div _="on click hide">Hide Me!</div>

<div _="on click hide with opacity">Hide Me With Opacity!</div>

<div _="on click hide #anotherDiv">Hide Another Div!</div>
```
