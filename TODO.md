## TODOs

### Language Features
* Support a `timeout` modifier for async commands like `fetch`, `call`, `wait for` etc.
* Support an `elsewhere` modifier for the `on` feature, akin to the click-away concept from AlpineJS:
```html
<div _="on click elsewhere trigger hide
        on hide remove .visible from me">
  <a _="on click send hide to my.parent">dismiss</a>
  A Modal (click elsewhere to dismiss)
</div>
```
* Array improvements
    * support the [] operator
    * add `first`, `last` and `random` pseudo-properties
    * property references off of arrays (that are not `length`, `first`, `last` or `random`) are flatMaps
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
* support a `loop` command (see HyperTalk) to support indefinite looping
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
* support a `find` expression or statement that allows for general querying against the DOM
```
  find .foo
  find .foo .bar
  find .foo in bar
  find one div.foo in section.bar
  find one div.foo in section.bar where children.count > 2
```
* inline js both at the top level (mainly for workers) and inside functions
```
js
  function foo() {
    // some garbage js
  }
end

def foo()
  set x to 10
  js
    in: x
    out: y
    var y = x + someJavscriptFunction();
  end
  log y
 end
```
* support double dash comments `-- this is a comment`

#### Speculative Language Featurs
* A two-way binding system (maybe a global two way-bound namespace? hyperplane?)
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