## TODOs

### In Progress for 0.0.8
* Carson: `tell` command to replace `with` (different semantics, it becomes the default `me` but not the actual me)

### Language Features
* range operators for strings and arrays `str[..10] str[10..] str[2..10]`
* change array literals to `Array(1, 2, 3)`
  * support ` Set(1, 2, 3)` and other data types?
  * pluggable?
*  Support a `timeout` modifier for commands like `fetch`, `call`, `wait for` etc.
  * deep project involving dealing w/ async commands not executing if they time out during execution
* `merge/merge into` - Merge objects with one another
* `delete` command
* Better DOM manipulation tools? (research)
* regular expressions `regexp /foo/` (so it doesn't conflict w/ the hyperplane)
  * full `sed` command?
* `merge/merge into` - Merge objects with one another
* `reply` & `wait for response` in event handlers
* `tell` to replace `with`?  (More orthodox HyperTalk)
* `go` to go to a URL or element in the dom (`scrollToVisible`?)
* Support parenthesizes expressions in pseudopossessives: `transition (the div's parent's parent)'s opacity to 1`
* Event model
* functions should be able to be marked `sync` to make only one execution at a time occur, in serial fashion
* unify attribute literals and array literals with lookahead
* unify all css() like literals to a general dynamic evaluation (eval is context sensitive)
* `increment/decrement` commands
* Make `first, last, random` work as identifiers (backtracking parser)
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

#### /// The Hyperplane
* A mechanism for storing values in the DOM that respects HATEOAS
  
  ```
    log /x -- a variable associated with the current 'me'
    log #foo/x -- a variable associated with the element #foo
    log //x -- a variable stored in a parent hierarchy
    log #foo//x -- a variable stored in a parent hierarchy of element #foo
    log ///x -- a persistent variable stored in local storage
  ```
  
  the hyperplane has infrastructure for catching mutations and updating references, as well as fully developed event model
    * support a `bind` feature that will bind anything to an expression
      ```
        bind me to "x is ${//x}" 
      ```
      for this to work, the first time bind evaluates this it would just take whatever was returned and then loop
      and put the hyperplane into a mutation-listening mode (for this context only) where instead of evaluating to the
      value of `/x`, it would return a promise and resolve with a new value when |x is mutated
      
      this would leverage the async-transparency runtime and make lazy binding easy!
      
      it would also allow you to bind to anything asynchronous, such as a web socket

      ```
        bind my.innerHTML to socket.getLatest() 
      ```
      
      in the absence of a promise, `bind` should poll every 500ms or something like that
      
    * support a `watch` command

  ```html
  <div>///somePersistentVar</div>
  ```

### Infrastructure
* Recovering parser (we are single error right now)
* Handle multiple returns/throws in an async context (timeout, async, etc.)
