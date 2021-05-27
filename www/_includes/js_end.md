### Note on `end`

`end` cannot appear inside JS code as an identifier. However, it **can** appear in string literals (`"end", 'end'`, **not** `` `end` ``).

Here are workarounds for some cases where you might need `end` in your JavaScript code:

```js
// Don't:
var end = getTheEnd();
// Do:
var theEnd = getTheEnd();

// Don't:
getEndable().end();
// Do:
getEndable()["end"]();

// Don't:
var template = `this can only end ${good ? "well" : "badly"}`;
// Do:
var template = `this can only ${"end"} ${good ? "well" : "badly"}`;

// Don't:
var regex = /end (.*)/;
// Do:
var regex = new RegExp("end (.*)");
```
