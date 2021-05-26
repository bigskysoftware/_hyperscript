---
layout: layout.njk
title: ///_hyperscript
---

## The `put` Command

### Syntax

```ebnf
put <expression> (into | before | at start of | at end of | after)  <expression>`
```

### Description

The `put` command allows you to insert content into a variable, property or the DOM.

### Examples

```html
<div _="on click put '<em>Clicked!</em>' into me">Click Me!</div>

<!-- equivalent to the above -->
<div _="on click put '<em>Clicked!</em>' into my.innerHTML">Click Me!</div>

<div _="on click 
	call document.createElement('em')
	put 'Clicked!' in it
	put it in me">Click Me!</div>
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
