## TODOs

## 0.0.4 features
* @benpate Array improvements
    * support the [] operator
* @1cg First pass at documentation
* @Deniz Akşimşek - Support `hide`/`show` pattern
```html
<script type="text/hyperscript">
  def myTransition(op, elt)
    if op is "hide"
      -- logic to hide the element
    else
      -- logic to show the element
    end
  end
</script>

  hide me # configured default, potentially "myTransition"
  hide me with opacity
  hide me with myTransition
  hide me with visibility
  hide me with display

  show me
  show me with opacity
  show me with myTransition
  show me with visibility
  show me with display
  show me with display inline -- allow a specific display argument as well
```

### Language Features
* Web Worker API but for Web Sockets... o_O)))
  * two way - server can invoke functions on client, client can invoke functions on server
  * normal listening for messages also works of course
* string expression templating
```
   set str to "this $is a ${cool.feature}"
```
* Figure out an explicit transition API
  * https://v3.vuejs.org/guide/transitions-enterleave.html#transitioning-single-elements-components
  * https://github.com/alpinejs/alpine/#x-transition
  * https://www.educba.com/css-scale/
  * strawman:
  ```html
  transition
    opacity from 0 to 100
    transform.scale from 90 to 100
    add .class1, .class2
  with ease-out 300ms
  ```
* support `async` command
  * `async log me`
  * `async do wait 2s then log me end`
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
   on click 2 and more log "this ain't my first click"
```
* the `on` feature needs to support multiple events
* implement the throttle, delay/debounce and maybe enqueued functionality from htmx
```
  on click delay 100ms before log "delayed click"
  on click throttle 100ms before log "throttled click"
  on click queue one log "queued click"
  on click queue all log "throttled click"
```
* functions should be able to be marked `sync` to make only one execution at a time occur, in serial fashion
* support a `select` expression or statement that allows for general querying against the DOM
```
  select .foo
  select .foo .bar
  select .foo in bar
  select one div.foo in section.bar
  select one div.foo in section.bar where children.count > 2
```

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
  the hyperplane has infrastructure for catching mutations and updating references, as well as fully developed event model, and hyperplane expressions can be embedded in HTML

  ```html
  <div>#|||somePersistentVar</div>
  ```

* A reversable syntax for state-based transformations of DOM elements
```
  while hover add .foo
```

### Language Infrastructure
* catch blocks for functions?

### Parser Infrastructure
* Recovering parser (we are single error right now)
* Pull hyperscript core out?
* Make tokenizer pluggable with new tokenization elements
