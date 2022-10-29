---
title: make - ///_hyperscript
---

## The `make` command

### Syntax

```ebnf
make (a|an) <expression> [from <arg-list>] [called <identifier>]
make (a|an) <query-ref>                    [called <identifier>]
```

### Description

The `make` command can be used to create class instances or DOM elements.

In the first form:

```hyperscript
make a URL from "/path/", "https://origin.example.com"
```

is equal to the JavaScript `new URL("/path/", "https://origin.example.com")`.

In the second form:

```hyperscript
make an <a.navlink/>
```

will create an `<a>` element and add the class `"navlink"` to it. Currently, only
classes and IDs are supported.

### Examples

```hyperscript
def formatPizzaToppings(toppings)
  make an Intl.ListFormat from "en", { type: "conjunction" }
    called listFmt

  for part in listFmt.formatToParts(toppings)
    if the part's type is "element"
      make a <span.topping/>
      put the part's value into its textContent
      append it to #toppings
    else
      append the part's value to #toppings
    end
  end
```

 <span class="topping">Pepperoni</span>, <span class="topping">Mushrooms</span>
and <span class="topping">Green Peppers</span>

<style>
.topping { font-weight: bold; color: #e10 }
</style>
