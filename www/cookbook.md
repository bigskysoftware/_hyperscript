---
layout: layout.njk
title: ///_hyperscript
---

# The hyperscript Cookbook

Below is a collection of hyperscript snippets for achieving various patterns in web development.

### <a name="fade-and-remove"></a>[Fade & Remove](#fade-and-remove)

If you wish to fade an element out and remove it from the DOM, you can use something like this:

```html
<style>
.fade {
    transition: 1s ease-in;
    opacity: 0;
}
</style>
<button _="on click add .fade then wait for transitionend then remove me">
  Fade & Remove
</button>
```
<style>
.fade {
    transition: 1s ease-in;
    opacity: 0;
}
</style>
<button class="btn primary" _="on click add .fade then wait for transitionend then remove me">
  Fade & Remove
</button>


