---
layout: layout.njk
title: ///_hyperscript
---

## The `ajax` Command

### Syntax

`ajax GET url`
`ajax POST [data] to url`

* `url` can be either a string or a naked url

### Description

The `ajax` command issues an ajax request to the given URL.  The URL can either be a naked URL or a string literal.

If the request is a `POST` it can include serialized JSON data.

This command introduces two symbols after it:

* `response` - the response text
* `xhr` - the xhr that issued the request

This command is asynchronous.  All commands that follow it will be delayed until the AJAX request completes.

### Examples

```html
<div _='on click ajax GET /example then put response into my.innerHTML'>
  Get from /example!
</div>

<div _='on click ajax POST {answer:42} to /example then put response into my.innerHTML'>
  Post to /example!
</div>
```  