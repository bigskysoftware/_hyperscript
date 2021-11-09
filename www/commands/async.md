
## The `async` Command

### Syntax

```ebnf
async <command>

async do
 {command}
end
```

### Description

The `async` command you to execute a command of a block of commands asynchronously (they will not block hyperscript from continuing
even if they return a promise)

### Examples

```html
<!--
  here we spin off the fetch and put asynchronously and immediately
  put a value into the button
-->
<button
  _="on click async do
                      fetch /example
                      put it into my.innerHTML
                    end
                    put 'Fetching It!' into my innerHTML"
>
  Fetch it!
</button>
```
