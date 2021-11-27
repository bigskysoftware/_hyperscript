---
title: Disable all Buttons During an htmx Request
---

If you wish to disable every button during an [htmx](https://htmx.org) request, you can use this snippet:

```html
<body _="on every htmx:beforeSend in <button:not(.no-disable)/> 
           tell it 
               toggle [disabled='true'] until htmx:afterOnLoad">
      
</body>
```

Here we use the `every` keyword to avoid queuing events, and then the `in` modifier to filter only clicks that occur
within buttons that do not have the `.no-disable` class on them.  When the body gets an event that matches this requirement, 
it will toggle the `disabled` property to `true` on the button, until it receives an `htmx:afterLoad` event from the button.  

We use the `with` command to make `it` (the button) the default target (`me`) for the toggle command
