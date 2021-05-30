
## The `repeat` Command

### Syntax

```ebnf
repeat for <identifier> in <expression> [index <identifier>] { <command> } end
repeat in <expression> [index <identifier>] { <command> } end
repeat while <expression> [index <identifier>] { <command> } end
repeat until <expression> [index <identifier>] { <command> } end
repeat until event <expression> [from <expression>] [index <identifier>] { <command> } end
repeat <number> times [index <identifier>] { <command> } end
repeat forever <expression> [index <identifier>] { <command> } end
for <identifier> in <expression> [index <identifier>]
```

### Description

The `repeat` command provides iteration in the hyperscript language. It is very flexible and supports many forms.

In every form you may assign a named value to the current iteration index by appending a `index i` to the
loop specification.

Here are examples of all the above forms:

```hyperscript
  -- the basic for loop
  repeat for p in <p/>
    add .example to p
  end

  -- syntactic sugar for the above
  for p in <p/>
    add .example to p
  end

  -- iterating over an array but without an explicit variable
  -- instead the keyword it is used
  repeat in <p/>
    add .example to it
  end

  -- iterate while a condition is true
  repeat while #div matches .active
    put "Still waiting." into #div.innerHTML
    wait 1s
    put "Still waiting.." into #div.innerHTML
    wait 1s
    put "Still waiting..." into #div.innerHTML
  end

  -- iterate until a condition is true
  repeat until #div does not match .active
    put "Still waiting." into #div.innerHTML
    wait 1s
    put "Still waiting.." into #div.innerHTML
    wait 1s
    put "Still waiting..." into #div.innerHTML
  end

  -- iterate until an event 'stop' occurs
  repeat until event stop
    put "Still waiting." into #div.innerHTML
    wait 1s
    put "Still waiting.." into #div.innerHTML
    wait 1s
    put "Still waiting..." into #div.innerHTML
  end

  -- iterate five times
  repeat 5 times
    put "Fun " before end of #div.innerHTML
  end

  -- iterate five times
  repeat forever
    toggle .throb on #div
    wait 1s
  end

```
