---
layout: layout.njk
title: ///_hyperscript
---

## The `string` Expression

### Syntax

```
  set x to "foo"
  set y to 'bar'
  set foobar to '$foo$bar'
```

### Description

String expressions are similar to string expressions in javascript, and support both a quote and double quote delimiter.

Strings in hyperscript act like [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) in Javascript, and you can use either a `$` or `${}` to include an expression value in the string.

### Examples

```html
<div _="on click log 'hello world'">Hello World!</div>
```