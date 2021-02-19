---
layout: layout.njk
title: ///_hyperscript
---

**Note:** This page is about the top-level JS feature. \_hyperscript also supports [inline JS as a command](/commands/js/), say, inside an event listener or function.

Top-level JavaScript can be used in a `<script type=text/hyperscript>` block, as shown:

```
js
    function regexFind(re, group, str) {
        return new RegExp(re).exec(str)[group];
    }

    return { regexMatch };
end
```

This function can then be used in \_hyperscript code:

```html
<input type=text _="
    on input call regexFind('(.*)\+.*@.*', 1, my.value" />
```
