---
title: fetch - ///_hyperscript
---

## The `fetch` Command

The `fetch` command issues an HTTP request using the browser's [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch). The result is saved into the `it` variable, and the command is asynchronous.

The URL can be a naked URL or a string literal:

```hyperscript
fetch /api/users              -- naked URL
fetch "https://example.com"   -- string literal
fetch `/users/${id}`          -- template literal
```

### Request Options

Pass request options with the `with` clause. These map directly to the second argument of
the browser's [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) API
([`RequestInit`](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)):

```hyperscript
fetch /api/users with method:"POST", body:"name=Joe", headers:{Accept:"application/json"}
```

You can also use an object literal:

```hyperscript
fetch /api/users with { method:"POST", body:"name=Joe" }
```

Common options:

| Option | Description |
|--------|-------------|
| `method` | HTTP method (`"GET"`, `"POST"`, `"PUT"`, `"DELETE"`, etc.). Defaults to `"GET"` |
| `headers` | An object of request headers |
| `body` | Request body - a string, `FormData`, `Blob`, etc. |
| `credentials` | `"omit"`, `"same-origin"`, or `"include"` |
| `cache` | `"default"`, `"no-store"`, `"reload"`, `"no-cache"`, `"force-cache"`, `"only-if-cached"` |
| `mode` | `"cors"`, `"no-cors"`, `"same-origin"` |
| `timeout` | Hyperscript-specific: milliseconds before the request is aborted |

Posting a form's values:

```hyperscript
fetch /api/submit with method:"POST", body:<form/> as FormData
```

Setting an auth header:

```hyperscript
fetch /api/me with headers:{Authorization:`Bearer ${token}`} as JSON
```

### Response Types

By default the response body is returned as a string. You can change this with the `as` modifier:

| Form | Result |
|------|--------|
| _(no `as`)_ | Response body as a string |
| `as Text` | Same as the default - response body as a string |
| `as JSON` | Parse the body as JSON and return the resulting object |
| `as HTML` | Parse the body as HTML and return a `DocumentFragment` |
| `as Response` | Return the raw [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) object; you handle body parsing and errors yourself |
| `as <Conversion>` | Apply any registered [conversion](/expressions/as) to the response text (e.g. `as Int`, `as Fragment`) |

The `as` clause can come before or after the `with` clause:

```hyperscript
fetch /api/users as JSON with method:"POST"
fetch /api/users with method:"POST" as JSON
```

### Error Handling

By default, `fetch` throws on non-2xx responses (404, 500, etc.), so you can
handle errors with a `catch` block:

```hyperscript
fetch /api/users as JSON
catch e
    log "fetch failed:", e
end
```

The thrown error includes `response` and `status` properties.

To pass through non-2xx responses without throwing, use `do not throw` (or `don't throw`):

```hyperscript
fetch /api/users as JSON do not throw
fetch /api/users as JSON don't throw
-- it contains whatever the server sent, even on 404/500
```

`fetch X as Response` never throws - you get the raw Response and handle it yourself:

```hyperscript
fetch /api/users as Response
if it.ok
    set data to it's json
end
```

To customize which status codes throw, set `_hyperscript.config.fetchThrowsOn` to
an array of regex patterns tested against the stringified status code. The default
is `[/4.*/, /5.*/]` (all 4xx and 5xx). Set it to `[]` to disable throwing entirely.

```js
// throw on 5xx only
_hyperscript.config.fetchThrowsOn = [/5.*/];

// throw on specific codes
_hyperscript.config.fetchThrowsOn = [/404/, /500/];

// never throw
_hyperscript.config.fetchThrowsOn = [];
```

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

<button _='on click fetch /test as JSON with method:"POST"
                    put `${its result}` into my innerHTML'>
  Post to /test!
</button>

<button _="on click fetch `${pageUrl}` as HTML
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
fetch <string-like> [as [a | an] (JSON | HTML | Response | Text | <conversion>)] [<object-literal> | with <named-args>] [(do not | don't) throw]
```
