---
title: Drag-and-drop elements
---

You can drag and drop elements by listening to drag events and using the `dataTransfer` object.

```html
<p _="on dragstart call event.dataTransfer.setData('text/plain',target.textContent)">
  <button class="btn primary" draggable=true>DRAG ME</button>
  <button class="btn primary" draggable=true>OR ME</button>
</p>
```

```html
<pre _="
  on dragover or dragenter halt the event
    then set the target's style.background to 'lightgray'
  on dragleave or drop set the target's style.background to ''
  on drop get event.dataTransfer.getData('text/plain')
    then put it into the next <output/>
    halt the event's bubbling">Drop Area
&nbsp;
&nbsp;
&nbsp;
Drop Area</pre>
Result: <output></output>
```

When a drag starts, we set the value of the dataTransfer object. When the drag goes over a [valid drop zone](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API#define_a_drop_zone) we set the background. When leaving a drop zone or after a drop we reset the background. Upon a drop we recover the original value and display it.

In some cases it is necessary to prevent the event's bubbling.
A drop event, for example, can trigger a search of the dropped string in browsers. A dragstart event, when nested, may result in unexpected data overwrites.

<p _="on dragstart call event.dataTransfer.setData('text/plain',target.textContent)">
  <button class="btn primary" draggable=true>DRAG ME</button>
  <button class="btn primary" draggable=true>OR ME</button>
</p>

<pre _="
  on dragover or dragenter halt the event
    then set the target's style.background to 'lightgray'
  on dragleave or drop set the target's style.background to ''
  on drop get event.dataTransfer.getData('text/plain')
    then put it into the next <output/>
    halt the event's bubbling">Drop Area
&nbsp;
&nbsp;
&nbsp;
Drop Area</pre>
Result: <output></output>

This can also be used to accept dragged files for an `<input type="file">` element.
