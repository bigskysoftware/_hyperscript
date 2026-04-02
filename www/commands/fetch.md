---
title: fetch - ///_hyperscript
---

## The `fetch` Command

The `fetch` command issues an HTTP request using the browser's [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch). The result is saved into the `it` variable, and the command is asynchronous.

By default the response is processed as text, but you can change this with the `as` modifier:
- `as JSON` -- parse as JSON
- `as HTML` -- parse as HTML
- `as response` -- return the raw Response object
- `as <Conversion>` -- use any [conversion](/expressions/as) on the response text

The URL can be a naked URL or a string literal.

### Timeouts & Cancelling

You can add a timeout to a request using the `with` form:

```html
<button _="on click fetch /example with timeout:300ms
                    put the result into my innerHTML">
  Get from /example!
</button>
```

To cancel a fetch request, send a `fetch:abort` event to the element that triggered the request:

```html
<div>
    <button id="btn1"
            _="on click
                 add @disabled
                 fetch /example
                 put the result after me
               finally
                 remove @disabled">
        Get Response
    </button>
    <button _="on click send fetch:abort to #btn1">
        Cancel The Request
    </button>
</div>
```

### Dynamic URLs with Template Literals

If you need to fetch from a dynamically-generated URL, use a [template literal string](/expressions/string/) as the URL:

```hyperscript
set userId to my [@data-userId]
fetch `/users/${userId}/profile` as JSON  -- parsed into an object
```

### Events

The `fetch` command fires several events you can listen to (using hyperscript or JavaScript) for configuring requests, updating UI state, etc.

|  event | description
|-------|-------------
|`hyperscript:beforeFetch`| (Deprecated, use `fetch:beforeRequest`) Fired before a fetch request, can be used to configure headers, etc.
|`fetch:beforeRequest`| Fired before a fetch request, can be used to configure headers, etc.
|`fetch:afterResponse`| Fired after a fetch request completes but before the response is processed, can be used to mutate the response.
|`fetch:afterRequest`| Fired after a fetch response has been processed.
|`fetch:error`| Fired when an error occurs.

Below are two examples showing how to configure an `X-AuthToken` header using the `fetch:beforeRequest` event:

```html
<body _="on fetch:beforeRequest(headers)
            set headers['X-AuthToken'] to getAuthToken()">
            ...
</body>
```

```javascript
document.body.addEventListener('fetch:beforeRequest', (event) => {
    event.detail.headers['X-AuthToken'] = getAuthToken();
});
```

### Examples

```html
<button _="on click fetch /example
                    put it into my innerHTML">
  Get from /example!
</button>

<button _='on click fetch /test as json with method:"POST"
                    put `${its result}` into my innerHTML'>
  Post to /test!
</button>

<button _="on click fetch `${pageUrl}` as html
                    get the textContent of the <h1/> in it
                    call alert(result)">
  Get the title of the page!
</button>

<div _='on click fetch /number as Number with method:"POST"
                 put "${the result + 1}" into my innerHTML'>
  Increment!
</div>
```

### Syntax

```ebnf
fetch <string-like> [as [a | an] (json | html | response | text | <conversion>)] [<object-literal> | with <named-args>]
```
