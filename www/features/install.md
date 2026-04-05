---
title: install - ///_hyperscript
---

## The `install` Feature

The `install` feature attaches a previously-defined [`behavior`](/features/behavior) to
an element, applying its event handlers and other features as if they had been written
directly on the element.

### Example

```html
<script type="text/hyperscript">
  behavior Removable
    on click remove me
  end
</script>

<div _="install Removable">Click to remove me</div>
```

### Arguments

If the behavior takes parameters, pass them as named arguments:

```html
<script type="text/hyperscript">
  behavior Removable(removeButton)
    on click from removeButton remove me
  end
</script>

<div class="banner" _="install Removable(removeButton: #close-banner)">
  <button id="close-banner">×</button>
  Banner content
</div>
```

### Namespaced Behaviors

Behaviors can be defined under a dotted path, and `install` uses the same path:

```hyperscript
behavior My.UI.Removable
  on click remove me
end
```

```html
<div _="install My.UI.Removable">...</div>
```

### Multiple Installs

You can install multiple behaviors on the same element by using `install` more than once:

```html
<div _="install Removable
        install Draggable(dragHandle: .titlebar in me)">
  ...
</div>
```

### Syntax

```ebnf
install <name>[(<named-argument-list>)]
```
