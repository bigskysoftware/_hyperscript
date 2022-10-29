---
title: put - ///_hyperscript
---

## The `put` Command

### Syntax

```ebnf
put <expression> (into | before | at [the] start of | at [the] end of | after)  <expression>`
```

### Description

The `put` command allows you to insert content into a variable, property or the DOM.

Content that is added to the DOM via the `put` command targeting DOM will have any hyperscript content within it
initialized without needing to call `processNode()`.

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
