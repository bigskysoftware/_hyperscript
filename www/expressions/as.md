---
title: as - ///_hyperscript
---

## The `as` Expression

The `as` expression converts a value from one type to another using hyperscript's pluggable conversion system. You can chain multiple conversions together with the pipe operator (`|`).

By default, hyperscript provides the following conversions:

* `Array` - convert to Array
* `Boolean` - convert to boolean
* `Date` - convert to Date
* `Float` - convert to float
* `FormEncoded` - converts an object into a form-encoded string
* `Fragment` - converts a string into an HTML Fragment
* `HTML` - converts NodeLists and arrays to an HTML string
* `Int` - convert to integer
* `JSON` - parse a JSON string into an object
* `JSONString` - convert to a JSON string
* `Number` - convert to number
* `Object` - convert from a JSON string
* `String` - convert to String
* `Values` - converts a Form (or other element) into a struct containing its input names/values
* `Fixed<:N>` - convert to a fixed precision string representation of the number, with an optional precision of `N`

### Examples

```hyperscript
  log '10' as Int                       -- logs 10
  log '3.141568' as Fixed:2             -- logs '3.14'
  log '{"foo":10}' as JSON              -- logs { "foo": 10 }
  log 10 as String                      -- logs "10"
  log #myForm as Values | JSONString    -- logs form data as JSON string
  log #myForm as Values | FormEncoded   -- logs form data as URL-encoded string
```

### Custom Conversions

You can add new conversions by adding them to the `_hyperscript.config.conversions` object:

```js
_hyperscript.config.conversions["MyConversion"] = function (val) {
  return "I converted: " + val;
};
```

which can then be used like so in hyperscript:

```html
<button _="on click put 'foo' as MyConversion into my innerHTML">
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
<button _="on click put 'foo' as MyConversion:Short into my innerHTML">
  Call my conversion
</button>
```

### Syntax

```ebnf
<expression> as [a | an] <conversion> [| <conversion>]*
```
