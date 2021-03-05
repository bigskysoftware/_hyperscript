## TODOs

### 0.0.5 release
* docs

### Language Features
* animate command ? I don't see a lot of value add (unlike transition)
* Event model
* Debugging
* range operator
*  array helpers 'first', 'last', 'in', 'random'
* Web Worker API but for Web Sockets... o_O)))
  * two way - server can invoke functions on client, client can invoke functions on server
  * normal listening for messages also works of course
* repeat command improvements
```
// By default, counter uses "it" convention
repeat from 1 to 10 
    put it in myVar
end

// This would also work if IterableVariable is an Array or Object
repeat for x in IterableVariable
    call JsFn(x)
end
```
* Support a `timeout` modifier for async commands like `fetch`, `call`, `wait for` etc.
* the `on` feature needs to support a count filter (and numeric ranges)
```on click 1 log "first click"
   on click 2 and on log "this ain't my first click"
   on click 2 to 3 log "this ain't my first click"
```
* implement the throttle, delay/debounce and maybe enqueued functionality from htmx
```
  on click delay 100ms before log "delayed click"
  on click throttle 100ms before log "throttled click"
```
* functions should be able to be marked `sync` to make only one execution at a time occur, in serial fashion
* unify properly literals and array literals with lookahead
* unify all css() like literals to a general dynamic evaluation (eval is context sensitive)

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
  the hyperplane has infrastructure for catching mutations and updating references, as well as fully developed event model
    * support a `bind` feature that will bind anything to an expression
      ```
        bind my.innerHTML to "x is " + |x 
      ```
      for this to work, the first time bind evaluates this it would just take whatever was returned and then loop
      and put the hyperplane into a mutation-listening mode (for this context only) where instead of evaluating to the
      value of |x, it would return a promise and resolve with a new value when |x is mutated
      
      this would leverage the async-transparency runtime and make lazy binding easy!
      
      it would also allow you to bind to anything asynchronous, such as a web socket

      ```
        bind my.innerHTML to socket.getLatest() 
      ```
      
      in the absence of a promise, `bind` should poll every 500ms or something like that

  ```html
  <div>#|||somePersistentVar</div>
  ```

* A reversable syntax for state-based transformations of DOM elements
```
  while hover add .foo
```

### Parser Infrastructure
* Recovering parser (we are single error right now)
* Pull hyperscript core out?
* Make tokenizer pluggable with new tokenization elements
