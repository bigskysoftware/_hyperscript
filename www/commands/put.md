---
title: put - ///_hyperscript
---

## The `put` Command

The `put` command inserts content into a variable, property, or the DOM. It reads naturally for placement operations like "put X into Y" or "put X after Y".

Content added to the DOM via `put` will have any hyperscript within it automatically initialized -- no need to call `processNode()`.

### Examples

```html
<div _="on click put '<em>Clicked!</em>' into me">Click Me!</div>

<!-- equivalent to the above -->
<div _="on click put '<em>Clicked!</em>' into my.innerHTML">Click Me!</div>

<div
  _="on click
	call document.createElement('em')
	put 'Clicked!' in it
	put it in me"
>
  Click Me!
</div>
```

```hyperscript
def fillList(array, ul)
	for item in array
		-- put `<li>${item}</li>` at end of ul
		call document.createElement('li')
		put the item into its textContent
		put it at end of the ul
	end
end
```

### Arrays

`put` works with arrays for positional insertion:

```hyperscript
put item at start of myArray             -- unshift
put item at end of myArray               -- push
```

### Syntax

```ebnf
put <expression> (into | before | at [the] start of | at [the] end of | after) <expression>
```
