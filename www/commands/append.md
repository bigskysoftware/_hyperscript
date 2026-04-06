---
title: append - ///_hyperscript
---

## The `append` Command

The `append` command adds a value to the end of a string, array, or HTML element. If you don't specify a target, it writes to the standard `result` variable.

The behavior depends on the target type:

- **String** — uses `+=` to concatenate to the end of the variable.
- **Array** — uses `Array.push()` to add a new item.
- **HTML Element** — appends to the element's `innerHTML`.

### Examples

#### Append to a string

```hyperscript
set fullName to "John"
append " Connor" to fullName
-- fullName == "John Connnor"
```

#### Append to an array

```hyperscript
set resultArray to []
append 1 to resultArray
append 2 to resultArray
append 3 to resultArray
-- resultArray == [1,2,3]
```

#### Append to an HTML Element

```hyperscript
append "<i>More HTML here</i>" to #myDIV
```

#### Use `append` to collect content

If no target variable is provided, `append` writes to the standard `result` variable by default. This can help you write more compact code — but be careful, many other commands also write to `result` (or `it`), which can overwrite your work.

```hyperscript
set result to "<div>"
repeat for person in people
    append `
        <div id="${person.id}">
            <div class="icon"><img src="${person.iconURL}"></div>
            <div class="label">${person.firstName} ${person.lastName}</div>
        </div>
    `
end
append "</div>"
put it into #people
```

#### Append to a set

```hyperscript
set mySet to [] as Set
append "item" to mySet                   -- set.add("item")
```

### Syntax

```ebnf
append <expression> [to <string> | <array> | <set> | <element>]
```
