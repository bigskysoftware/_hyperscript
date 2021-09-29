---
layout: layout.njk
title: ///_hyperscript
---

## The `it/result` Variable

### Syntax

```ebnf
  it
```

### Description

Many hyperscript commands return a value which is stored in the local variable scope as `result` or `it`.  Subsequent commands will often overwrite this value, so you'll need to store it in your own variable before it gets erased.

For [possessive expressions](/expressions/possessive), `its` will also work, as in `its property` instead of `it.property`.

### Examples

This uses the [fetch command](/commands/fetch) to load data from a server, an [as expression](/expressions/as) to parse JSON, then [puts](/commands/put) the result into a local variable called "people"

```hyperscript
    fetch /my-server/people as an Object
    put it into people
```
