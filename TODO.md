## TODOs

### 0.8.0 release
* Carson - Proper scoping, including in behaviors NEEDS DOCS
* Deniz - Rework target expression (?)
* Deniz - Determine how to handle mutations to the DOM with respect to listeners
   * lazily remove listeners when owner has been removed from DOM
   * when a node is replaced in the DOM, what about the listeners put on it by other elements?
* Deniz - `me` identifier inside of css query literals
* Ben(?) - improve `fetch` command w/ more obvious syntax for body, headers, etc.
  ```text
    fetch /foo with a POST
    fetch /foo with a POST and body {foo:"bar"}
    fetch /foo with a POST and body {foo:"bar"} and headers {blah:'blah'}
  ```
  * make defaults pluggable
  * resurrect `ajax` command?  (had more functionality in some ways)
* Ben(?) - Better DOM manipulation tools? (needs research)
* Carson - template support in class literals and id literals:
  ```hyperscript
    set foo to 'blah'
    set x to .{foo}
    set y to #{foo}
  ```

### Language Features
* Recovering parser (we are single error right now)
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


### Scoping Spec

* The default scope is `local` and is bound to the given feature's execution context
    * variables are "hoisted" as with the `var` statement in javascript
* Variables are declared implicitly by setting a value to a name
* By default `set x to 10` follows this resolution process:
  * examine the current scope, if `x` exists, update its value
  * examine the elements scope, if `x` exists, update its value
  * examine the global scope, if `x` exists, update its value
  * if the variable does not exist in any of these scopes, create the variable in the local scope
* When reading a variable `x`, the following algorithm is used
  * examine the current scope, if `x` exists, return its value
  * examine the elements scope, if `x` exists, return its value
  * examine the global scope, if `x` exists, return its value
* Each behavior provides an isolated element scope
  * There is no mechanism for referencing the actual element scopes values from within a behavior
* If you wish to explicitly create a global variable, you must use the `global` keyword: `set global x to 10`
* If you wish to explicitly create an element variable, you must use the `element` keyword: `set element x to 10`
* Behavior variables are also available indirectly via the `behavior` symbol:
    ```hyperscript
    behavior Example(foo)
      on click
        set the behavior's foo to 10
      end
    end
    ```
