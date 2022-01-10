## TODOs

### 0.9.x release

* ~~Convert hyperscript runtime to wrap arrays w/ a Promise rather than `linerize/delinearize` :)~~
* ~~Support `*width` syntax for referring to style properties (similar to `@` for normal attributes)~~
* Finish new documentation (Carson)
* ~~Fix `fetch` issue when an `as` follows a `with`:~~
  ```applescript
     fetch /foo with method:"POST" as json -- as json bindes to "POST" too tightly
   ```
  options are to ~~support curlies after `with` syntax~~ and/or look ahead for `json` etc.
* ~~Support `sender` symbol when responding to events~~

### Language Features
* Wait a tick before `transition` to allow previous mutations to settle?
* Integrate events to allow call-like behavior:
  ```applescript
    send foo to #bar
    put the result into me
  ```
  * `reply` & `wait for response` in event handlers?
* Ben(?) - Better DOM manipulation tools? (needs research)
* Recovering parser (we are single error right now)
* `delete` command
* `focus` command
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
