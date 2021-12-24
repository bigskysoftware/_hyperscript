
## The `fetch` Command

### Syntax

```ebnf
fetch <stringLike> [<object literal> | 'with' <naked named arguments>] [ as [ a | an ]( json | Object | text | request ) ]
```

### Description

The `fetch` command issues a [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) request to the
given URL. The URL can either be a naked URL or a string literal.

By default the result will be processed as text, but you can have it processed
as JSON, as HTML, or as a raw request object by adding the `as json`, `as html`
or `as request` modifiers.

Additionally, you can use [conversions](/expressions/as) directly on the
response text.

This command saves the result into the `it` variable.

This command is asynchronous.

### Timeouts & Cancelling

The `fetch` command supports both timeouts as well as request cancellation.

To add a timeout to a request syntactically, you can use add a `timeout` property using the `with` form:

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

### Events

The `fetch` command features a few events that can be listened to (using hyperscript or javascript) to do things
like configure the fetch options, update UI state, etc.

|  event | description
|-------|-------------
|`hyperscript:beforeFetch`| (Deprecated, use `fetch:beforeRequest`) Fired before a fetch request, can be used to configure headers, etc.
|`fetch:beforeRequest`| Fired before a fetch request, can be used to configure headers, etc.
|`fetch:afterResponse`| Fired after a fetch request completes but before the response is processed, can be used to mutate the response.
|`fetch:afterRequest`| Fired after a fetch response has been processed.
|`fetch:error`| Fired when an error occurs.

Below are a two examples showing how to configure an `X-AuthToken` header using the `fetch:beforeRequest` event:

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

<button _='on click fetch /test with method:"POST" as json
                    put `${its result}` into my innerHTML'>
  Post to /test!
</button>

<button _="on click fetch `${pageUrl}` as html
                    get the textContent of the <h1/> in it
                    call alert(result)">
  Get the title of the page!
</button>

<div _='on click fetch /number with method:"POST" as Number
                 put "${the result + 1}" into my innerHTML'>
  Increment!
</div>
```
