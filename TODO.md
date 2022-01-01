## TODOs

### 0.9.x release

* ~~Convert hyperscript runtime to wrap arrays w/ a Promise rather than `linerize/delinearize` :)~~
* ~~Support `*width` syntax for referring to style properties (similar to `@` for normal attributes)~~
* Finish new documentation (Carson)
* Wait a tick before `transition` to allow previous mutations to settle?
* Integrate events to allow call-like behavior:
  ```applescript
    send foo to #bar
    put the result into me
  ```
* Fix `fetch` issue when an `as` follows a `with`:
  ```applescript
     fetch /foo with method:"POST" as json -- as json bindes to "POST" too tightly
   ```
  options are to support curlies after `with` and/or look ahead for `json` etc.
* ~~Support `sender` symbol when responding to events~~

### Language Features
* Ben(?) - Better DOM manipulation tools? (needs research)
* Recovering parser (we are single error right now)
* `delete` command
* `focus` command
* `reply` & `wait for response` in event handlers?
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
* Make `first, last, random` work as identifiers (backtracking parser)
* repeat command improvements
    ```
    // By default, counter uses "it" convention
    repeat from 1 to 10
        put it in myVar
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
