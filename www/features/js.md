
## The `js` Feature (top-level)

### Syntax

`js <js-body> end`

- `js-body` is some JavaScript code.

### Description

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

`function` declarations inside a JS block will be exposed to the global scope (`let`, `var`, `const` declarations will not be exposed). As a result, this function can then be used in \_hyperscript code:

```html
<input
  type="text"
  _="
    on input call regexFind('(.*)\+.*@.*', 1, my.value"
/>
```

If you don't want to expose all the functions, return an object containing those that you _do_ want to expose:

```hyperscript
js
    function regexExec(re, str) {
        return new RegExp(re).exec(str);
    }

    function regexFind(re, group, str) {
        return regexExec(re, str)[group];
    }

    return { regexFind };
end
```

`js` blocks can also be placed in workers:

```hyperscript
worker MyWorker
    js
        function _regexFind(re, group, str) {
            return new RegExp(re).exec(str)[group];
        }
    end
    def regexFind(re, group, str) return _regexFind(re, group, str) end
```

`this` inside a `js` block is the global scope (`window`, or `self` in workers).

{% include js_end.md %}
