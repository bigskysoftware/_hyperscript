## TODOs

### Language Features
* Support a `timeout` modifier for async commands like `fetch`, `call`, `wait for` etc.
* Array improvements
    * support the [] operator
    * add `first`, `last` and `random` pseudo-properties
    * property references off of arrays (that are not `length`, `first`, `last` or `random`) are flatMaps
* the `on` feature needs to support a count filter
```on click 1 log "first click"
   on click 2 and on log "not first click
```
* the `on` feature should by default only allow one concurrent execution, unless modified with the `every` keyword
```
  on click wait 2s then log "one click at a time causes execution"
  on every click wait 2s then log "every click causes execution"
```
  * basically reimplement the throttle/delay functionality from htmx
* functions should be able to be marked `sync` to make only one execution at a time occur
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

### Language Infrastructure
* Figure out exception propagation in mixed/mode evaluation
    * throw?
    * catch blocks?  Associated with functions?
    * events?

### Parser Infrastructure
* Recovering parser (we are single error right now)
* Pull hyperscript core out?
* Make parser pluggable with new syntactic elements
* Make tokenizer pluggable with new tokenization elements