---
title: swap - ///_hyperscript
---

## The `swap` Command

### Syntax

```ebnf
  swap <assignable expression> with <assignable expression>
```

### Description

The `swap` command exchanges the values of two assignable expressions. It works with any writable target: local variables, properties, array elements, or any combination of these.

Both values are read before either is written, so the swap is safe even when the two expressions share state.

### Examples

```html
<!-- swap two variables -->
<div _="on click set x to 'hello' then set y to 'world'
                  then swap x with y
                  then put x into me">
  Click Me!
</div>

<!-- swap two properties -->
<button _="on click swap #a.textContent with #b.textContent">
  Swap Text
</button>

<!-- swap array elements -->
<div _="on click set arr to [1, 2, 3]
                 then swap arr[0] with arr[2]
                 then put arr as String into me">
  Click Me!
</div>

<!-- swap a variable with a property -->
<div _="on click set x to 'old'
                 then swap x with #target.dataset.val
                 then put x into me">
  Click Me!
</div>
```
