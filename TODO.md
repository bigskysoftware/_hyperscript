## TODOs

### 0.0.5 release
* docs

### Language Features
* functions on elements (store in hyperplane if available)
* animate command ? I don't see a lot of value add (unlike transition)
* Event model
* Debugging
* range operator
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
* functions should be able to be marked `sync` to make only one execution at a time occur, in serial fashion
* unify attribute literals and array literals with lookahead
* unify all css() like literals to a general dynamic evaluation (eval is context sensitive)
* `default <identifier> to <expression> ` - default a value if it does not exist
* `increment/decrement` commands
* regular expressions
* range operators for strings and arrays `str[..10] str[10..] str[2..10]`
* Better DOM manipulation tools
* `merge/merge into` - Merge objects with one another
* Make `first, last, random` work as identifiers (backtracking parser)

#### Speculative Language Features
* /// The Hyperplane
  
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

* A reversable syntax for state-based transformations of DOM elements
```
  while hover add .foo
```

### Parser Infrastructure
* Recovering parser (we are single error right now)
* Pull hyperscript core out?
* Make tokenizer pluggable with new tokenization elements
