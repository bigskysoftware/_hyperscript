
## The `js` Command (inline)

**Note:** This page is about the inline JS command. \_hyperscript also supports [JS blocks at the top level](/features/js/).

### Syntax

`js[(<param-list>)] <js-body> end`

- `param-list` is a comma separated list of identifiers, which are \_hyperscript variables whose values will be passed to this JavaScript code and become available there under their original name
- `js-body` is some JavaScript code whose return value will be the result of this command (what `it` refers to in the next command).

### Description

The `js` command can be used to embed JavaScript code inline in \_hyperscript, as shown below:

```html
<button
  _="on click 
           js
               if ('clipboard' in window.navigator) {
               	 return navigator.clipboard.readText()
               }
           end
           put it in my.innerHTML "
></button>
```

`this` inside a `js` block is the global scope (`window`, or `self` in workers).

If the `js` block returns a promise, the code that comes after it will execute when it resolves.

If the `js` block needs to use variables from the surrounding \_hyperscript code, these need to be explicitly declared as shown:

```html
<button
  _="on click 
           set text to #input.value  
           js(me, text)
               if ('clipboard' in window.navigator) {
               	 return navigator.clipboard.writeText(text)
               	   .then(() => 'Copied');
               	   .catch(() => me.parentElement.remove(me))
               }
           end
           put message in my.innerHTML "
></button>
```

{% include "js_end.md" %}
