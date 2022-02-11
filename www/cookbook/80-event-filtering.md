---
title: Event Filter
---

You can easily filter events based on a condition by using the `on <event-name>[]` form of the [`on` feature](/features/on)

```html
<button _="on click[event.altKey] remove .primary then settle then add .primary">CLICK ME</button>
```

In this case we simply check if the Alt key is being held down or not.

<button
  class="btn primary"
  _="on click[event.altKey] remove .primary then settle then add .primary">CLICK ME</button>
