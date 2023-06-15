---
title: cookies - ///_hyperscript
---

## The `cookies` Symbol

### Syntax

```ebnf
  cookies
```

### Description

The cookies symbol is not a proper expression, but rather a value assigned, by default, to the `cookies` symbol.  This
value presents a better API than the standard [`document.cookie`](https://developer.mozilla.org/en-US/docs/web/api/document/cookie)
API, making it cookies work more like [`window.localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

The API of the `cookies` symbol is as follows:

| name                         | description                                                   | example                       |
|------------------------------|---------------------------------------------------------------|-------------------------------|
| cookies.<cookie name>        | returns (or sets) the value of the cookie with the given name | `set cookies.foo to 'bar'`    |
| cookies[<cookie name>]       | returns (or sets) the value of the cookie with the given name | `set cookies['foo'] to 'bar'` |
| cookies.length               | returns the total number of cookies                           | `log cookies.length`          |
| cookies[<number>]            | returns the nth cookie                                        | `log cookies[0]`              |
| cookies.clear(<cookie name>) | clears a given cookie                                         | `cookies.clear('foo')`        |
| cookies.clearAll()           | clears all cookies                                            | `cookies.clear('foo')`        |

In addition to this, the `cookies` symbol can be iterated over:

```hyperscript
    for c in cookies
      log c.name, c.value
    end
```

You can also assign a simple javascript object to a given cookie name in order to pass values for 
[specialized attributes](https://developer.mozilla.org/en-US/docs/web/api/document/cookie#write_a_new_cookie) like `expires`:

```hyperscript
  set cookies['My-Cookie'] to {value: "true", maxAge: 600}
```

The attributes of the the javascript object will be interpreted as follows:

* `value` will be the value of the cookie
* All other properties will be kebab-cased from camel case and set as part of the cookie string, as specified [here](https://developer.mozilla.org/en-US/docs/web/api/document/cookie#write_a_new_cookie).


### Examples

```html
<div _="on click wait 2s then log 'hello world'">Hello World!</div>
```
