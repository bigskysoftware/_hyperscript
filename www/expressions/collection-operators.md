---
title: collection operators - ///_hyperscript
---

## Collection Operators

Collection operators let you filter, sort, transform, split, and join sequences inline, right in your hyperscript expressions. They chain naturally -- you can filter a list, sort it, then map it, all in one expression.

Inside `where` and `mapped to` expressions, `it` (and `its`) refers to the current element being tested or transformed.

- **`where`** -- filters a collection, keeping only elements where the condition is true.
- **`sorted by`** -- sorts a collection by a key expression. Add `descending` to reverse the order.
- **`mapped to`** -- transforms each element, producing a new collection.
- **`split by`** -- splits a string into an array by a delimiter.
- **`joined by`** -- joins a collection into a string with a delimiter between elements.

### Examples

```html
<button _="on click
             set items to <li/> where it matches .active
             log items">
  Active items
</button>
```

```html
<button _="on click
             set sorted to <li/> sorted by its textContent
             log sorted">
  Sort items
</button>
```

```html
<button _="on click
             set names to <li/> mapped to its textContent
             put names joined by ', ' into #output">
  List names
</button>
```

```html
<input _="on keyup
            set words to my value split by ' '
            put words.length + ' words' into the next <span/>"/>
```

```html
<button _="on click
             set items to <li/> where its textContent is not empty
                                 sorted by its textContent descending
                                 mapped to its textContent
             put items joined by ' | ' into #result">
  Chain it all
</button>
```

### Syntax

```ebnf
<collection> where <condition>
<collection> sorted by <expression> [descending]
<collection> mapped to <expression>
<string> split by <expression>
<collection> joined by <expression>
```
