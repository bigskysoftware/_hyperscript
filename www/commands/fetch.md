---
layout: layout.njk
title: ///_hyperscript
---

## The `fetch` Command

### Syntax

`fetch url`
`fetch url {args}`
`fetch url {args} as json`

* `url` can be either a string or a naked url

### Description

The `fetch` command issues a [fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) request to the 
given URL.  The URL can either be a naked URL or a string literal.

By default the result will be processed as text, but you can have it processed as JSON, or as a raw request object
by adding the `as json` or `as request` modifiers.

This command saves the result into the `it` variable.

This command is asynchronous.  All commands that follow it will be delayed until the fetch request completes.

### Examples

```html
<div _='on click fetch /example then put it into my.innerHTML'>
  Get from /example!
</div>

<div _='on click fetch /test {method:"POST"} as json then call JSON.stringify(it) then put it into my.innerHTML'>
  Post to /example!
</div>
```  