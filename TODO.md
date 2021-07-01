## TODOs

### 0.8.2 release
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
* Carson - `next` and `previous` expressions

### Language Features
* Recovering parser (we are single error right now)
* `delete` command
* `focus` command
* `reply` & `wait for response` in event handlers?
*  Support a `timeout` modifier for commands like `fetch`, `call`, `wait for` etc.
  * deep project involving dealing w/ async commands not executing if they time out during execution
  * maybe just timeout for `fetch` ?
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
* Expressions for `field`, `button`, `tag` and `nodeList` [See GitHub](https://github.com/bigskysoftware/_hyperscript/issues/121)
* Event for DOM mutation commands (put, append, render) -- user can add listener to initialize inserted content

### Scoping Spec

* hyperscript has three levels of scoping:
    * `local` - bound to the current feature's execution lifespan
    * `element` - bound to the DOM element's lifespan
    * `global` - bound to the global page lifespan
* The default scope is `local`
    * local variables are "hoisted" as with the `var` statement in javascript so all variables are "top level"
    * hyperscript does not throw an error when a symbol is referred to that has not been initialized.  Instead you
      will get the value `undefined`
* Variables are declared *implicitly* by setting a value to a name
* When setting a value using the form `set x to 10`, hyperscript follows this resolution process:
  * examine the `local` scope, if `x` exists, update its value
  * examine the `element` scope, if `x` exists, update its value
  * examine the `global` scope, if `x` exists, update its value
  * if the variable does not exist in any of these scopes, create the variable in the local scope
* When reading a variable `x`, the following algorithm is used
  * examine the `local` scope, if `x` exists, return its value
  * examine the `elements` scope, if `x` exists, return its value
  * examine the `global` scope, if `x` exists, return its value
* hyperscript [behaviors](/features/behavior/) each have their own *isolated* `element` scope
  * `element` scoped variables are not shared between behaviors or between a behavior and the normal element scope
  * There is no mechanism for referencing the normal element scopes values from within a behavior
  * All constructor arguments to behaviors are scoped at the `element` level and shared across features within the
    behavior
* If you wish to explicitly create a global variable, you must use the `global` keyword: `set global x to 10`
* If you wish to explicitly create an element variable, you must use the `element` keyword: `set element x to 10`
* Lower level scopes may mask upper levels of scope by explicitly specifying the level at which a variable is set:
  ```hyperscript
    set global x to 10 -- sets a global variable x to 10
    set local x to 20  -- sets a local variable x to 20
    log global x       -- logs 10
    log local x        -- logs 20
    log x              -- logs 20 per the resolution algorithm outlined above
  ```
* For readability, getting and setting a `element` scoped variable may use a pseudo-possessive `'s`
  ```html
    <div _="init set the element's foo to 10
            on click put foo into me">
      Click me...
    </div>
  ```
