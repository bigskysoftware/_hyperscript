---
title: set - ///_hyperscript
---

## The `set` Feature

The `set` feature runs a `set` command once when the feature is installed
on an element. Use it at the top of an element's `_=` attribute or inside
a `behavior` to give the element initial state, mark it with an attribute,
or write a global as a side effect of mounting.

`me` is bound to the element being processed, so unrooted targets like
`@data-foo` or `*color` apply to that element automatically.

### Allowed targets

Any target except a bare (handler-local) variable is allowed:

| Target form        | Effect |
|--------------------|--------|
| `:varName`         | Element-scoped variable, lives with the element |
| `^varName`         | Inherited / DOM-scoped variable, visible to descendants |
| `$varName`         | Global (window) variable |
| `@attrName`        | Attribute on the element (calls `setAttribute`) |
| `*propName`        | Inline style property on the element |
| `me.propName`      | Property on the element via `me` |

Local variables (bare identifiers like `set foo to 42`) are rejected at
parse time, since the locals object is discarded the moment the install
context returns - the write would have no observable effect.

### Examples

Element-scoped state, the most common use:

```html
<div _="set :count to 0
        on click increment :count then put :count into me">0</div>
```

Mark an element with an attribute on mount, so other selectors can find it:

```html
<div _="set @data-ready to 'true'"></div>
```

Inside a `behavior`, set an attribute on every element it's installed onto:

```html
<script type="text/hyperscript">
  behavior LinkedScroll
    set @data-linked-scroll to 'true'
    -- ...
  end
</script>
```

Initialize a global from an element's data:

```html
<div data-user-id="42"
     _="set $currentUser to my @data-user-id"></div>
```

### Syntax

```ebnf
set <target> to <expression>
```

Where `<target>` is any non-local assignable expression - see the table
above. See the [`set` command](/commands/set) for the full list of
assignable forms (the feature accepts the same targets as the command,
minus locals).
