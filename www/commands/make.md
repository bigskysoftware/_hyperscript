---
title: make - ///_hyperscript
---

## The `make` Command

The `make` command creates new class instances or DOM elements. You can optionally name the result with `called`.

In the first form, you construct a class instance -- `make a URL from "/path/", "https://origin.example.com"` is equivalent to JavaScript's `new URL("/path/", "https://origin.example.com")`.

In the second form, you create a DOM element -- `make an <a.navlink/>` creates an `<a>` element with the class `"navlink"`. Currently, only classes and IDs are supported in the query selector.

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

### Syntax

```ebnf
make (a | an) <expression> [from <arg-list>] [called <identifier>]
make (a | an) <query-ref> [called <identifier>]
```
