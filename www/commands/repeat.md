---
title: repeat - ///_hyperscript
---

## The `repeat` Command

The `repeat` command provides iteration in hyperscript. It supports many forms: collection loops, conditional loops, counted loops, infinite loops, event-driven loops, and bottom-tested loops.

In every form you can track the current iteration index by appending `index <identifier>` to the loop specification.

### Examples

```hyperscript
  -- the basic for loop
  repeat for p in <p/>
    add .example to p
  end

  -- syntactic sugar for the above
  for p in <p/>
    add .example to p
  end

  -- you can iterate over the properties in a javascript object
  set obj to {foo:1, bar:2}
  for x in obj
    log obj[x]
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

  -- iterate forever
  repeat forever
    toggle .throb on #div
    wait 1s
  end

  -- bottom-tested loop: body runs at least once
  repeat
    get the next <li/> from me
    remove .highlight from it
  until it is null end

  -- bottom-tested with while
  repeat
    increment x
  while x < 10 end

```

### Syntax

```ebnf
repeat for <identifier> in <expression> [index <identifier>] <command>* end
repeat in <expression> [index <identifier>] <command>* end
repeat while <expression> [index <identifier>] <command>* end
repeat until <expression> [index <identifier>] <command>* end
repeat until event <expression> [from <expression>] [index <identifier>] <command>* end
repeat <number> times [index <identifier>] <command>* end
repeat forever [index <identifier>] <command>* end
repeat <command>* until <expression> end
repeat <command>* while <expression> end
for <identifier> in <expression> [index <identifier>]
```
