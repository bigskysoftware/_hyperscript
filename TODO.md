## TODOs

## 0.0.4 features
* **_DONE_** @Deniz Akşimşek Support an `elsewhere` modifier for the `on` feature, akin to the click-away concept from AlpineJS:
```html
<div _="on click elsewhere trigger hide
        on hide remove .visible from me">
  <a _="on click send hide to my.parent">dismiss</a>
  A Modal (click elsewhere to dismiss)
</div>
```
* @benpate Array improvements
    * support the [] operator
    * add `first`, `last` and `random` pseudo-properties
    * property references off of arrays (that are not `length`, `first`, `last` or `random`) are flatMaps
* @1dg support a `repeat` command (see HyperTalk) to support indefinite looping
```
// Infinite loop
repeat forever
  call blink()
end

// Simple repeat without requiring a counter
repeat 5 times
    call pulse()
end

// By default, counter uses "it" convention
repeat from 1 to 10 
    put it in myVar
end

// Loop over an array (counter is still "it")
repeat in [1, 2, 3, 4, 5]
    put it in myVar
end

// Assign a variable name if you don't want to use "it"
repeat for x in ['a', 'b', 'c', 'd']
    call myVar(x) 
end

// This would also work if IterableVariable is an Array or Object
repeat for x in IterableVariable
    call JsFn(x)
end

// until loops
repeat until myVar is 100 
    call increment(myVar) 
end

// while loops
repeat while myVar < 100
    call amazingJSHere(myVar)
end

// event gated loops
repeat until event foo
  log "not yet..."
end

repeat until event foo on #bar 
  log "not yet..."
end
```
* First pass at documentation
* MAYBE @Deniz Akşimşek string expression templating
```
   set str to "this $is a ${cool.feature}"
```

### Language Features
* Support `is`, `is not`, `is really`, `is greater than` etc.
* Support a `timeout` modifier for async commands like `fetch`, `call`, `wait for` etc.
* the `on` feature needs to support a count filter (and numeric ranges)
```on click 1 log "first click"
   on click 2.. on log "this ain't my first click"
```
* implement the throttle, delay and maybe enqueued functionality from htmx
```
  on click delay 100ms before log "delayed click"
  on click throttle 100ms log "throttled click"
  on click enqueued log "throttled click"
```
* functions should be able to be marked `sync` to make only one execution at a time occur, in serial fashion
* support a non-blocking `listen` command for listening for an event without blocking
```
  listen for click on #btn with clicked
  loop while not clicked
    add .foo to #bar
    wait for transitionend on #bar
    remove .foo from #bar
    wait for transitionend on #bar
  end
  add .finishTransition to #bar
  wait for transitionend on #bar
  remove .finishTransition from #bar
```
* support a `select` expression or statement that allows for general querying against the DOM
```
  select .foo
  select .foo .bar
  select .foo in bar
  select one div.foo in section.bar
  select one div.foo in section.bar where children.count > 2
```

#### Speculative Language Features
* A two-way binding system (maybe a global two way-bound namespace? hyperplane?
  some speculation:
  Hyperplane - hyperscript's two-way binding mechanism.  The hyperplane is a place to store values accessible outside of the normal scope.  There are various dimensions/planes in the hyperplane:
  
  ```
    log |x -- a variable associated with the current 'me'
    log #foo|x -- a variable associated with the element #foo
    log ||x -- a global variable stored in memory
    log |||x -- a persistent variable stored in local storage
  ```
  the hyperplane has infrastructure for catching mutations and updating references, as well as fully developed event model, and hyperplane expressions can be embedded in HTML

  ```html
  <div>#|||somePersistentVar</div>
  ```

* A reversable syntax for state-based transformations of DOM elements
```
  while hover add .foo
```

### Language Infrastructure
* catch blocks for functions?

### Parser Infrastructure
* Recovering parser (we are single error right now)
* Pull hyperscript core out?
* Make parser pluggable with new syntactic elements (commands, features and primary/top-level expressions at least)
* Make tokenizer pluggable with new tokenization elements
