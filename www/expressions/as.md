---
layout: layout.njk
title: ///_hyperscript
---

## The `as` Expression

### Syntax

```ebnf
  <expression> as CONVERSION
```

### Description

Hyperscript provides a pluggable conversion system with the `as` expression. It will look up the conversion of the given name and apply it to the input expression.

By default, hyperscript provides the following conversions:

* `Array` - convert to Array
* `Date` - convert to Date
* `Float` - convert to float
* `Fragment` - converts a string into an HTML Fragment
* `HTML` - converts NodeLists and arrays to an HTML string
* `Int` - convert to integer
* `JSON` - convert to a JSON String
* `Number` - convert to number
* `Object` - convert from a JSON String
* `String` - convert to String
* `Values` - converts a Form (or other element) into a struct containing its input names/values

You can add new conversions by adding them to the `_hyperscript.config.conversions` object:

```js
_hyperscript.config.conversions["MyConversion"] = function (val) {
  return "I converted: " + val;
};
```

which can then be used like so in hyperscript:

```html
<button _="on click put 'foo' as MyConversion into my.innerHTML">
  Call my conversion
</button>
```

You also have the option to create a dynamic conversion, which will be called
before all conversions, and allow you to create more flexible conversion naming schemes

```js
_hyperscript.config.conversions.dynamicResolvers.push(function (
  conversionName,
  val
) {
  if (conversionName.indexOf("MyConversion:") == 0) {
    var arg = conversionName.split(":")[1];
    if (arg === "Short") {
      return "I converted : " + val;
    } else if (arg === "Long") {
      return "I am happy to announce I converted : " + val;
    }
  }
});
```

This conversion could now be used like so:

```html
<button _="on click put 'foo' as MyConversion:Short into my.innerHTML">
  Call my conversion
</button>

<button _="on click put 'foo' as MyConversion:Long into my.innerHTML">
  Call my conversion
</button>
```
