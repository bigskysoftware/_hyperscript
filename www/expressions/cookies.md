---
title: cookies - ///_hyperscript
---

## The `cookies` Symbol

The `cookies` symbol gives you a clean API for working with browser cookies, making them behave more like [`window.localStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) instead of the awkward [`document.cookie`](https://developer.mozilla.org/en-US/docs/web/api/document/cookie) string API.

### API

| name                         | description                                                   | example                       |
|------------------------------|---------------------------------------------------------------|-------------------------------|
| cookies.<cookie name>        | returns (or sets) the value of the cookie with the given name | `set cookies.foo to 'bar'`    |
| cookies[<cookie name>]       | returns (or sets) the value of the cookie with the given name | `set cookies['foo'] to 'bar'` |
| cookies.length               | returns the total number of cookies                           | `log cookies.length`          |
| cookies[<number>]            | returns the nth cookie                                        | `log cookies[0]`              |
| cookies.clear(<cookie name>) | clears a given cookie                                         | `cookies.clear('foo')`        |
| cookies.clearAll()           | clears all cookies                                            | `cookies.clearAll()`     |

### Iterating

The `cookies` symbol can be iterated over:

```hyperscript
    for c in cookies
      log c.name, c.value
    end
```

### Setting Cookie Attributes

You can assign a simple javascript object to a given cookie name in order to pass values for
[specialized attributes](https://developer.mozilla.org/en-US/docs/web/api/document/cookie#write_a_new_cookie) like `expires`:

```hyperscript
  set cookies['My-Cookie'] to {value: "true", maxAge: 600}
```

The attributes of the javascript object will be interpreted as follows:

* `value` will be the value of the cookie
* All other properties will be kebab-cased from camel case and set as part of the cookie string, as specified [here](https://developer.mozilla.org/en-US/docs/web/api/document/cookie#write_a_new_cookie).

### Examples

```html
<button _="on click set cookies.hello to 'world'">
    Set the cookie 'hello' to 'world'!
</button>
```

### Syntax

```ebnf
cookies
```
