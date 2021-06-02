## TODOs

### 0.1.0 release
* Carson(?) - Proper scoping, including in behaviors
* Deniz - Determine how to handle mutations to the DOM with respect to listeners
   * [ ] when a node is replaced in the DOM, what about the listeners put on it by other elements?
   * [X] lazily remove listeners when owner has been removed from DOM
* Ben(?) - improve `fetch` command w/ more obvious syntax for body, headers, etc.
  ```text
    fetch /foo with a POST
    fetch /foo with a POST and body {foo:"bar"}
    fetch /foo with a POST and body {foo:"bar"} and headers {blah:'blah'}
  ```
  * make defaults pluggable
  * resurrect `ajax` command?  (had more functionality in some ways)
* Ben(?) - Better DOM manipulation tools? (needs research)
* Carson (?) - Recovering parser (we are single error right now)

### Language Features
* `delete` command
* `reply` & `wait for response` in event handlers?
* garbage collect event listeners added to external elements periodically (?)
*  Support a `timeout` modifier for commands like `fetch`, `call`, `wait for` etc.
  * deep project involving dealing w/ async commands not executing if they time out during execution
* `merge/merge into` - Merge objects with one another
* runtime type checked parameters and return types
  ```text
    def(foo:String!) : String!
    end
  ```
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
* date/time library [See GitHub](https://github.com/bigskysoftware/_hyperscript/issues/123)
* `global` keyword [See GitHub](https://github.com/bigskysoftware/_hyperscript/issues/122)
* Expressions for `field`, `button`, `tag` and `nodeList` [See GitHub](https://github.com/bigskysoftware/_hyperscript/issues/121)
* Event for DOM mutation commands (put, append, render) -- user can add listener to initialize inserted content
* Interpolate elements into queries
  ```hyperscript
  <${me} ~ pre>code/> -- all code blocks after me
  ```
  do this by adding a temporary attribute
