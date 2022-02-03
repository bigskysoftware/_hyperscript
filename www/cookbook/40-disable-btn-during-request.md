---
title: Disable a Button During an htmx Request
---

If you wish to disable a button during an [htmx](https://htmx.org) request, you can use this snippet:

```html
<button
      class="button is-primary"
      hx-get="/example"
      _="on click toggle [@disabled='true'] until htmx:afterOnLoad">
      Do It
</button>
```
