
## The `append` Command

### Syntax

```ebnf
append <string> [to <string> | <array> | <HTML Element>]
```

### Description

The `append` command adds a string value to the end of another string, array, or HTML Element. If no target variable is defined, then the standard `result` variable is used by default.

### Examples

#### Append to a string

If you target a string variable, then `append` uses `+=` to add the string to the end of the target variable.

```hyperscript
set fullName to "John"
append " Connor" to fullName
-- fullName == "John Connnor"
```

#### Append to an array

If you target an array variable, then `append` uses `Array.push()` to add a new item to the end of the array.

```hyperscript
set resultArray to []
append 1 to resultArray
append 2 to resultArray
append 3 to resultArray
-- resultArray == [1,2,3]
```

#### Append to an HTML Element

If you target an HTML Element, then the value is appended to the end of the element's `innerHTML`.  This also works with `me` and `myself` references.

```hyperscript
append "<i>More HTML here</i>" to #myDIV
append "<b>well done</b>" to myself
```


#### Append to a collection of HTML Elements

If you use a CSS selector to target a group of HTML Elements, then the value is appended to the end of the every element's `innerHTML`.

```hyperscript
append "<i>More HTML here</i>" to <.classRef/>
```


#### Use `append` to collect content

If no target variable is provided, `append` writes to the standard `result` variable by default. In some cases this can help you to write even more compact code. But, be careful! Many other commands will also write to the `result` (or `it`) variable, which can overwrite your work.

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
