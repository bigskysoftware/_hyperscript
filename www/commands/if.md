---
layout: layout.njk
title: ///_hyperscript
---

## The `if` Command

### Syntax

`if <conditional> [then] <command-list> [else <command-list] end`

### Description

The `if` command provides the standard if-statement control flow.

### Examples

```html
<div _="on click if not me.disabled then add .clicked end">Click Me!</div>
```