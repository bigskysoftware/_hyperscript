---
title: transition - ///_hyperscript
---

## The `transition` Command

The `transition` command smoothly animates CSS properties from one value to another. It's synchronous -- execution pauses until the transition completes.

Style properties are referenced with a [style ref](/expressions/style-ref), the `*` prefix (e.g. `*opacity`, `*width`). If you specify a target (e.g. `transition my *opacity` or `transition #div's *opacity`), the transition applies to that element. Otherwise it applies to `me`.

The target can be a possessive or `of` expression:

```hyperscript
  transition my *opacity to 0
  transition the div's *opacity to 0
  transition #anotherDiv's *opacity to 0
  transition *opacity of #anotherDiv to 0
```

Each property transition starts with a style ref, optionally followed by `from` and an initial value (if omitted, the current computed value is used). Then comes `to` followed by the final value. You can use quoted or naked strings.

You can transition multiple properties in a single command by listing additional style refs one after another:

```hyperscript
  transition *opacity from 0 to 1 *translateY from '10px' to '0px' over 300ms
```

You can set the transition duration with `over` (e.g. `over 500ms` or `over 2 seconds`), or set the full transition style with `using` (e.g. `using 'all 1s ease-in'`).

The default transition is controlled by `_hyperscript.config.defaultTransition`, which is `all 500ms ease-in` by default.

The special value `initial` captures the original value of a style property the first time a transition runs on an element, and can be referenced in future transitions.

### Examples

```html
<div _="on click transition my *opacity to 0 then remove me">
  Fade then remove me
</div>
```

### Syntax

```ebnf
transition [<target>] (*<property-name> [from <string>] to <string>)+
  [over <time-expression> | using <expression>]
```
