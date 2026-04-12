---
title: take - ///_hyperscript
---

## The `take` Command

The `take` command removes a class or attribute from a set of elements and
adds it to a target. It is hyperscript's shorthand for "exactly one of these
elements should have this state" - the canonical use is the active tab in a
tab strip, but the same shape covers selected rows, mode switches, breadcrumb
step indicators, single-select chips, and any other mutually-exclusive UI.

### Anatomy

```
take <class-ref+ | attribute-ref> [with <value>] [from <source> [giving <value>]] [for <target>]
```

| Clause                | What it does | Default if omitted |
|-----------------------|--------------|--------------------|
| `<class-ref>`         | One or more `.classNames` to move | - required form A |
| `<attribute-ref>`     | An `@attr` or `[@attr='value']` to move | - required form B |
| `with <value>`        | A *replacement* given to the `from` elements instead of having the class/attribute removed. For the attribute form `<value>` is any expression; for the class form it is a single class reference. | class is removed / attribute is removed |
| `from <expression>`   | Source element(s) to take from | for classes: any element on the page that has the class; for attributes: must be specified |
| `giving <value>`      | Same meaning as `with`, but written *after* the `from` clause where it usually reads more naturally. Cannot be combined with `with`. | - |
| `for <expression>`    | Destination element to give it to | `me` |

### Class form

```html
<div _="on click take .active">
  Activate me - removes .active from any element on the page that has it,
  then adds it to me.
</div>
```

```html
<ul _="on click take .selected from <li/> in me for the closest <li/> to the target">
  <li>One</li><li>Two</li><li>Three</li>
</ul>
```

The `from` clause narrows the search and the `for` clause picks the
destination. `for` defaults to `me`, so leaving it off means "give it to
the element this handler is on."

#### Swapping classes

For mutually-exclusive states like `selected`/`unselected`, you can give
the `from` elements a *replacement* class with `with` (before `from`) or
`giving` (after `from`). The `for` target gets the inverse swap - it
gains the taken class and loses the replacement.

```html
<div class="seg" _="on click take .selected from .opt giving .unselected for the closest <.opt/> to the target">
  <button class="opt selected">Day</button>
  <button class="opt unselected">Week</button>
  <button class="opt unselected">Month</button>
</div>
```

Click any option: every `.opt` ends up `unselected` except the clicked
one, which is `selected`. Same single-statement DOM walk as the
attribute version.

This form is only valid for a single class reference - `take .a .b
giving .c` is rejected at parse time, since it isn't clear which class
`.c` should pair with.

### Attribute form

```html
<button _="on click take @aria-current">Active step</button>
```

Removes `aria-current` from anywhere on the page that has it, then adds
it (with an empty value) to the clicked button.

The `with` clause changes the semantic from *remove* to *replace* on the
`from` elements - useful for ARIA attributes that should always be present
with one value or another. The same value can also be written *after* the
`from` clause as `giving`, which usually reads more naturally:

```html
<div _="on click
          take @aria-selected='true'
          from <[role=tab]/> in me
          giving 'false'
          for the closest <[role=tab]/> to the target">
  <button role="tab" aria-selected="true">One</button>
  <button role="tab" aria-selected="false">Two</button>
</div>
```

That single statement does four things at once: every other tab gets
`aria-selected="false"`, the clicked tab gets `aria-selected="true"`,
and the runtime walks the DOM only twice (once for the source set, once
for the target).

`giving` and `with` are interchangeable, and `giving` may appear either
*before* the `from` clause (matching the position of `with`) or *after*
it. Pick whichever order reads best for the statement at hand:

```
-- both of these do exactly the same thing
take @aria-selected='true' with 'false' from <[role=tab]/> in me for tab
take @aria-selected='true' from <[role=tab]/> in me giving 'false' for tab
```

`with` and `giving` cannot be combined in the same statement.

### Multiple classes at once

```html
<div _="on click take .active .highlight from .item for me">…</div>
```

Each listed class is moved independently from the same source set to
the same destination.

### See also

- [Tabs with `take` pattern](/patterns/dom/tabs/) - the canonical use
- [`add ... when`](/commands/add) - the complementary form for "set this
  state on each element of a query based on a per-element predicate"

### Syntax

```ebnf
take (<class-ref>+ [with <class-ref>] | <attribute-ref> [with <expression>])
     [from <expression> [giving (<class-ref> | <expression>)]]
     [for <expression>]
```
