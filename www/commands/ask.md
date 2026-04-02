---
title: ask - ///_hyperscript
---

## The `ask` Command

The `ask` command displays a browser `prompt()` dialog with the given message. The user's input is placed into [`it`](/expressions/it). If the user cancels, `it` is `null`.

### Examples

```html
<button _="on click
  ask 'What is your name?'
  if it is not null
    put 'Hello, ' + it into #greeting
  end
">Ask Name</button>
<span id="greeting"></span>
```

### Syntax

```ebnf
ask <expression>
```
