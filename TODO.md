## TODOs

### 0.0.9 Release In Progress
* Deniz - template tag support
* Ben - `increment/decrement` commands
  * should work w/ strings and attributes e.g. `incremenet @count`
  * should treat empty string (and null? and undefined?) as 0
  * should support a `by` modifier e.g. `increment @count by 2`
  * should update `result`
    ```
      increment x
      put it into me
    ```

### Language Features
* Determine how to handle mutations to the DOM with respect to listeners 
   * lazily remove listeners when owner has been removed from DOM
   * when a node is replaced in the DOM, what about the listeners put on it by other elements?
* `delete` command
* `reply` & `wait for response` in event handlers?
* garbage collect event listeners added to external elements periodically (?)
* improve `fetch` command w/ more obvious syntax for body, headers, etc.
  ```text
    fetch /foo with a POST 
    fetch /foo with a POST and body {foo:"bar"}
    fetch /foo with a POST and body {foo:"bar"} and headers {blah:'blah'}
  ```
  * make defaults pluggable 
  * resurrect `ajax` command?  (had more functionality in some ways)
*  Support a `timeout` modifier for commands like `fetch`, `call`, `wait for` etc.
  * deep project involving dealing w/ async commands not executing if they time out during execution
* `merge/merge into` - Merge objects with one another
* runtime type checked parameters and return types
  ```text
    def(foo:String!) : String!
    end
  ```
* Better DOM manipulation tools? (needs research)
* Full `sed` command for string manipulation?
* `play` command using [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
* Support parenthesizes expressions in pseudopossessives: `transition (the div's parent's parent)'s opacity to 1`
* Event model
* functions should be able to be marked `sync` to make only one execution at a time occur, in serial fashion
* unify all css() like literals to a general dynamic evaluation (eval is context sensitive)
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
