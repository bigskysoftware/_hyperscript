---
layout: layout.njk
title: ///_hyperscript
---

# The `js` Feature (top-level)

**Note:** This page is about the top-level JS feature. \_hyperscript also supports [inline JS as a command](/commands/js/), say, inside an event listener or function.

Top-level JavaScript can be used in a `<script type=text/hyperscript>` block, as shown:

```hyperscript
js
    function regexFind(re, group, str) {
        return new RegExp(re).exec(str)[group];
    }

    return { regexFind };
end
```

Declarations inside the `js` block are local to the block. If the JavaScript body returns an object as shown above, its properties will be copied to the global scope. As a result, this function can then be used in \_hyperscript code:

```html
<input type=text _="
    on input call regexFind('(.*)\+.*@.*', 1, my.value" />
```


<div hidden><!-- this is not implemented yet -->

`js` blocks can also be placed in workers:

```hyperscript
worker MyWorker
    js
        return {
            _regexFind(re, group, str) {
                return new RegExp(re).exec(str)[group];
            }
        };
    end
    def regexFind(re, group, str) return _regexFind(re, group, str) end
```

</div>

`this` inside a `js` block is the global scope (`window`, or `self` in workers).

{% include js_end.md %}
