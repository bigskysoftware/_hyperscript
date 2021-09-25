
## The `fetch` Command

### Syntax

```ebnf
fetch <stringLike> [<object literal>] [ as ( json | text | response ) ]
```

### Description

The `fetch` command issues a [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) request to the
given URL. The URL can either be a naked URL or a string literal.

By default the result will be processed as text, but you can have it processed
as JSON, as HTML, or as a raw response object by adding the `as json`, `as html`
or `as response` modifiers.

Additionally, you can use [conversions](/expressions/as) directly on the
response text.

This command saves the result into the `it` variable.

This command is asynchronous.

### Examples

```html
<div
  _="on click fetch /example
                 put it into my.innerHTML"
>
  Get from /example!
</div>

<div
  _='on click fetch /test {method:"POST"} as json
                 put `Result: $it.result` into my.innerHTML'
>
  Post to /test!
</div>

<div
  _="on click fetch `${pageUrl}` as html
    get the textContent of the <h1/> in it
    call alert(result)"
>
  Get the title of the page!
</div>

<div
  _='on click fetch /number {method:"GET"} as Number
                 put "${it + 1}" into my.innerHTML'
>
  Increment!
</div>
```
